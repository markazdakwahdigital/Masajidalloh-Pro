BEGIN;
CREATE OR REPLACE FUNCTION mp_private.admin_seat_count(p_mosque uuid) RETURNS integer LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT count(*)::integer FROM (SELECT "userId" FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque UNION SELECT "userId" FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=p_mosque) a;
$$;
REVOKE ALL ON FUNCTION mp_private.admin_seat_count(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION mp_private.guard_admin_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE used integer;
BEGIN
 PERFORM 1 FROM public."Mosque" WHERE id=NEW."mosqueId" FOR UPDATE;
 IF TG_TABLE_NAME='MosqueAdmin' THEN
  SELECT count(DISTINCT "userId") INTO used FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=NEW."mosqueId" AND "userId"<>NEW."userId";
 ELSE
  IF TG_OP='UPDATE' THEN
   SELECT count(*) INTO used FROM (SELECT "userId" FROM public."MosqueAdmin" WHERE "mosqueId"=NEW."mosqueId" UNION SELECT "userId" FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=NEW."mosqueId" AND NOT("mosqueId"=OLD."mosqueId" AND "userId"=OLD."userId")) a WHERE "userId"<>NEW."userId";
  ELSE SELECT count(*) INTO used FROM (SELECT "userId" FROM public."MosqueAdmin" WHERE "mosqueId"=NEW."mosqueId" UNION SELECT "userId" FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=NEW."mosqueId") a WHERE "userId"<>NEW."userId"; END IF;
 END IF;
 IF used>=3 THEN RAISE EXCEPTION 'admin_limit'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION mp_private.guard_admin_limit() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS mp_limit_primary_admin ON public."MosqueAdmin";
CREATE TRIGGER mp_limit_primary_admin BEFORE INSERT OR UPDATE OF "userId","mosqueId" ON public."MosqueAdmin" FOR EACH ROW EXECUTE FUNCTION mp_private.guard_admin_limit();
DROP TRIGGER IF EXISTS mp_limit_additional_admin ON public."MosqueAdditionalAdmin";
CREATE TRIGGER mp_limit_additional_admin BEFORE INSERT OR UPDATE OF "userId","mosqueId" ON public."MosqueAdditionalAdmin" FOR EACH ROW EXECUTE FUNCTION mp_private.guard_admin_limit();

CREATE OR REPLACE FUNCTION public.mp_admin_team(p_mosque uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque); main boolean;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque AND "userId"=uid) INTO main;
 RETURN jsonb_build_object('canManage',main,'limit',3,'usedSeats',mp_private.admin_seat_count(p_mosque)+(SELECT count(*) FROM public."MosqueAdminInvite" i WHERE i."mosqueId"=p_mosque AND i.status='PENDING'),'admins',coalesce((SELECT jsonb_agg(jsonb_build_object('id',u.id,'name',u.name,'email',u.email,'primary',a.main)) FROM (SELECT "userId",true AS main FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque UNION SELECT "userId",false FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=p_mosque) a JOIN public."User" u ON u.id=a."userId"),'[]'::jsonb),'invites',coalesce((SELECT jsonb_agg(jsonb_build_object('email',email,'status',status)) FROM public."MosqueAdminInvite" WHERE "mosqueId"=p_mosque),'[]'::jsonb),'pengurus',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',data->>'name','email',data->>'email')) FROM public."MosqueRecord" WHERE "mosqueId"=p_mosque AND kind='dkm' AND "archivedAt" IS NULL AND coalesce(data->>'email','')<>''),'[]'::jsonb));
END $$;
CREATE OR REPLACE FUNCTION public.mp_invite_admin(p_mosque uuid,p_record uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque); em text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque AND "userId"=uid) THEN RAISE EXCEPTION 'primary_admin_required' USING ERRCODE='42501'; END IF;
 SELECT lower(trim(data->>'email')) INTO em FROM public."MosqueRecord" WHERE id=p_record AND "mosqueId"=p_mosque AND kind='dkm' AND "archivedAt" IS NULL;
 IF em IS NULL OR em!~'^[^ @]+@[^ @]+[.][^ @]+$' THEN RAISE EXCEPTION 'dkm_email_required'; END IF;
 IF EXISTS(SELECT 1 FROM public."AdminEmailRegistry" WHERE email=em) AND em<>'markazdakwahdigital.01@gmail.com' THEN RAISE EXCEPTION 'admin_email_already_used'; END IF;
 IF EXISTS(SELECT 1 FROM public."User" u WHERE lower(u.email)=em AND mp_private.is_admin(p_mosque,u.id)) THEN RAISE EXCEPTION 'already_admin'; END IF;
 IF mp_private.admin_seat_count(p_mosque)+(SELECT count(*) FROM public."MosqueAdminInvite" WHERE "mosqueId"=p_mosque AND status='PENDING' AND email<>em)>=3 THEN RAISE EXCEPTION 'admin_limit'; END IF;
 INSERT INTO public."MosqueAdminInvite"("mosqueId",email,"recordId","invitedBy") VALUES(p_mosque,em,p_record,uid) ON CONFLICT("mosqueId",email) DO UPDATE SET status='PENDING',"recordId"=excluded."recordId","invitedBy"=uid,"createdAt"=now();
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,'admin.invite',em);
END $$;
CREATE OR REPLACE FUNCTION public.mp_accept_admin(p_mosque uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); em text; req public."MosqueAdminInvite";
BEGIN
 PERFORM 1 FROM public."Mosque" WHERE id=p_mosque AND status='ACTIVE' AND "archivedAt" IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'tenant_unavailable'; END IF;
 SELECT lower(email) INTO em FROM public."User" WHERE id=uid;
 SELECT * INTO req FROM public."MosqueAdminInvite" WHERE "mosqueId"=p_mosque AND email=em AND status='PENDING' FOR UPDATE;
 IF req.email IS NULL THEN RAISE EXCEPTION 'invitation_required' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public."AdminEmailRegistry" WHERE email=em) AND em<>'markazdakwahdigital.01@gmail.com' THEN RAISE EXCEPTION 'admin_email_already_used'; END IF;
 IF mp_private.admin_seat_count(p_mosque)>=3 THEN RAISE EXCEPTION 'admin_limit'; END IF;
 INSERT INTO public."MosqueMembership"("mosqueId","userId",status) VALUES(p_mosque,uid,'ACTIVE') ON CONFLICT("mosqueId","userId") DO UPDATE SET status='ACTIVE';
 INSERT INTO public."MosqueAdditionalAdmin"("mosqueId","userId") VALUES(p_mosque,uid);
 UPDATE public."MosqueAdminInvite" SET status='ACCEPTED' WHERE "mosqueId"=p_mosque AND email=em;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,'admin.accept',uid::text);
