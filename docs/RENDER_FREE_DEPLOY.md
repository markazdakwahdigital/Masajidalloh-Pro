# Render Free: MASAJIDALLOH PRO staging

## Status
- Render Blueprint `render.yaml` is in the GitHub development branch.
- Service compute is explicitly `free` (one web service, **no Render Postgres**; continue using Supabase Free).
- This source-control change does **not** create or deploy a Render service. Do not claim live deployment until Render reports success and URL is verified.
- Region Singapore; Next.js 15 server runtime, Node 22, Prisma client generation at build, liveness `/api/health`.
- The repo's application code is on `feature/phase1-saas-foundation`, not `main`; point Render to that branch.

## Next step once Render connection is active
1. In Render Dashboard (https://dashboard.render.com/), choose **New → Blueprint** and connect `markazdakwahdigital/Masajidalloh-Pro`; select `feature/phase1-saas-foundation`.
2. Review proposed service and **confirm plan Free** before approving Blueprint sync; **do not** provision any paid service or database.
3. During initial Blueprint setup, supply `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `DATABASE_URL` from Supabase securely in Render's environment secret input. `sync: false` means they must not be committed to GitHub or sent to chat.
4. Verify that public Supabase URL and project ID match the existing project. Never use Supabase service_role in client values.
5. Wait for build and launch; check `/api/health` then the landing page and login page.
6. Once a confirmed HTTPS `onrender.com` URL exists, update Supabase Auth Site URL and allow `https://REAL-HOST/auth/finish`; generate a new recovery link (old invitation is already used).
7. Test access to Masjid Agung Al Muttaqiin and audit/permission gates. Finance features are not production ready.

## Free service caveats
- Free Render web services spin down after 15 minutes of inactivity; cold starts can take roughly a minute.
- Bandwidth, build minutes, and free instance hours have limits. Watch account usage; workspace having a Free plan does not necessarily prevent supplemental bills if a payment method is on file. Do not approve upgrades or incurred charges without user consent.
- Keep Netlify existing project untouched as fallback.
- Public `/api/health` checks process liveness only, not database or Auth readiness.

## If Render Blueprint import cannot select the non-default branch
Use **New → Web Service** with the same GitHub repository and manually select branch `feature/phase1-saas-foundation`, `Node` runtime, `Free` compute, build `npm install --no-audit --no-fund && node scripts/check-deploy-env.mjs && npm run db:generate && npm run build`, start `npm run start -- --hostname 0.0.0.0`, health `/api/health`, and the same environment secrets. Do not select a paid compute plan.
