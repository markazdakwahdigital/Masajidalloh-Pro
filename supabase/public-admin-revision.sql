BEGIN;
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS whatsapp text;
CREATE TABLE IF NOT EXISTS public."MosqueAdditionalAdmin"("mosqueId" uuid REFERENCES public."Mosque"(id),"userId" uuid REFERENCES public."User"(id),"createdAt" timestamptz NOT NULL DEFAULT now(),PRIMARY KEY("mosqueId","userId"));
CREATE TABLE IF NOT EXISTS public."AdminEmailRegistry"(email text PRIMARY KEY,"userId" uuid REFERENCES public."User"(id),"mosqueId" uuid NOT NULL REFERENCES public."Mosque"(id),"createdAt" timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public."MosqueAdminInvite"("mosqueId" uuid REFERENCES public."Mosque"(id),email text,"recordId" uuid REFERENCES public."MosqueRecord"(id),"invitedBy" uuid REFERENCES public."User"(id),status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACCEPTED','REVOKED')),"createdAt" timestamptz NOT NULL DEFAULT now(),PRIMARY KEY("mosqueId",email));
ALTER TABLE public."AdminEmailRegistry" ADD COLUMN IF NOT EXISTS "userId" uuid REFERENCES public."User"(id);
ALTER TABLE public."MosqueAdditionalAdmin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminEmailRegistry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MosqueAdminInvite" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."MosqueAdditionalAdmin",public."AdminEmailRegistry",public."MosqueAdminInvite" FROM PUBLIC,anon,authenticated;
INSERT INTO public."AdminEmailRegistry"(email,"userId","mosqueId") SELECT lower(u.email),u.id,a."mosqueId" FROM public."MosqueAdmin" a JOIN public."User" u ON u.id=a."userId" ON CONFLICT(email) DO NOTHING;
CREATE OR REPLACE FUNCTION mp_private.reserve_admin_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE em text; existing uuid;
BEGIN
 SELECT lower(email) INTO em FROM public."User" WHERE id=NEW."userId";
 IF em='markazdakwahdigital.01@gmail.com' THEN RETURN NEW; END IF;
 INSERT INTO public."AdminEmailRegistry"(email,"userId","mosqueId") VALUES(em,NEW."userId",NEW."mosqueId") ON CONFLICT(email) DO NOTHING;
 SELECT "mosqueId" INTO existing FROM public."AdminEmailRegistry" WHERE email=em;
 IF existing IS DISTINCT FROM NEW."mosqueId" THEN RAISE EXCEPTION 'admin_email_already_used'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS mp_reserve_admin_email ON public."MosqueAdmin";
CREATE TRIGGER mp_reserve_admin_email BEFORE INSERT OR UPDATE OF "userId" ON public."MosqueAdmin" FOR EACH ROW EXECUTE FUNCTION mp_private.reserve_admin_email();
DROP TRIGGER IF EXISTS mp_reserve_additional_email ON public."MosqueAdditionalAdmin";
CREATE TRIGGER mp_reserve_additional_email BEFORE INSERT OR UPDATE OF "userId" ON public."MosqueAdditionalAdmin" FOR EACH ROW EXECUTE FUNCTION mp_private.reserve_admin_email();
CREATE OR REPLACE FUNCTION mp_private.prevent_reused_admin_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN IF lower(NEW.email)<>'markazdakwahdigital.01@gmail.com' AND EXISTS(SELECT 1 FROM public."AdminEmailRegistry" WHERE email=lower(NEW.email)) THEN RAISE EXCEPTION 'admin_email_already_used'; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS mp_admin_signup_guard ON auth.users;
CREATE TRIGGER mp_admin_signup_guard BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION mp_private.prevent_reused_admin_signup();
CREATE OR REPLACE FUNCTION mp_private.is_admin(p_mosque uuid,p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque AND "userId"=p_user) OR EXISTS(SELECT 1 FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=p_mosque AND "userId"=p_user);
$$;
CREATE OR REPLACE FUNCTION mp_private.admin(p_mosque uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor();
BEGIN
 PERFORM 1 FROM public."Mosque" WHERE id=p_mosque FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public."MosqueMembership" m JOIN public."Mosque" q ON q.id=m."mosqueId" WHERE m."mosqueId"=p_mosque AND m."userId"=uid AND m.status='ACTIVE' AND q.status='ACTIVE' AND q."archivedAt" IS NULL AND mp_private.is_admin(p_mosque,uid)) THEN RAISE EXCEPTION 'admin_required' USING ERRCODE='42501'; END IF;
 RETURN uid;
END $$;
CREATE OR REPLACE FUNCTION mp_private.actor() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE aid uuid:=auth.uid(); em text; nm text; uid uuid;
BEGIN
 SELECT lower(email),left(coalesce(nullif(raw_user_meta_data->>'name',''),split_part(email,'@',1)),120)
 INTO em,nm FROM auth.users WHERE id=aid AND email_confirmed_at IS NOT NULL;
 IF aid IS NULL OR em IS NULL THEN RAISE EXCEPTION 'verified_session_required' USING ERRCODE='42501'; END IF;
 SELECT id INTO uid FROM public."User" WHERE "authUserId"=aid;
 IF uid IS NULL THEN
  SELECT id INTO uid FROM public."User" WHERE lower(email)=em AND "authUserId" IS NULL FOR UPDATE;
  IF uid IS NOT NULL THEN UPDATE public."User" SET "authUserId"=aid,"updatedAt"=now() WHERE id=uid;
  ELSE INSERT INTO public."User"("authUserId",email,name) VALUES(aid,em,nm) ON CONFLICT("authUserId") DO UPDATE SET "updatedAt"=now() RETURNING id INTO uid; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM public."User" WHERE id=uid AND lower(email)<>em) THEN UPDATE public."User" SET email=em,"updatedAt"=now() WHERE id=uid; END IF;
 UPDATE public."User" SET whatsapp=left(au.raw_user_meta_data->>'whatsapp',22) FROM auth.users au WHERE public."User".id=uid AND au.id=aid AND public."User".whatsapp IS NULL AND coalesce(au.raw_user_meta_data->>'whatsapp','')~'^\+?[0-9 ()-]{9,22}$';
 RETURN uid;
END $$;
CREATE OR REPLACE FUNCTION public.mp_can_apply() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor();
BEGIN RETURN mp_private.operator() OR (NOT EXISTS(SELECT 1 FROM public."AdminEmailRegistry" h WHERE h."userId"=uid OR h.email=(SELECT lower(email) FROM public."User" WHERE id=uid)) AND NOT EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "userId"=uid) AND NOT EXISTS(SELECT 1 FROM public."MosqueAdditionalAdmin" WHERE "userId"=uid) AND NOT EXISTS(SELECT 1 FROM public."TenantApplication" t JOIN public."User" u ON lower(t.email)=lower(u.email) WHERE u.id=uid AND t.status='PENDING')); END $$;
CREATE OR REPLACE FUNCTION public.mp_apply_tenant(p_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); em text; request_id uuid;
BEGIN
 SELECT email INTO em FROM public."User" WHERE id=uid;
 IF p_data->>'plan' NOT IN ('BASIC','PRO','ENTERPRISE') OR coalesce(length(trim(p_data->>'mosqueName')),0) NOT BETWEEN 3 AND 160 OR coalesce(length(trim(p_data->>'city')),0) NOT BETWEEN 3 AND 100 OR coalesce(length(trim(p_data->>'address')),0) NOT BETWEEN 10 AND 500 OR coalesce(length(trim(p_data->>'contactName')),0) NOT BETWEEN 3 AND 120 OR coalesce(p_data->>'whatsapp','')!~'^\+?[0-9 ()-]{9,22}$' THEN RAISE EXCEPTION 'invalid_application'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(em));
 IF NOT public.mp_can_apply() THEN RAISE EXCEPTION 'admin_registration_blocked'; END IF;
 IF (SELECT count(*) FROM public."TenantApplication" WHERE lower(email)=em AND "submittedAt">now()-interval '24 hours')>=2 THEN RAISE EXCEPTION 'application_rate_limit'; END IF;
 INSERT INTO public."TenantApplication"("mosqueName",city,address,"contactName",email,whatsapp,plan,status) VALUES(trim(p_data->>'mosqueName'),trim(p_data->>'city'),trim(p_data->>'address'),trim(p_data->>'contactName'),em,p_data->>'whatsapp',p_data->>'plan','PENDING') RETURNING id INTO request_id;
 RETURN request_id;
