# Multi-tenant launch — 25 Oktober 2026

## Implemented
- Authenticated Supabase HTTPS RPC replaces the runtime Prisma/database-URI path. No service-role key in the app.
- Each active Mosque has at most one writer, enforced by MosqueAdmin primary key and every mutation's server/database checks. Existing single explicitly authorized manager is preserved.
- Active members can read Dashboard and all module reports within the assigned package. Readers receive no data-entry forms or management controls.
- Verified-email accounts submit pending applications. Only verified platform owner markazdakwahdigital.01@gmail.com can activate/reject through /platform. Activation is transactional and assigns one Admin and the selected plan. It does not collect payment.
- Admin shares /gabung/<Mosque UUID>; readers verify email, request access, and await Admin approval. Admin can revoke reading access.
- Writes and changes produce audit logs. Archive is soft deletion. Visible dashboards refresh every 30 seconds; this is polling, not push subscriptions.
- Public /api/readiness tests DB connectivity only. It does not certify email delivery, backup recovery, capacity or complete production readiness.

## Security model
Authenticated RPCs intentionally use SECURITY DEFINER with an empty search_path, fixed fully qualified relations, verified auth.uid(), current membership, sole-admin and server-assigned-package checks. All helper functions are in a private schema without anonymous/authenticated access. Direct table access remains revoked and RLS remains enabled. The Supabase advisor warnings for authenticated definer functions are expected for this bounded API contract; anonymous users cannot invoke them. No user_metadata value grants authority.

## Verification
- 23 local tests, TypeScript, lint and Cloudflare production build.
- tests/multitenant-database.sql: 45 synthetic tenants, 15 per package, 195 database assertions including membership approval/revocation, isolation, blocked reader writes, plan gates, verification and registration limits. Runs in a transaction with ROLLBACK, no persistent test users/tenants.
- This is not a 45-session concurrent browser or production load test.

## Required before general launch
1. Configure custom SMTP in Supabase. The built-in sender is restricted and is not a production enrollment mail service. Never disable verification to bypass mail delivery.
2. Create and verify the platform owner account above through /buat-akun; this account is not automatically created by the schema.
3. Complete a real browser enrollment -> email confirmation -> activation -> Admin save/reload -> reader approval/read/denied write check with participating real users. No account passwords should be given to the assistant.
4. Validate backups and a restoration procedure, and run authenticated load testing before claiming capacity for 45 concurrently active tenants and all their readers.
5. Google Drive photo upload is optional and remains disabled unless its separate authorized integration is configured. Core biodata can be saved without a photo.

Database SQL is in supabase/multitenant-launch.sql. Preserve existing data; do not blindly rerun initialization/backfill after changing designated Admins. No automatic billing or paid provisioning is enabled.

## Tenant management
Apply supabase/tenant-management.sql after the base launch SQL. Operator-only status/plan/Admin changes require a reason, a review step and an exact current-state check under a tenant row lock. The Admin helper takes the same lock before authorization so a queued old Admin write cannot pass after reassignment or suspension. Admin replacement accepts only an active, verified existing member; the prior Admin remains a reader. No tenant records are deleted on suspension or package downgrade. Operator read APIs disclose management metadata, not workspace records. Latest 50 tenant audit entries are shown. Existing tenant settings were not changed during verification. Positive production changes must be made deliberately by the signed-in operator.
