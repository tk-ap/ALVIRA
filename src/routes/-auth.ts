// ── Auth server functions ──
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";
import {
  getDb,
  createSession,
  createUser,
  deleteSession,
  deleteExpiredSessions,
  getPasswordHash,
  createPasswordResetToken,
  consumePasswordResetToken,
  updatePasswordHash,
  getSessionByToken,
  getUserByEmail,
  getUserById,
  getProfileCount,
  incrementInterviewCount,
  getUserLimits,
} from "~/db";

const SESSION_COOKIE = "alvira_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// ── Helpers ──

function getSessionTokenFromRequest(): string | null {
  try {
    return getCookie(SESSION_COOKIE) ?? null;
  } catch {
    return null;
  }
}

// ── Signup ──

export const signup = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { email?: string; password?: string };
    if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) {
      throw new Error("A valid email is required.");
    }
    if (!d.password || typeof d.password !== "string" || d.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    return { email: d.email.trim().toLowerCase(), password: d.password };
  })
  .handler(async ({ data }) => {
    // Check if user already exists
    const existing = getUserByEmail(data.email);
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    // Hash password with Bun
    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // Create user
    const userId = crypto.randomUUID();
    const user = createUser(userId, data.email, passwordHash);

    // Queue welcome email (file-based bridge to email agent)
    const queuePath = join("/home", "team", "shared", "pending-welcome-emails.txt");
    appendFileSync(queuePath, JSON.stringify({ email: data.email, timestamp: new Date().toISOString() }) + "\n");

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    createSession(userId, token, expiresAt);

    return {
      user: { id: user.id, email: user.email, tier: user.tier },
      token,
      expiresAt,
    };
  });

// ── Login ──

export const login = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { email?: string; password?: string };
    if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) {
      throw new Error("A valid email is required.");
    }
    if (!d.password || typeof d.password !== "string") {
      throw new Error("Password is required.");
    }
    return { email: d.email.trim().toLowerCase(), password: d.password };
  })
  .handler(async ({ data }) => {
    const hash = getPasswordHash(data.email);
    if (!hash) {
      throw new Error("Invalid email or password.");
    }

    const valid = await Bun.password.verify(data.password, hash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    const user = getUserByEmail(data.email)!;

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    createSession(user.id, token, expiresAt);

    return {
      user: { id: user.id, email: user.email, tier: user.tier },
      token,
      expiresAt,
    };
  });

// ── Password reset ──

const RESET_TOKEN_MAX_AGE = 60 * 60 * 1000;
const PUBLIC_SITE_URL = "https://alvira.ctonew.app";

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const email = (data as { email?: string }).email;
    if (!email || typeof email !== "string" || !email.includes("@")) throw new Error("A valid email is required.");
    return email.trim().toLowerCase();
  })
  .handler(async ({ data }) => {
    const user = getUserByEmail(data);
    // Always return the same response to avoid revealing which addresses have accounts.
    if (user) {
      const token = crypto.randomUUID();
      createPasswordResetToken(user.id, token, new Date(Date.now() + RESET_TOKEN_MAX_AGE).toISOString());
      const queuePath = join("/home", "team", "shared", "pending-password-reset-emails.txt");
      appendFileSync(queuePath, JSON.stringify({ email: user.email, resetUrl: `${PUBLIC_SITE_URL}/reset-password?token=${encodeURIComponent(token)}`, timestamp: new Date().toISOString() }) + "\n");
    }
    return { success: true };
  });

export const resetPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token?: string; newPassword?: string };
    if (!d.token || typeof d.token !== "string") throw new Error("Reset token is required.");
    if (!d.newPassword || typeof d.newPassword !== "string" || d.newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
    return { token: d.token, newPassword: d.newPassword };
  })
  .handler(async ({ data }) => {
    const userId = consumePasswordResetToken(data.token);
    if (!userId) throw new Error("This reset link is invalid or has expired. Please request a new one.");
    const passwordHash = await Bun.password.hash(data.newPassword, { algorithm: "bcrypt", cost: 10 });
    updatePasswordHash(userId, passwordHash);
    return { success: true };
  });

// ── Logout ──

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = getSessionTokenFromRequest();
  if (token) {
    deleteSession(token);
  }
  // Also clear the cookie server-side
  try {
    deleteCookie(SESSION_COOKIE);
  } catch {
    // ignore if cookie operations aren't available
  }
  return { success: true };
});

// ── Get current user ──

async function requireUser() {
  const token = getSessionTokenFromRequest();
  if (!token) throw new Error("Authentication required.");
  const session = getSessionByToken(token);
  if (!session || new Date(session.expires_at) < new Date()) throw new Error("Authentication required.");
  const user = getUserById(session.user_id);
  if (!user) throw new Error("Authentication required.");
  return user;
}

// ── Save profile (with free tier limit check) ──

