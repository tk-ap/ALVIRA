# ALVIRA Founding Beta

`founding_beta` is an early-access entitlement for the first 5–10 real product users. It is intentionally separate from founder/admin access and from paid conversion data.

## Access boundary

Founding Beta users receive unrestricted customer-facing ALVIRA access during the active beta window: Context interviews and updates, saved Context capacity, uploads/URL ingestion, Reflect/Reflect Build, exports, continuation flows, Bridge when available, and other customer-facing non-free features.

They do **not** receive owner metrics, the test-tier switcher, admin controls, other users' data, or internal founder diagnostics.

The app represents the access window in `founding_beta_access`. Free beta users use the internal `founding_beta` tier while access is active so existing free-tier quota checks treat them as unrestricted without recording them as paid Pro/Lifetime customers. Reflect authorization separately recognizes active Founding Beta access.

The beta overlay calls the access synchronizer on normal authenticated navigation. When an access record has expired, an account still carrying the internal `founding_beta` tier is restored to its saved `previous_tier`.

## Grant one user

Run after the user has created an ALVIRA account. Forty-five days is the recommended initial window.

```sql
WITH target AS (
  SELECT id, tier
  FROM users
  WHERE LOWER(TRIM(email)) = LOWER(TRIM('USER_EMAIL_HERE'))
), grant_access AS (
  INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
  SELECT id,
         CASE WHEN tier = 'founding_beta' THEN 'free' ELSE tier END,
         NOW() + INTERVAL '45 days'
  FROM target
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = EXCLUDED.expires_at,
        previous_tier = CASE
          WHEN founding_beta_access.previous_tier = 'founding_beta' THEN 'free'
          ELSE founding_beta_access.previous_tier
        END
  RETURNING user_id
)
UPDATE users
SET tier = 'founding_beta'
WHERE id IN (SELECT user_id FROM grant_access)
  AND tier = 'free';
```

If the user is already Pro/Lifetime, leave the paid tier in place; the active Founding Beta record still enables the beta feedback layer without overwriting paid access.

## Revoke early

```sql
WITH revoked AS (
  DELETE FROM founding_beta_access
  WHERE user_id = (
    SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM('USER_EMAIL_HERE'))
  )
  RETURNING user_id, previous_tier
)
UPDATE users u
SET tier = r.previous_tier
FROM revoked r
WHERE u.id = r.user_id
  AND u.tier = 'founding_beta';
```

## QA feedback layer

Only accounts with an active `founding_beta_access` row see the persistent **FOUNDING BETA · FEEDBACK** control.

The layer supports:

- `Worked as expected`
- `Confusing`
- `Something broke`
- full problem reports
- product observations
- severity
- expected behavior
- optional tester-selected screenshot
- optional tester-selected contextual excerpt

Automatically captured diagnostics are limited to route/page, timestamp, browser/device, viewport, the beta user ID, surface, and URL-level profile/interview IDs when present. ALVIRA does not automatically attach Context answers, uploaded files, document contents, or other personal Context.

Every report is persisted in `beta_feedback` and sent to `BETA_FEEDBACK_EMAIL` (default `alvira@agentmail.to`). The tester address is set as Reply-To. If email delivery fails, the database record remains available for recovery.

`src/lib/founding-beta.ts` includes an idempotent runtime schema guard matching `migrations/004_founding_beta.sql`, so a missing migration does not cause the beta feedback path to 500 after deployment.
