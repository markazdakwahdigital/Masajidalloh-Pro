BEGIN;
CREATE OR REPLACE FUNCTION mp_private.admin(p_mosque uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor();
BEGIN
 PERFORM 1 FROM public."Mosque" WHERE id=p_mosque FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public."MosqueAdmin" a JOIN public."MosqueMembership" m ON m."mosqueId"=a."mosqueId" AND m."userId"=a."userId" JOIN public."Mosque" q ON q.id=a."mosqueId" WHERE a."mosqueId"=p_mosque AND a."userId"=uid AND m.status='ACTIVE' AND q.status='ACTIVE') THEN RAISE EXCEPTION 'admin_required' USING ERRCODE='42501'; END IF;
 RETURN uid;
END $$;
CREATE OR REPLACE FUNCTION public.mp_manage_tenant(p_mosque uuid,p_action text,p_value text,p_expected jsonb,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; current_state jsonb; old_admin uuid; target uuid; before_state jsonb;
BEGIN
 IF NOT mp_private.operator() THEN RAISE EXCEPTION 'operator_required' USING ERRCODE='42501'; END IF;
 actor:=mp_private.actor();
 IF p_action IS NULL OR p_action NOT IN ('status','plan','admin') OR coalesce(length(trim(p_reason)),0) NOT BETWEEN 5 AND 500 THEN RAISE EXCEPTION 'invalid_change'; END IF;
 PERFORM 1 FROM public."Mosque" WHERE id=p_mosque FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'tenant_not_found'; END IF;
 SELECT a."userId",jsonb_build_object('status',q.status,'plan',coalesce(s.plan,'BASIC'),'adminId',a."userId") INTO old_admin,current_state FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id LEFT JOIN public."MosqueAdmin" a ON a."mosqueId"=q.id WHERE q.id=p_mosque;
 IF p_expected IS NULL OR current_state<>p_expected THEN RAISE EXCEPTION 'stale_tenant'; END IF;
 before_state:=current_state;
 IF p_action='status' THEN
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
 END IF;
 INSERT INTO public."AuditLog"("mosqueId","actorId",action,resource) VALUES(p_mosque,actor,'tenant.'||p_action||'.change',jsonb_build_object('before',before_state,'value',p_value,'reason',trim(p_reason))::text);
END $$;
CREATE OR REPLACE FUNCTION public.mp_operator_tenants() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT mp_private.operator() THEN RAISE EXCEPTION 'operator_required' USING ERRCODE='42501'; END IF;
 PERFORM mp_private.actor();
 RETURN jsonb_build_object('tenants',coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'name',q.name,'status',q.status,'plan',coalesce(s.plan,'BASIC'),'adminId',a."userId",'admin',u.email,'createdAt',q."createdAt",'readers',(SELECT count(*) FROM public."MosqueMembership" m WHERE m."mosqueId"=q.id AND m.status='ACTIVE' AND m."userId" IS DISTINCT FROM a."userId"),'members',coalesce((SELECT jsonb_agg(jsonb_build_object('id',v.id,'name',v.name,'email',v.email)) FROM public."MosqueMembership" m JOIN public."User" v ON v.id=m."userId" JOIN auth.users au ON au.id=v."authUserId" WHERE m."mosqueId"=q.id AND m.status='ACTIVE' AND au.email_confirmed_at IS NOT NULL),'[]'::jsonb)) ORDER BY q."createdAt" DESC) FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id LEFT JOIN public."MosqueAdmin" a ON a."mosqueId"=q.id LEFT JOIN public."User" u ON u.id=a."userId"),'[]'::jsonb),'history',coalesce((SELECT jsonb_agg(to_jsonb(h)) FROM (SELECT l."createdAt",l.action,l.resource,q.name AS "mosqueName" FROM public."AuditLog" l JOIN public."Mosque" q ON q.id=l."mosqueId" WHERE l.action LIKE 'tenant.%' ORDER BY l."createdAt" DESC LIMIT 50) h),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.mp_manage_tenant(uuid,text,text,jsonb,text),public.mp_operator_tenants() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mp_manage_tenant(uuid,text,text,jsonb,text),public.mp_operator_tenants() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
