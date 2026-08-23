// ── Database: Postgres (Neon) when DATABASE_URL is set, else SQLite ──
// The app historically used SQLite only, which on Vercel landed in /tmp (an
// ephemeral per-serverless-instance path) — so a fresh deployment started with
// an empty database and logins failed. Now, when DATABASE_URL is present
// (Neon on Vercel), getDb() returns a Postgres backend that persists across
// restarts and instances. Locally (no DATABASE_URL) it keeps the SQLite path.
//
// All helpers below are async so they work against either backend. The SQLite
// backend executes synchronously inside the async helpers (awaiting a plain
// value is a no-op); the Postgres backend (src/pgDb.ts) returns promises.
import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPostgresDb, type PostgresDbLike } from "./pgDb";

const require = createRequire(import.meta.url);

const DEFAULT_DB_DIR =
  process.env.ALVIRA_DATA_DIR ??
  (process.env.VERCEL ? join(tmpdir(), "alvira-data") : join(process.cwd(), ".data"));

let activeDbDir = DEFAULT_DB_DIR;
let activeDbPath = join(activeDbDir, "alvira.db");

function loadDatabaseConstructor() {
  if (typeof Bun !== "undefined") {
    const { Database } = require("bun:sqlite");
    return Database;
  }

  const sqliteMod = require("node:sqlite");
  return sqliteMod.DatabaseSync ?? sqliteMod.Database ?? sqliteMod.default?.DatabaseSync ?? sqliteMod.default?.Database;
}

type QueryHandle = {
  get: (...args: unknown[]) => unknown | Promise<unknown>;
  all: (...args: unknown[]) => unknown[] | Promise<unknown[]>;
  run: (...args: unknown[]) => unknown | Promise<unknown>;
};

type SqliteDatabaseLike = {
  exec: (sql: string) => void | Promise<void>;
  run: (sql: string, params?: unknown[] | Record<string, unknown>) => unknown | Promise<unknown>;
  query: (sql: string) => QueryHandle;
};

function normalizeSqlParams(args: unknown[]) {
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  if (args.length === 1 && args[0] && typeof args[0] === "object" && !Array.isArray(args[0])) {
    return Object.values(args[0] as Record<string, unknown>);
  }
  return args;
}

function wrapQuery(conn: any, sql: string): QueryHandle {
  if (typeof conn.query === "function") {
    return conn.query(sql);
  }

  const statement = conn.prepare(sql);
  return {
    get: (...args: unknown[]) => statement.get(...normalizeSqlParams(args)),
    all: (...args: unknown[]) => statement.all(...normalizeSqlParams(args)),
    run: (...args: unknown[]) => statement.run(...normalizeSqlParams(args)),
  };
}

function adaptSqliteConnection(conn: any): SqliteDatabaseLike {
  return {
    exec: (sql: string) => conn.exec(sql),
    run: (sql: string, params?: unknown[] | Record<string, unknown>) => {
      if (typeof conn.run === "function") return conn.run(sql, params ?? []);
      const statement = conn.prepare(sql);
      return statement.run(...normalizeSqlParams(Array.isArray(params) ? params : (params ? Object.values(params) : [])));
    },
    query: (sql: string) => wrapQuery(conn, sql),
  };
}

// Data directory is overridable (used by scripts/verify-tracking.ts so tests never
// touch the production DB). In serverless environments, writable /tmp is safer than
// a read-only working directory such as /var/task.

// ── Event retention / rate limits (metrics integrity) ──
// Bounded retention keeps the events table from growing forever: rows older than
// this are pruned at startup and then opportunistically at most once per day on
// event writes (see maybePruneEvents), so a long-lived server stays bounded too.
// 180 days comfortably covers the 7d/30d owner funnel windows while bounding storage.
export const EVENT_RETENTION_DAYS = 180;
// Blunt per-identity cap (user_id or anonymous_id): at most this many event writes
// per rolling window before excess writes are dropped. This limits buggy or
// repeating clients from inflating metrics — it is NOT full hostile-bot
// protection. Normal use generates a handful of events per session (a heavy day
// is well under 50), so 240/hour can never be hit organically.
export const EVENT_RATE_LIMIT_WINDOW_MINUTES = 60;
export const EVENT_RATE_LIMIT_MAX = 240;
// Opportunistic daily-prune anchor: event writes prune at most once per day (see
// maybePruneEvents below); startup pruning in getDb covers restarts.
let lastEventPruneAt = 0;
const EVENT_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

