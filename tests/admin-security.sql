BEGIN;
CREATE TEMP TABLE security_results(result jsonb);
ALTER TABLE pg_temp.security_results ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE ids uuid[]:=ARRAY[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];users uuid[]:=ARRAY[]::uuid[];records uuid[]:=ARRAY[]::uuid[];m uuid;other uuid;q jsonb;uid uuid;rec uuid;em text;denied boolean;checks int:=0;i int;before_count int;
BEGIN
 FOR i IN 1..5 LOOP
  INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES(ids[i],'security-'||ids[i]||'@example.invalid',now(),'{}');
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ids[i],'role','authenticated')::text,true);uid:=mp_private.actor();users:=array_append(users,uid);
 END LOOP;
 INSERT INTO public."Mosque"(name,slug,status) VALUES('Admin security rollback fixture',gen_random_uuid()::text,'ACTIVE') RETURNING id INTO m;
 INSERT INTO public."Mosque"(name,slug,status) VALUES('Other security rollback fixture',gen_random_uuid()::text,'ACTIVE') RETURNING id INTO other;
 INSERT INTO public."MosqueSettings"("mosqueId",plan,data) VALUES(m,'BASIC','{}');
 INSERT INTO public."MosqueMembership"("mosqueId","userId",status) VALUES(m,users[1],'ACTIVE');INSERT INTO public."MosqueAdmin"("mosqueId","userId") VALUES(m,users[1]);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ids[1],'role','authenticated')::text,true);
 FOR i IN 2..4 LOOP
  q:=public.mp_save_record(m,'dkm',jsonb_build_object('name','Security fixture Pengurus '||i,'position','Sekretaris DKM','gender','Laki-laki','address','PRIVATE_ADDRESS','phone','081234567890','email','security-'||ids[i]||'@example.invalid','startDate','2026-10-27','active',true));records:=array_append(records,(q->'record'->>'id')::uuid);
 END LOOP;
 PERFORM public.mp_invite_admin(m,records[1]);PERFORM public.mp_invite_admin(m,records[2]);q:=public.mp_admin_team(m);
 IF (q->>'usedSeats')::int<>3 OR (q->>'limit')::int<>3 THEN RAISE EXCEPTION 'pending_seats_not_reserved'; END IF;checks:=checks+1;
 denied:=false;BEGIN PERFORM public.mp_invite_admin(m,records[3]);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='admin_limit';END;IF NOT denied THEN RAISE EXCEPTION 'fourth_invite_allowed'; END IF;checks:=checks+1;
 PERFORM public.mp_invite_admin(m,records[1]);checks:=checks+1;
 denied:=false;BEGIN PERFORM public.mp_invite_admin(other,records[3]);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'cross_tenant_invite'; END IF;checks:=checks+1;
 FOR i IN 2..3 LOOP
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ids[i],'role','authenticated')::text,true);PERFORM public.mp_accept_admin(m);
 END LOOP;
 IF mp_private.admin_seat_count(m)<>3 THEN RAISE EXCEPTION 'three_admins_not_accepted'; END IF;checks:=checks+1;
 denied:=false;BEGIN PERFORM public.mp_invite_admin(m,records[3]);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'additional_admin_manages_access'; END IF;checks:=checks+1;
 -- Simulate a legacy pending invitation: acceptance must independently enforce the cap.
 INSERT INTO public."MosqueAdminInvite"("mosqueId",email,"recordId","invitedBy") VALUES(m,'security-'||ids[4]||'@example.invalid',records[3],users[1]);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ids[4],'role','authenticated')::text,true);
 denied:=false;BEGIN PERFORM public.mp_accept_admin(m);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='admin_limit';END;IF NOT denied THEN RAISE EXCEPTION 'stale_invitation_bypassed_cap'; END IF;checks:=checks+1;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ids[1],'role','authenticated')::text,true);
 PERFORM public.mp_revoke_admin(m,'security-'||ids[3]||'@example.invalid');PERFORM public.mp_invite_admin(m,records[3]);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ids[4],'role','authenticated')::text,true);PERFORM public.mp_accept_admin(m);
 IF mp_private.admin_seat_count(m)<>3 THEN RAISE EXCEPTION 'replacement_admin_failed'; END IF;checks:=checks+1;
 denied:=false;BEGIN INSERT INTO public."MosqueAdditionalAdmin"("mosqueId","userId") VALUES(m,users[5]);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='admin_limit';END;IF NOT denied THEN RAISE EXCEPTION 'direct_assignment_bypassed_cap'; END IF;checks:=checks+1;
 SELECT count(*) INTO before_count FROM public."AuditLog" WHERE "mosqueId"=m AND action='account.password.change';
 UPDATE auth.users SET encrypted_password='SYNTHETIC_HASH_FOR_ROLLBACK_ONLY' WHERE id=ids[4];
 IF (SELECT count(*) FROM public."AuditLog" WHERE "mosqueId"=m AND action='account.password.change')<>before_count+1 THEN RAISE EXCEPTION 'password_change_not_audited'; END IF;checks:=checks+1;
 IF EXISTS(SELECT 1 FROM public."AuditLog" WHERE "mosqueId"=m AND resource LIKE '%SYNTHETIC_HASH%') THEN RAISE EXCEPTION 'hash_leaked_to_audit'; END IF;checks:=checks+1;
 UPDATE auth.users SET encrypted_password='SYNTHETIC_HASH_FOR_ROLLBACK_ONLY' WHERE id=ids[4];
 IF (SELECT count(*) FROM public."AuditLog" WHERE "mosqueId"=m AND action='account.password.change')<>before_count+1 THEN RAISE EXCEPTION 'duplicate_password_audit'; END IF;checks:=checks+1;
 UPDATE auth.users SET email='changed-'||ids[4]||'@example.invalid' WHERE id=ids[4];
 IF NOT EXISTS(SELECT 1 FROM public."AuditLog" WHERE "mosqueId"=m AND action='account.email.change' AND resource::jsonb->>'beforeEmail'='security-'||ids[4]||'@example.invalid' AND resource::jsonb->>'email'='changed-'||ids[4]||'@example.invalid') THEN RAISE EXCEPTION 'email_history_missing'; END IF;checks:=checks+1;
 denied:=false;BEGIN PERFORM public.mp_operator_admin_security();EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'tenant_admin_reads_platform_security'; END IF;checks:=checks+1;
 q:=public.mp_public_workspace(m);IF q::text LIKE '%@example.invalid%' OR q::text LIKE '%PRIVATE_ADDRESS%' THEN RAISE EXCEPTION 'security_data_in_public_workspace'; END IF;checks:=checks+1;
 IF has_function_privilege('anon','public.mp_operator_admin_security()','EXECUTE') OR has_table_privilege('authenticated','public."AuditLog"','SELECT') OR has_schema_privilege('authenticated','mp_private','USAGE') THEN RAISE EXCEPTION 'unsafe_security_grant'; END IF;checks:=checks+1;
 INSERT INTO security_results VALUES(jsonb_build_object('result','PASS','checks',checks));
END $$;
SELECT * FROM security_results;
ROLLBACK;
