-- founding_beta_applications was only created lazily by app code, so 012 failed
-- on a fresh database. Create the base table first; a no-op where it exists.
CREATE TABLE IF NOT EXISTS founding_beta_applications (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  use_case TEXT NOT NULL,
  ai_tools TEXT,
  ai_frequency TEXT NOT NULL,
  feedback_commitment TEXT NOT NULL,
  motivation TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'alvira',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founding_beta_applications_created ON founding_beta_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_founding_beta_applications_email ON founding_beta_applications(LOWER(email));