export const saveProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { topic?: string; tier?: string; state?: unknown; portrait?: unknown };
    if (!d.topic || typeof d.topic !== "string" || !d.tier || !d.state) throw new Error("Topic, tier, and state are required.");
    return { topic: d.topic.trim(), tier: d.tier, state: d.state, portrait: d.portrait };
  })
  .handler(async ({ data }) => {
    const user = await requireUser();
    const d = getDb();

    // Check if this is an existing profile (same topic)
    const existing = d.query("SELECT id FROM profiles WHERE user_id = ? AND topic = ?").get(user.id, data.topic) as { id: string } | undefined;

    // Free tier: can only have 1 profile (unless updating existing)
    if (user.tier === "free" && !existing) {
      const count = getProfileCount(user.id);
      if (count >= 1) {
        return { error: "limit_reached", limit: "profiles" };
      }
    }

    const id = existing?.id ?? crypto.randomUUID();
    d.run(
      existing
        ? "UPDATE profiles SET tier = ?, state_json = ?, portrait_json = COALESCE(?, portrait_json), updated_at = datetime('now') WHERE id = ? AND user_id = ?"
        : "INSERT INTO profiles (id, user_id, topic, tier, state_json, portrait_json) VALUES (?, ?, ?, ?, ?, ?)",
      existing ? [data.tier, JSON.stringify(data.state), data.portrait ? JSON.stringify(data.portrait) : null, id, user.id] : [id, user.id, data.topic, data.tier, JSON.stringify(data.state), data.portrait ? JSON.stringify(data.portrait) : null],
    );
    return { id };
  });

export const listProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return getDb().query("SELECT id, topic, tier, updated_at FROM profiles WHERE user_id = ? ORDER BY updated_at DESC").all(user.id);
});

export const getMeosProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const rows = getDb().query("SELECT id, topic, tier, state_json, portrait_json, updated_at FROM profiles WHERE user_id = ? AND (topic LIKE '%MeOS%' OR topic LIKE '%meos%') ORDER BY updated_at DESC").all(user.id) as Array<{ id: string; topic: string; tier: string; state_json: string; portrait_json: string | null; updated_at: string }>;
  return rows.map(row => ({ ...row, state: JSON.parse(row.state_json), portrait: row.portrait_json ? JSON.parse(row.portrait_json) : null }));
});

export const saveMeosPortrait = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({ profileId: String((data as { profileId?: string }).profileId ?? ""), portrait: (data as { portrait?: unknown }).portrait }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    getDb().run("UPDATE profiles SET portrait_json = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?", [JSON.stringify(data.portrait), data.profileId, user.id]);
    return { success: true };
  });

export const loadProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({ profileId: String((data as { profileId?: string }).profileId ?? "") }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const row = getDb().query("SELECT id, topic, tier, state_json FROM profiles WHERE id = ? AND user_id = ?").get(data.profileId, user.id) as { id: string; topic: string; tier: string; state_json: string } | undefined;
    if (!row) throw new Error("Profile not found.");
    return { id: row.id, topic: row.topic, tier: row.tier, state: JSON.parse(row.state_json) };
  });

export const deleteProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({ profileId: String((data as { profileId?: string }).profileId ?? "") }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    getDb().run("DELETE FROM profiles WHERE id = ? AND user_id = ?", [data.profileId, user.id]);
    return { success: true };
  });

export const autosaveInterview = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { offering?: string; topic?: string; state?: unknown };
    if (!d.offering || !d.topic || !d.state) throw new Error("Interview state is required.");
    return { offering: d.offering.trim(), topic: d.topic.trim(), state: d.state };
  })
  .handler(async ({ data }) => {
    const user = await requireUser();
    getDb().run(
      "INSERT INTO interview_drafts (user_id, offering, topic, state_json, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(user_id, offering) DO UPDATE SET topic=excluded.topic, state_json=excluded.state_json, updated_at=datetime('now')",
      [user.id, data.offering, data.topic, JSON.stringify(data.state)],
    );
    return { success: true };
  });

export const getInterviewDraft = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const row = getDb().query("SELECT offering, topic, state_json, updated_at FROM interview_drafts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1").get(user.id) as { offering: string; topic: string; state_json: string; updated_at: string } | undefined;
  return row ? { ...row, state: JSON.parse(row.state_json) } : null;
});

export const clearInterviewDraft = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireUser();
  getDb().run("DELETE FROM interview_drafts WHERE user_id = ?", [user.id]);
  return { success: true };
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  // Clean up expired sessions
  deleteExpiredSessions();

  const token = getSessionTokenFromRequest();
  if (!token) return null;

  const session = getSessionByToken(token);
  if (!session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    deleteSession(token);
    return null;
  }

  const user = getUserById(session.user_id);
  if (!user) return null;

  return { id: user.id, email: user.email, tier: user.tier, interviewCount: user.interview_count };
});

// ── Interview count tracking ──

export const trackInterview = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireUser();

  // Free tier: check interview limit before incrementing
  if (user.tier === "free" && user.interview_count >= 3) {
    return { error: "limit_reached", limit: "interviews" };
  }

  const newCount = incrementInterviewCount(user.id);
  return { interviewCount: newCount, tier: user.tier };
});

// ── Get user limits (for account page and app) ──

export const fetchUserLimits = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const limits = getUserLimits(user.id);
  if (!limits) throw new Error("User not found.");
  return limits;
});