END $$;
CREATE OR REPLACE FUNCTION public.mp_home() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); result jsonb;
BEGIN
 SELECT jsonb_build_object('mosques',coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'name',q.name,'plan',coalesce(s.plan,'BASIC'),'admin',mp_private.is_admin(q.id,uid)) ORDER BY q.name) FROM public."MosqueMembership" m JOIN public."Mosque" q ON q.id=m."mosqueId" LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id LEFT JOIN public."MosqueAdmin" a ON a."mosqueId"=q.id WHERE m."userId"=uid AND m.status='ACTIVE' AND q.status='ACTIVE'),'[]'::jsonb),
 'applications',coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'name',t."mosqueName",'plan',t.plan,'status',t.status)) FROM public."TenantApplication" t JOIN public."User" u ON lower(t.email)=lower(u.email) WHERE u.id=uid),'[]'::jsonb)) INTO result; RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.mp_workspace(p_mosque uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); assigned text; writer boolean; result jsonb;
BEGIN
 IF NOT mp_private.is_admin(p_mosque,uid) THEN RAISE EXCEPTION 'admin_required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public."MosqueMembership" m JOIN public."Mosque" q ON q.id=m."mosqueId" WHERE m."mosqueId"=p_mosque AND m."userId"=uid AND m.status='ACTIVE' AND q.status='ACTIVE') THEN RAISE EXCEPTION 'tenant_access_denied' USING ERRCODE='42501'; END IF;
 SELECT coalesce(s.plan,'BASIC'),mp_private.is_admin(q.id,uid),jsonb_build_object('name',q.name,'id',q.id,'settings',jsonb_build_object('name',q.name)||coalesce(s.data,'{}'::jsonb))
 INTO assigned,writer,result FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id WHERE q.id=p_mosque;
 RETURN result||jsonb_build_object('plan',assigned,'canWrite',writer,'records',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'kind',r.kind,'data',r.data,'createdAt',r."createdAt") ORDER BY r."createdAt" DESC) FROM public."MosqueRecord" r WHERE r."mosqueId"=p_mosque AND r."archivedAt" IS NULL AND mp_private.has_module(assigned,r.kind)),'[]'::jsonb));
