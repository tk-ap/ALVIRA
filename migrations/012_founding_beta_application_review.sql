ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS entitlement_mode TEXT;
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS decision_email_sent_at TIMESTAMPTZ;
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS decision_message_id TEXT;
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS decision_email_error TEXT;

CREATE INDEX IF NOT EXISTS idx_founding_beta_applications_pending
  ON founding_beta_applications(created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_founding_beta_applications_reviewed
  ON founding_beta_applications(reviewed_at DESC)
  WHERE status IN ('approved', 'denied');
