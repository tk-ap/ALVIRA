# ALVIRA Vercel Runtime Migration

## Status

This is a post–Revision 11 working hypothesis, not owner-ratified product direction. It changes deployment infrastructure only; it does not change the approved product experience.

## Approved requirement

Run ALVIRA on Vercel without Node function startup failures and without losing existing customer data.

## Implementation requirements

- Use Postgres through `DATABASE_URL`; do not use process-local SQLite in Vercel functions.
- Preserve compatibility with existing bcrypt password hashes.
- Store sessions, profiles, drafts, purchases, waitlist entries, and recovery records in Postgres.
- Deliver transactional email through Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured.
- Fail deployment before publishing when `DATABASE_URL` is absent.
- Keep `https://alvira.ctonew.app` live until migration counts and smoke tests pass.

## Deployment sequence

1. Create or connect a Neon Postgres database in the Vercel project.
2. Export `DATABASE_URL` in the deployment terminal.
3. Run `bun run db:migrate` and confirm `Postgres schema is ready.`
4. Back up the current SQLite database and export every table before production cutover.
5. Import the export into Postgres and compare row counts by table.
6. Set `PUBLIC_SITE_URL`, `OPENAI_API_KEY`, and optional Resend variables in Vercel.
7. Run `bun run go-live` to deploy a preview.
8. Smoke-test homepage, signup, login, profile save/load, interview autosave, password reset, and team waitlist.
9. Move the production domain only after owner review.

## Acceptance criteria

- Vercel returns HTTP 200 for `/`, `/login`, and `/signup`.
- A new account can sign up, sign out, and sign back in.
- Existing bcrypt credentials remain valid after data import.
- Profile and interview draft writes survive a new deployment.
- No production bundle contains `bun:sqlite`, `Bun.password`, or `/home/team/shared`.
- Imported table row counts match the signed-off SQLite export.
- The old production site remains recoverable until final domain cutover.
