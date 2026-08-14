// ── Auth server functions ──
import { compare, hash as hashPassword } from "bcryptjs";
import { createServerFn } from "@tanstack/react-start";
import { isOwnerEmail } from "~/lib/access";
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
} from "~/db";
import { sendPasswordResetEmail, sendWelcomeEmail } from "~/email";

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
    if (
      !d.password ||
      typeof d.password !== "string" ||
      d.password.length < 8
    ) {
      throw new Error("Password must be at least 8 characters.");
    }
    return { email: d.email.trim().toLowerCase(), password: d.password };
  })
  .handler(async ({ data }) => {
    // Check if user already exists
    const existing = await getUserByEmail(data.email);
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    // Hash password with Bun
    const passwordHash = await hashPassword(data.password, 10);

    // Create user
    const userId = crypto.randomUUID();
    const user = await createUser(userId, data.email, passwordHash);

    await sendWelcomeEmail(data.email);

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + SESSION_MAX_AGE * 1000,
    ).toISOString();
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

    const valid = await compare(data.password, hash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    const user = (await getUserByEmail(data.email))!;

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + SESSION_MAX_AGE * 1000,
    ).toISOString();
    await createSession(user.id, token, expiresAt);

    return {
      user: { id: user.id, email: user.email, tier: user.tier },
      token,
      expiresAt,
    };
  });

// ── Password reset ──

const RESET_TOKEN_MAX_AGE = 60 * 60 * 1000;
const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL || "https://alvira.ctonew.app";

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const email = (data as { email?: string }).email;
    if (!email || typeof email !== "string" || !email.includes("@"))
      throw new Error("A valid email is required.");
    return email.trim().toLowerCase();
  })
  .handler(async ({ data }) => {
    const user = await getUserByEmail(data);
    // Always return the same response to avoid revealing which addresses have accounts.
    if (user) {
      const token = crypto.randomUUID();
      await createPasswordResetToken(
        user.id,
        token,
        new Date(Date.now() + RESET_TOKEN_MAX_AGE).toISOString(),
      );
      await sendPasswordResetEmail(
        user.email,
        `${PUBLIC_SITE_URL}/reset-password?token=${encodeURIComponent(token)}`,
      );
    }
    return { success: true };
  });

export const resetPassword = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token?: string; newPassword?: string };
    if (!d.token || typeof d.token !== "string")
      throw new Error("Reset token is required.");
    if (
      !d.newPassword ||
      typeof d.newPassword !== "string" ||
      d.newPassword.length < 8
    )
      throw new Error("Password must be at least 8 characters.");
    return { token: d.token, newPassword: d.newPassword };
  })
  .handler(async ({ data }) => {
    const userId = await consumePasswordResetToken(data.token);
    if (!userId)
      throw new Error(
        "This reset link is invalid or has expired. Please request a new one.",
      );
    const passwordHash = await hashPassword(data.newPassword, 10);
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
  if (!session || new Date(session.expires_at) < new Date())
    throw new Error("Authentication required.");
  const user = await getUserById(session.user_id);
  if (!user) throw new Error("Authentication required.");
  return user;
}

export const claimPurchase = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const product = (data as { product?: string }).product;
    if (product !== "meos_build" && product !== "meos_care")
      throw new Error("Unsupported purchase.");
    return { product };
  })
  .handler(async ({ data }) => {
    const user = await requireUser();
    await recordPurchase(user.id, data.product);
    return { success: true };
  });

export const getEntitlements = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await requireUser();
    const entitlements = await listEntitlements(user.id);
    if (isOwnerEmail(user.email)) {
      for (const product of [
        "owner_all_access",
        "meos_build",
        "meos_care",
        "ai_integrations",
      ]) {
        if (!entitlements.includes(product)) entitlements.push(product);
      }
    }
    if ((await getMeosComp(user.email)) && !entitlements.includes("meos_build"))
      entitlements.push("meos_build");
    return entitlements;
  },
);

export const authorizeMeos = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await requireUser();
    const { requireMeos } = await import("./-entitlements.server");
    await requireMeos(user);
    return { authorized: true };
  },
);

// ── Save profile (with free tier limit check) ──

