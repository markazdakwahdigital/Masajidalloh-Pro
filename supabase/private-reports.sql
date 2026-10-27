-- Private report data: verified tenant Admin or verified platform operator only.
CREATE OR REPLACE FUNCTION public.mp_report_workspace(p_mosque uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=mp_private.actor(); assigned text; result jsonb;
BEGIN
 IF NOT mp_private.operator() THEN
  PERFORM mp_private.admin(p_mosque);
 END IF;
 SELECT coalesce(s.plan,'BASIC'),jsonb_build_object('id',q.id,'name',q.name,'settings',jsonb_build_object('name',q.name)||coalesce(s.data,'{}'::jsonb))
 INTO assigned,result FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id
 WHERE q.id=p_mosque AND q."archivedAt" IS NULL AND (q.status='ACTIVE' OR mp_private.operator());
 IF result IS NULL THEN RAISE EXCEPTION 'report_access_denied' USING ERRCODE='42501'; END IF;
 RETURN result||jsonb_build_object('plan',assigned,'canWrite',false,'records',coalesce((SELECT jsonb_agg(jsonb_build_object('id',r.id,'kind',r.kind,'data',r.data,'createdAt',r."createdAt") ORDER BY r."createdAt" DESC,r.id) FROM public."MosqueRecord" r WHERE r."mosqueId"=p_mosque AND r."archivedAt" IS NULL AND mp_private.has_module(assigned,r.kind)),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.mp_report_workspace(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mp_report_workspace(uuid) TO authenticated;
