# Supabase invitation redirect — localhost connection refused

## Observed 2026-10-21

- The first pilot administrator invitation successfully created a Supabase Auth user and **email was confirmed**. Supabase records a sign-in event.
- The browser was sent to `http://localhost:3000`, a development-only origin where no app was running on the user's device.
- A reused/expired invitation can also contain `error_code=otp_expired`; do **not** retry the disclosed old token. Tokens should never appear in tickets, chat, public repository, or screenshots.

## Fix for a usable staging deployment

1. Deploy Next.js server application to a supported free hosting provider with environment secrets. The repository currently has **no confirmed accessible staging URL**.
2. In Supabase Dashboard → Authentication → URL Configuration, set **Site URL** to the actual HTTPS staging origin; add exact allowed redirect URL `https://YOUR-STAGING-DOMAIN/auth/finish` in **Redirect URLs**.
3. New invitation or password recovery links must use `redirectTo: 'https://YOUR-STAGING-DOMAIN/auth/finish'`. For invitations sent using Supabase Dashboard, the configured default Site URL may be used; ensure its destination is correct. Never use localhost in emails for remote users.
4. Newly implemented `/auth/finish` accepts Supabase OAuth PKCE `?code=` or implicit `#access_token=...&refresh_token=...` and establishes browser session cookies; it clears the URL fragment/query and routes to protected `/setup-password`. Protected server action allows verified Auth users to set a password.
5. If a link already got consumed at localhost, request **a fresh password recovery link** using the corrected redirect. Do not create duplicate Auth accounts. If provider presents an invitation again, do not share the link externally.
6. After password is saved, app dashboard will show **no active mosque** until the separately authorized first-mosque bootstrap has linked Auth user UUID, user profile, and membership. Do not grant roles just because the email was known.
7. Test on HTTPS staging and mobile: invitation/recovery, expiry, one-time use, sign-in, sign-out, unauthorized user, and tenant isolation. Disable verbose token logging.

**Security:** The user pasted a complete invite verification URL into chat; treat that token as compromised. It appears to have already been consumed but must never be reused. No production hosting or live end-to-end test has been completed.
