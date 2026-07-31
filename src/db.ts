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

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      tier TEXT NOT NULL,
      state_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, topic)
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
  `);

  // ── Migration: add interview_count to existing users table ──
  try {
    db.exec("ALTER TABLE users ADD COLUMN interview_count INTEGER NOT NULL DEFAULT 0");
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