END $$;


CREATE OR REPLACE FUNCTION public.mp_public_workspace(p_mosque uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE assigned text; result jsonb;
BEGIN
 SELECT coalesce(s.plan,'BASIC'),jsonb_build_object('id',q.id,'name',q.name,'settings',(SELECT coalesce(jsonb_object_agg(k,v),'{}') FROM jsonb_each(jsonb_build_object('name',q.name)||coalesce(s.data,'{}')) x(k,v) WHERE k IN ('name','city','address','website','servicePhone','timezone')))
 INTO assigned,result FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id WHERE q.id=p_mosque AND q.status='ACTIVE' AND q."archivedAt" IS NULL;
 IF result IS NULL THEN RAISE EXCEPTION 'tenant_unavailable' USING ERRCODE='42501'; END IF;
 RETURN result||jsonb_build_object('plan',assigned,'canWrite',false,'records',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'kind',r.kind,'createdAt',r."createdAt",'data',(SELECT coalesce(jsonb_object_agg(k,v),'{}') FROM jsonb_each(r.data) x(k,v) WHERE k=ANY(CASE WHEN r.kind='dkm' THEN ARRAY['name','position','active'] WHEN r.kind='jamaah' THEN ARRAY['name','group','active'] WHEN r.kind='penerima' THEN ARRAY['name','category','assistance','active'] WHEN r.kind='petugas' THEN ARRAY['name','role','active'] ELSE ARRAY['name','title','type','date','time','amount','method','purpose','source','form','item','quantity','unit','distributed','active','asset','category','account','location','condition','owner','published','responsible','city','confirmed','audience','content','approved'] END))) ORDER BY r."createdAt" DESC) FROM public."MosqueRecord" r WHERE r."mosqueId"=p_mosque AND r."archivedAt" IS NULL AND mp_private.has_module(assigned,r.kind) AND r.kind NOT IN ('setting','profil','laporan')),'[]'::jsonb));
