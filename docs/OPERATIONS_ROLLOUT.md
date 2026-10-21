# Operational readiness / gated rollout

## Usable functionality once configured
- Supabase Auth password login; verified Supabase subject maps to explicit provisioned `User.authUserId`.
- Per-mosque membership + permission verification is checked by server, not URL or hidden button.
- Active member with `mosque.read` sees mosque profile.
- Member with `mosque.manage` can update mosque name; saves atomically with an audit log.
- Dashboard without active membership shows an explicit empty state (no dummy records).

## In database
- Initial 8 tables and unique `User.authUserId` migration applied.
- Seeded four roles (ketua_takmir, admin_masjid, bendahara, sekretaris) and eight permissions with assignments.
- RLS enabled, anon/authenticated table access denied. Server-side Prisma connection must remain private.

## Manual provisioning process (controlled; not public signup)
1. Create the first verified Supabase Auth user in dashboard with secure invitation or administrator-owned credentials.
2. Connect that user's `auth.users.id` to an application `User.authUserId` record using trusted admin tooling, NEVER plain email matching.
3. Create/activate a `Mosque`, `MosqueMembership`, assign role via `MembershipRole`. Do not expose these actions publicly before appropriate onboarding controls exist.
4. Configure server-only `DATABASE_URL` and public Supabase project URL/publishable key in deployment secrets.
5. Deploy to a staging origin and test login/logout, inactive user denial, cross-mosque access rejection, profile editing, and audit creation.
6. Add connection pooling, backups/restore, CSRF/session refresh/revocation, rate limiting, support/access reviews, and financial ledger before using financial data.

## Deployment blockers
- No deployment provider is connected/selected at this step.
- No server secret is configured in hosting.
- No test admin has been provisioned; live end-to-end tests not run.
- No production readiness claim is justified.
