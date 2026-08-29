import { getDb } from "~/db";

export interface FoundingBetaAccess {
  user_id: string;
  previous_tier: string;
  expires_at: string;
  granted_at: string;
}

const FOUNDING_BETA_EXISTING_USER_CUTOFF = "2026-08-29T19:56:50Z";
const FOUNDING_BETA_PERMANENT_EXPIRY = "9999-12-31T23:59:59Z";
const FOUNDING_BETA_EXCLUDED_EMAILS = [
  "tahlia.ashwood@gmail.com",
  "codex-smoke-1786676512909@example.com",
  "alvira@agentmail.to",
];

let foundingBetaSchemaReady: Promise<void> | null = null;

export function ensureFoundingBetaSchema(): Promise<void> {
  if (foundingBetaSchemaReady) return foundingBetaSchemaReady;

  foundingBetaSchemaReady = (async () => {
    const db = getDb();
    await db.query(`
      CREATE TABLE IF NOT EXISTS founding_beta_access (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        previous_tier TEXT NOT NULL DEFAULT 'free',
        expires_at TIMESTAMPTZ NOT NULL,
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS beta_feedback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        kind TEXT NOT NULL,
        severity TEXT NOT NULL,
        signal TEXT,
        surface TEXT NOT NULL,
        route TEXT NOT NULL,
        details TEXT NOT NULL,
        expected TEXT,
        context_excerpt TEXT,
        screenshot_data_url TEXT,
        user_agent TEXT,
        viewport TEXT,
        profile_id TEXT,
        interview_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query("CREATE INDEX IF NOT EXISTS idx_founding_beta_expiry ON founding_beta_access(expires_at)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback(user_id)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at DESC)");

    // Existing eligible users were the initial Founding Beta cohort. Founding
    // access is now a permanent complimentary account entitlement rather than
    // a 45-day trial. The very-far-future timestamp preserves compatibility
    // with the existing schema while making the entitlement effectively
    // non-expiring for the life of the account/service.
    const ownerEmail = (process.env.ALVIRA_OWNER_EMAIL ?? FOUNDING_BETA_EXCLUDED_EMAILS[0]).trim().toLowerCase();
    const excluded = Array.from(new Set([ownerEmail, ...FOUNDING_BETA_EXCLUDED_EMAILS]));
    await db.query(
      `INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
       SELECT id,
              CASE WHEN tier = 'founding_beta' THEN 'free' ELSE tier END,
              $3::timestamptz
         FROM users
        WHERE created_at <= $1::timestamptz
          AND LOWER(TRIM(email)) <> ALL($2::text[])
       ON CONFLICT (user_id) DO NOTHING`,
      [FOUNDING_BETA_EXISTING_USER_CUTOFF, excluded, FOUNDING_BETA_PERMANENT_EXPIRY],
    );
    await db.query(
      `UPDATE founding_beta_access
          SET expires_at = $1::timestamptz
        WHERE expires_at < $1::timestamptz`,
      [FOUNDING_BETA_PERMANENT_EXPIRY],
    );
    await db.query(
      `UPDATE users u
          SET tier = 'founding_beta'
         FROM founding_beta_access f
        WHERE f.user_id = u.id
          AND f.expires_at > NOW()
          AND u.tier = 'free'`,
    );
  })().catch((error) => {
    foundingBetaSchemaReady = null;
    throw error;
  });

  return foundingBetaSchemaReady;
}

export async function getFoundingBetaAccess(userId: string): Promise<FoundingBetaAccess | null> {
  await ensureFoundingBetaSchema();
  const row = (await getDb().query(
    "SELECT user_id, previous_tier, expires_at, granted_at FROM founding_beta_access WHERE user_id = $1",
    [userId],
  ))[0] as FoundingBetaAccess | undefined;
  return row ?? null;
}

export async function hasActiveFoundingBeta(userId: string): Promise<boolean> {
  const access = await getFoundingBetaAccess(userId);
  return !!access && new Date(access.expires_at).getTime() > Date.now();
}

export async function syncFoundingBetaTier(user: { id: string; tier: string }): Promise<{ active: boolean; expiresAt: string | null }> {
  const access = await getFoundingBetaAccess(user.id);
  if (!access) return { active: false, expiresAt: null };

  const active = new Date(access.expires_at).getTime() > Date.now();
  if (active && user.tier === "free") {
    await getDb().query("UPDATE users SET tier = 'founding_beta' WHERE id = $1 AND tier = 'free'", [user.id]);
  } else if (!active && user.tier === "founding_beta") {
    const restoreTier = access.previous_tier === "founding_beta" ? "free" : access.previous_tier;
    await getDb().query("UPDATE users SET tier = $1 WHERE id = $2 AND tier = 'founding_beta'", [restoreTier, user.id]);
  }

  return { active, expiresAt: access.expires_at };
}