END $$;
CREATE OR REPLACE FUNCTION public.mp_admin_team(p_mosque uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque); main boolean;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque AND "userId"=uid) INTO main;
 RETURN jsonb_build_object('canManage',main,'admins',coalesce((SELECT jsonb_agg(jsonb_build_object('id',u.id,'name',u.name,'email',u.email,'primary',a.main)) FROM (SELECT "userId",true AS main FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque UNION SELECT "userId",false FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=p_mosque) a JOIN public."User" u ON u.id=a."userId"),'[]'::jsonb),'invites',coalesce((SELECT jsonb_agg(jsonb_build_object('email',email,'status',status)) FROM public."MosqueAdminInvite" WHERE "mosqueId"=p_mosque),'[]'::jsonb),'pengurus',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',data->>'name','email',data->>'email')) FROM public."MosqueRecord" WHERE "mosqueId"=p_mosque AND kind='dkm' AND "archivedAt" IS NULL AND coalesce(data->>'email','')<>''),'[]'::jsonb));
END $$;
CREATE OR REPLACE FUNCTION public.mp_invite_admin(p_mosque uuid,p_record uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque); em text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque AND "userId"=uid) THEN RAISE EXCEPTION 'primary_admin_required' USING ERRCODE='42501'; END IF;
 SELECT lower(trim(data->>'email')) INTO em FROM public."MosqueRecord" WHERE id=p_record AND "mosqueId"=p_mosque AND kind='dkm' AND "archivedAt" IS NULL;
 IF em IS NULL OR em!~'^[^ @]+@[^ @]+[.][^ @]+$' THEN RAISE EXCEPTION 'dkm_email_required'; END IF;
 IF EXISTS(SELECT 1 FROM public."AdminEmailRegistry" WHERE email=em) AND em<>'markazdakwahdigital.01@gmail.com' THEN RAISE EXCEPTION 'admin_email_already_used'; END IF;
 IF (SELECT count(*) FROM public."MosqueAdminInvite" WHERE "mosqueId"=p_mosque AND status='PENDING')>=20 THEN RAISE EXCEPTION 'invite_limit'; END IF;
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
 INSERT INTO public."MosqueMembership"("mosqueId","userId",status) VALUES(p_mosque,uid,'ACTIVE') ON CONFLICT("mosqueId","userId") DO UPDATE SET status='ACTIVE';
 INSERT INTO public."MosqueAdditionalAdmin"("mosqueId","userId") VALUES(p_mosque,uid);
 UPDATE public."MosqueAdminInvite" SET status='ACCEPTED' WHERE "mosqueId"=p_mosque AND email=em;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,'admin.accept',uid::text);
