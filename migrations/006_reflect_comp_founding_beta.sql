INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
SELECT u.id,
       CASE WHEN u.tier = 'founding_beta' THEN 'free' ELSE u.tier END,
       TIMESTAMPTZ '9999-12-31T23:59:59Z'
FROM users u
WHERE EXISTS (SELECT 1 FROM meos_comps c
              WHERE LOWER(TRIM(c.email)) = LOWER(TRIM(u.email))
                AND c.expires_at > NOW())
  AND LOWER(TRIM(u.email)) NOT IN (
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
