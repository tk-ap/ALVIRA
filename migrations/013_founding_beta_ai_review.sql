ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(4,3);
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS ai_reviewed_at TIMESTAMPTZ;
ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS ai_review_model TEXT;

CREATE INDEX IF NOT EXISTS idx_founding_beta_applications_ai_pending
  ON founding_beta_applications(created_at DESC)
  WHERE status='pending' AND ai_recommendation IS NULL;
