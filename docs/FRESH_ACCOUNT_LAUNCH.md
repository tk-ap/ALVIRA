# Fresh-account launch runbook

## Decision

ALVIRA is launching a new Neon-backed account system. Existing local-SQLite accounts are intentionally not migrated. Users create a new account after launch.

## Before deployment

1. Apply `bun run db:migrate` using the Neon production connection string.
2. Run `bun run db:verify` using that same connection string.
3. In the ALVIRA Vercel project, set production `DATABASE_URL` to that string.
4. Configure `PUBLIC_SITE_URL` to ALVIRA's canonical HTTPS URL.
5. Configure real email delivery (`RESEND_API_KEY`, `EMAIL_FROM`) and validate one password-reset delivery.
6. Do not configure `ALVIRA_SESSION_COOKIE_DOMAIN` while the products use distinct `vercel.app` domains.

## Shared login future state

While the legacy Bridge backend remains on a sibling deployment, set the same `ALVIRA_SESSION_COOKIE_DOMAIN` value on both deployments, for example `.alvira.ai`. Both deployments must use the same Neon `DATABASE_URL` and validate the same `sessions` rows. Customer-facing Bridge entry and management live inside ALVIRA at `/bridge`; the sibling deployment is an implementation detail during migration.

## E2E acceptance

1. A new free-tier account can sign up and receives an `HttpOnly`, `Secure`, server-set session cookie in production.
2. A fresh browser session can log in, reach `/app`, and save/reload a profile.
3. Logout invalidates the session and clears the server-managed cookie.
4. Password reset email arrives and permits a new password.
5. The smoke account flow is verified before owner-only paths.

## Customer email — draft only, do not send before E2E approval

**Subject:** A fresh start for ALVIRA

Hi,

ALVIRA now brings three connected experiences into one product: Context builds what AI should know, Reflect helps you revisit and evolve that understanding, and Bridge lets you carry approved context into ChatGPT, Claude, Gemini, Cursor, and the rest of your stack.

As part of this launch, we’ve moved to a new, more durable account foundation. Existing sign-in credentials were not carried forward, so please create a new ALVIRA account to continue.

Create your new account: {{ALVIRA_SIGNUP_URL}}

Then open Bridge inside ALVIRA: https://alviratech.vercel.app/bridge

Thank you for being early. Your feedback is helping shape what comes next.

— The ALVIRA team
