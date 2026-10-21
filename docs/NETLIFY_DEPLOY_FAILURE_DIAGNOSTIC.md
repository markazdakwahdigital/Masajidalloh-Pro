# Netlify diagnostic and current state

## Facts checked (2026-10-21)
- GitHub branch `feature/phase1-saas-foundation` CI builds successfully; this does NOT prove Netlify deployment or connectivity.
- Netlify project user supplied: `https://app.netlify.com/projects/masajidallohpro/deploys`.
- Failed Netlify deploys were deleted by user; no corresponding deploy log has been retrieved.
- Chat integration does not provide Netlify write/log access. No change to Netlify site settings is claimed.
- Supabase project has one verified Auth identity already linked to the pilot app user, active mosque and active `admin_masjid` membership.

## Secret-safe preflight
`netlify.toml` runs `scripts/check-deploy-env.mjs` before Prisma and Next.js. It checks only syntax/presence, never prints secret values. It does NOT confirm the DB password, SSL setup, pooler compatibility, or network connectivity.

## Troubleshooting after next deploy
1. Verify Netlify Free plan and deployment from `feature/phase1-saas-foundation`.
2. Look at project → Deploys → latest deploy → Deploy log. Keep only the final error and a short redacted fragment; never paste environment values, invite tokens or full connection strings.
3. An env preflight error means a missing/invalid Netlify variable. A Prisma/Next build failure needs the **exact redacted error**.
4. After a successful deploy, configure Supabase Auth's Site URL and `/auth/finish` redirect with the exact HTTPS site URL, then generate a new password recovery link for the existing verified account.
5. Do not promote finance features or enable real masjid data until live session and tenant isolation tests pass.
