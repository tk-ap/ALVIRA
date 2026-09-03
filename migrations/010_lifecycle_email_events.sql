CREATE TABLE IF NOT EXISTS lifecycle_email_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  kind TEXT NOT NULL,
  message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_email_events_user_kind_sent
  ON lifecycle_email_events(user_id, kind, sent_at DESC);
