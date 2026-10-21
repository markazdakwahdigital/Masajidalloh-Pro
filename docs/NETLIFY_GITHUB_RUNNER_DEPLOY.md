# Alternative to broken Netlify build pipeline: GitHub runner → Netlify CLI

**State:** GitHub workflow added, NOT yet run with a real Netlify token. It must be launched manually and may fail until validated against the user's actual Netlify project.

## Why this method
Netlify site `masajidallohpro` repeatedly returned exit code 2 and no detailed build trace. GitHub Actions builds Next.js successfully. This workflow uses GitHub's runner for validation and executes `netlify deploy` to build/package the Next.js app and upload the result (including serverless functions) to the existing project. It is not a static export. Netlify's official CLI `deploy` builds unless `--no-build` is specified.

## Only required new secret in GitHub
1. In Netlify account dashboard → User settings → Applications → **Personal access tokens**, create a token with only needed permission/scope when UI supports it.
2. Open GitHub repository Settings → Secrets and variables → Actions → **New repository secret**.
3. Name exactly `NETLIFY_AUTH_TOKEN`; paste the token **in GitHub only**, not in chat, source code, screenshot or a PR.
4. Keep Supabase publishable key and `DATABASE_URL` in Netlify's managed Environment variables (production context). Don't copy database passwords to GitHub.
5. To avoid duplicate failing Netlify-side Git deploys, **stop/disable automatic Netlify builds** for this site through Netlify's deployment settings once confirmed (manual CLI uploads still work); do not delete the site or change its Free plan.

## Execute once ready
- GitHub Actions → **Deploy Netlify via GitHub runner** → **Run workflow** → branch `feature/phase1-saas-foundation` (workflow_dispatch must be recognized by GitHub; some workflows are only visible in the Actions UI once a workflow file exists on the default branch).
- Before running, verify Netlify team remains **Free**; this workflow never creates a paid tier.
- Monitor the GitHub Actions job log. On success verify live HTTPS site and `/api/health` route.
- If GitHub Actions does not offer the workflow because it has not been merged to default branch, **do not merge the draft PR without review**. We can create a small workflow-only commit in the default branch when explicitly authorized, or choose another route.
- If Netlify CLI cannot read production variables marked sensitive, the build will fail with a redacted check; do not print their values.
- Use Netlify URL to update Supabase Authentication Site URL and allow exact `https://REAL-SITE.netlify.app/auth/finish` callback; request new recovery link for already verified administrator.
- GitHub Actions secret use must remain restricted to trusted branches; do not trigger workflows on untrusted pull requests.
- Success in GitHub Actions does not replace live authentication, database connectivity, two-tenant security and backup tests.

**Cost:** No plan upgrades or paid products, but Netlify/GitHub Free usage quotas apply. Review quota before running.
