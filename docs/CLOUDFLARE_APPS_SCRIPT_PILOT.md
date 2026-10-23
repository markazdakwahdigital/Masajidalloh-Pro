# Cloudflare + Google Apps Script pilot — MASAJIDALLOH PRO

**Status:** development preparation only; **NOT** deployed, not a functioning Cloudflare app.

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
