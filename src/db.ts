import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;
let sql: Sql | null = null;

export function getDb(): Sql {
  if (sql) return sql;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required. Connect a Postgres database before starting ALVIRA.");
  }
  sql = neon(connectionString);
  return sql;
}

async function rows<T>(query: string, params: unknown[] = []): Promise<T[]> {
  return (await getDb().query(query, params)) as T[];
}

async function first<T>(query: string, params: unknown[] = []): Promise<T | null> {
  return (await rows<T>(query, params))[0] ?? null;
}

async function run(query: string, params: unknown[] = []): Promise<void> {
  await getDb().query(query, params);
}

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

export interface MeosComp {
  id: string;
  email: string;
  expires_at: string;
  created_at: string;
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
}

export interface UserLimits {
  id: string;
  email: string;
  tier: string;
  interviewCount: number;
  profileCount: number;
  maxProfiles: number;
  maxInterviews: number;
}

export interface TeamWaitlistEntry {
  name: string;
  email: string;
  company: string | null;
  team_size: string | null;
  use_case: string | null;
}

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

export async function getUserById(userId: string): Promise<User | null> {
  return first<User>("SELECT id, email, tier, stripe_customer_id, interview_count, created_at FROM users WHERE id = $1", [userId]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return first<User>("SELECT id, email, tier, stripe_customer_id, interview_count, created_at FROM users WHERE email = $1", [email]);
}

export async function insertMeosComp(email: string, expiresAt: string): Promise<void> {
  await run("INSERT INTO meos_comps (id, email, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING", [crypto.randomUUID(), email.trim().toLowerCase(), expiresAt]);
}

export async function getMeosComp(email: string): Promise<MeosComp | null> {
  return first<MeosComp>("SELECT id, email, expires_at, created_at FROM meos_comps WHERE email = $1 AND expires_at > NOW()", [email.trim().toLowerCase()]);
}

export async function getOwnerMetrics(): Promise<OwnerMetrics> {
  const count = async (query: string) => Number((await first<{ count: string | number }>(query))?.count ?? 0);
  const [total, free, pro, lifetime, profileCount, pendingInterviews, waitlistCount, activeCompCount, activeComps, recentWaitlist, recentUsers] = await Promise.all([
    count("SELECT COUNT(*) AS count FROM users"),
    count("SELECT COUNT(*) AS count FROM users WHERE tier = 'free'"),
    count("SELECT COUNT(*) AS count FROM users WHERE tier = 'pro'"),
    count("SELECT COUNT(*) AS count FROM users WHERE tier = 'lifetime'"),
    count("SELECT COUNT(*) AS count FROM profiles"),
    count("SELECT COUNT(*) AS count FROM profiles WHERE state_json IS NOT NULL"),
    count("SELECT COUNT(*) AS count FROM team_waitlist"),
    count("SELECT COUNT(*) AS count FROM meos_comps WHERE expires_at > NOW()"),
    rows<OwnerMetrics["activeComps"][number]>("SELECT email, expires_at FROM meos_comps WHERE expires_at > NOW() ORDER BY expires_at ASC"),
    rows<OwnerMetrics["recentWaitlist"][number]>("SELECT name, email, company, team_size, created_at FROM team_waitlist ORDER BY created_at DESC LIMIT 5"),
    rows<OwnerMetrics["recentUsers"][number]>("SELECT email, tier, created_at FROM users ORDER BY created_at DESC LIMIT 5"),
  ]);
  return { userCounts: { total, free, pro, lifetime }, profileCount, pendingInterviews, waitlistCount, activeCompCount, activeComps, recentWaitlist, recentUsers };
}

export async function createUser(id: string, email: string, passwordHash: string): Promise<User> {
  return (await first<User>("INSERT INTO users (id, email, password_hash, tier) VALUES ($1, $2, $3, 'free') RETURNING id, email, tier, stripe_customer_id, interview_count, created_at", [id, email, passwordHash]))!;
}

export async function getPasswordHash(email: string): Promise<string | null> {
  return (await first<{ password_hash: string }>("SELECT password_hash FROM users WHERE email = $1", [email]))?.password_hash ?? null;
}

export async function createPasswordResetToken(userId: string, token: string, expiresAt: string): Promise<void> {
  await run("DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < NOW()", [userId]);
  await run("INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)", [token, userId, expiresAt]);
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const row = await first<{ user_id: string }>("DELETE FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() RETURNING user_id", [token]);
  return row?.user_id ?? null;
}

export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  await run("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
}

export async function createSession(userId: string, token: string, expiresAt: string): Promise<Session> {
  return (await first<Session>("INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, user_id, token, expires_at, created_at", [crypto.randomUUID(), userId, token, expiresAt]))!;
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  return first<Session>("SELECT id, user_id, token, expires_at, created_at FROM sessions WHERE token = $1", [token]);
}

export async function deleteSession(token: string): Promise<void> { await run("DELETE FROM sessions WHERE token = $1", [token]); }
export async function deleteExpiredSessions(): Promise<void> { await run("DELETE FROM sessions WHERE expires_at < NOW()"); }

export async function getProfileCount(userId: string): Promise<number> {
  return Number((await first<{ count: string | number }>("SELECT COUNT(*) AS count FROM profiles WHERE user_id = $1", [userId]))?.count ?? 0);
}

export async function hasEntitlement(userId: string, product: string): Promise<boolean> {
  return !!(await first("SELECT 1 FROM purchases WHERE user_id = $1 AND product = $2 LIMIT 1", [userId, product]));
}

export async function recordPurchase(userId: string, product: string): Promise<void> { await run("INSERT INTO purchases (id, user_id, product) VALUES ($1, $2, $3)", [crypto.randomUUID(), userId, product]); }
export async function listEntitlements(userId: string): Promise<string[]> { return (await rows<{ product: string }>("SELECT DISTINCT product FROM purchases WHERE user_id = $1 ORDER BY product", [userId])).map((row) => row.product); }

export async function incrementInterviewCount(userId: string): Promise<number> {
  return Number((await first<{ interview_count: number }>("UPDATE users SET interview_count = interview_count + 1 WHERE id = $1 RETURNING interview_count", [userId]))?.interview_count ?? 0);
}

export async function getInterviewCount(userId: string): Promise<number> { return Number((await first<{ interview_count: number }>("SELECT interview_count FROM users WHERE id = $1", [userId]))?.interview_count ?? 0); }
export async function upgradeUserTier(userId: string, tier: string): Promise<User | null> { await run("UPDATE users SET tier = $1 WHERE id = $2", [tier, userId]); return getUserById(userId); }

export async function getUserLimits(userId: string): Promise<UserLimits | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  const profileCount = await getProfileCount(userId);
  return { id: user.id, email: user.email, tier: user.tier, interviewCount: user.interview_count, profileCount, maxProfiles: user.tier === "free" ? 1 : Infinity, maxInterviews: user.tier === "free" ? 3 : Infinity };
}

