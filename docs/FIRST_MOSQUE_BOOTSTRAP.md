# First mosque & administrator: safe pilot bootstrap

**Current status:** As of 2026-10-21 the connected Supabase project had **zero** Auth users, application users, and mosques. This repository does NOT automatically create a user, guess a user's name, or grant privileges by merely signing in.

## Secure onboarding procedure

1. In Supabase Dashboard for project `vsbvyhghggvzoanozvvw`, navigate **Authentication > Users** and create/invite the first trusted operator account. Verify that the account has a confirmed email. Do not use publicly accessible sign-up as an administrator bootstrap.
2. Choose the actual first mosque's name, a URL-safe slug, and the operator's display name.
3. In a private administrator terminal with a secure database connection, run the **single-use** `scripts/bootstrap-first-mosque.sql` using the documented `psql -v ...` options. The SQL performs verification, requires that the database is still empty, inserts one `User`, one `Mosque`, an active membership and the `ketua_takmir` role in one transaction, plus an audit row. If prerequisites fail, it aborts without partial changes.
4. Verify the `MosqueMembership` is active. Then test sign-in on the *staging* application. No arbitrary user should receive initial privileges.
5. Test a second mosque and second user in a test environment with distinct identities: check authorized reads and edits, blocked unauthorized IDs, suspended membership, invalid status transition, and audit entries.
6. Rotate/restrict administrator credentials and keep Supabase privileged keys and database URL **out of source control, chat, logs, and client bundles**.

> Only execute this script once, in a controlled empty instance. It deliberately fails when any user or mosque already exists. No user provisioning was attempted or performed by this commit.

## Deployment readiness

- Auth and API server need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and server-only DATABASE_URL set as hosting environment variables; NEVER in browser assets or committed files.
- GitHub Actions currently prove Prisma schema validity, TypeScript, lint, and Next.js build, **not live end-to-end functionality**.
- Before financial data: provider backups and restore test, two-tenant integration tests, rate limiting, monitored logs, MFA, hardened account invites, and finance authorization/ledger.
- Free hosting decision awaits a working supported provider account with a compatible Next.js/Prisma runtime. No recurring-cost services have been activated in this phase.
