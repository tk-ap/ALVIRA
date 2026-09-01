import { getDb } from "~/db";

export interface FoundingBetaAccess {
  user_id: string;
  previous_tier: string;
  expires_at: string;
  granted_at: string;
}

export interface FoundingBetaInvite {
  email: string;
  status: "reserved" | "claimed";
  source: string;
  reserved_at: string;
  claimed_user_id: string | null;
  claimed_at: string | null;
}

// Snapshot expanded on 2026-09-01 to include every real account that already
// existed when the Founders Beta Club cohort was finalized. Future signups are
// not silently enrolled; they must have an email-level reservation or an
// explicitly granted account entitlement.
const FOUNDING_BETA_EXISTING_USER_CUTOFF = "2026-09-01T03:27:20Z";
const FOUNDING_BETA_PERMANENT_EXPIRY = "9999-12-31T23:59:59Z";
const FOUNDING_BETA_EXCLUDED_EMAILS = [
  "tahlia.ashwood@gmail.com",
  "codex-smoke-1786676512909@example.com",
  "alvira@agentmail.to",
];

let foundingBetaSchemaReady: Promise<void> | null = null;

function foundingBetaExcludedEmails(): string[] {
  const ownerEmail = (process.env.ALVIRA_OWNER_EMAIL ?? FOUNDING_BETA_EXCLUDED_EMAILS[0]).trim().toLowerCase();
  return Array.from(new Set([ownerEmail, ...FOUNDING_BETA_EXCLUDED_EMAILS]));
}

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
      CREATE TABLE IF NOT EXISTS founding_beta_invites (
        email TEXT PRIMARY KEY,
        status TEXT NOT NULL DEFAULT 'reserved',
        source TEXT NOT NULL DEFAULT 'manual',
        reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        claimed_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        claimed_at TIMESTAMPTZ
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
    await db.query("CREATE INDEX IF NOT EXISTS idx_founding_beta_invites_status ON founding_beta_invites(status)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback(user_id)");
    await db.query("CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at DESC)");

    const excluded = foundingBetaExcludedEmails();

    // Legacy ALVIRA Reflect compensation recipients are the first grandfathered
    // Founding Beta invite cohort. They may not have an ALVIRA account yet, so
    // reserve by email and claim only when that exact address becomes a user.
    await db.query(
      `INSERT INTO founding_beta_invites (email, status, source)
       SELECT LOWER(TRIM(email)), 'reserved', 'reflect_comp'
         FROM meos_comps
        WHERE expires_at > NOW()
          AND LOWER(TRIM(email)) <> ALL($1::text[])
          AND LOWER(TRIM(email)) NOT LIKE '%@example.com'
       ON CONFLICT (email) DO NOTHING`,
      [excluded],
    );

    // Every real account that existed when the cohort was finalized receives
    // the permanent account entitlement. This remains a fixed historical
    // snapshot; future signups do not enter through this path.
    await db.query(
      `INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
       SELECT id,
              CASE WHEN tier = 'founding_beta' THEN 'free' ELSE tier END,
              $3::timestamptz
         FROM users
        WHERE created_at <= $1::timestamptz
          AND LOWER(TRIM(email)) <> ALL($2::text[])
          AND LOWER(TRIM(email)) NOT LIKE '%@example.com'
       ON CONFLICT (user_id) DO NOTHING`,
      [FOUNDING_BETA_EXISTING_USER_CUTOFF, excluded, FOUNDING_BETA_PERMANENT_EXPIRY],
    );

    // If a reserved email already has an account, claim it immediately.
    await db.query(
      `INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
       SELECT u.id,
              CASE WHEN u.tier = 'founding_beta' THEN 'free' ELSE u.tier END,
              $1::timestamptz
         FROM founding_beta_invites i
         JOIN users u ON LOWER(TRIM(u.email)) = i.email
        WHERE i.status IN ('reserved', 'claimed')
       ON CONFLICT (user_id) DO UPDATE
         SET expires_at = GREATEST(founding_beta_access.expires_at, EXCLUDED.expires_at)`,
      [FOUNDING_BETA_PERMANENT_EXPIRY],
    );
    await db.query(`
      UPDATE founding_beta_invites i
         SET status = 'claimed',
             claimed_user_id = u.id,
             claimed_at = COALESCE(i.claimed_at, NOW())
        FROM users u
       WHERE LOWER(TRIM(u.email)) = i.email
         AND i.status IN ('reserved', 'claimed')
    `);

    // Founding Beta is permanent for the approved account/service lifetime.
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

export async function getFoundingBetaInvite(email: string): Promise<FoundingBetaInvite | null> {
  await ensureFoundingBetaSchema();
  const row = (await getDb().query(
    `SELECT email, status, source, reserved_at, claimed_user_id, claimed_at
       FROM founding_beta_invites
      WHERE email = LOWER(TRIM($1))
      LIMIT 1`,
    [email],
  ))[0] as FoundingBetaInvite | undefined;
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

export async function claimFoundingBetaInviteForUser(user: { id: string; email: string; tier: string }): Promise<{ active: boolean; expiresAt: string | null; tier: string }> {
  await ensureFoundingBetaSchema();
  const email = user.email.trim().toLowerCase();
  const excluded = foundingBetaExcludedEmails();

  if (!excluded.includes(email) && !email.endsWith("@example.com")) {
    const invite = (await getDb().query(
      `SELECT email, status, claimed_user_id
         FROM founding_beta_invites
        WHERE email = $1
          AND (status = 'reserved' OR claimed_user_id = $2)
        LIMIT 1`,
      [email, user.id],
    ))[0] as { email: string; status: string; claimed_user_id: string | null } | undefined;

    if (invite) {
      await getDb().query(
        `INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
         VALUES ($1, $2, $3::timestamptz)
         ON CONFLICT (user_id) DO UPDATE
           SET expires_at = GREATEST(founding_beta_access.expires_at, EXCLUDED.expires_at)`,
        [user.id, user.tier === "founding_beta" ? "free" : user.tier, FOUNDING_BETA_PERMANENT_EXPIRY],
      );
      await getDb().query(
        `UPDATE founding_beta_invites
            SET status = 'claimed',
                claimed_user_id = $1,
                claimed_at = COALESCE(claimed_at, NOW())
          WHERE email = $2`,
        [user.id, email],
      );
    }
  }

  const beta = await syncFoundingBetaTier(user);
  return {
    ...beta,
    tier: beta.active && user.tier === "free" ? "founding_beta" : user.tier,
  };
}
