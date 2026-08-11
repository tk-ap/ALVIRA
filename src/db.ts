// ── Database: Bun-native SQLite ──
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Data directory is overridable (used by scripts/verify-tracking.ts so tests never
// touch the production DB). Defaults to ./.data for backward compatibility.
const DB_DIR = process.env.ALVIRA_DATA_DIR ?? join(process.cwd(), ".data");
const DB_PATH = join(DB_DIR, "alvira.db");

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;

  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent reads
  db.exec("PRAGMA journal_mode=WAL");

  // ── Migrations: run CREATE TABLE IF NOT EXISTS on startup ──
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      interview_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry ON password_reset_tokens(expires_at);

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      tier TEXT NOT NULL,
      state_json TEXT NOT NULL,
      portrait_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, topic)
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
    CREATE TABLE IF NOT EXISTS interview_drafts (
      user_id TEXT NOT NULL,
      offering TEXT NOT NULL,
      topic TEXT NOT NULL,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, offering),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_waitlist (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      team_size TEXT,
      use_case TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_team_waitlist_email ON team_waitlist(email);

    CREATE TABLE IF NOT EXISTS meos_comps (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS draft_transfers (
      id TEXT PRIMARY KEY,
      target_email TEXT NOT NULL,
      source_user_id TEXT NOT NULL,
      source_offering TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- First-party funnel events (signup, interview start/completion, exports,
    -- MeOS CTA impressions/clicks). Only non-sensitive aggregate props are stored —
    -- never interview answers or other sensitive content.
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_id TEXT,
      anonymous_id TEXT,
      props_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_name_created_at ON events(name, created_at);
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_anonymous_id ON events(anonymous_id);
  `);

  // Seed recovery compensation offers; INSERT OR IGNORE keeps existing expiry dates stable.
  db.run("INSERT OR IGNORE INTO meos_comps (id, email, expires_at) VALUES (?, ?, datetime('now', '+30 days'))", ["meos-comp-courtnee", "courtneeowens22@gmail.com"]);
  db.run("INSERT OR IGNORE INTO meos_comps (id, email, expires_at) VALUES (?, ?, datetime('now', '+30 days'))", ["meos-comp-hipopmarkets", "hipopmarkets@gmail.com"]);

  // Seed the draft transfer for hipopmarkets' recovered interview draft (currently orphaned under
  // Tahlia's user id after the DB corruption recovery). Only seed while the source draft actually
  // exists — once the transfer has been executed (row deleted), a server restart must not re-seed it.
  db.run(
    `INSERT OR IGNORE INTO draft_transfers (id, target_email, source_user_id, source_offering)
     SELECT 'transfer-hipopmarkets', 'hipopmarkets@gmail.com', '1d76633b-2602-47bf-8f5c-adb76603e41e', 'context'
     WHERE EXISTS (SELECT 1 FROM interview_drafts WHERE user_id = '1d76633b-2602-47bf-8f5c-adb76603e41e' AND offering = 'context')`
  );

  // ── Migration: add interview_count to existing users table ──
  try {
    db.exec("ALTER TABLE profiles ADD COLUMN portrait_json TEXT");
  } catch {
    // Column already exists — safe to ignore
  }
  try {
    db.exec("ALTER TABLE users ADD COLUMN interview_count INTEGER NOT NULL DEFAULT 0");
  } catch {
    // Column already exists — safe to ignore
  }
  try {
    db.exec("ALTER TABLE profiles ADD COLUMN offering TEXT NOT NULL DEFAULT 'context'");
  } catch {
    // Column already exists — safe to ignore
  }

  return db;
}

// ── Helpers ──

export interface User {
  id: string;
  email: string;
  tier: string;
  stripe_customer_id: string | null;
  interview_count: number;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export function getUserById(userId: string): User | null {
  const d = getDb();
  const row = d
    .query("SELECT id, email, tier, stripe_customer_id, interview_count, created_at FROM users WHERE id = ?")
    .get(userId) as User | undefined;
  return row ?? null;
}

export function getUserByEmail(email: string): User | null {
  const d = getDb();
  const row = d
    .query("SELECT id, email, tier, stripe_customer_id, interview_count, created_at FROM users WHERE email = ?")
    .get(email) as User | undefined;
  return row ?? null;
}

export interface MeosComp {
  id: string;
  email: string;
  expires_at: string;
  created_at: string;
}

export function insertMeosComp(email: string, expiresAt: string): void {
  getDb().run("INSERT OR IGNORE INTO meos_comps (id, email, expires_at) VALUES (?, ?, ?)", [crypto.randomUUID(), email.trim().toLowerCase(), expiresAt]);
}

export function getMeosComp(email: string): MeosComp | null {
  const row = getDb().query("SELECT id, email, expires_at, created_at FROM meos_comps WHERE email = ? AND expires_at > datetime('now')").get(email.trim().toLowerCase()) as MeosComp | undefined;
  return row ?? null;
}

export interface OwnerMetrics {
  userCounts: { total: number; free: number; pro: number; lifetime: number };
  profileCount: number;
  pendingInterviews: number;
  waitlistCount: number;
  activeCompCount: number;
  activeComps: Array<{ email: string; expires_at: string }>;
  recentWaitlist: Array<{ name: string; email: string; company: string | null; team_size: string | null; created_at: string }>;
  recentUsers: Array<{ email: string; tier: string; created_at: string }>;
  funnel: FunnelMetrics;
}

/** 7-day and 30-day counts for the four core funnel events. */
export interface FunnelMetrics {
  signupCompleted: { d7: number; d30: number };
  interviewStarted: { d7: number; d30: number };
  interviewCompleted: { d7: number; d30: number };
  exportPerformed: { d7: number; d30: number };
}

export function getOwnerMetrics(): OwnerMetrics {
  const d = getDb();
  const count = (sql: string) => Number((d.query(sql).get() as { count: number }).count);
  const countWhere = (sql: string, ...params: unknown[]) => Number((d.query(sql).get(...params) as { count: number }).count);
  const eventCounts = (name: string) => ({
    d7: countWhere("SELECT COUNT(*) AS count FROM events WHERE name = ? AND created_at >= datetime('now', '-7 days')", name),
    d30: countWhere("SELECT COUNT(*) AS count FROM events WHERE name = ? AND created_at >= datetime('now', '-30 days')", name),
  });
  return {
    userCounts: {
      total: count("SELECT COUNT(*) AS count FROM users"),
      free: count("SELECT COUNT(*) AS count FROM users WHERE tier = 'free'"),
      pro: count("SELECT COUNT(*) AS count FROM users WHERE tier = 'pro'"),
      lifetime: count("SELECT COUNT(*) AS count FROM users WHERE tier = 'lifetime'"),
    },
    profileCount: count("SELECT COUNT(*) AS count FROM profiles"),
    // Pending interviews = saved in-progress interview drafts, not every profile.
    pendingInterviews: count("SELECT COUNT(*) AS count FROM interview_drafts"),
    waitlistCount: count("SELECT COUNT(*) AS count FROM team_waitlist"),
    activeCompCount: count("SELECT COUNT(*) AS count FROM meos_comps WHERE expires_at > datetime('now')"),
    activeComps: d.query("SELECT email, expires_at FROM meos_comps WHERE expires_at > datetime('now') ORDER BY expires_at ASC").all() as OwnerMetrics["activeComps"],
    recentWaitlist: d.query("SELECT name, email, company, team_size, created_at FROM team_waitlist ORDER BY created_at DESC LIMIT 5").all() as OwnerMetrics["recentWaitlist"],
    recentUsers: d.query("SELECT email, tier, created_at FROM users ORDER BY created_at DESC LIMIT 5").all() as OwnerMetrics["recentUsers"],
    funnel: {
      signupCompleted: eventCounts("signup_completed"),
      interviewStarted: eventCounts("interview_started"),
      interviewCompleted: eventCounts("interview_completed"),
      exportPerformed: eventCounts("export_performed"),
    },
  };
}

export function createUser(
  id: string,
  email: string,
  passwordHash: string,
): User {
  const d = getDb();
  d.run(
    "INSERT INTO users (id, email, password_hash, tier) VALUES (?, ?, ?, 'free')",
    [id, email, passwordHash],
  );
  return { id, email, tier: "free", stripe_customer_id: null, interview_count: 0, created_at: new Date().toISOString() };
}

export function getPasswordHash(email: string): string | null {
  const d = getDb();
  const row = d
    .query("SELECT password_hash FROM users WHERE email = ?")
    .get(email) as { password_hash: string } | undefined;
  return row?.password_hash ?? null;
}

export function createPasswordResetToken(userId: string, token: string, expiresAt: string): void {
  const d = getDb();
  d.run("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < datetime('now')", [userId]);
  d.run("INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, expiresAt]);
}

export function consumePasswordResetToken(token: string): string | null {
  const d = getDb();
  const row = d.query("SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > datetime('now')").get(token) as { user_id: string } | undefined;
  if (!row) return null;
  d.run("DELETE FROM password_reset_tokens WHERE token = ?", [token]);
  return row.user_id;
}

export function updatePasswordHash(userId: string, passwordHash: string): void {
  getDb().run("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
}

export function createSession(userId: string, token: string, expiresAt: string): Session {
  const d = getDb();
  const id = crypto.randomUUID();
  d.run("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", [
    id,
    userId,
    token,
    expiresAt,
  ]);
  return { id, user_id: userId, token, expires_at: expiresAt, created_at: new Date().toISOString() };
}

export function getSessionByToken(token: string): Session | null {
  const d = getDb();
  const row = d
    .query("SELECT id, user_id, token, expires_at, created_at FROM sessions WHERE token = ?")
    .get(token) as Session | undefined;
  return row ?? null;
}

export function deleteSession(token: string): void {
  const d = getDb();
  d.run("DELETE FROM sessions WHERE token = ?", [token]);
}

export function deleteExpiredSessions(): void {
  const d = getDb();
  d.run("DELETE FROM sessions WHERE expires_at < datetime('now')");
}

// ── Profile helpers ──

export function getProfileCount(userId: string): number {
  const d = getDb();
  const row = d.query("SELECT COUNT(*) as count FROM profiles WHERE user_id = ?").get(userId) as { count: number };
  return row.count;
}

export function hasEntitlement(userId: string, product: string): boolean {
  return !!getDb().query("SELECT 1 FROM purchases WHERE user_id = ? AND product = ? LIMIT 1").get(userId, product);
}

export function recordPurchase(userId: string, product: string): void {
  getDb().run("INSERT INTO purchases (id, user_id, product) VALUES (?, ?, ?)", [crypto.randomUUID(), userId, product]);
}

export function listEntitlements(userId: string): string[] {
  return (getDb().query("SELECT DISTINCT product FROM purchases WHERE user_id = ? ORDER BY created_at DESC").all(userId) as Array<{ product: string }>).map(row => row.product);
}

// ── Interview count ──

export function incrementInterviewCount(userId: string): number {
  const d = getDb();
  d.run("UPDATE users SET interview_count = interview_count + 1 WHERE id = ?", [userId]);
  const row = d.query("SELECT interview_count FROM users WHERE id = ?").get(userId) as { interview_count: number };
  return row.interview_count;
}

export function getInterviewCount(userId: string): number {
  const d = getDb();
  const row = d.query("SELECT interview_count FROM users WHERE id = ?").get(userId) as { interview_count: number } | undefined;
  return row?.interview_count ?? 0;
}

// ── Tier management ──

export function upgradeUserTier(userId: string, tier: string): User | null {
  const d = getDb();
  d.run("UPDATE users SET tier = ? WHERE id = ?", [tier, userId]);
  return getUserById(userId);
}

// ── Combined user info with limits ──

export interface UserLimits {
  id: string;
  email: string;
  tier: string;
  interviewCount: number;
  profileCount: number;
  maxProfiles: number;
  maxInterviews: number;
}

export function getUserLimits(userId: string): UserLimits | null {
  const user = getUserById(userId);
  if (!user) return null;
  const profileCount = getProfileCount(userId);
  return {
    id: user.id,
    email: user.email,
    tier: user.tier,
    interviewCount: user.interview_count,
    profileCount,
    maxProfiles: user.tier === "free" ? 1 : Infinity,
    maxInterviews: user.tier === "free" ? 3 : Infinity,
  };
}

// ── Team waitlist ──

export interface TeamWaitlistEntry {
  name: string;
  email: string;
  company: string | null;
  team_size: string | null;
  use_case: string | null;
}

export function insertTeamWaitlistEntry(entry: TeamWaitlistEntry): void {
  const d = getDb();
  d.run(
    "INSERT INTO team_waitlist (id, name, email, company, team_size, use_case) VALUES (?, ?, ?, ?, ?, ?)",
    [crypto.randomUUID(), entry.name, entry.email, entry.company, entry.team_size, entry.use_case],
  );
}

// ── Draft transfers ──
// Transfers an orphaned interview draft (recovered under the wrong user id after the DB
// corruption incident) to the correct account when its owner re-registers.

export interface PendingDraftTransfer {
  id: string;
  target_email: string;
  source_user_id: string;
  source_offering: string;
}

export interface DraftTransferResult {
  transferred: boolean;
  reason?: "source_gone" | "transfer_gone" | "already_owned";
}

export function getPendingDraftTransfer(email: string): PendingDraftTransfer | undefined {
  const d = getDb();
  return d
    .query("SELECT id, target_email, source_user_id, source_offering FROM draft_transfers WHERE target_email = ?")
    .get(email.trim().toLowerCase()) as PendingDraftTransfer | undefined;
}

export function executeDraftTransfer(transferId: string, targetUserId: string): DraftTransferResult {
  const d = getDb();

  const transfer = d
    .query("SELECT id, target_email, source_user_id, source_offering FROM draft_transfers WHERE id = ?")
    .get(transferId) as PendingDraftTransfer | undefined;
  if (!transfer) return { transferred: false, reason: "transfer_gone" };

  // The transfer is a no-op if the source and target are the same account.
  if (transfer.source_user_id === targetUserId) {
    d.run("DELETE FROM draft_transfers WHERE id = ?", [transferId]);
    return { transferred: false, reason: "already_owned" };
  }

  // Read the source draft.
  const sourceDraft = d
    .query("SELECT topic, state_json, updated_at FROM interview_drafts WHERE user_id = ? AND offering = ?")
    .get(transfer.source_user_id, transfer.source_offering) as { topic: string; state_json: string; updated_at: string } | undefined;

  // No source draft to move — clean up the pending transfer and report.
  if (!sourceDraft) {
    d.run("DELETE FROM draft_transfers WHERE id = ?", [transferId]);
    return { transferred: false, reason: "source_gone" };
  }

  // Edge case: target already has a draft with the same offering (fresh accounts shouldn't,
  // but be safe). Rename the transferred draft's offering so it doesn't clash with the
  // (user_id, offering) primary key and both drafts survive.
  let offering = transfer.source_offering;
  const conflict = d
    .query("SELECT 1 FROM interview_drafts WHERE user_id = ? AND offering = ? LIMIT 1")
    .get(targetUserId, transfer.source_offering);
  if (conflict) {
    offering = `${transfer.source_offering}_transferred_${Date.now()}`;
  }

  // Move the draft to the new owner, then remove the source row (the PK is (user_id, offering),
  // so inserting under a different user_id leaves the orphaned source row behind unless deleted).
  d.run(
    "INSERT OR REPLACE INTO interview_drafts (user_id, offering, topic, state_json, updated_at) VALUES (?, ?, ?, ?, ?)",
    [targetUserId, offering, sourceDraft.topic, sourceDraft.state_json, sourceDraft.updated_at],
  );
  d.run("DELETE FROM interview_drafts WHERE user_id = ? AND offering = ?", [transfer.source_user_id, transfer.source_offering]);
  d.run("DELETE FROM draft_transfers WHERE id = ?", [transferId]);

  return { transferred: true };
}

// ── First-party funnel events ──

export interface EventRecord {
  id: string;
  name: string;
  user_id: string | null;
  anonymous_id: string | null;
  props_json: string;
  created_at: string;
}

export interface TrackEventInput {
  userId?: string | null;
  anonymousId?: string | null;
  /** Non-sensitive, allowlisted-in-caller props only (strings, numbers, booleans). */
  props?: Record<string, string | number | boolean>;
}

/** Insert a funnel event. Never store interview answers or other sensitive content. */
export function insertEvent(name: string, input: TrackEventInput = {}): void {
  getDb().run(
    "INSERT INTO events (id, name, user_id, anonymous_id, props_json) VALUES (?, ?, ?, ?, ?)",
    [crypto.randomUUID(), name, input.userId ?? null, input.anonymousId ?? null, JSON.stringify(input.props ?? {})],
  );
}

/** Count events of a given name within the last `days` days. */
export function countEvent(name: string, days: number): number {
  const row = getDb()
    .query("SELECT COUNT(*) AS count FROM events WHERE name = ? AND created_at >= datetime('now', ?)")
    .get(name, `-${days} days`) as { count: number };
  return row.count;
}

/** Most recent events (owner dashboard / debugging); limited for memory-safety. */
export function recentEvents(limit = 50): EventRecord[] {
  return getDb()
    .query("SELECT id, name, user_id, anonymous_id, props_json, created_at FROM events ORDER BY created_at DESC LIMIT ?")
    .all(limit) as EventRecord[];
}
