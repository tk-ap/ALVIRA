// Neon/Postgres persistence for the launch-critical auth/session surface.
import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for Neon persistence");
  return neon(url);
}

export type User = {
  id: string;
  email: string;
  tier: string;
  stripe_customer_id: string | null;
  interview_count: number;
  created_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
};

export async function getUserById(userId: string): Promise<User | null> {
  const rows = await sql()`SELECT id,email,tier,stripe_customer_id,interview_count,created_at FROM users WHERE id=${userId} LIMIT 1`;
  return (rows[0] as User | undefined) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql()`SELECT id,email,tier,stripe_customer_id,interview_count,created_at FROM users WHERE lower(email)=lower(${email.trim()}) LIMIT 1`;
  return (rows[0] as User | undefined) ?? null;
}

export async function getPasswordHash(userId: string): Promise<string | null> {
  const rows = await sql()`SELECT password_hash FROM users WHERE id=${userId} LIMIT 1`;
  return rows[0]?.password_hash ? String(rows[0].password_hash) : null;
}

export async function createUser(user: { id: string; email: string; password_hash: string; tier?: string }): Promise<void> {
  await sql()`INSERT INTO users (id,email,password_hash,tier) VALUES (${user.id},${user.email.trim().toLowerCase()},${user.password_hash},${user.tier ?? "free"})`;
}

export async function createSession(session: Session): Promise<void> {
  await sql()`INSERT INTO sessions (id,user_id,token,expires_at) VALUES (${session.id},${session.user_id},${session.token},${session.expires_at})`;
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const rows = await sql()`SELECT id,user_id,token,expires_at,created_at FROM sessions WHERE token=${token} AND expires_at > now() LIMIT 1`;
  return (rows[0] as Session | undefined) ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await sql()`DELETE FROM sessions WHERE token=${token}`;
}

export async function updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
  await sql()`UPDATE users SET password_hash=${passwordHash} WHERE id=${userId}`;
}
