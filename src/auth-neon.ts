import * as bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { createUser, getPasswordHash, getSessionByToken, getUserByEmail, getUserById, createSession, deleteSession } from "./db-neon";

export async function authenticate(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const hash = await getPasswordHash(user.id);
  if (!hash || !(await bcrypt.compare(password, hash))) return null;
  return user;
}

export async function register(email: string, password: string, tier = "free") {
  const normalized = email.trim().toLowerCase();
  if (await getUserByEmail(normalized)) throw new Error("EMAIL_IN_USE");
  const id = randomUUID();
  const password_hash = await bcrypt.hash(password, 12);
  await createUser({ id, email: normalized, password_hash, tier });
  return getUserById(id);
}

export async function startSession(userId: string, expiresAt: string) {
  const token = randomUUID() + randomUUID();
  await createSession({ id: randomUUID(), user_id: userId, token, expires_at: expiresAt, created_at: new Date().toISOString() });
  return token;
}

export async function resolveSession(token: string) {
  const session = await getSessionByToken(token);
  if (!session) return null;
  return getUserById(session.user_id);
}

export async function endSession(token: string) {
  await deleteSession(token);
}
