# ALVIRA Founding Beta

`founding_beta` is a permanent complimentary entitlement for the first real ALVIRA product users. It is intentionally separate from founder/admin access and from paid conversion data.

## Access boundary

Founding Beta users receive unrestricted customer-facing ALVIRA access: Context interviews and updates, saved Context capacity, uploads/URL ingestion, Reflect/Reflect Build, exports, continuation flows, Bridge when available, and other customer-facing non-free features.

They do **not** receive owner metrics, the test-tier switcher, admin controls, other users' data, or internal founder diagnostics.

The app represents the entitlement in `founding_beta_access`. Free beta users use the internal `founding_beta` tier so existing free-tier quota checks treat them as unrestricted without recording them as paid Pro/Lifetime customers. The entitlement uses a compatibility expiry of `9999-12-31T23:59:59Z`; operationally it is permanent unless explicitly revoked.

## Existing-account cohort

The initial cohort is the eligible account snapshot created on 2026-08-29 at `2026-08-29T19:56:50Z`. Owner/test/service accounts are explicitly excluded. Runtime schema synchronization is idempotent and upgrades any older temporary Founding Beta expiry to the permanent compatibility expiry.

## Pre-account reservations

People who qualify before creating an account are stored in `founding_beta_reservations` by normalized email. A reservation is durable history rather than a consumable token.

Canonical fields are:

- `email`
- `source`
- `reserved_at`
- `claimed_at`
- `claimed_user_id`
- `revoked_at`

On signup, ALVIRA performs one atomic SQL statement that marks an eligible unclaimed reservation as claimed, creates or refreshes `founding_beta_access`, and promotes a Free account to `founding_beta`. The reservation row is retained after claim so later onboarding, communications, and billing reconciliation can distinguish reserved, claimed, and revoked states.

An ordinary new account with no active reservation remains on its normal tier.

## Reserve a future user

```sql
INSERT INTO founding_beta_reservations (email, source, reserved_at)
VALUES (LOWER(TRIM('USER_EMAIL_HERE')), 'founder_invite', NOW())
ON CONFLICT (email) DO UPDATE
SET source = EXCLUDED.source,
    revoked_at = NULL;
```

Do not set `claimed_at` or `claimed_user_id` manually; signup claims the reservation.

## Grant an existing account directly

```sql
WITH target AS (
  SELECT id, tier
  FROM users
  WHERE LOWER(TRIM(email)) = LOWER(TRIM('USER_EMAIL_HERE'))
), grant_access AS (
  INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
  SELECT id,
         CASE WHEN tier = 'founding_beta' THEN 'free' ELSE tier END,
         TIMESTAMPTZ '9999-12-31T23:59:59Z'
  FROM target
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = EXCLUDED.expires_at
  RETURNING user_id
)
UPDATE users
SET tier = 'founding_beta'
WHERE id IN (SELECT user_id FROM grant_access)
  AND tier = 'free';
```

If the user is already Pro/Lifetime, leave the paid tier in place; the active Founding Beta record can still identify cohort membership without overwriting paid access.

## Revoke

Revoking a pre-account reservation should set `revoked_at` rather than deleting the row. Revoking an already-claimed account should remove its `founding_beta_access` row and restore `previous_tier` if the user still carries the internal `founding_beta` tier.

## QA feedback layer

Only accounts with an active `founding_beta_access` row see the persistent **FOUNDING BETA · FEEDBACK** control.

The layer supports worked-as-expected signals, confusion/breakage reports, product observations, severity, expected behavior, optional tester-selected screenshots, and optional tester-selected contextual excerpts.

Automatically captured diagnostics are limited to route/page, timestamp, browser/device, viewport, the beta user ID, surface, and URL-level profile/interview IDs when present. ALVIRA does not automatically attach Context answers, uploaded files, document contents, or other personal Context.

Every report is persisted in `beta_feedback` and sent to `BETA_FEEDBACK_EMAIL` (default `alvira@agentmail.to`). The tester address is set as Reply-To. If email delivery fails, the database record remains available for recovery.

`src/lib/founding-beta.ts` includes the idempotent runtime schema guard needed to converge older databases onto this contract after deployment.
