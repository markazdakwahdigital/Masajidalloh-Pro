BEGIN;
ALTER TABLE public."TenantApplication" ADD COLUMN IF NOT EXISTS "mosqueEmail" text;
ALTER TABLE public."TenantApplication" ADD COLUMN IF NOT EXISTS "mosqueWhatsapp" text;
CREATE OR REPLACE FUNCTION mp_private.application_profile(p_request public."TenantApplication") RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT jsonb_build_object('name',(p_request)."mosqueName",'city',(p_request).city,'address',(p_request).address,'email',coalesce(nullif((p_request)."mosqueEmail",''),(p_request).email),'servicePhone',coalesce(nullif((p_request)."mosqueWhatsapp",''),(p_request).whatsapp),'timezone','Asia/Jakarta');
$$;
REVOKE ALL ON FUNCTION mp_private.application_profile(public."TenantApplication") FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.mp_apply_tenant(p_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); em text; request_id uuid;
BEGIN
 SELECT email INTO em FROM public."User" WHERE id=uid;
 IF p_data->>'plan' NOT IN ('BASIC','PRO','ENTERPRISE') OR coalesce(length(trim(p_data->>'mosqueName')),0) NOT BETWEEN 3 AND 160 OR coalesce(length(trim(p_data->>'city')),0) NOT BETWEEN 3 AND 100 OR coalesce(length(trim(p_data->>'address')),0) NOT BETWEEN 10 AND 500 OR coalesce(length(trim(p_data->>'contactName')),0) NOT BETWEEN 3 AND 120 OR coalesce(p_data->>'whatsapp','')!~'^\+?[0-9 ()-]{9,22}$' THEN RAISE EXCEPTION 'invalid_application'; END IF;
 IF coalesce(length(trim(p_data->>'mosqueEmail')),0) NOT BETWEEN 3 AND 254 OR coalesce(trim(p_data->>'mosqueEmail'),'')!~'^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' OR coalesce(p_data->>'mosqueWhatsapp','')!~'^\+?[0-9 ()-]{9,22}$' OR length(regexp_replace(coalesce(p_data->>'mosqueWhatsapp',''),'[^0-9]','','g')) NOT BETWEEN 9 AND 15 OR length(regexp_replace(coalesce(p_data->>'whatsapp',''),'[^0-9]','','g')) NOT BETWEEN 9 AND 15 THEN RAISE EXCEPTION 'invalid_application'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(em));
 IF NOT public.mp_can_apply() THEN RAISE EXCEPTION 'admin_registration_blocked'; END IF;
 IF (SELECT count(*) FROM public."TenantApplication" WHERE lower(email)=em AND "submittedAt">now()-interval '24 hours')>=2 THEN RAISE EXCEPTION 'application_rate_limit'; END IF;
 INSERT INTO public."TenantApplication"("mosqueName",city,address,"contactName",email,whatsapp,"mosqueEmail","mosqueWhatsapp",plan,status) VALUES(trim(p_data->>'mosqueName'),trim(p_data->>'city'),trim(p_data->>'address'),trim(p_data->>'contactName'),em,p_data->>'whatsapp',lower(trim(p_data->>'mosqueEmail')),trim(p_data->>'mosqueWhatsapp'),p_data->>'plan','PENDING') RETURNING id INTO request_id;
 RETURN request_id;
END $$;
CREATE OR REPLACE FUNCTION public.mp_review_tenant(p_request uuid,p_approve boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; applicant uuid; req public."TenantApplication"; mosque uuid;
BEGIN
 IF NOT mp_private.operator() THEN RAISE EXCEPTION 'operator_required' USING ERRCODE='42501'; END IF;
 actor:=mp_private.actor();
 SELECT * INTO req FROM public."TenantApplication" WHERE id=p_request FOR UPDATE;
 IF req.id IS NULL OR req.status<>'PENDING' THEN RAISE EXCEPTION 'application_not_pending'; END IF;
 IF NOT p_approve THEN UPDATE public."TenantApplication" SET status='REJECTED',"reviewedAt"=now() WHERE id=p_request; RETURN NULL; END IF;
 SELECT u.id INTO applicant FROM public."User" u JOIN auth.users au ON au.id=u."authUserId" WHERE lower(u.email)=lower(req.email) AND au.email_confirmed_at IS NOT NULL;
 IF applicant IS NULL THEN RAISE EXCEPTION 'applicant_not_verified'; END IF;
 INSERT INTO public."Mosque"(name,slug,status) VALUES(req."mosqueName",'masjid-'||gen_random_uuid()::text,'ACTIVE') RETURNING id INTO mosque;
 INSERT INTO public."MosqueSettings"("mosqueId",plan,data) VALUES(mosque,req.plan,mp_private.application_profile(req));
 INSERT INTO public."MosqueMembership"("mosqueId","userId",status) VALUES(mosque,applicant,'ACTIVE');
 INSERT INTO public."MosqueAdmin"("mosqueId","userId") VALUES(mosque,applicant);
 UPDATE public."TenantApplication" SET status='APPROVED',"mosqueId"=mosque,"reviewedAt"=now() WHERE id=p_request;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(mosque,actor,'tenant.activate',p_request::text);
 RETURN mosque;
END $$;
REVOKE ALL ON FUNCTION public.mp_apply_tenant(jsonb),public.mp_review_tenant(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mp_apply_tenant(jsonb),public.mp_review_tenant(uuid,boolean) TO authenticated;
COMMIT;