END $$;

-- Record only that credentials changed, never passwords, hashes, tokens, or codes.
CREATE OR REPLACE FUNCTION mp_private.audit_admin_credentials() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE person uuid; tenant uuid;
BEGIN
 SELECT id INTO person FROM public."User" WHERE "authUserId"=NEW.id;
 IF person IS NULL THEN RETURN NEW; END IF;
 FOR tenant IN SELECT "mosqueId" FROM public."MosqueAdmin" WHERE "userId"=person UNION SELECT "mosqueId" FROM public."MosqueAdditionalAdmin" WHERE "userId"=person LOOP
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
   INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(tenant,person,'account.password.change',jsonb_build_object('email',NEW.email)::text);
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
   INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(tenant,person,'account.email.change',jsonb_build_object('beforeEmail',OLD.email,'email',NEW.email)::text);
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION mp_private.audit_admin_credentials() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS mp_audit_admin_credentials ON auth.users;
CREATE TRIGGER mp_audit_admin_credentials AFTER UPDATE OF encrypted_password,email ON auth.users FOR EACH ROW EXECUTE FUNCTION mp_private.audit_admin_credentials();
CREATE OR REPLACE FUNCTION public.mp_operator_admin_security() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT mp_private.operator() THEN RAISE EXCEPTION 'operator_required' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object(
 'admins',coalesce((SELECT jsonb_agg(jsonb_build_object('mosqueId',q.id,'mosqueName',q.name,'tenantStatus',q.status,'archived',q."archivedAt" IS NOT NULL,'userId',u.id,'name',u.name,'email',coalesce(au.email,u.email),'primary',a.main,'since',a.since) ORDER BY q.name,a.main DESC,u.name) FROM (SELECT "mosqueId","userId",true main,"assignedAt" since FROM public."MosqueAdmin" UNION ALL SELECT "mosqueId","userId",false,"createdAt" FROM public."MosqueAdditionalAdmin") a JOIN public."Mosque" q ON q.id=a."mosqueId" JOIN public."User" u ON u.id=a."userId" LEFT JOIN auth.users au ON au.id=u."authUserId"),'[]'::jsonb),
 'invites',coalesce((SELECT jsonb_agg(jsonb_build_object('mosqueName',q.name,'email',i.email,'status',i.status,'createdAt',i."createdAt") ORDER BY i."createdAt" DESC) FROM public."MosqueAdminInvite" i JOIN public."Mosque" q ON q.id=i."mosqueId"),'[]'::jsonb),
 'history',coalesce((SELECT jsonb_agg(x.entry ORDER BY x."createdAt" DESC) FROM (SELECT a."createdAt",jsonb_build_object('id',a.id,'mosqueName',q.name,'actorEmail',u.email,'action',a.action,'resource',a.resource,'createdAt',a."createdAt") entry FROM public."AuditLog" a LEFT JOIN public."Mosque" q ON q.id=a."mosqueId" LEFT JOIN public."User" u ON u.id=a."actorId" WHERE a.action LIKE 'admin.%' OR a.action IN ('account.password.change','account.email.change','tenant.admin.change','tenant.activate') ORDER BY a."createdAt" DESC,a.id DESC LIMIT 200) x),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.mp_operator_admin_security() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mp_operator_admin_security() TO authenticated;

COMMIT;
