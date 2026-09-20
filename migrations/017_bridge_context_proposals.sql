CREATE TABLE IF NOT EXISTS bridge_context_proposals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id TEXT,
  client_id TEXT NOT NULL,
  statement TEXT NOT NULL,
  rationale TEXT,
  supersedes_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  CONSTRAINT bridge_context_proposals_status_chk CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX IF NOT EXISTS idx_bridge_context_proposals_user_status
  ON bridge_context_proposals(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bridge_context_proposals_profile
  ON bridge_context_proposals(profile_id, created_at DESC);
