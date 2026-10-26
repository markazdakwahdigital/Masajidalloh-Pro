BEGIN;
CREATE OR REPLACE FUNCTION public.mp_public_mosques(p_search text DEFAULT '',p_limit integer DEFAULT 24,p_offset integer DEFAULT 0,p_mosque uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH visible AS (
  SELECT q.id,q.name,coalesce(s.data->>'city','') AS city FROM public."Mosque" q LEFT JOIN public."MosqueSettings" s ON s."mosqueId"=q.id
  WHERE q.status='ACTIVE' AND q."archivedAt" IS NULL AND (p_mosque IS NULL OR q.id=p_mosque) AND strpos(lower(q.name||' '||coalesce(s.data->>'city','')),lower(trim(left(coalesce(p_search,''),100))))>0
 ), page AS (SELECT * FROM visible ORDER BY name,id LIMIT greatest(1,least(coalesce(p_limit,24),48)) OFFSET greatest(0,least(coalesce(p_offset,0),10000)))
 SELECT jsonb_build_object('total',(SELECT count(*) FROM visible),'items',coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY name,id) FROM page),'[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.mp_public_mosques(text,integer,integer,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mp_public_mosques(text,integer,integer,uuid) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
