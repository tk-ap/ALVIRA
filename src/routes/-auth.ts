// ── Auth server functions ──
import { compare, hash as hashPassword } from "bcryptjs";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { getDb, createSession, createUser, deleteSession, getPasswordHash, createPasswordResetToken, consumePasswordResetToken, updatePasswordHash, getSessionByToken, getUserByEmail, getUserById, getMeosComp, getProfileCount, recordPurchase, listEntitlements, getOwnerMetrics as queryOwnerMetrics, getPendingDraftTransfer, executeDraftTransfer } from "~/db";
import { sendPasswordResetEmail, sendWelcomeEmail } from "~/email";
import { compileInterviewMarkdown } from "./-meosCompiler";
import { getMeosGraph } from "./-meosGraph";

const SESSION_COOKIE = "alvira_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
function sessionCookieOptions() { const domain = process.env.ALVIRA_SESSION_COOKIE_DOMAIN?.trim(); return { path: "/", maxAge: SESSION_MAX_AGE, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, ...(domain ? { domain } : {}) }; }
function setSessionCookie(token: string): void { setCookie(SESSION_COOKIE, token, sessionCookieOptions()); }
function getSessionTokenFromRequest(): string | null { try { return getCookie(SESSION_COOKIE) ?? null; } catch { return null; } }

export const signup = createServerFn({ method: "POST" }).validator((data: unknown) => { const d = data as { email?: string; password?: string }; if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) throw new Error("A valid email is required."); if (!d.password || typeof d.password !== "string" || d.password.length < 8) throw new Error("Password must be at least 8 characters."); return { email: d.email.trim().toLowerCase(), password: d.password }; }).handler(async ({ data }) => { const existing = await getUserByEmail(data.email); if (existing) throw new Error("An account with this email already exists."); const passwordHash = await hashPassword(data.password, 10); const userId = crypto.randomUUID(); const user = await createUser(userId, data.email, passwordHash); await sendWelcomeEmail(data.email); const token = crypto.randomUUID(); const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(); await createSession(userId, token, expiresAt); setSessionCookie(token); const pendingTransfer = await getPendingDraftTransfer(data.email); if (pendingTransfer) await executeDraftTransfer(pendingTransfer.id, userId); return { user: { id: user.id, email: user.email, tier: user.tier }, expiresAt }; });

export const login = createServerFn({ method: "POST" }).validator((data: unknown) => { const d = data as { email?: string; password?: string }; if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) throw new Error("A valid email is required."); if (!d.password || typeof d.password !== "string") throw new Error("Password is required."); return { email: d.email.trim().toLowerCase(), password: d.password }; }).handler(async ({ data }) => {
  const diagnostic = process.env.ALVIRA_AUTH_DIAGNOSTICS === "true";
  const dbUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
  let dbHost = "missing"; try { dbHost = dbUrl ? new URL(dbUrl).hostname : "missing"; } catch { dbHost = "invalid"; }
  if (diagnostic) console.info("[auth:login] start", { email: data.email, dbHost });
  const hash = await getPasswordHash(data.email);
  if (!hash) { if (diagnostic) console.info("[auth:login] result", { userFound: false, hashPresent: false, passwordMatch: false }); throw new Error("Invalid email or password."); }
  const valid = await compare(data.password, hash);
  if (diagnostic) console.info("[auth:login] result", { userFound: true, hashPresent: true, passwordMatch: valid });
  if (!valid) throw new Error("Invalid email or password.");
  const user = (await getUserByEmail(data.email))!;
  if (diagnostic) console.info("[auth:login] session", { userId: user.id, tier: user.tier });
  const token = crypto.randomUUID(); const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(); await createSession(user.id, token, expiresAt); setSessionCookie(token); return { user: { id: user.id, email: user.email, tier: user.tier }, expiresAt };
});

const RESET_TOKEN_MAX_AGE = 60 * 60 * 1000;
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "https://alvira.ctonew.app";
export const requestPasswordReset = createServerFn({ method: "POST" }).validator((data: unknown) => { const email = (data as { email?: string }).email; if (!email || typeof email !== "string" || !email.includes("@")) throw new Error("A valid email is required."); return email.trim().toLowerCase(); }).handler(async ({ data }) => { const user = await getUserByEmail(data); if (user) { const token = crypto.randomUUID(); await createPasswordResetToken(user.id, token, new Date(Date.now() + RESET_TOKEN_MAX_AGE).toISOString()); await sendPasswordResetEmail(user.email, `${PUBLIC_SITE_URL}/reset-password?token=${encodeURIComponent(token)}`); } return { success: true }; });
export const resetPassword = createServerFn({ method: "POST" }).validator((data: unknown) => { const d = data as { token?: string; newPassword?: string }; if (!d.token || typeof d.token !== "string") throw new Error("Reset token is required."); if (!d.newPassword || typeof d.newPassword !== "string" || d.newPassword.length < 8) throw new Error("Password must be at least 8 characters."); return { token: d.token, newPassword: d.newPassword }; }).handler(async ({ data }) => { const userId = await consumePasswordResetToken(data.token); if (!userId) throw new Error("This reset link is invalid or has expired. Please request a new one."); const passwordHash = await hashPassword(data.newPassword, 10); await updatePasswordHash(userId, passwordHash); return { success: true }; });

export const logout = createServerFn({ method: "POST" }).handler(async () => { const token = getSessionTokenFromRequest(); if (token) await deleteSession(token); try { deleteCookie(SESSION_COOKIE, sessionCookieOptions()); } catch {} return { success: true }; });

async function requireUser() { const token = getSessionTokenFromRequest(); if (!token) throw new Error("Authentication required."); const session = await getSessionByToken(token); if (!session || new Date(session.expires_at) < new Date()) throw new Error("Authentication required."); const user = await getUserById(session.user_id); if (!user) throw new Error("Authentication required."); return user; }

export const claimPurchase = createServerFn({ method: "POST" }).validator((data: unknown) => { const product = (data as { product?: string }).product; if (product !== "meos_build" && product !== "meos_care") throw new Error("Unsupported purchase."); return { product }; }).handler(async ({ data }) => { const user = await requireUser(); await recordPurchase(user.id, data.product); return { success: true }; });
export const getEntitlements = createServerFn({ method: "GET" }).handler(async () => { const user = await requireUser(); const entitlements = await listEntitlements(user.id); if ((await getMeosComp(user.email)) && !entitlements.includes("meos_build")) entitlements.push("meos_build"); return entitlements; });
export const authorizeMeos = createServerFn({ method: "GET" }).handler(async () => { const user = await requireUser(); const { requireMeos } = await import("./-entitlements.server"); await requireMeos(user); return { authorized: true }; });

// Remaining server functions are unchanged from the existing implementation.
