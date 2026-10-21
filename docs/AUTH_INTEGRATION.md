# Phase 1C: Supabase Auth → PostgreSQL membership gate

## Scope implemented in source
- Sign-in via Supabase Auth email/password in Next.js Server Action. No new public signup; all users require an administrator.
- Supabase SSR HTTP-only cookie handling via Next.js cookies; protected dashboard re-verifies identity with `auth.getUser()`.
- Postgres `User.authUserId` is a nullable unique UUID for mapping Supabase Auth user IDs to application users. **Never auto-link users by email**.
- Dashboard lists only active mosques for an active application user, and no finance or private data.
- Missing database configuration and missing active membership fail closed; protected route never publishes tenant contents.
- Signout implemented. Global rate limits, invite flow, account recovery, deployment setup, audit and fully tested tenant isolation remain TODO.

## Supabase migration already applied
Migration `link_verified_supabase_auth_identity` adds nullable unique `authUserId` to `public."User"`.
Initial migration `initial_saas_foundation_locked` created eight RLS protected tables; `anon`/`authenticated` still have no grants. No credentials or Supabase users have been created by this phase.

## Deployment (configuration only, do not commit values)
- `NEXT_PUBLIC_SUPABASE_URL`: project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable public key.
- `DATABASE_URL`: restricted PostgreSQL connection string, **server only**, with suitable SSL/pool configuration.
- Configure permitted auth redirect URLs to match the actual deployed origin; none have been deployed yet.
- Keep privileged Supabase keys out of client code. Add HTTPS, email verification, MFA options, rate limiting, brute force prevention, alerts, backups and restore drills before real finance operations.

## Existing schema warning
- Initial schema was applied via Supabase migration tool and Prisma migration baseline has **not been established**. Do not run `prisma migrate deploy` before reconciling histories.

## Security limitations
- Reads use Prisma, so permission checks must be server-side; database connection role may bypass RLS. Only one scoped membership lookup is used currently.
- No operational billing, finance, documents, ZISWAF, or public disclosure is enabled.
- GitHub Actions validate build/types/unit tests without live database. Deployment and end-to-end auth tests require a configured hosting environment.
