ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;
ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS claimed_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

UPDATE founding_beta_reservations
SET reserved_at = COALESCE(reserved_at, granted_at, NOW())
WHERE reserved_at IS NULL;

ALTER TABLE founding_beta_reservations ALTER COLUMN reserved_at SET DEFAULT NOW();
ALTER TABLE founding_beta_reservations ALTER COLUMN reserved_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_founding_beta_reservation_claimed_user
  ON founding_beta_reservations(claimed_user_id);

UPDATE founding_beta_access
SET expires_at = TIMESTAMPTZ '9999-12-31T23:59:59Z'
WHERE expires_at < TIMESTAMPTZ '9999-12-31T23:59:59Z';

UPDATE users u
SET tier = 'founding_beta'
FROM founding_beta_access f
WHERE f.user_id = u.id
  AND f.expires_at > NOW()
  AND u.tier = 'free';