END $$;
CREATE OR REPLACE FUNCTION public.mp_revoke_admin(p_mosque uuid,p_email text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.admin(p_mosque); target uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque AND "userId"=uid) THEN RAISE EXCEPTION 'primary_admin_required' USING ERRCODE='42501'; END IF;
 SELECT id INTO target FROM public."User" WHERE lower(email)=lower(trim(p_email));
 IF EXISTS(SELECT 1 FROM public."MosqueAdmin" WHERE "mosqueId"=p_mosque AND "userId"=target) THEN RAISE EXCEPTION 'cannot_revoke_primary'; END IF;
 DELETE FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=p_mosque AND "userId"=target;
 UPDATE public."MosqueMembership" SET status='SUSPENDED' WHERE "mosqueId"=p_mosque AND "userId"=target;
 UPDATE public."MosqueAdminInvite" SET status='REVOKED' WHERE "mosqueId"=p_mosque AND email=lower(trim(p_email));
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,uid,'admin.revoke',lower(trim(p_email)));
END $$;
CREATE OR REPLACE FUNCTION public.mp_manage_tenant(p_mosque uuid,p_action text,p_value text,p_expected jsonb,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; current_state jsonb; old_admin uuid; target uuid; before_state jsonb;
BEGIN
 IF NOT mp_private.operator() THEN RAISE EXCEPTION 'operator_required' USING ERRCODE='42501'; END IF;
 actor:=mp_private.actor();
 IF p_action IS NULL OR p_action NOT IN ('status','plan','admin','archive','restore') OR coalesce(length(trim(p_reason)),0) NOT BETWEEN 5 AND 500 THEN RAISE EXCEPTION 'invalid_change'; END IF;
 PERFORM 1 FROM public."Mosque" WHERE id=p_mosque FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'tenant_not_found'; END IF;
 SELECT a."userId",jsonb_build_object('status',q.status,'plan',coalesce(s.plan,'BASIC'),'adminId',a."userId",'archivedAt',q."archivedAt") INTO old_admin,current_state FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id LEFT JOIN public."MosqueAdmin" a ON a."mosqueId"=q.id WHERE q.id=p_mosque;
 IF p_expected IS NULL OR current_state<>('{"archivedAt":null}'::jsonb||p_expected) THEN RAISE EXCEPTION 'stale_tenant'; END IF;
 before_state:=current_state;
 IF current_state->>'archivedAt' IS NOT NULL AND p_action<>'restore' THEN RAISE EXCEPTION 'tenant_archived'; END IF;
 IF p_action='archive' THEN
  IF current_state->>'status'<>'SUSPENDED' OR p_value IS DISTINCT FROM 'ARCHIVE' THEN RAISE EXCEPTION 'suspend_before_archive'; END IF;
  UPDATE public."Mosque" SET "archivedAt"=now(),"updatedAt"=now() WHERE id=p_mosque;
 ELSIF p_action='restore' THEN
  IF current_state->>'archivedAt' IS NULL OR p_value IS DISTINCT FROM 'RESTORE' THEN RAISE EXCEPTION 'tenant_not_archived'; END IF;
  UPDATE public."Mosque" SET "archivedAt"=NULL,status='SUSPENDED',"updatedAt"=now() WHERE id=p_mosque;
 ELSIF p_action='status' THEN
  IF p_value IS NULL OR p_value NOT IN ('ACTIVE','SUSPENDED') THEN RAISE EXCEPTION 'invalid_status'; END IF;
  IF p_value='ACTIVE' AND old_admin IS NULL THEN RAISE EXCEPTION 'admin_required'; END IF;
  UPDATE public."Mosque" SET status=p_value::public."MosqueStatus","updatedAt"=now() WHERE id=p_mosque;
 ELSIF p_action='plan' THEN
  IF p_value IS NULL OR p_value NOT IN ('BASIC','PRO','ENTERPRISE') THEN RAISE EXCEPTION 'invalid_plan'; END IF;
  INSERT INTO public."MosqueSettings"("mosqueId",plan,data) VALUES(p_mosque,p_value,'{}') ON CONFLICT("mosqueId") DO UPDATE SET plan=excluded.plan,"updatedAt"=now();
 ELSE
  SELECT u.id INTO target FROM public."User" u JOIN auth.users au ON au.id=u."authUserId" JOIN public."MosqueMembership" m ON m."userId"=u.id WHERE m."mosqueId"=p_mosque AND m.status='ACTIVE' AND u.id::text=p_value AND au.email_confirmed_at IS NOT NULL;
  IF target IS NULL OR target=old_admin THEN RAISE EXCEPTION 'verified_member_required'; END IF;
  INSERT INTO public."MosqueAdmin"("mosqueId","userId") VALUES(p_mosque,target) ON CONFLICT("mosqueId") DO UPDATE SET "userId"=excluded."userId","assignedAt"=now();
  DELETE FROM public."MosqueAdditionalAdmin" WHERE "mosqueId"=p_mosque AND "userId"=target;
 END IF;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,actor,'tenant.'||p_action||'.change',jsonb_build_object('before',before_state,'value',p_value,'reason',trim(p_reason))::text);
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mp_private FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.mp_public_workspace(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mp_public_workspace(uuid) TO anon,authenticated;
DO $$ DECLARE f record; BEGIN FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('mp_can_apply','mp_admin_team','mp_invite_admin','mp_accept_admin','mp_revoke_admin') LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f.signature); EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature); END LOOP; END $$;
REVOKE ALL ON FUNCTION public.mp_reader_request(uuid),public.mp_readers(uuid),public.mp_reader_review(uuid,uuid,boolean),public.mp_reader_revoke(uuid,uuid) FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
