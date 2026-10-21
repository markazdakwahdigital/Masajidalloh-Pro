# Phase 1B — Backend authorization foundations

## Delivered
- Added server-only membership lookup that validates an **already authenticated** actor against an ACTIVE mosque and ACTIVE membership.
- Derives permissions from membership roles in database; rejects missing/inactive membership or inactive mosque.
- Added negative tests for cross-tenant access, anonymous access, and missing permissions.
- Added explicit testing to GitHub Actions.

## Not delivered
- No identity provider or login mechanism is wired in. The `VerifiedActor` value must ONLY come from a verified server session once integrated.
- No PostgreSQL instance exists, so server membership lookup has not been integration-tested against a live database.
- No RLS policies, database migration, file storage, financial APIs, Redis, backup, or deployment exist.
- These functions are NOT an API authorization boundary by themselves. Every protected API must resolve the verified actor on the server and authorize each resource.
- Do not expose the membership service through client-provided arbitrary user IDs.
- No real mosque data should be onboarded until all essential isolation tests pass.

## Next steps
1. Provision a PostgreSQL development environment with least-privilege credentials (no secrets committed).
2. Add Auth.js or suitable maintained session-based identity integration, verified email flows, and session revocation.
3. Create tenant-scoped migrations and RLS policies; test with two separate mosques and unauthorized ID manipulation.
4. Integrate public/private dashboard separation, real queries, audit logs, and backup/restore testing.
