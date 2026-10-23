# Cloudflare + Google Apps Script pilot — MASAJIDALLOH PRO

**Status:** vinext static compatibility preflight completed on 2026-10-23, but **NOT** deployed; no Cloudflare runtime smoke test yet.

### Recorded preflight result — GitHub Actions run 39897458696
- `npx --yes vinext check`: **96% compatible (13 supported, 1 partial, 0 issues)**.
- Next.js imports **7/7 fully supported**; Prisma library recognized as adapter-compatible, NOT proof that current native Prisma engine works on Workers.
- `reactStrictMode` configuration is partially supported (App Router behavior differs).
- Scan did not test live Cloudflare build, Supabase access, login cookies, native Prisma binaries, tenant boundaries, or load.
- Evidence: https://github.com/markazdakwahdigital/Masajidalloh-Pro/actions/runs/39897458696


## Goals and non-negotiable rules

- Keep Supabase PostgreSQL/Auth authoritative for users, tenants, membership, roles and pending tenant applications.
- Keep existing Netlify and current GitHub Pages deployments untouched during validation.
- No payment, tenant activation, or provisioning from a spreadsheet or a public anonymous endpoint.
- No Supabase service-role secret, DATABASE_URL, session token, or other privileged credential in Google Apps Script, Sheets, browser, or GitHub.
- Only use no-cost plans while quotas permit; upgrade requires the owner's explicit approval.
- Verify isolation: two distinct masjids cannot view or change each other's records.

## Track A — Cloudflare runtime compatibility (NOT YET IMPLEMENTED)

Cloudflare currently recommends **vinext** for new Workers Next.js deployments.
Our actual source is Next.js 15 App Router with Server Actions, server-only Prisma Client 6 native query engine, and Supabase SSR cookies.
A direct deployment of the current source is unsafe: native Prisma Query Engine is a Node/server binary and cannot simply be copied to Workers.

1. In this dedicated feature branch, run the official vinext compatibility check (`npx vinext check`) in a local/CI sandbox before any migration. Review toolchain support for Next.js **15.5**, Server Actions, SSR cookies, route handlers, and PWA assets.
2. Evaluate a Cloudflare-compatible, least-privilege access route to Supabase Postgres (e.g. Prisma-supported edge driver/adapter where supported, or server API with explicit authorization checks). **Do not** expose an admin/service-role key to the frontend or use unsecured PostgREST endpoints.
3. Convert in small slices: public landing + health, auth login/logout, authorized dashboard, membership filtering, tenant application form. Do not declare runtime compatibility solely from a successful static build.
4. Run runtime tests on Workers Free and verify package size, execution-time quota, cross-tenant isolation, auth cookie persistence, rate limits, and logging. Free quotas are not an uptime or cost guarantee.
5. Only after end-to-end tests, connect a production hostname and cut over; retain rollback.

Official guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

## Track B — Google Apps Script intake (IMPLEMENTED AS OPTIONAL SOURCE FILE)

`integrations/apps-script/Code.gs` is an optional **waiting-list notification** helper. It intentionally does **not** sync directly into Supabase, charge, approve, or create accounts.

### Manual configuration in a restricted Google account

1. Make a Google Form titled "Minat Tenant MASAJIDALLOH PRO" with fields: Nama Masjid, Kota/Kabupaten, Alamat Masjid, Nama PIC, Email PIC, Nomor WhatsApp PIC, Paket yang Diminati, Persetujuan Penggunaan Data. Keep response collection restricted. Describe the data purpose, retention and contact before publishing. Do not ask for passwords, ID scans, or financial information.
2. Under **Responses**, create a linked Google Sheet. Limit spreadsheet sharing to authorized MDD CRM/admin personnel; never set "Anyone with link".
3. Open the linked spreadsheet → Extensions → Apps Script, paste `Code.gs`, and save.
4. Optional: Apps Script → Project Settings → Script Properties → add `MDD_ADMIN_NOTIFY_EMAIL` with the responsible CRM/admin email. Do not paste secrets.
5. Apps Script → Triggers → Add trigger → function `onTenantFormSubmit`, event source **From spreadsheet**, event type **On form submit**. Approve Google permissions with the owner account.
6. Send one test form submission and inspect new `Status Tindak Lanjut = PENDING` and `Waktu Pencatatan` cells. If configured, verify an email notifying admin (it intentionally contains no applicant PII).
7. Test duplicate trigger, permission handling, and spreadsheet visibility. Only CRM may manually validate a candidate before provisioning a Supabase Auth user and ACTIVE MosqueMembership.

**Caveats**: Google Apps Script email/trigger quotas and automatic form collection limits apply. Spreadsheet response is an administrative backup/waiting list; it is not proof of registered or activated tenant. Script has not been installed or executed in a Google account by this repository commit.

## Release gate

- [ ] Cloudflare account/Free quota verified
- [ ] vinext compatibility and Workers build proven
- [ ] database adapter/server authorization tested
- [ ] login, logout, dashboard, PWA, tenant registration tested on actual Workers runtime
- [ ] cross-tenant access-control tests passed
- [ ] Google Form opt-in, protected Sheet and installable trigger tested
- [ ] rollback, backups, privacy notice and request limits in place
- [ ] production host switched after owner approval

