CREATE TABLE IF NOT EXISTS founding_beta_invites (
  email TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'reserved',
  source TEXT NOT NULL DEFAULT 'manual',
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_founding_beta_invites_status
  ON founding_beta_invites(status);

-- Grandfather active ALVIRA Reflect compensation recipients into the Founding
-- Beta invitation cohort. These reservations can exist before an account does.
INSERT INTO founding_beta_invites (email, status, source)
SELECT LOWER(TRIM(email)), 'reserved', 'reflect_comp'
FROM meos_comps
WHERE expires_at > NOW()
  AND LOWER(TRIM(email)) NOT IN (
    'tahlia.ashwood@gmail.com',
    'codex-smoke-1786676512909@example.com',
    'alvira@agentmail.to'
  )
  AND LOWER(TRIM(email)) NOT LIKE '%@example.com'
ON CONFLICT (email) DO NOTHING;

-- Expand the fixed historical cohort through the point at which the Founders
-- Beta Club cohort was finalized. Future signups are not silently enrolled.
INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
SELECT id,
       CASE WHEN tier = 'founding_beta' THEN 'free' ELSE tier END,
       TIMESTAMPTZ '9999-12-31T23:59:59Z'
FROM users
WHERE created_at <= TIMESTAMPTZ '2026-09-01T03:27:20Z'
  AND LOWER(TRIM(email)) NOT IN (
    'tahlia.ashwood@gmail.com',
    'codex-smoke-1786676512909@example.com',
    'alvira@agentmail.to'
  )
  AND LOWER(TRIM(email)) NOT LIKE '%@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Existing Founding Beta grants are permanent for the approved account/service
-- lifetime, including grants created by the earlier 45-day migration.
UPDATE founding_beta_access
SET expires_at = TIMESTAMPTZ '9999-12-31T23:59:59Z'
WHERE expires_at < TIMESTAMPTZ '9999-12-31T23:59:59Z';

-- Claim any reservation whose email already belongs to a real ALVIRA account.
INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
SELECT u.id,
       CASE WHEN u.tier = 'founding_beta' THEN 'free' ELSE u.tier END,
       TIMESTAMPTZ '9999-12-31T23:59:59Z'
FROM founding_beta_invites i
JOIN users u ON LOWER(TRIM(u.email)) = i.email
WHERE i.status IN ('reserved', 'claimed')
ON CONFLICT (user_id) DO UPDATE
SET expires_at = GREATEST(
  founding_beta_access.expires_at,
  EXCLUDED.expires_at
);

UPDATE founding_beta_invites i
SET status = 'claimed',
    claimed_user_id = u.id,
    claimed_at = COALESCE(i.claimed_at, NOW())
FROM users u
WHERE LOWER(TRIM(u.email)) = i.email
  AND i.status IN ('reserved', 'claimed');

UPDATE users u
SET tier = 'founding_beta'
FROM founding_beta_access f
WHERE f.user_id = u.id
  AND f.expires_at > NOW()
  AND u.tier = 'free';
