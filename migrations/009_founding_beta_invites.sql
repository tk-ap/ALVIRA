ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;
ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS invite_message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_founding_beta_reservations_invite_ready
  ON founding_beta_reservations(reserved_at)
  WHERE claimed_at IS NULL
    AND revoked_at IS NULL
    AND invite_sent_at IS NULL;
