CREATE TABLE IF NOT EXISTS founding_beta_reservations (
  email TEXT PRIMARY KEY,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO founding_beta_reservations (email) VALUES
  ('courtneeowens22@gmail.com'),
  ('hipopmarkets@gmail.com'),
  ('mailiggans@gmail.com')
ON CONFLICT (email) DO NOTHING;
