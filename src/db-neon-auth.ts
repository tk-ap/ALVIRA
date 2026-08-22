import { neon } from "@neondatabase/serverless";

export interface NeonUser {
  id: string;
  email: string;
  tier: string;
  stripe_customer_id: string | null;
  interview_count: number;
  created_at: string;
}

export interface NeonSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.VERCEL) {
  console.warn("[neon] DATABASE_URL is missing in production; Neon auth adapter is unavailable.");
}

const sql = databaseUrl ? neon(databaseUrl) : null;

function requireSql() {
  if (!sql) throw new Error("Persistent database is not configured.");
  return sql;
}

export async function getNeonUserByEmail(email: string): Promise<NeonUser | null> {
  const db = requireSql();
  const rows = await db`SELECT id, email, tier, stripe_customer_id, interview_count, created_at FROM users WHERE email = ${email} LIMIT 1`;
  return (rows[0] as NeonUser | undefined) ?? null;
}

export async function getNeonUserById(userId: string): Promise<NeonUser | null> {
  const db = requireSql();
  const rows = await db`SELECT id, email, tier, stripe_customer_id, interview_count, created_at FROM users WHERE id = ${userId} LIMIT 1`;
  return (rows[0] as NeonUser | undefined) ?? null;
}

export async function getNeonPasswordHash(email: string): Promise<string | null> {
  const db = requireSql();
  const rows = await db`SELECT password_hash FROM users WHERE email = ${email} LIMIT 1`;
  return (rows[0] as { password_hash: string } | undefined)?.password_hash ?? null;
}

export async function createNeonUser(id: string, email: string, passwordHash: string): Promise<NeonUser> {
  const db = requireSql();
  const rows = await db`
    INSERT INTO users (id, email, password_hash, tier)
    VALUES (${id}, ${email}, ${passwordHash}, 'free')
    RETURNING id, email, tier, stripe_customer_id, interview_count, created_at
  `;
  return rows[0] as NeonUser;
}

export async function createNeonSession(userId: string, token: string, expiresAt: string): Promise<NeonSession> {
  const db = requireSql();
  const id = crypto.randomUUID();
  const rows = await db`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (${id}, ${userId}, ${token}, ${expiresAt})
    RETURNING id, user_id, token, expires_at, created_at
  `;
  return rows[0] as NeonSession;
}

export async function getNeonSessionByToken(token: string): Promise<NeonSession | null> {
  const db = requireSql();
  const rows = await db`SELECT id, user_id, token, expires_at, created_at FROM sessions WHERE token = ${token} LIMIT 1`;
  return (rows[0] as NeonSession | undefined) ?? null;
}

export async function deleteNeonSession(token: string): Promise<void> {
  const db = requireSql();
  await db`DELETE FROM sessions WHERE token = ${token}`;
}

export async function updateNeonPasswordHash(userId: string, passwordHash: string): Promise<void> {
  const db = requireSql();
  await db`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
}

export async function createNeonPasswordResetToken(userId: string, token: string, expiresAt: string): Promise<void> {
  const db = requireSql();
  await db`DELETE FROM password_reset_tokens WHERE user_id = ${userId} OR expires_at < NOW()`;
  await db`INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expiresAt})`;
}

export async function consumeNeonPasswordResetToken(token: string): Promise<string | null> {
  const db = requireSql();
  const rows = await db`SELECT user_id FROM password_reset_tokens WHERE token = ${token} AND expires_at > NOW() LIMIT 1`;
  const userId = (rows[0] as { user_id: string } | undefined)?.user_id;
  if (!userId) return null;
  await db`DELETE FROM password_reset_tokens WHERE token = ${token}`;
  return userId;
}

export async function migrateNeonUserPasswordHash(email: string, passwordHash: string): Promise<NeonUser> {
  const existing = await getNeonUserByEmail(email);
  if (existing) {
    await updateNeonPasswordHash(existing.id, passwordHash);
    return existing;
  }
  return createNeonUser(crypto.randomUUID(), email, passwordHash);
}
