ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS code_challenge TEXT;
ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS code_challenge_method TEXT;
ALTER TABLE bridge_authorization_codes ADD COLUMN IF NOT EXISTS connection_id TEXT;

ALTER TABLE bridge_access_tokens ADD COLUMN IF NOT EXISTS connection_id TEXT;

CREATE TABLE IF NOT EXISTS bridge_oauth_clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  redirect_uris_json TEXT NOT NULL,
  application_type TEXT NOT NULL DEFAULT 'native',
  token_endpoint_auth_method TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bridge_tokens_connection_id
  ON bridge_access_tokens(connection_id)
  WHERE connection_id IS NOT NULL;
