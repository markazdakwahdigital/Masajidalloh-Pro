-- One-time FIRST MASJID provisioning. PostgreSQL psql client only, not Supabase SQL Editor.
-- Prerequisites: Create an Auth user via Supabase Authentication > Users first,
-- and CONFIRM the email through a trustworthy email flow.
-- Do not enter credentials into GitHub, source code or the ChatGPT conversation.
-- Run via psql in an administrator-controlled terminal with:
-- psql "$DATABASE_URL" -v auth_user_id='verified-user-uuid' \
--   -v display_name='Nama Pengurus' -v mosque_name='Nama Masjid' \
--   -v mosque_slug='nama-masjid' -f scripts/bootstrap-first-mosque.sql
\set ON_ERROR_STOP on
BEGIN;
-- Variables are safely SQL-quoted by psql; this script DOES NOT run in browser/public API.
CREATE TEMP TABLE bootstrap_input ON COMMIT DROP AS
SELECT :'auth_user_id'::uuid AS auth_id,
       :'display_name'::text AS display_name,
       :'mosque_name'::text AS mosque_name,
       :'mosque_slug'::text AS mosque_slug;
-- Fail the transaction unless identity is email-verified and platform is empty.
SELECT 1 / CASE WHEN (
  SELECT count(*) = 1 FROM auth.users a
  JOIN bootstrap_input i ON i.auth_id = a.id
  WHERE a.email_confirmed_at IS NOT NULL AND a.email IS NOT NULL
) THEN 1 ELSE 0 END AS verified_identity_required;
SELECT 1 / CASE WHEN (SELECT count(*) = 0 FROM public."Mosque") AND
                      (SELECT count(*) = 0 FROM public."User")
               THEN 1 ELSE 0 END AS first_setup_only;
SELECT 1 / CASE WHEN EXISTS(SELECT 1 FROM public."Role" WHERE key='ketua_takmir')
               THEN 1 ELSE 0 END AS roles_must_be_seeded;
SELECT 1 / CASE WHEN EXISTS(
  SELECT 1 FROM bootstrap_input WHERE
  char_length(trim(display_name)) BETWEEN 3 AND 100 AND
  char_length(trim(mosque_name)) BETWEEN 3 AND 120 AND
  mosque_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND
  char_length(mosque_slug) BETWEEN 3 AND 80
) THEN 1 ELSE 0 END AS valid_inputs_required;
INSERT INTO public."User" (id, "authUserId", email, name)
SELECT gen_random_uuid(), a.id, lower(a.email), trim(i.display_name)
FROM bootstrap_input i JOIN auth.users a ON a.id=i.auth_id
WHERE a.email_confirmed_at IS NOT NULL;
INSERT INTO public."Mosque" (id,name,slug,status)
SELECT gen_random_uuid(), trim(mosque_name), mosque_slug, 'ACTIVE'::public."MosqueStatus"
FROM bootstrap_input;
INSERT INTO public."MosqueMembership" (id,"mosqueId","userId",status)
SELECT gen_random_uuid(),m.id,u.id,'ACTIVE'::public."MembershipStatus"
FROM public."Mosque" m CROSS JOIN public."User" u JOIN bootstrap_input i ON u."authUserId"=i.auth_id
WHERE m.slug=i.mosque_slug;
INSERT INTO public."MembershipRole" ("membershipId","roleId")
SELECT mm.id,r.id FROM public."MosqueMembership" mm
CROSS JOIN public."Role" r WHERE r.key='ketua_takmir';
INSERT INTO public."AuditLog" (id,"mosqueId","actorId",action,resource)
SELECT gen_random_uuid(), m.id,u.id,'mosque.bootstrap','Mosque'
FROM public."Mosque" m CROSS JOIN public."User" u;
COMMIT;
-- Revoke/disconnect administrator credentials after initial provisioning.