export const saveProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      topic?: string;
      tier?: string;
      state?: unknown;
      portrait?: unknown;
      offering?: string;
      preview?: boolean;
    };
    if (!d.topic || typeof d.topic !== "string" || !d.tier || !d.state)
      throw new Error("Topic, tier, and state are required.");
    return {
      topic: d.topic.trim(),
      tier: d.tier,
      state: d.state,
      portrait: d.portrait,
      preview: d.preview === true,
      offering:
        d.offering === "meos" ? ("meos" as const) : ("context" as const),
    };
  })
  .handler(async ({ data }) => {
    const user = await requireUser();
    if (data.offering === "meos" && !data.preview) {
      const { requireMeos } = await import("./-entitlements.server");
      await requireMeos(user);
    }
    const d = getDb();

    // Check if this is an existing profile (same topic)
    const existing = (
      await d.query(
        "SELECT id FROM profiles WHERE user_id = $1 AND topic = $2",
        [user.id, data.topic],
      )
    )[0] as { id: string } | undefined;

    // Free tier: can only have 1 profile (unless updating existing)
    if (!isOwnerEmail(user.email) && user.tier === "free" && !existing) {
      const count = await getProfileCount(user.id);
      if (count >= 1) {
        return { error: "limit_reached", limit: "profiles" };
      }
    }

    const id = existing?.id ?? crypto.randomUUID();
    await d.query(
      existing
        ? "UPDATE profiles SET offering = $1, tier = $2, state_json = $3, portrait_json = COALESCE($4, portrait_json), updated_at = NOW() WHERE id = $5 AND user_id = $6"
        : "INSERT INTO profiles (id, user_id, topic, offering, tier, state_json, portrait_json) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      existing
        ? [
            data.offering,
            data.tier,
            JSON.stringify(data.state),
            data.portrait ? JSON.stringify(data.portrait) : null,
            id,
            user.id,
          ]
        : [
            id,
            user.id,
            data.topic,
            data.offering,
            data.tier,
            JSON.stringify(data.state),
            data.portrait ? JSON.stringify(data.portrait) : null,
          ],
    );
    return { id };
  });

export const listProfiles = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await requireUser();
    return getDb().query(
      "SELECT id, topic, tier, updated_at FROM profiles WHERE user_id = $1 ORDER BY updated_at DESC",
      [user.id],
    );
  },
);

export const getMeosProfiles = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await requireUser();
    const rows = (await getDb().query(
      "SELECT id, topic, tier, state_json, portrait_json, updated_at FROM profiles WHERE user_id = $1 AND offering = 'meos' ORDER BY updated_at DESC",
      [user.id],
    )) as Array<{
      id: string;
      topic: string;
      tier: string;
      state_json: string;
      portrait_json: string | null;
      updated_at: string;
    }>;
    return rows.map((row) => ({
      ...row,
      state: JSON.parse(row.state_json),
      portrait: row.portrait_json ? JSON.parse(row.portrait_json) : null,
    }));
  },
);

async function createMeosSnapshot(
  userId: string,
  profileId: string,
  source: string,
) {
  const d = getDb();
  const row = (
    await d.query(
      "SELECT state_json, portrait_json FROM profiles WHERE id = $1 AND user_id = $2 AND offering = 'meos'",
      [profileId, userId],
    )
  )[0] as { state_json: string; portrait_json: string | null } | undefined;
  if (!row) throw new Error("MeOS profile not found.");
  const version = Number(
    (
      (
        await d.query(
          "SELECT COALESCE(MAX(version), 0) + 1 AS version FROM meos_versions WHERE profile_id = $1",
          [profileId],
        )
      )[0] as { version: number }
    ).version,
  );
  await d.query(
    "INSERT INTO meos_versions (id, profile_id, user_id, version, source, state_json, portrait_json) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [
      crypto.randomUUID(),
      profileId,
      userId,
      version,
      source,
      row.state_json,
      row.portrait_json,
    ],
  );
  return version;
}

export const getHostedMeosProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({
    profileId: String((data as { profileId?: string }).profileId ?? ""),
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { requireMeos } = await import("./-entitlements.server");
    await requireMeos(user);
    const row = (
      await getDb().query(
        "SELECT id, topic, state_json, portrait_json, updated_at FROM profiles WHERE id = $1 AND user_id = $2 AND offering = 'meos'",
        [data.profileId, user.id],
      )
    )[0] as
      | {
          id: string;
          topic: string;
          state_json: string;
          portrait_json: string | null;
          updated_at: string;
        }
      | undefined;
    if (!row) throw new Error("MeOS profile not found.");
    return {
      id: row.id,
      topic: row.topic,
      state: JSON.parse(row.state_json),
      portrait: row.portrait_json ? JSON.parse(row.portrait_json) : null,
      updatedAt: row.updated_at,
    };
  });

export const syncMeosProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({
    profileId: String((data as { profileId?: string }).profileId ?? ""),
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { requireEntitlement } = await import("./-entitlements.server");
    await requireEntitlement(user, "meos_care");
    return {
      version: await createMeosSnapshot(user.id, data.profileId, "care_sync"),
    };
  });

export const getMeosVersions = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({
    profileId: String((data as { profileId?: string }).profileId ?? ""),
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { requireEntitlement } = await import("./-entitlements.server");
    await requireEntitlement(user, "meos_care");
    return getDb().query(
      "SELECT id, version, source, created_at FROM meos_versions WHERE profile_id = $1 AND user_id = $2 ORDER BY version DESC LIMIT 25",
      [data.profileId, user.id],
    );
  });

