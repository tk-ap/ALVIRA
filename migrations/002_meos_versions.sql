CREATE TABLE IF NOT EXISTS meos_versions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  state_json TEXT NOT NULL,
  portrait_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, version)
);

CREATE INDEX IF NOT EXISTS idx_meos_versions_profile_created ON meos_versions(profile_id, created_at DESC);
