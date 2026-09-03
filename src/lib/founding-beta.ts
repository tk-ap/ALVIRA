import { getDb } from "~/db";

export interface FoundingBetaAccess {
  user_id: string;
  previous_tier: string;
  expires_at: string;
  granted_at: string;
}

export interface FoundingBetaReservation {
  email: string;
  source: string;
  reserved_at: string;
  claimed_at: string | null;
  claimed_user_id: string | null;
  revoked_at: string | null;
}

export const FOUNDING_BETA_EXISTING_USER_CUTOFF = "2026-08-29T19:56:50Z";
export const FOUNDING_BETA_PERMANENT_EXPIRY = "9999-12-31T23:59:59Z";
export const FOUNDING_BETA_EXCLUDED_EMAILS = [
  "tahlia.ashwood@gmail.com",
  "codex-smoke-1786676512909@example.com",
  "alvira@agentmail.to",
];

type Queryable = {
  query: (query: string, params?: unknown[]) => Promise<unknown[]>;
};

export function normalizeFoundingBetaEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isExistingFoundingBetaEligible(input: {
  email: string;
  createdAt: string;
  excludedEmails?: string[];
}): boolean {
  const excluded = new Set((input.excludedEmails ?? FOUNDING_BETA_EXCLUDED_EMAILS).map(normalizeFoundingBetaEmail));
  return new Date(input.createdAt).getTime() <= new Date(FOUNDING_BETA_EXISTING_USER_CUTOFF).getTime()
    && !excluded.has(normalizeFoundingBetaEmail(input.email));
}

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
      CREATE TABLE IF NOT EXISTS founding_beta_reservations (
        email TEXT PRIMARY KEY,
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source TEXT NOT NULL DEFAULT 'manual',
        reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        claimed_at TIMESTAMPTZ,
        claimed_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        revoked_at TIMESTAMPTZ
      )
    `);
    await db.query("ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'");
    await db.query("ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ");
    await db.query("ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ");
    await db.query("ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS claimed_user_id TEXT REFERENCES users(id) ON DELETE SET NULL");
    await db.query("ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ");
    await db.query("UPDATE founding_beta_reservations SET reserved_at = COALESCE(reserved_at, granted_at, NOW()) WHERE reserved_at IS NULL");
    await db.query("ALTER TABLE founding_beta_reservations ALTER COLUMN reserved_at SET DEFAULT NOW()");
    await db.query("ALTER TABLE founding_beta_reservations ALTER COLUMN reserved_at SET NOT NULL");
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
    await db.query("CREATE INDEX IF NOT EXISTS idx_founding_beta_reservation_claimed_user ON founding_beta_reservations(claimed_user_id)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback(user_id)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at DESC)");

    const ownerEmail = normalizeFoundingBetaEmail(process.env.ALVIRA_OWNER_EMAIL ?? FOUNDING_BETA_EXCLUDED_EMAILS[0]);
    const excluded = Array.from(new Set([ownerEmail, ...FOUNDING_BETA_EXCLUDED_EMAILS.map(normalizeFoundingBetaEmail)]));
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

export async function claimFoundingBetaReservationWithDb(
  db: Queryable,
  user: { id: string; email: string; tier: string },
): Promise<boolean> {
  const rows = await db.query(
    `WITH reservation AS (
       UPDATE founding_beta_reservations
          SET claimed_at = NOW(),
              claimed_user_id = $2
        WHERE email = $1
          AND claimed_at IS NULL
          AND revoked_at IS NULL
       RETURNING email
     ), grant_access AS (
       INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
       SELECT $2, CASE WHEN $3 = 'founding_beta' THEN 'free' ELSE $3 END, $4::timestamptz
         FROM reservation
       ON CONFLICT (user_id) DO UPDATE
         SET expires_at = EXCLUDED.expires_at
       RETURNING user_id
     ), promote_user AS (
       UPDATE users
          SET tier = 'founding_beta'
        WHERE id IN (SELECT user_id FROM grant_access)
          AND tier = 'free'
       RETURNING id
     )
     SELECT EXISTS (SELECT 1 FROM grant_access) AS claimed`,
    [normalizeFoundingBetaEmail(user.email), user.id, user.tier, FOUNDING_BETA_PERMANENT_EXPIRY],
  ) as Array<{ claimed: boolean }>;
  return rows[0]?.claimed === true;
}

export async function claimFoundingBetaReservation(user: { id: string; email: string; tier: string }): Promise<boolean> {
  await ensureFoundingBetaSchema();
  return claimFoundingBetaReservationWithDb(getDb(), user);
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
