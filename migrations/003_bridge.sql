CREATE TABLE IF NOT EXISTS bridge_authorization_codes (
  code_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bridge_access_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'context:read profile:read',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bridge_codes_expiry ON bridge_authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_bridge_tokens_user_id ON bridge_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_tokens_expiry ON bridge_access_tokens(expires_at);
