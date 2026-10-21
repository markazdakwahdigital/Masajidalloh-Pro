# Supabase foundation — verified 2026-10-21

Project: `vsbvyhghggvzoanozvvw` (Supabase, PostgreSQL 17, region ap-northeast-2 / Seoul).
The project ID is public configuration, **not** a credential.

## Actual migration applied to Supabase

- Migration: `20261021022943_initial_saas_foundation_locked`
- Status: successful, verified via Supabase migration list.
- Eight tables: `Mosque`, `User`, `Role`, `Permission`, `MosqueMembership`, `MembershipRole`, `RolePermission`, `AuditLog`.
- Tables are currently empty; indexes and foreign keys have been created.
- PostgreSQL RLS enabled on all eight tables, with no policies (fail closed).
- SQL grants to `anon` and `authenticated` revoked; checked using `has_table_privilege`: SELECT = false for all eight tables.
- Supabase advisor reports INFO `rls_enabled_no_policy` (expected until verified session and membership authorization are implemented).
- Migration was applied directly via Supabase management integration, and has **not** been recreated as a versioned SQL file inside this GitHub repository. Do not attempt to replay an initial CREATE TABLE migration on this existing project; first baseline Prisma migration history and reconcile the source-controlled schema carefully.

## Next phase / blocking work

1. Implement verified session authentication, profile mapping, password reset and session revocation.
2. Build authorization using database-verified membership and tenant role permissions.
3. Choose one vetted data access architecture: Prisma server-only with least-privilege DB credentials and consistent per-query tenant filters, or vetted Supabase JWT+RLS policies. Do **not** bypass RLS with a service-role key in browsers.
4. Reconcile Prisma migrations with existing Supabase migration history before running `prisma migrate deploy`.
5. Add integration tests involving two distinct mosques, including cross-tenant queries, exports, documents, and mutations.
6. Establish automated backups and verified restore; avoid using real financial data until secured.
7. Store database connection string and secrets in hosting secret storage, never in this repository or chat.

No deployment, operational user signup, or tenant data has been enabled.
