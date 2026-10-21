# Phase 1D: Pilot programs and mosque agenda
- Supabase migration `mosque_programs_tenant_locked` applied, creating `MosqueProgram` with tenant FK and index, check constraints, RLS deny-by-default, and grants revoked from anon/authenticated.
- `program.read` and `program.manage` permissions assigned to the appropriate starter roles.
- A signed-in active mosque member with `program.read` can see up to 50 activities scoped by the authorized `mosqueId`.
- A member with `program.manage` can create DRAFT activities using a server action, with atomic audit record. Publication not supported yet.
- The source uses fixed Asia/Jakarta timezone for pilot scheduling; multi-timezone configuration must be implemented before nationwide use.
- No real administration account exists. No live login nor cross-tenant end-to-end tests have run. RLS remains closed to public Supabase REST clients; Prisma server DB role must not be exposed.
- Existing Supabase migration history needs Prisma baseline reconciliation before Prisma migration commands are run.
- Review concurrency handling, anti-abuse limits, profile auditing, secure provisioning and periodic backups before production.
