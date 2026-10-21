# Implementation plan

## Phase 1A — bootstrap (this PR)
1. Initialize Next.js/TypeScript project and premium brand-aligned responsive overview.
2. Define foundational Prisma entities: mosques, users, memberships, roles, permissions, audit.
3. Add read-only health endpoint and a tenant authorization helper that denies cross-tenant access.
4. Record unimplemented features and technical risks.

## Phase 1B — authenticated SaaS foundation (not yet implemented)
1. Provision managed PostgreSQL with backups, restricted networking and least privilege.
2. Add real session-based authentication, email verification, and secure password reset.
3. Bind session actor to active mosque membership via database server-side checks.
4. Implement RBAC enforcement in server routes and PostgreSQL RLS policies; test cross-tenant API/file/export denial.
5. Create versioned Prisma migration after schema validation; execute against test DB before production.
6. Build actual admin/mosque dashboards from authenticated DB queries, no mock numbers.
7. Add testing, CI, monitoring and backup restore drill.

## Phase 2 onward
SaaS subscriptions, invoicing, approvals, finance, ZISWAF, jamaah, dakwah, UMKM, and reporting per blueprint. Redis is planned when a real cache/queue use-case is implemented.

## Release policy
Never claim production readiness until auth, RBAC, tenant isolation, billing, backup recovery, and security tests pass.
