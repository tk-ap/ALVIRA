ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS selected_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS destination TEXT;

ALTER TABLE bridge_access_tokens ADD COLUMN IF NOT EXISTS selected_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE bridge_access_tokens ADD COLUMN IF NOT EXISTS destination TEXT;

CREATE INDEX IF NOT EXISTS idx_bridge_tokens_selected_profile
  ON bridge_access_tokens(selected_profile_id)
  WHERE revoked_at IS NULL;