### Real build attempt (2026-10-23)
- GitHub Actions run [39983938184](https://github.com/markazdakwahdigital/Masajidalloh-Pro/actions/runs/39983938184) revealed **npm ERESOLVE** during installation of the vinext 1.3.0 toolchain: the existing `react@19.1.4` does not satisfy vinext's declared `react@^19.3.1` peer requirement.
- Consequently **the Vite build did not run**; the 96% static scan is not a successful build or Cloudflare deployment.
- Next test must upgrade React and matching dependencies *only on a migration test branch*, reconcile lockfile, run existing unit/Next.js checks, then attempt `vite build`. Do not use `--force` or `--legacy-peer-deps` to mask incompatibilities.
- Cloudflare dashboard is not accessible via an installed connector in this chat; the owner must authorize a browser-controlled Work session or an approved hosting integration before remote deployment can be performed.

### Updated build result — 2026-10-23, GitHub Actions run 39986800102
- The migration branch now uses `react@19.3.1` and `react-dom@19.3.1` in `package.json`, plus ESM mode (`"type": "module"`) so the vinext Vite config can load.
- `npm install --no-save vinext vite @vitejs/plugin-react @vitejs/plugin-rsc react-server-dom-webpack` succeeded without forcing peer-dependency resolution.
- **`npx vite build` succeeded** on GitHub Actions (the workflow now fails on build errors). This is a production bundle created in CI, **not** a Cloudflare deployment or runtime smoke test.
- GitHub evidence: https://github.com/markazdakwahdigital/Masajidalloh-Pro/actions/runs/39986800102
- Remaining blockers: validate the exact Workers build output, select and implement a Cloudflare-compatible Prisma/Postgres adapter, secret management, runtime login/logout, PWA, tenant isolation, and Cloudflare Free quota behavior. No credentials or Cloudflare Worker were provisioned.
- React and ESM changes are isolated on `feature/cloudflare-gas-pilot`; legacy Netlify runtime is unchanged.

### Rust-free Prisma adapter migration — 2026-10-23
- Migration branch only: upgraded Prisma CLI and client to **6.19.0** and added matching `@prisma/adapter-pg`, `pg`, and `@types/pg`.
- Changed `schema.prisma` generator to `engineType = "client"`, removing native RHEL/Debian Rust engine requirement.
- `src/lib/db.ts` now uses PrismaPg with server-only `DATABASE_URL`. Do **not** expose the URL in client or deploy if absent.
- GitHub Actions [39987479118](https://github.com/markazdakwahdigital/Masajidalloh-Pro/actions/runs/39987479118): Rust-free Prisma generate and `npx vite build` both passed with non-production placeholder DB URL; no connection was attempted.
- Worker **runtime not yet tested**; remaining: create/verify Cloudflare-specific vinext config and worker binding, test pg TCP/TLS with Supabase Transaction Pooler under `nodejs_compat`, confirm secrets and SSR cookies on live test Worker, verify tenant isolation and quotas.
- IMPORTANT: React, Prisma and adapter upgrades are not intended for the legacy Netlify production branch; do not merge to `main` blindly.
- Framework guide: https://www.prisma.io/docs/orm/v6/prisma-client/deployment/edge/deploy-to-cloudflare

### Cloudflare Worker build-output audit — 2026-10-23

- Config now uses Cloudflare Vite Plugin **2.0.0-beta.v.3**, `cloudflare.config.ts`, and the `cf` CLI **1.0.0-beta.20**, solely on migration branch. It also uses the real Cloudflare plugin in Vite's RSC environment.
- GitHub Actions [39990814328](https://github.com/markazdakwahdigital/Masajidalloh-Pro/actions/runs/39990814328) successfully generated Cloudflare v2 build output under `.cloudflare/output/v0` (but this alone does not prove functional SSR).
- A stricter gate in [39991132993](https://github.com/markazdakwahdigital/Masajidalloh-Pro/actions/runs/39991132993) **blocked release**: `workers/default/worker.config.json` has no `manifest.mainModule`. The output is assets-only; server login/dynamic tenant routes would not run.
- **DO NOT DEPLOY / DO NOT PROMOTE:** diagnose vinext RSC Worker entrypoint generation with the v2 Cloudflare Vite plugin. Consider running the official `vinext init --platform=cloudflare` in a disposable test checkout, comparing generated `cloudflare.config.ts` and `vite.config.ts`; never auto-create paid cache resources or inject credentials.
- Current Cloudflare Free integration has **no Worker deployed, no database connection tested, no login proven**. Existing Netlify live site and Supabase database untouched.

### Server entrypoint repair — 2026-10-24

- Root cause confirmed from run 40035373472 and vinext 1.3.0's installed initializer: typed Cloudflare v2 config omitted `worker.entrypoint`. The plugin therefore emitted an assets-only Worker even though Vite built RSC chunks elsewhere. Config now follows the initializer: `defineWorker`, `vinext/server/fetch-handler`, ASSETS binding and explicit static-asset routing.
- Local production build now emits `manifest.mainModule` and actual server modules in `workers/default/bundle`. `cf deploy --dry-run --prebuilt --mode production` passed without uploading or provisioning resources. Compressed upload approximately 562 KiB on the first repaired build.
- Added a manifest/module check and workerd HTTP smoke checks to CI. Smoke checks cover liveness, public SSR, anonymous dashboard redirects and PWA assets. They deliberately do not claim authenticated login, database access or realtime behavior.
- Existing 14 tests passed locally. TypeScript passed; ESLint passed with existing component warnings after ignoring generated build output.
- Local workerd could not start in this execution environment (`fatal library error, lookup self`); CI runtime result must be inspected before release. CI disables the optional inspector to avoid network-interface enumeration and uses dummy credentials only.
- Dependency lockfile now commits the tested toolchain. CI uses `npm ci`, removes its second unpinned toolchain install, and selects Node 24.22.0 to satisfy cf's declared engine requirement.
- Three required runtime bindings are declared as secrets: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Only DATABASE_URL is privileged; public Supabase configuration must also be available at build time for client components. No production secret values are committed.
- Remote deployment, real database connectivity, authenticated sessions and realtime updates remain unverified. Browser connection is unavailable in the current session. Existing production site is unchanged.
