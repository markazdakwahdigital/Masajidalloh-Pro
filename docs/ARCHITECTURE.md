# Architecture decisions

- Brand: MASAJIDALLOH PRO; Professional Mosque Management Platform; Masjid Makmur, Adaptif, dan Berdaya.
- Product: multi-tenant SaaS. A mosque is a tenant identified by UUID.
- UI: royal blue, gold, white; reserved for production assets, not auto-generated stand-ins.
- Next.js server rendering/API; PostgreSQL with Prisma; Redis recommended for future invalidation, locks and queues, not primary datastore.
- Credentials via server environment only. No secrets in Git.
- Server must resolve mosque scope via authenticated, authorized membership; a URL parameter alone cannot authorize access.
- Real financial data must be computed server-side and audited.
- Platform support cannot access tenant private data by default.
- Current schema is initial design, not a migration or running database.