export const restoreMeosVersion = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({
    profileId: String((data as { profileId?: string }).profileId ?? ""),
    version: Number((data as { version?: number }).version),
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const { requireEntitlement } = await import("./-entitlements.server");
    await requireEntitlement(user, "meos_care");
    const row = (
      await getDb().query(
        "SELECT state_json, portrait_json FROM meos_versions WHERE profile_id = $1 AND user_id = $2 AND version = $3",
        [data.profileId, user.id, data.version],
      )
    )[0] as { state_json: string; portrait_json: string | null } | undefined;
    if (!row) throw new Error("Version not found.");
    await getDb().query(
      "UPDATE profiles SET state_json = $1, portrait_json = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4",
      [row.state_json, row.portrait_json, data.profileId, user.id],
    );
    return {
      version: await createMeosSnapshot(
        user.id,
        data.profileId,
        `restore_v${data.version}`,
      ),
    };
  });

export const saveMeosPortrait = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({
    profileId: String((data as { profileId?: string }).profileId ?? ""),
    portrait: (data as { portrait?: unknown }).portrait,
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await getDb().query(
      "UPDATE profiles SET portrait_json = $1, offering = 'meos', updated_at = NOW() WHERE id = $2 AND user_id = $3",
      [JSON.stringify(data.portrait), data.profileId, user.id],
    );
    return { success: true };
  });

export const loadProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({
    profileId: String((data as { profileId?: string }).profileId ?? ""),
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    const row = (
      await getDb().query(
        "SELECT id, topic, tier, state_json FROM profiles WHERE id = $1 AND user_id = $2",
        [data.profileId, user.id],
      )
    )[0] as
      | { id: string; topic: string; tier: string; state_json: string }
      | undefined;
    if (!row) throw new Error("Profile not found.");
    return {
      id: row.id,
      topic: row.topic,
      tier: row.tier,
      state: JSON.parse(row.state_json),
    };
  });

export const deleteProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({
    profileId: String((data as { profileId?: string }).profileId ?? ""),
  }))
  .handler(async ({ data }) => {
    const user = await requireUser();
    await getDb().query("DELETE FROM profiles WHERE id = $1 AND user_id = $2", [
      data.profileId,
      user.id,
    ]);
    return { success: true };
  });

export const autosaveInterview = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { offering?: string; topic?: string; state?: unknown };
    if (!d.offering || !d.topic || !d.state)
      throw new Error("Interview state is required.");
    return {
      offering: d.offering.trim(),
      topic: d.topic.trim(),
      state: d.state,
    };
  })
  .handler(async ({ data }) => {
    const user = await requireUser();
    await getDb().query(
      "INSERT INTO interview_drafts (user_id, offering, topic, state_json, updated_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT(user_id, offering) DO UPDATE SET topic=excluded.topic, state_json=excluded.state_json, updated_at=NOW()",
      [user.id, data.offering, data.topic, JSON.stringify(data.state)],
    );
    return { success: true };
  });

export const getInterviewDraft = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await requireUser();
    const row = (
      await getDb().query(
        "SELECT offering, topic, state_json, updated_at FROM interview_drafts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
        [user.id],
      )
    )[0] as
      | {
          offering: string;
          topic: string;
          state_json: string;
          updated_at: string;
        }
      | undefined;
    return row ? { ...row, state: JSON.parse(row.state_json) } : null;
  },
);

export const clearInterviewDraft = createServerFn({ method: "POST" }).handler(
  async () => {
    const user = await requireUser();
    await getDb().query("DELETE FROM interview_drafts WHERE user_id = $1", [
      user.id,
    ]);
    return { success: true };
  },
);

export const getOwnerMetrics = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await requireUser();
    if (user.email !== "tahlia.ashwood@gmail.com")
      throw new Error("Not authorized.");
    return await queryOwnerMetrics();
  },
);

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
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

    return {
      id: user.id,
      email: user.email,
      tier: user.tier,
      interviewCount: user.interview_count,
      isOwner: isOwnerEmail(user.email),
    };
  },
);

// ── Interview count tracking ──

export const trackInterview = createServerFn({ method: "POST" }).handler(
  async () => {
    const user = await requireUser();

    // Free tier: check interview limit before incrementing
    if (
      !isOwnerEmail(user.email) &&
      user.tier === "free" &&
      user.interview_count >= 3
    ) {
      return { error: "limit_reached", limit: "interviews" };
    }

    const newCount = await incrementInterviewCount(user.id);
    return { interviewCount: newCount, tier: user.tier };
  },
);

// ── Get user limits (for account page and app) ──

export const fetchUserLimits = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await requireUser();
    const limits = await getUserLimits(user.id);
    if (!limits) throw new Error("User not found.");
    return isOwnerEmail(user.email)
      ? {
          ...limits,
          maxProfiles: Infinity,
          maxInterviews: Infinity,
          isOwner: true,
        }
      : { ...limits, isOwner: false };
  },
);
