CREATE TABLE IF NOT EXISTS customer_email_threads (
  thread_id TEXT PRIMARY KEY,
  inbox_id TEXT NOT NULL,
  correspondent_email TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reservation_email TEXT,
  subject TEXT,
  last_message_id TEXT,
  last_preview TEXT,
  last_received_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  needs_reply BOOLEAN NOT NULL DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_email_events (
  event_id TEXT PRIMARY KEY,
  svix_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  thread_id TEXT NOT NULL REFERENCES customer_email_threads(thread_id) ON DELETE CASCADE,
  message_id TEXT NOT NULL UNIQUE,
  inbox_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reservation_email TEXT,
  subject TEXT,
  preview TEXT,
  body_text TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_email_threads_attention
  ON customer_email_threads(needs_reply, last_received_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_email_events_thread
  ON customer_email_events(thread_id, received_at DESC);
