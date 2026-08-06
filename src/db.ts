// ── Database: Bun-native SQLite ──
import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_DIR = join(process.cwd(), ".data");
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
  `);

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

export interface OwnerMetrics {
  userCounts: { total: number; free: number; pro: number; lifetime: number };
  profileCount: number;
  pendingInterviews: number;
  waitlistCount: number;
  recentWaitlist: Array<{ name: string; email: string; company: string | null; team_size: string | null; created_at: string }>;
  recentUsers: Array<{ email: string; tier: string; created_at: string }>;
}

export function getOwnerMetrics(): OwnerMetrics {
  const d = getDb();
  const count = (sql: string) => Number((d.query(sql).get() as { count: number }).count);
  return {
    userCounts: {
      total: count("SELECT COUNT(*) AS count FROM users"),
      free: count("SELECT COUNT(*) AS count FROM users WHERE tier = 'free'"),
      pro: count("SELECT COUNT(*) AS count FROM users WHERE tier = 'pro'"),
      lifetime: count("SELECT COUNT(*) AS count FROM users WHERE tier = 'lifetime'"),
    },
    profileCount: count("SELECT COUNT(*) AS count FROM profiles"),
    pendingInterviews: count("SELECT COUNT(*) AS count FROM profiles WHERE state_json IS NOT NULL"),
    waitlistCount: count("SELECT COUNT(*) AS count FROM team_waitlist"),
    recentWaitlist: d.query("SELECT name, email, company, team_size, created_at FROM team_waitlist ORDER BY created_at DESC LIMIT 5").all() as OwnerMetrics["recentWaitlist"],
    recentUsers: d.query("SELECT email, tier, created_at FROM users ORDER BY created_at DESC LIMIT 5").all() as OwnerMetrics["recentUsers"],
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
