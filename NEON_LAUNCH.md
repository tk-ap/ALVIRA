# Neon launch path

Production persistence is being moved from ephemeral Vercel SQLite to Neon Postgres.

## Launch rule

Do not delete, reset, or migrate the legacy SQLite state automatically. Historical account recovery remains a separate operation.

## Current launch-critical Neon surface

- `src/db-neon.ts`: Neon users/sessions/password persistence.
- `src/auth-neon.ts`: async authentication/session service.
- Neon schema: users, sessions, password resets, profiles, purchases, interview drafts, waitlist, compensation, draft transfers, events.

## Recovery rule

The legacy SQLite account is not represented in Neon. If the old Vercel instance is still available, export the account/profile/draft data into Neon before merging or deleting anything. If it is unavailable, recreate a launch account without overwriting historical identifiers.

## Verification before production cutover

1. DATABASE_URL present in Vercel production.
2. Neon schema migration applied.
3. New account registration succeeds.
4. Login creates a durable Neon session.
5. Logout deletes the Neon session.
6. Re-login works from a fresh browser session.
7. Profile/interview persistence is verified on the launch path.
8. Legacy SQLite remains untouched until recovery is complete.
