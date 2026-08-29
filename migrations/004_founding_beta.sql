CREATE TABLE IF NOT EXISTS founding_beta_access (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  previous_tier TEXT NOT NULL DEFAULT 'free',
  expires_at TIMESTAMPTZ NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beta_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL,
  signal TEXT,
  surface TEXT NOT NULL,
  route TEXT NOT NULL,
  details TEXT NOT NULL,
  expected TEXT,
  context_excerpt TEXT,
  screenshot_data_url TEXT,
  user_agent TEXT,
  viewport TEXT,
  profile_id TEXT,
  interview_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founding_beta_expiry ON founding_beta_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at DESC);

-- Founding Beta cohort snapshot requested 2026-08-29T19:56:50Z.
-- Existing accounts only; future signups are not silently enrolled.
INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
SELECT id,
       CASE WHEN tier = 'founding_beta' THEN 'free' ELSE tier END,
       NOW() + INTERVAL '45 days'
FROM users
WHERE created_at <= TIMESTAMPTZ '2026-08-29T19:56:50Z'
  AND LOWER(TRIM(email)) NOT IN (
    'tahlia.ashwood@gmail.com',
    'codex-smoke-1786676512909@example.com',
    'alvira@agentmail.to'
  )
ON CONFLICT (user_id) DO NOTHING;

UPDATE users u
SET tier = 'founding_beta'
FROM founding_beta_access f
WHERE f.user_id = u.id
  AND f.expires_at > NOW()
  AND u.tier = 'free';
