# Security status

NOT PRODUCTION READY. `requireTenantAccess` is a pure guard only: no server auth or DB-backed membership validation exists. Never expose protected application routes until those are implemented.

Required: secure sessions; verified membership, object-level authorization, tenant-scoped queries, RLS review, least-privileged DB role, authorization tests against direct API ID tampering, secure uploads, audit, rate limit, CSRF review, data privacy controls and tested restoration.
