# Tenant registration pilot
- /paket presents BASIC free and proposed PRO / ENTERPRISE tiers, without collecting payments.
- /daftar-masjid stores a PENDING application in TenantApplication through server-only Prisma. No self-signup credentials are issued.
- TenantApplication has RLS enabled; no grants for anon/authenticated REST API. Database owner server connection only.
- Maximum 2 applications per contact email in a 24 hour period, basic bot honeypot. Add production-grade IP-based edge rate limiting/CAPTCHA before broad public launch.
- Operational approval/manual provisioning via authorized Supabase admin, with identity proof and mosque duplicate screening. Never change application status to APPROVED without creating mosque membership, role and verified Supabase Auth identity.
- Plan PRO / ENTERPRISE prices are placeholders; no checkout, billing, paid activation or automatic subscription.
- Admin approval UI, platform owner accounts, verification email, terms/privacy consent, pricing decisions, and audit actions remain future work.
