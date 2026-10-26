BEGIN;
CREATE OR REPLACE FUNCTION public.mp_chair_profile(p_mosque uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('id',r.id,'name',r.data->>'name','photoId',r.data->>'photoId')
 FROM public."MosqueRecord" r JOIN public."Mosque" q ON q.id=r."mosqueId"
 WHERE q.id=p_mosque AND q.status='ACTIVE' AND q."archivedAt" IS NULL AND r.kind='dkm' AND r."archivedAt" IS NULL AND r.data->>'position'='Ketua DKM' AND r.data->>'active'='true' AND coalesce(trim(r.data->>'name'),'')<>''
 ORDER BY coalesce(r.data->>'startDate','') DESC,r."createdAt" DESC,r.id DESC LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.mp_chair_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mp_chair_profile(uuid) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
