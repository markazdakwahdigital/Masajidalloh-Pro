# MASAJIDALLOH PRO — Netlify Free staging deployment

> STATUS: Repository is prepared for import, but Netlify has not been deployed by ChatGPT. Do not treat a successful GitHub CI build as a successful live deployment.

## Important: choose the Git branch containing application code

- Repository: `markazdakwahdigital/Masajidalloh-Pro`
- Branch to deploy: `feature/phase1-saas-foundation`
- **Do not select `main` yet**; the application is only on the feature branch and PR #1 is still draft.
- If the Netlify import wizard cannot select a non-default production branch, link the repo then configure **Project configuration → Build & deploy → Continuous deployment → Branches and deploy contexts → Production branch**. Confirm the actual Netlify UI before deploying. Do not merge a draft PR simply to work around a deployment setting.

## Build settings

- Framework: Next.js (auto detected)
- Base directory: repository root / leave blank
- Build command: `npm run db:generate && npm run build` (set in `netlify.toml`)
- Publish directory: `.next` (Netlify's Next.js runtime/plugin must be active; no static export)
- Node.js 22.
- Verify Netlify's Next.js runtime supports the exact Next.js 15.5 build before usage.

## Variables to configure in Netlify UI, never in GitHub code or chat

- `NEXT_PUBLIC_SUPABASE_URL`: `https://vsbvyhghggvzoanozvvw.supabase.co` (public URL)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: obtain publishable key in Supabase Project Settings → API Keys. **Public** but keep it in deployment config to avoid errors, never confuse with service role/secret key.
- `DATABASE_URL`: the connection-pool-compatible **PostgreSQL connection URI** from Supabase Project → Connect. Secret! Restrict to server runtime; use SSL and approved pooling mode. Do not supply DB password in conversation, URL screenshot, or Git.
- Leave the Supabase **service_role / secret key** unset; frontend must never receive it.
- If Netlify build caches generated Prisma Client incorrectly, clear build cache and redeploy.

## After obtaining your actual HTTPS site URL

1. In Supabase Authentication → URL Configuration: set Site URL to `https://ACTUAL-NETLIFY-SITE.netlify.app` and allow exact redirect `https://ACTUAL-NETLIFY-SITE.netlify.app/auth/finish`.
2. Old invites redirected to localhost, and disclosed/reused tokens cannot be relied on. Send a new password recovery link to the **already confirmed** email, never resend the disclosed token.
3. Test `/`, `/login`, `/auth/finish`, `/setup-password`, `/dashboard` with valid and invalid sessions. Confirm error pages do not leak tokens.
4. Complete the first mosque bootstrap using the verified admin user; see `FIRST_MOSQUE_BOOTSTRAP.md` for preconditions. Do not change any password in SQL.
5. Test cross-tenant permissions with two test mosques, protected actions, and audit records before enabling real masjid data.

## Cost and boundaries

Use Netlify's **Free** tier only and do not enable a paid plan. Watch build/compute credits and quota dashboards. The staging URL is not a guarantee of 24/7 availability. All app secrets stay in managed environment variables. Real finance data requires tested backup, restore and security controls.
