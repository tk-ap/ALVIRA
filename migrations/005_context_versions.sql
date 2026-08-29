CREATE TABLE IF NOT EXISTS context_versions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'before_update',
  offering TEXT NOT NULL,
  topic TEXT NOT NULL,
  tier TEXT NOT NULL,
  state_json TEXT NOT NULL,
  portrait_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, version)
);

CREATE INDEX IF NOT EXISTS idx_context_versions_profile_created ON context_versions(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_context_versions_user_created ON context_versions(user_id, created_at DESC);