export async function insertTeamWaitlistEntry(entry: TeamWaitlistEntry): Promise<void> {
  await run("INSERT INTO team_waitlist (id, name, email, company, team_size, use_case) VALUES ($1, $2, $3, $4, $5, $6)", [crypto.randomUUID(), entry.name, entry.email, entry.company, entry.team_size, entry.use_case]);
}

export async function getPendingDraftTransfer(email: string): Promise<PendingDraftTransfer | null> {
  return first<PendingDraftTransfer>("SELECT id, target_email, source_user_id, source_offering FROM draft_transfers WHERE target_email = $1", [email.trim().toLowerCase()]);
}

export async function executeDraftTransfer(transferId: string, targetUserId: string): Promise<DraftTransferResult> {
  const transfer = await first<PendingDraftTransfer>("SELECT id, target_email, source_user_id, source_offering FROM draft_transfers WHERE id = $1", [transferId]);
  if (!transfer) return { transferred: false, reason: "transfer_gone" };
  if (transfer.source_user_id === targetUserId) { await run("DELETE FROM draft_transfers WHERE id = $1", [transferId]); return { transferred: false, reason: "already_owned" }; }
  const source = await first<{ topic: string; state_json: string; updated_at: string }>("SELECT topic, state_json, updated_at FROM interview_drafts WHERE user_id = $1 AND offering = $2", [transfer.source_user_id, transfer.source_offering]);
  if (!source) { await run("DELETE FROM draft_transfers WHERE id = $1", [transferId]); return { transferred: false, reason: "source_gone" }; }
  const conflict = await first("SELECT 1 FROM interview_drafts WHERE user_id = $1 AND offering = $2 LIMIT 1", [targetUserId, transfer.source_offering]);
  const offering = conflict ? `${transfer.source_offering}_transferred_${Date.now()}` : transfer.source_offering;
  await getDb().transaction([
    getDb().query("INSERT INTO interview_drafts (user_id, offering, topic, state_json, updated_at) VALUES ($1, $2, $3, $4, $5)", [targetUserId, offering, source.topic, source.state_json, source.updated_at]),
    getDb().query("DELETE FROM interview_drafts WHERE user_id = $1 AND offering = $2", [transfer.source_user_id, transfer.source_offering]),
    getDb().query("DELETE FROM draft_transfers WHERE id = $1", [transferId]),
  ]);
  return { transferred: true };
}
