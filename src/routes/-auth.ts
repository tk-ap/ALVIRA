// ── Auth server functions ──
import bcrypt from "bcryptjs";
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
  getMeosComp,
  getProfileCount,
  incrementInterviewCount,
  getUserLimits,
  recordPurchase,
  listEntitlements,
  getOwnerMetrics as queryOwnerMetrics,
  getPendingDraftTransfer,
  executeDraftTransfer,
  insertEvent,
} from "~/db";
import { deliver, enqueueEmail } from "~/emailQueue";
import { compileInterviewMarkdown } from "./-meosCompiler";
import { getMeosGraph } from "./-meosGraph";

const SESSION_COOKIE = "alvira_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

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
    const d = data as { email?: string; password?: string; anonymousId?: string };
    if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) {
      throw new Error("A valid email is required.");
    }
    if (!d.password || typeof d.password !== "string" || d.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    // Optional anonymous id links pre-signup funnel activity to the new account.
    const anonymousId =
      typeof d.anonymousId === "string" && /^[a-zA-Z0-9._:-]{1,128}$/.test(d.anonymousId.trim())
        ? d.anonymousId.trim()
        : undefined;
    return { email: d.email.trim().toLowerCase(), password: d.password, anonymousId };
  })
  .handler(async ({ data }) => {
    // Check if user already exists
    const existing = await getUserByEmail(data.email);
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await hashPassword(data.password);

    // Create user
    const userId = crypto.randomUUID();
    const user = await createUser(userId, data.email, passwordHash);

    // Queue welcome email (file-based bridge to email agent). enqueueEmail never
    // throws — a filesystem failure must not break an otherwise successful signup.
    enqueueEmail("welcome", { email: data.email, timestamp: new Date().toISOString() });

    // First-party funnel event: signup_completed, server-side right after user
    // creation (user_id known). Tracking failures never block signup.
    try {
      await insertEvent("signup_completed", { userId, anonymousId: data.anonymousId, props: { tier: "free" } });
    } catch (err) {
      console.warn("[events] signup_completed persistence failed", String(err));
    }

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await createSession(userId, token, expiresAt);

    // Check for a pending draft transfer (e.g. hipopmarkets' recovered draft that is currently
    // orphaned under another user id after the DB corruption recovery). Execute it if present.
    const pendingTransfer = await getPendingDraftTransfer(data.email);
    if (pendingTransfer) {
      await executeDraftTransfer(pendingTransfer.id, userId);
    }

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
    const hash = await getPasswordHash(data.email);
    if (!hash) {
      throw new Error("Invalid email or password.");
    }

    const valid = await verifyPassword(data.password, hash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    const user = (await getUserByEmail(data.email))!;

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await createSession(user.id, token, expiresAt);

    return {
      user: { id: user.id, email: user.email, tier: user.tier },
      token,
      expiresAt,
    };
  });

// ── Password reset ──

const RESET_TOKEN_MAX_AGE = 60 * 60 * 1000;
const PUBLIC_SITE_URL = (() => {
  const override = (process.env.PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "").trim();
  if (!override) return "https://alvira.ctonew.app";
  return override.startsWith("http://") || override.startsWith("https://") ? override : `https://${override}`;
})();

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const email = (data as { email?: string }).email;
    if (!email || typeof email !== "string" || !email.includes("@")) throw new Error("A valid email is required.");
    return email.trim().toLowerCase();
  })
  .handler(async ({ data }) => {
    const user = await getUserByEmail(data);
    // Always return the same response to avoid revealing which addresses have accounts.
    if (user) {
      const token = crypto.randomUUID();
      await createPasswordResetToken(user.id, token, new Date(Date.now() + RESET_TOKEN_MAX_AGE).toISOString());
      const resetUrl = `${PUBLIC_SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
      const result = (process.env.EMAIL_API_URL ?? "").trim()
        ? await deliver(user.email, "Reset your ALVIRA password", `We received a request to reset your ALVIRA password. Click the link below to choose a new password:\n\n${resetUrl}\n\nThis link expires in one hour. If you didn't request this, you can ignore this email.`)
        : (() => {
            const queued = enqueueEmail("reset", {
              email: user.email,
              resetUrl,
              timestamp: new Date().toISOString(),
            });
            if (!queued) {
              throw new Error("Password reset emails are not configured for this deployment. Set EMAIL_API_URL and EMAIL_API_KEY, or configure the queue processor.");
            }
            return { ok: true, mode: "simulated" as const };
          })();

      if (!result.ok) {
        throw new Error(result.error ?? "Unable to send password reset email.");
      }
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
    const userId = await consumePasswordResetToken(data.token);
    if (!userId) throw new Error("This reset link is invalid or has expired. Please request a new one.");
    const passwordHash = await hashPassword(data.newPassword);
    await updatePasswordHash(userId, passwordHash);
    return { success: true };
  });

// ── Logout ──

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = getSessionTokenFromRequest();
  if (token) {
    await deleteSession(token);
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
  const session = await getSessionByToken(token);
  if (!session || new Date(session.expires_at) < new Date()) throw new Error("Authentication required.");
  const user = await getUserById(session.user_id);
  if (!user) throw new Error("Authentication required.");
  return user;
}

export const claimPurchase = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const product = (data as { product?: string }).product;
    if (product !== "meos_build" && product !== "meos_care") throw new Error("Unsupported purchase.");
    return { product };
  })
  .handler(async ({ data }) => { const user = await requireUser(); await recordPurchase(user.id, data.product); return { success: true }; });

