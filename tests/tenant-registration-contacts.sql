BEGIN;
CREATE TEMP TABLE registration_contact_results(result jsonb);
ALTER TABLE pg_temp.registration_contact_results ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();u uuid;app uuid;otherapp uuid;req public."TenantApplication";profile jsonb;p jsonb;q jsonb;bad jsonb;denied boolean;checks int:=0;ae text;be text;
BEGIN
 ae:='registration-admin-'||a||'@example.invalid';be:='mosque-contact-'||b||'@example.invalid';
 INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES(a,ae,now(),'{}'),(b,be,now(),'{}');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);u:=mp_private.actor();
 p:=jsonb_build_object('mosqueName','Registration contact fixture','city','Jakarta','address','Alamat Masjid pengujian rollback','contactName','Pengurus Uji','whatsapp','081234567890','mosqueWhatsapp','089876543210','mosqueEmail',upper(be),'email',be,'plan','BASIC');
 FOR bad IN SELECT * FROM (VALUES(p-'mosqueEmail'),(p||'{"mosqueEmail":"a@b@c.org"}'),(p-'mosqueWhatsapp'),(p||'{"mosqueWhatsapp":"---------"}'),(p||'{"whatsapp":"---------"}')) x(v) LOOP
  denied:=false;BEGIN PERFORM public.mp_apply_tenant(bad);EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='invalid_application';END;IF NOT denied THEN RAISE EXCEPTION 'invalid_contact_allowed'; END IF;checks:=checks+1;
 END LOOP;
 app:=public.mp_apply_tenant(p);SELECT * INTO req FROM public."TenantApplication" WHERE id=app;
 IF req.email<>ae OR req."mosqueEmail"<>be OR req.whatsapp<>'081234567890' OR req."mosqueWhatsapp"<>'089876543210' THEN RAISE EXCEPTION 'contacts_or_applicant_mixed'; END IF;checks:=checks+1;
 profile:=mp_private.application_profile(req);
 IF profile->>'email'<>be OR profile->>'servicePhone'<>'089876543210' OR profile->>'name'<>'Registration contact fixture' THEN RAISE EXCEPTION 'activation_profile_mapping'; END IF;checks:=checks+1;
 q:=public.mp_home();IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(q->'applications') x WHERE x->>'id'=app::text) THEN RAISE EXCEPTION 'applicant_lost_status'; END IF;checks:=checks+1;
 denied:=false;BEGIN PERFORM public.mp_apply_tenant(p||'{"mosqueEmail":"another@example.invalid"}');EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='admin_registration_blocked';END;IF NOT denied THEN RAISE EXCEPTION 'contact_email_bypassed_pending_guard'; END IF;checks:=checks+1;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);PERFORM mp_private.actor();
 q:=public.mp_home();IF EXISTS(SELECT 1 FROM jsonb_array_elements(q->'applications') x WHERE x->>'id'=app::text) THEN RAISE EXCEPTION 'contact_email_gained_applicant_access'; END IF;checks:=checks+1;
 denied:=false;BEGIN PERFORM public.mp_review_tenant(app,true);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'ordinary_account_can_activate'; END IF;checks:=checks+1;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 UPDATE public."TenantApplication" SET status='REJECTED' WHERE id=app;
 otherapp:=public.mp_apply_tenant(p||'{"mosqueEmail":"second-contact@example.invalid"}');UPDATE public."TenantApplication" SET status='REJECTED' WHERE id=otherapp;
 denied:=false;BEGIN PERFORM public.mp_apply_tenant(p||'{"mosqueEmail":"third-contact@example.invalid"}');EXCEPTION WHEN raise_exception THEN denied:=SQLERRM='application_rate_limit';END;IF NOT denied THEN RAISE EXCEPTION 'contact_email_bypassed_account_rate_limit'; END IF;checks:=checks+1;
 INSERT INTO public."TenantApplication"("mosqueName",city,address,"contactName",email,whatsapp,plan,status) VALUES('Legacy contact fixture','Jakarta','Alamat Masjid lama','Pengurus Lama',ae,'081234567890','BASIC','REJECTED') RETURNING * INTO req;
 profile:=mp_private.application_profile(req);IF profile->>'email'<>ae OR profile->>'servicePhone'<>'081234567890' THEN RAISE EXCEPTION 'legacy_application_broken'; END IF;checks:=checks+1;
 IF has_function_privilege('anon','public.mp_apply_tenant(jsonb)','EXECUTE') OR has_table_privilege('authenticated','public."TenantApplication"','SELECT') OR has_schema_privilege('authenticated','mp_private','USAGE') THEN RAISE EXCEPTION 'registration_privileges_widened'; END IF;checks:=checks+1;
 INSERT INTO registration_contact_results VALUES(jsonb_build_object('result','PASS','checks',checks));
END $$;
SELECT * FROM registration_contact_results;
ROLLBACK;