// ── Schema (kept in SQLite-flavored SQL; Postgres backend translates it) ──
const SCHEMA_DDL = `
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
  `;

/**
 * The full set of schema + idempotent seed statements, SQLite-flavored, that
 * must run before any query. Used by the Postgres backend (lazily, on first
 * op) and by the SQLite backend at startup. ALTER statements are intentionally
 * LAST and non-fatal if they fail ("already migrated").
 */
function buildSchemaStatements(): string[] {
  return [
    // DDL (split into single statements because Postgres allows one statement
    // per query in extended protocol).
    ...SCHEMA_DDL.split(";").map((s) => s.trim()).filter(Boolean),

    // Seed recovery compensation offers (INSERT OR IGNORE keeps expiry stable).
    "INSERT OR IGNORE INTO meos_comps (id, email, expires_at) VALUES ('meos-comp-courtnee', 'courtneeowens22@gmail.com', datetime('now', '+30 days'))",
    "INSERT OR IGNORE INTO meos_comps (id, email, expires_at) VALUES ('meos-comp-hipopmarkets', 'hipopmarkets@gmail.com', datetime('now', '+30 days'))",

    // Seed the draft transfer for hipopmarkets' recovered draft (only while the
    // source draft exists — once executed/deleted, a restart must not re-seed).
    "INSERT OR IGNORE INTO draft_transfers (id, target_email, source_user_id, source_offering) SELECT 'transfer-hipopmarkets', 'hipopmarkets@gmail.com', '1d76633b-2602-47bf-8f5c-adb76603e41e', 'context' WHERE EXISTS (SELECT 1 FROM interview_drafts WHERE user_id = '1d76633b-2602-47bf-8f5c-adb76603e41e' AND offering = 'context')",

    // Migration: add columns to existing tables (non-fatal if already present).
    "ALTER TABLE profiles ADD COLUMN portrait_json TEXT",
    "ALTER TABLE users ADD COLUMN interview_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE profiles ADD COLUMN offering TEXT NOT NULL DEFAULT 'context'",

    // Bounded event retention prune on startup.
    "DELETE FROM events WHERE created_at < datetime('now', '-180 days')",
  ];
}

let db: SqliteDatabaseLike | PostgresDbLike | null = null;

export function getDb(): SqliteDatabaseLike | PostgresDbLike {
  if (db) return db;

  // Postgres (Neon) backend: durable across Vercel restarts/instances.
  const pgUrl = process.env.DATABASE_URL?.trim();
  if (pgUrl) {
    db = createPostgresDb(pgUrl, buildSchemaStatements());
    return db;
  }

  const dirToUse = activeDbDir;
  try {
    if (!existsSync(dirToUse)) {
      mkdirSync(dirToUse, { recursive: true });
    }
  } catch {
    const fallbackDir = join(tmpdir(), "alvira-data");
    if (fallbackDir !== dirToUse) {
      mkdirSync(fallbackDir, { recursive: true });
      activeDbDir = fallbackDir;
      activeDbPath = join(fallbackDir, "alvira.db");
    }
  }

  const DatabaseCtor = loadDatabaseConstructor();
  const conn = adaptSqliteConnection(new DatabaseCtor(activeDbPath));

  // Enable WAL mode for better concurrent reads
  conn.exec("PRAGMA journal_mode=WAL");

  // Enforce foreign keys so ON DELETE SET NULL (events.user_id) and ON DELETE
  // CASCADE (sessions, profiles, purchases, interview_drafts) actually work.
  conn.exec("PRAGMA foreign_keys = ON");

  // Run every schema + seed statement. The DDL is split already in
  // buildSchemaStatements(); each is idempotent.
  for (const stmt of buildSchemaStatements()) {
    if (!stmt.trim()) continue;
    try {
      conn.run(stmt);
    } catch (err) {
      // ALTER ... ADD COLUMN fails when the column already exists — that is the
      // "already migrated" case and is expected on an existing database.
      if (/duplicate column|already exists|duplicate column name/i.test(String((err as Error).message))) continue;
      throw err;
    }
  }

  db = conn;
  return db;
}