export const getEntitlements = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const entitlements = await listEntitlements(user.id);
  if (await getMeosComp(user.email) && !entitlements.includes("meos_build")) entitlements.push("meos_build");
  return entitlements;
});

export const authorizeMeos = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const { requireMeos } = await import("./-entitlements.server");
  await requireMeos(user);
  return { authorized: true };
});

// ── Save profile (with free tier limit check) ──

export const saveProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { topic?: string; tier?: string; state?: unknown; portrait?: unknown; offering?: string; preview?: boolean };
    if (!d.topic || typeof d.topic !== "string" || !d.tier || !d.state) throw new Error("Topic, tier, and state are required.");
    return { topic: d.topic.trim(), tier: d.tier, state: d.state, portrait: d.portrait, preview: d.preview === true, offering: d.offering === "meos" ? "meos" as const : "context" as const };
  })
  .handler(async ({ data }) => {
    const user = await requireUser();
    if (data.offering === "meos" && !data.preview) {
      const { requireMeos } = await import("./-entitlements.server");
      await requireMeos(user);
    }
    const d = getDb();

    // Check if this is an existing profile (same topic)
    const existing = (await d.query("SELECT id FROM profiles WHERE user_id = ? AND topic = ?").get(user.id, data.topic)) as { id: string } | undefined;

    // Free tier: can only have 1 profile (unless updating existing)
    if (user.tier === "free" && !existing) {
      const count = await getProfileCount(user.id);
      if (count >= 1) {
        return { error: "limit_reached", limit: "profiles" };
      }
    }

    let portrait = data.portrait;
    const state = data.state as { domains?: Record<string, { answers?: string[] }> } | undefined;
    if (state && typeof state === "object") {
      const compiled = compileInterviewMarkdown(state as any, data.offering === "meos" ? getMeosGraph() : []);
      portrait = {
        ...(typeof portrait === "object" && portrait ? (portrait as Record<string, unknown>) : {}),
        markdownFiles: compiled.allFiles,
      };
    }

    const id = existing?.id ?? crypto.randomUUID();
    await d.run(
      existing
        ? "UPDATE profiles SET offering = ?, tier = ?, state_json = ?, portrait_json = COALESCE(?, portrait_json), updated_at = datetime('now') WHERE id = ? AND user_id = ?"
        : "INSERT INTO profiles (id, user_id, topic, offering, tier, state_json, portrait_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
      existing ? [data.offering, data.tier, JSON.stringify(data.state), portrait ? JSON.stringify(portrait) : null, id, user.id] : [id, user.id, data.topic, data.offering, data.tier, JSON.stringify(data.state), portrait ? JSON.stringify(portrait) : null],
    );
    return { id };
  });

export const listProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return (await getDb().query("SELECT id, topic, tier, updated_at FROM profiles WHERE user_id = ? ORDER BY updated_at DESC").all(user.id));
});

export const getMeosProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const rows = (await getDb().query("SELECT id, topic, tier, state_json, portrait_json, updated_at FROM profiles WHERE user_id = ? AND offering = 'meos' ORDER BY updated_at DESC").all(user.id)) as Array<{ id: string; topic: string; tier: string; state_json: string; portrait_json: string | null; updated_at: string }>;
  return rows.map(row => ({ ...row, state: JSON.parse(row.state_json), portrait: row.portrait_json ? JSON.parse(row.portrait_json) : null }));
});

export const saveMeosPortrait = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({ profileId: String((data as { profileId?: string }).profileId ?? ""), portrait: (data as { portrait?: unknown }).portrait, markdownFiles: (data as { markdownFiles?: Record<string, string> }).markdownFiles }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const payload = data.markdownFiles
      ? { ...(typeof data.portrait === "object" && data.portrait ? (data.portrait as Record<string, unknown>) : {}), markdownFiles: data.markdownFiles }
      : data.portrait;
    await getDb().run("UPDATE profiles SET portrait_json = ?, offering = 'meos', updated_at = datetime('now') WHERE id = ? AND user_id = ?", [JSON.stringify(payload), data.profileId, user.id]);
    return { success: true };
  });

