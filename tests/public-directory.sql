BEGIN;
DO $$
DECLARE m uuid; suspended uuid; archived uuid; pending uuid; q jsonb; fixture text:='DirectoryFixture-'||gen_random_uuid()::text;
BEGIN
 INSERT INTO public."Mosque"(name,slug,status) VALUES(fixture,gen_random_uuid()::text,'ACTIVE') RETURNING id INTO m;
 INSERT INTO public."MosqueSettings"("mosqueId",data) VALUES(m,'{"city":"KotaUji","servicePhone":"PRIVATE_PHONE","email":"PRIVATE_EMAIL"}');
 INSERT INTO public."Mosque"(name,slug,status) VALUES(fixture||' suspended',gen_random_uuid()::text,'SUSPENDED') RETURNING id INTO suspended;
 INSERT INTO public."Mosque"(name,slug,status,"archivedAt") VALUES(fixture||' archived',gen_random_uuid()::text,'SUSPENDED',now()) RETURNING id INTO archived;
 INSERT INTO public."Mosque"(name,slug,status) VALUES(fixture||' pending',gen_random_uuid()::text,'PENDING') RETURNING id INTO pending;
 q:=public.mp_public_mosques(fixture,24,0);IF (q->>'total')::int<>1 OR jsonb_array_length(q->'items')<>1 OR q->'items'->0->>'name'<>fixture THEN RAISE EXCEPTION 'directory_status_filter'; END IF;
 IF q::text LIKE '%PRIVATE_%' OR q->'items'->0?'email' OR q->'items'->0?'servicePhone' THEN RAISE EXCEPTION 'directory_private_leak'; END IF;
 q:=public.mp_public_mosques('kotauji',24,0,m);IF (q->>'total')::int<>1 THEN RAISE EXCEPTION 'city_search'; END IF;
 q:=public.mp_public_mosques(fixture,24,1);IF jsonb_array_length(q->'items')<>0 OR (q->>'total')::int<>1 THEN RAISE EXCEPTION 'pagination'; END IF;
 q:=public.mp_public_mosques('',24,0,archived);IF (q->>'total')::int<>0 THEN RAISE EXCEPTION 'archived_directory_exposed'; END IF;
 UPDATE public."Mosque" SET status='SUSPENDED' WHERE id=m;
 q:=public.mp_public_mosques(fixture);IF (q->>'total')::int<>0 THEN RAISE EXCEPTION 'suspension_not_reflected'; END IF;
 IF NOT has_function_privilege('anon','public.mp_public_mosques(text,integer,integer,uuid)','EXECUTE') OR has_table_privilege('anon','public."Mosque"','SELECT') THEN RAISE EXCEPTION 'directory_grants'; END IF;
END $$;
SELECT 'PASS: active-only directory, search, pagination, privacy and anonymous API' AS result;
ROLLBACK;
