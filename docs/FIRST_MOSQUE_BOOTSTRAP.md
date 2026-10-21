# First mosque provisioning — executed and verified

## Actual state as of 2026-10-21

- The first MASAJIDALLOH PRO pilot is **Masjid Agung Al Muttaqiin**, slug `masjid-agung-al-muttaqiin`.
- A verified Supabase Auth user, previously designated by the account owner, was linked to application `User` with provisional display label `Administrator Pilot`.
- Exactly one active `MosqueMembership` and the `admin_masjid` role were added, along with an `AuditLog` event `pilot.bootstrap.admin`.
- These records were successfully read back from the Supabase project. The user's email address and auth UUID are not committed to GitHub.
- No password was generated, inspected, or stored in the repository. The label is NOT a declaration of official Ketua Takmir title.
- **Do not run `scripts/bootstrap-first-mosque.sql` in this database.** The first-mosque-only prerequisite is no longer true. That script remains for fresh, empty environments only; it is not required to activate this pilot.

## Remaining release gates

1. Deploy a compatible Next.js server runtime using Free hosting; no Netlify deployment has been independently confirmed.
2. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-side `DATABASE_URL` in Netlify's secret settings, never source code or chat.
3. Set Supabase Authentication Site URL to the real HTTPS staging domain and allow `/auth/finish` callback.
4. Send a **fresh password recovery** link for the verified existing account. Old invite links may already be consumed or disclosed, so do not reuse them.
5. Verify login, logout, profile edit, draft/published program CRUD, audit entries and two-mosque tenant isolation end-to-end.
6. Enable/verify appropriate password protection, storage and database backups, least-privilege access, rate limiting and MFA before financial data.

No claim of live production readiness.