export const loadProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({ profileId: String((data as { profileId?: string }).profileId ?? "") }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const row = (await getDb().query("SELECT id, topic, tier, state_json FROM profiles WHERE id = ? AND user_id = ?").get(data.profileId, user.id)) as { id: string; topic: string; tier: string; state_json: string } | undefined;
    if (!row) throw new Error("Profile not found.");
    return { id: row.id, topic: row.topic, tier: row.tier, state: JSON.parse(row.state_json) };
  });

export const deleteProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({ profileId: String((data as { profileId?: string }).profileId ?? "") }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await getDb().run("DELETE FROM profiles WHERE id = ? AND user_id = ?", [data.profileId, user.id]);
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
    await getDb().run(
      "INSERT INTO interview_drafts (user_id, offering, topic, state_json, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(user_id, offering) DO UPDATE SET topic=excluded.topic, state_json=excluded.state_json, updated_at=datetime('now')",
      [user.id, data.offering, data.topic, JSON.stringify(data.state)],
    );
    return { success: true };
  });

export const getInterviewDraft = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  // Skip drafts that are the source of a pending transfer — they belong
  // to the target user, not the current user.
  const row = (await getDb().query(
    `SELECT d.offering, d.topic, d.state_json, d.updated_at
     FROM interview_drafts d
     WHERE d.user_id = ?
       AND NOT EXISTS (
         SELECT 1 FROM draft_transfers t
         WHERE t.source_user_id = d.user_id AND t.source_offering = d.offering
       )
     ORDER BY d.updated_at DESC LIMIT 1`
  ).get(user.id)) as { offering: string; topic: string; state_json: string; updated_at: string } | undefined;
  return row ? { ...row, state: JSON.parse(row.state_json) } : null;
});

export const finalizeInterviewDraft = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({
    topic: typeof (data as { topic?: string }).topic === "string" ? (data as { topic?: string }).topic!.trim() : "",
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const row = (await getDb().query(
     `SELECT offering, topic, state_json
      FROM interview_drafts
      WHERE user_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM draft_transfers t
          WHERE t.source_user_id = ? AND t.source_offering = interview_drafts.offering
        )
      ORDER BY updated_at DESC LIMIT 1`
    ).get(user.id, user.id)) as { offering: string; topic: string; state_json: string } | undefined;

    if (!row) throw new Error("No interview in progress to save.");

    const state = JSON.parse(row.state_json) as { domains?: Record<string, { answers?: string[] }> };
    const topic = data.topic || row.topic || "My Profile";

    if (user.tier === "free") {
     const count = await getProfileCount(user.id);
     const existing = (await getDb().query("SELECT id FROM profiles WHERE user_id = ? AND topic = ?").get(user.id, topic)) as { id: string } | undefined;
     if (!existing && count >= 1) {
       return { error: "limit_reached", limit: "profiles" };
     }
    }

    const compiled = compileInterviewMarkdown(state as any, row.offering === "meos" ? getMeosGraph() : []);
    const portrait = { markdownFiles: compiled.allFiles };
    const existing = (await getDb().query("SELECT id FROM profiles WHERE user_id = ? AND topic = ?").get(user.id, topic)) as { id: string } | undefined;
    const id = existing?.id ?? crypto.randomUUID();

    await getDb().run(
     existing
       ? "UPDATE profiles SET offering = ?, tier = ?, state_json = ?, portrait_json = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
       : "INSERT INTO profiles (id, user_id, topic, offering, tier, state_json, portrait_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
     existing
       ? [row.offering, user.tier, JSON.stringify(state), JSON.stringify(portrait), id, user.id]
       : [id, user.id, topic, row.offering, user.tier, JSON.stringify(state), JSON.stringify(portrait)],
    );

    await getDb().run("DELETE FROM interview_drafts WHERE user_id = ? AND offering = ?", [user.id, row.offering]);
    return { id, topic };
  });

export const clearInterviewDraft = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireUser();
  await getDb().run("DELETE FROM interview_drafts WHERE user_id = ?", [user.id]);
  return { success: true };
});

const OWNER_EMAIL = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com").trim().toLowerCase();

export const getOwnerMetrics = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  if (user.email.toLowerCase() !== OWNER_EMAIL) throw new Error("Not authorized.");
  return await queryOwnerMetrics();
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  // Clean up expired sessions
  await deleteExpiredSessions();

  const token = getSessionTokenFromRequest();
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await deleteSession(token);
    return null;
  }

  const user = await getUserById(session.user_id);
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

  const newCount = await incrementInterviewCount(user.id);
  return { interviewCount: newCount, tier: user.tier };
});

// ── Get user limits (for account page and app) ──

export const fetchUserLimits = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  const limits = await getUserLimits(user.id);
  if (!limits) throw new Error("User not found.");
  return limits;
});