/** Delete funnel events older than the retention window. Idempotent and safe to call anytime. */
export async function pruneOldEvents(): Promise<void> {
  await getDb().run("DELETE FROM events WHERE created_at < datetime('now', ?)", [`-${EVENT_RETENTION_DAYS} days`]);
}
/**
 * Opportunistic retention prune, at most once per day per server process.
 * Startup pruning covers restarts; this keeps long-lived servers bounded without
 * running a prune on every request. Never throws — retention is opportunistic
 * and must not break a metrics write.
 */
async function maybePruneEvents(): Promise<void> {
  const now = Date.now();
  if (now - lastEventPruneAt < EVENT_PRUNE_INTERVAL_MS) return;
  lastEventPruneAt = now;
  try {
    await pruneOldEvents();
  } catch (err) {
    console.warn("[events] opportunistic prune failed", String(err));
  }
}

/** Test hook for scripts/verify-tracking.ts: force the next event write to prune. */
export function forceNextEventPruneForTest(): void {
  lastEventPruneAt = 0;
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

export async function getUserById(userId: string): Promise<User | null> {
  const d = getDb();
  const row = (await d.query("SELECT id, email, tier, stripe_customer_id, interview_count, created_at FROM users WHERE id = ?").get(userId)) as User | undefined;
  if (!row) return null;
  return { ...row, interview_count: Number(row.interview_count) };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const d = getDb();
  const row = (await d.query("SELECT id, email, tier, stripe_customer_id, interview_count, created_at FROM users WHERE email = ?").get(email)) as User | undefined;
  if (!row) return null;
  return { ...row, interview_count: Number(row.interview_count) };
}

export interface MeosComp {
  id: string;
  email: string;
  expires_at: string;
  created_at: string;
}

export async function insertMeosComp(email: string, expiresAt: string): Promise<void> {
  await getDb().run("INSERT OR IGNORE INTO meos_comps (id, email, expires_at) VALUES (?, ?, ?)", [crypto.randomUUID(), email.trim().toLowerCase(), expiresAt]);
}

export async function getMeosComp(email: string): Promise<MeosComp | null> {
  const row = (await getDb().query("SELECT id, email, expires_at, created_at FROM meos_comps WHERE email = ? AND expires_at > datetime('now')").get(email.trim().toLowerCase())) as MeosComp | undefined;
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

/** 7-day and 30-day counts of unique people for the four core funnel events.
 *  A person is COALESCE(user_id, anonymous_id) — repeated actions by the same
 *  person count once. Rows with neither identifier are excluded entirely. */
export interface FunnelMetrics {
  signupCompleted: { d7: number; d30: number };
  interviewStarted: { d7: number; d30: number };
  interviewCompleted: { d7: number; d30: number };
  exportPerformed: { d7: number; d30: number };
}

export async function getOwnerMetrics(): Promise<OwnerMetrics> {
  const d = getDb();
  const count = async (sql: string) => Number(((await d.query(sql).get()) as { count: number }).count);
  const countWhere = async (sql: string, ...params: unknown[]) => Number(((await d.query(sql).get(...params)) as { count: number }).count);
  const eventCounts = (name: string) =>
    Promise.all([
      countWhere(
        `SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS count FROM events WHERE name = ? AND created_at >= datetime('now', '-7 days') AND (user_id IS NOT NULL OR anonymous_id IS NOT NULL)`,
        name,
      ),
      countWhere(
        `SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id)) AS count FROM events WHERE name = ? AND created_at >= datetime('now', '-30 days') AND (user_id IS NOT NULL OR anonymous_id IS NOT NULL)`,
        name,
      ),
    ]).then(([d7, d30]) => ({ d7, d30 }));

  const [userCounts, profileCount, pendingInterviews, waitlistCount, activeCompCount, activeComps, recentWaitlist, recentUsers, funnel] = await Promise.all([
    (async () => ({
      total: await count("SELECT COUNT(*) AS count FROM users"),
      free: await count("SELECT COUNT(*) AS count FROM users WHERE tier = 'free'"),
      pro: await count("SELECT COUNT(*) AS count FROM users WHERE tier = 'pro'"),
      lifetime: await count("SELECT COUNT(*) AS count FROM users WHERE tier = 'lifetime'"),
    }))(),
    count("SELECT COUNT(*) AS count FROM profiles"),
    count("SELECT COUNT(*) AS count FROM interview_drafts"),
    count("SELECT COUNT(*) AS count FROM team_waitlist"),
    count("SELECT COUNT(*) AS count FROM meos_comps WHERE expires_at > datetime('now')"),
    (await d.query("SELECT email, expires_at FROM meos_comps WHERE expires_at > datetime('now') ORDER BY expires_at ASC").all()) as OwnerMetrics["activeComps"],
    (await d.query("SELECT name, email, company, team_size, created_at FROM team_waitlist ORDER BY created_at DESC LIMIT 5").all()) as OwnerMetrics["recentWaitlist"],
    (await d.query("SELECT email, tier, created_at FROM users ORDER BY created_at DESC LIMIT 5").all()) as OwnerMetrics["recentUsers"],
    (async () => ({
      signupCompleted: await eventCounts("signup_completed"),
      interviewStarted: await eventCounts("interview_started"),
      interviewCompleted: await eventCounts("interview_completed"),
      exportPerformed: await eventCounts("export_performed"),
    }))(),
  ]);

  return {
    userCounts,
    profileCount,
    pendingInterviews,
    waitlistCount,
    activeCompCount,
    activeComps,
    recentWaitlist,
    recentUsers,
    funnel,
  };
}

export async function createUser(id: string, email: string, passwordHash: string): Promise<User> {
  const d = getDb();
  await d.run("INSERT INTO users (id, email, password_hash, tier) VALUES (?, ?, ?, 'free')", [id, email, passwordHash]);
  return { id, email, tier: "free", stripe_customer_id: null, interview_count: 0, created_at: new Date().toISOString() };
}

export async function getPasswordHash(email: string): Promise<string | null> {
  const row = (await getDb().query("SELECT password_hash FROM users WHERE email = ?").get(email)) as { password_hash: string } | undefined;
  return row?.password_hash ?? null;
}

export async function createPasswordResetToken(userId: string, token: string, expiresAt: string): Promise<void> {
  const d = getDb();
  await d.run("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < datetime('now')", [userId]);
  await d.run("INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)", [token, userId, expiresAt]);
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const d = getDb();
  const row = (await d.query("SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > datetime('now')").get(token)) as { user_id: string } | undefined;
  if (!row) return null;
  await d.run("DELETE FROM password_reset_tokens WHERE token = ?", [token]);
  return row.user_id;
}

export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  await getDb().run("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, userId]);
}

export async function createSession(userId: string, token: string, expiresAt: string): Promise<Session> {
  const d = getDb();
  const id = crypto.randomUUID();
  await d.run("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)", [id, userId, token, expiresAt]);
  return { id, user_id: userId, token, expires_at: expiresAt, created_at: new Date().toISOString() };
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const d = getDb();
  const row = (await d.query("SELECT id, user_id, token, expires_at, created_at FROM sessions WHERE token = ?").get(token)) as Session | undefined;
  return row ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await getDb().run("DELETE FROM sessions WHERE token = ?", [token]);
}

export async function deleteExpiredSessions(): Promise<void> {
  await getDb().run("DELETE FROM sessions WHERE expires_at < datetime('now')");
}

// ── Profile helpers ──

export async function getProfileCount(userId: string): Promise<number> {
  const d = getDb();
  const row = (await d.query("SELECT COUNT(*) as count FROM profiles WHERE user_id = ?").get(userId)) as { count: number };
  return Number(row.count);
}

export async function hasEntitlement(userId: string, product: string): Promise<boolean> {
  return !!(await getDb().query("SELECT 1 FROM purchases WHERE user_id = ? AND product = ? LIMIT 1").get(userId, product));
}

export async function recordPurchase(userId: string, product: string): Promise<void> {
  await getDb().run("INSERT INTO purchases (id, user_id, product) VALUES (?, ?, ?)", [crypto.randomUUID(), userId, product]);
}

export async function listEntitlements(userId: string): Promise<string[]> {
  const d = getDb();
  return ((await d.query("SELECT product FROM purchases WHERE user_id = ? GROUP BY product ORDER BY MAX(created_at) DESC").all(userId)) as Array<{ product: string }>).map((row) => row.product);
}

// ── Interview count ──

export async function incrementInterviewCount(userId: string): Promise<number> {
  const d = getDb();
  await d.run("UPDATE users SET interview_count = interview_count + 1 WHERE id = ?", [userId]);
  const row = (await d.query("SELECT interview_count FROM users WHERE id = ?").get(userId)) as { interview_count: number };
  return Number(row.interview_count);
}

export async function getInterviewCount(userId: string): Promise<number> {
  const d = getDb();
  const row = (await d.query("SELECT interview_count FROM users WHERE id = ?").get(userId)) as { interview_count: number } | undefined;
  return Number(row?.interview_count ?? 0);
}

// ── Tier management ──

export async function upgradeUserTier(userId: string, tier: string): Promise<User | null> {
  const d = getDb();
  await d.run("UPDATE users SET tier = ? WHERE id = ?", [tier, userId]);
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

export async function getUserLimits(userId: string): Promise<UserLimits | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  const profileCount = await getProfileCount(userId);
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

export async function insertTeamWaitlistEntry(entry: TeamWaitlistEntry): Promise<void> {
  const d = getDb();
  await d.run("INSERT INTO team_waitlist (id, name, email, company, team_size, use_case) VALUES (?, ?, ?, ?, ?, ?)", [
    crypto.randomUUID(),
    entry.name,
    entry.email,
    entry.company,
    entry.team_size,
    entry.use_case,
  ]);
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

export async function getPendingDraftTransfer(email: string): Promise<PendingDraftTransfer | undefined> {
  const d = getDb();
  return (await d.query("SELECT id, target_email, source_user_id, source_offering FROM draft_transfers WHERE target_email = ?").get(email.trim().toLowerCase())) as PendingDraftTransfer | undefined;
}

export async function executeDraftTransfer(transferId: string, targetUserId: string): Promise<DraftTransferResult> {
  const d = getDb();

  const transfer = (await d.query("SELECT id, target_email, source_user_id, source_offering FROM draft_transfers WHERE id = ?").get(transferId)) as PendingDraftTransfer | undefined;
  if (!transfer) return { transferred: false, reason: "transfer_gone" };

  // The transfer is a no-op if the source and target are the same account.
  if (transfer.source_user_id === targetUserId) {
    await d.run("DELETE FROM draft_transfers WHERE id = ?", [transferId]);
    return { transferred: false, reason: "already_owned" };
  }

  // Read the source draft.
  const sourceDraft = (await d
    .query("SELECT topic, state_json, updated_at FROM interview_drafts WHERE user_id = ? AND offering = ?")
    .get(transfer.source_user_id, transfer.source_offering)) as { topic: string; state_json: string; updated_at: string } | undefined;

  // No source draft to move — clean up the pending transfer and report.
  if (!sourceDraft) {
    await d.run("DELETE FROM draft_transfers WHERE id = ?", [transferId]);
    return { transferred: false, reason: "source_gone" };
  }

  // Edge case: target already has a draft with the same offering (fresh accounts shouldn't,
  // but be safe). Rename the transferred draft's offering so it doesn't clash with the
  // (user_id, offering) primary key and both drafts survive.
  let offering = transfer.source_offering;
  const conflict = await d.query("SELECT 1 FROM interview_drafts WHERE user_id = ? AND offering = ? LIMIT 1").get(targetUserId, transfer.source_offering);
  if (conflict) {
    offering = `${transfer.source_offering}_transferred_${Date.now()}`;
  }

  // Move the draft to the new owner, then remove the source row (the PK is (user_id, offering),
  // so inserting under a different user_id leaves the orphaned source row behind unless deleted).
  await d.run("INSERT OR REPLACE INTO interview_drafts (user_id, offering, topic, state_json, updated_at) VALUES (?, ?, ?, ?, ?)", [
    targetUserId,
    offering,
    sourceDraft.topic,
    sourceDraft.state_json,
    sourceDraft.updated_at,
  ]);
  await d.run("DELETE FROM interview_drafts WHERE user_id = ? AND offering = ?", [transfer.source_user_id, transfer.source_offering]);
  await d.run("DELETE FROM draft_transfers WHERE id = ?", [transferId]);

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
export async function insertEvent(name: string, input: TrackEventInput = {}): Promise<void> {
  await maybePruneEvents(); // opportunistic once-per-day retention, not on every request
  await getDb().run("INSERT INTO events (id, name, user_id, anonymous_id, props_json) VALUES (?, ?, ?, ?, ?)", [
    crypto.randomUUID(),
    name,
    input.userId ?? null,
    input.anonymousId ?? null,
    JSON.stringify(input.props ?? {}),
  ]);
}

/**
 * True when the identity (user_id or anonymous_id) has already written at least
 * EVENT_RATE_LIMIT_MAX events within the rolling window. Exceeds nothing under
 * normal use — a human generates a handful of events per session. This is a
 * blunt per-identity cap for buggy/repeating clients, not full hostile-bot
 * protection.
 */
export async function isEventRateLimited(userId: string | null, anonymousId: string | null): Promise<boolean> {
  if (!userId && !anonymousId) return true; // no identifier → treat as un-writable
  const row = (await getDb()
    .query(
      `SELECT COUNT(*) AS count FROM events
       WHERE created_at >= datetime('now', ?)
         AND ((? IS NOT NULL AND user_id = ?) OR (? IS NOT NULL AND anonymous_id = ?))`,
    )
    .get(`-${EVENT_RATE_LIMIT_WINDOW_MINUTES} minutes`, userId, userId, anonymousId, anonymousId)) as { count: number };
  return row.count >= EVENT_RATE_LIMIT_MAX;
}

/**
 * Guarded event write used by the public logEvent path (and the signup flow).
 * Metrics-integrity rules:
 *   - requires at least one identifier (user_id or anonymous_id) — rows with
 *     neither are dropped so funnel counts stay attributable;
 *   - enforces the per-identity rate limit above.
 * Fails open: returns false instead of throwing, and the caller must never
 * block the user's funnel action on tracking.
 */
export async function recordEvent(name: string, input: TrackEventInput = {}): Promise<boolean> {
  try {
    const userId = input.userId ?? null;
    const anonymousId = input.anonymousId ?? null;
    if (!userId && !anonymousId) {
      console.warn(`[events] dropped "${name}": no user_id or anonymous_id`);
      return false;
    }
    if (await isEventRateLimited(userId, anonymousId)) {
      console.warn(`[events] dropped "${name}": rate limit exceeded for identity`);
      return false;
    }
    await insertEvent(name, input);
    return true;
  } catch (err) {
    console.warn(`[events] record "${name}" failed`, String(err));
    return false;
  }
}

/** Count events of a given name within the last `days` days. */
export async function countEvent(name: string, days: number): Promise<number> {
  const row = (await getDb()
    .query("SELECT COUNT(*) AS count FROM events WHERE name = ? AND created_at >= datetime('now', ?)")
    .get(name, `-${days} days`)) as { count: number };
  return row.count;
}

/** Most recent events (owner dashboard / debugging); limited for memory-safety. */
export async function recentEvents(limit = 50): Promise<EventRecord[]> {
  return (await getDb()
    .query("SELECT id, name, user_id, anonymous_id, props_json, created_at FROM events ORDER BY created_at DESC LIMIT ?")
    .all(limit)) as EventRecord[];
}
