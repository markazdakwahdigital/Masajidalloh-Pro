# Phase 1E — publish/cancel program events

- Added server-gated status transition DRAFT → PUBLISHED → CANCELED.
- Every update checks identity, tenant, program.manage and previous state. Tenant-scoped updateMany and audit insertion are atomic.
- Programs are still visible **only** in the protected mosque dashboard, even when PUBLISHED. This does **not** expose a public calendar or automatically notify jamaah.
- Fixed timezone to Asia/Jakarta for pilot; other timezones require mosque-level configuration.
- Role revocation is rechecked inside the transaction; before production, add serializable transaction or row-locks for stricter concurrent-revocation guarantees.
- No public deployment or first admin provisioned.
