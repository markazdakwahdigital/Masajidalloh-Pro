# Netlify deployment fails — safe troubleshooting

## Current evidence
- Connected Netlify project: `masajidallohpro` (user-provided dashboard URL).
- Failed deployments were reportedly deleted; their actual build logs are unavailable to the GitHub/Supabase tools.
- GitHub Actions for the previous commit completed successfully. **GitHub build success is not a Netlify deploy success.**
- Netlify is not connected as a writable app/connector in this chat, and browser tab access needs the user's originating connected browser context. Do not claim to have deployed.

## What this commit changes
`netlify.toml` invokes `scripts/check-deploy-env.mjs` *before* Prisma generation and Next.js build. It prints only variable **names** and readable guidance, never secret values. It checks configured Supabase URL, publishable key format, and PostgreSQL URL presence/format. A pass does NOT verify DB credentials or network accessibility.

## Recover failure evidence
1. In Netlify project → **Deploys**, find the newest failed deploy → **Deploy log** or **Build log**.
2. If old deploys were deleted, trigger one new deploy from `feature/phase1-saas-foundation`, only after confirming Netlify Free remains active. A push to the connected production branch may also trigger automatic deployment.
3. Copy ONLY the final error heading and about 10–20 non-sensitive surrounding lines; redact all passwords, token-bearing URLs, secret values, and full DATABASE_URL. Never paste entire build logs unchecked.
4. Diagnose in this order: missing/invalid environment variables → dependency install/build → Netlify Next.js runtime/plugin → Prisma runtime connectivity → auth redirect. These are independent failure causes.

## Required app values (Netlify environment variables)
- `NEXT_PUBLIC_SUPABASE_URL`: public project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: sb_publishable_* key, not service_role.
- `DATABASE_URL`: PostgreSQL URL with current encoded DB password; secret in Netlify. Transaction pooler port may be 6543. This script does NOT validate password correctness.

Do not switch production to an unrelated branch, pay for upgrades, or remove auth/tenant guards to make deployment pass.
