import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDb } from "~/db";
import { ensureFoundingBetaSchema } from "~/lib/founding-beta";

const SESSION_COOKIE = "alvira_session";

type NewSignup = { email: string; tier: string; created_at: string };

export type OwnerOperatingBrief = {
  since: string;
  firstBrief: boolean;
  changes: {
    newSignupCount: number;
    newSignups: NewSignup[];
    newFoundingBetaCount: number;
    newFeedbackCount: number;
    newlyMeaningfulUsers: number;
  };
  health: {
    signups7d: number;
    meaningfulUsers7d: number;
    meaningfulUsers30d: number;
    contextsUpdated7d: number;
    interviewsStarted7d: number;
    interviewsCompleted7d: number;
    interviewCompletionRate7d: number | null;
    foundingBetaTotal: number;
    foundingBetaActive7d: number;
    foundingBetaDormant14d: number;
    foundingBetaActivated: number;
    foundingBetaActivationRate: number | null;
    foundingBetaFeedbackContributors: number;
  };
};

async function requireOwner() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Authentication required.");
  const db = getDb();
  const row = (await db.query(
    `SELECT u.id, u.email
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = $1 AND s.expires_at > NOW()
      LIMIT 1`,
    [token],
  ))[0] as { id: string; email: string } | undefined;
  if (!row) throw new Error("Authentication required.");
  const ownerEmail = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com").trim().toLowerCase();
  if (row.email.trim().toLowerCase() !== ownerEmail) throw new Error("Owner access required.");
  return row;
}

async function ensureOwnerBriefSchema() {
  await ensureFoundingBetaSchema();
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS owner_dashboard_state (
      owner_user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS bridge_access_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'context:read profile:read',
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    )
  `);
}

export const getOwnerOperatingBrief = createServerFn({ method: "GET" }).handler(async (): Promise<OwnerOperatingBrief> => {
  const owner = await requireOwner();
  await ensureOwnerBriefSchema();
  const db = getDb();
  const state = (await db.query("SELECT last_seen_at FROM owner_dashboard_state WHERE owner_user_id = $1", [owner.id]))[0] as { last_seen_at: string } | undefined;
  const firstBrief = !state;
  const since = state?.last_seen_at ?? new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [newSignups, changeCounts, healthRows] = await Promise.all([
    db.query(
      `SELECT email, tier, created_at
         FROM users
        WHERE created_at > $1
          AND LOWER(email) <> LOWER($2)
        ORDER BY created_at DESC
        LIMIT 8`,
      [since, owner.email],
    ) as Promise<NewSignup[]>,
    db.query(
      `SELECT
         (SELECT COUNT(*)::int FROM users WHERE created_at > $1 AND LOWER(email) <> LOWER($2)) AS new_signups,
         (SELECT COUNT(*)::int FROM founding_beta_access WHERE granted_at > $1) AS new_beta,
         (SELECT COUNT(*)::int FROM beta_feedback WHERE created_at > $1) AS new_feedback,
         (SELECT COUNT(DISTINCT user_id)::int FROM (
            SELECT user_id FROM profiles WHERE updated_at > $1
            UNION ALL SELECT user_id FROM interview_drafts WHERE updated_at > $1
            UNION ALL SELECT user_id FROM bridge_access_tokens WHERE created_at > $1
            UNION ALL SELECT user_id FROM events WHERE created_at > $1 AND user_id IS NOT NULL AND name IN (
              'interview_started','interview_completed','export_performed','context_updated',
              'reflect_completed','reuse_performed','dossier_built','bridge_connected'
            )
          ) x) AS meaningful_users`,
      [since, owner.email],
    ) as Promise<Array<{ new_signups: number; new_beta: number; new_feedback: number; meaningful_users: number }>>,
    db.query(`
      WITH meaningful AS (
        SELECT user_id, updated_at AS activity_at FROM profiles
        UNION ALL SELECT user_id, updated_at FROM interview_drafts
        UNION ALL SELECT user_id, created_at FROM bridge_access_tokens
        UNION ALL SELECT user_id, created_at FROM events
          WHERE user_id IS NOT NULL AND name IN (
            'interview_started','interview_completed','export_performed','context_updated',
            'reflect_completed','reuse_performed','dossier_built','bridge_connected'
          )
      ), beta_activity AS (
        SELECT f.user_id, f.granted_at, MAX(m.activity_at) AS last_meaningful_at
          FROM founding_beta_access f
          LEFT JOIN meaningful m ON m.user_id = f.user_id AND m.activity_at >= f.granted_at
         GROUP BY f.user_id, f.granted_at
      )
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE created_at >= NOW() - INTERVAL '7 days') AS signups_7d,
        (SELECT COUNT(DISTINCT user_id)::int FROM meaningful WHERE activity_at >= NOW() - INTERVAL '7 days') AS meaningful_7d,
        (SELECT COUNT(DISTINCT user_id)::int FROM meaningful WHERE activity_at >= NOW() - INTERVAL '30 days') AS meaningful_30d,
        (SELECT COUNT(*)::int FROM profiles WHERE updated_at >= NOW() - INTERVAL '7 days') AS contexts_updated_7d,
        (SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id))::int FROM events WHERE name = 'interview_started' AND created_at >= NOW() - INTERVAL '7 days') AS interviews_started_7d,
        (SELECT COUNT(DISTINCT COALESCE(user_id, anonymous_id))::int FROM events WHERE name = 'interview_completed' AND created_at >= NOW() - INTERVAL '7 days') AS interviews_completed_7d,
        (SELECT COUNT(*)::int FROM founding_beta_access) AS beta_total,
        (SELECT COUNT(*)::int FROM beta_activity WHERE last_meaningful_at >= NOW() - INTERVAL '7 days') AS beta_active_7d,
        (SELECT COUNT(*)::int FROM beta_activity WHERE granted_at <= NOW() - INTERVAL '14 days' AND (last_meaningful_at IS NULL OR last_meaningful_at < NOW() - INTERVAL '14 days')) AS beta_dormant_14d,
        (SELECT COUNT(*)::int FROM beta_activity WHERE last_meaningful_at IS NOT NULL) AS beta_activated,
        (SELECT COUNT(DISTINCT user_id)::int FROM beta_feedback) AS beta_feedback_contributors
    `) as Promise<Array<Record<string, number>>>,
  ]);

  const changes = changeCounts[0] ?? { new_signups: 0, new_beta: 0, new_feedback: 0, meaningful_users: 0 };
  const h = healthRows[0] ?? {};
  const started = Number(h.interviews_started_7d ?? 0);
  const completed = Number(h.interviews_completed_7d ?? 0);
  const betaTotal = Number(h.beta_total ?? 0);
  const betaActivated = Number(h.beta_activated ?? 0);

  await db.query(
    `INSERT INTO owner_dashboard_state (owner_user_id, last_seen_at)
     VALUES ($1, NOW())
     ON CONFLICT (owner_user_id) DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at`,
    [owner.id],
  );

  return {
    since,
    firstBrief,
    changes: {
      newSignupCount: Number(changes.new_signups ?? 0),
      newSignups,
      newFoundingBetaCount: Number(changes.new_beta ?? 0),
      newFeedbackCount: Number(changes.new_feedback ?? 0),
      newlyMeaningfulUsers: Number(changes.meaningful_users ?? 0),
    },
    health: {
      signups7d: Number(h.signups_7d ?? 0),
      meaningfulUsers7d: Number(h.meaningful_7d ?? 0),
      meaningfulUsers30d: Number(h.meaningful_30d ?? 0),
      contextsUpdated7d: Number(h.contexts_updated_7d ?? 0),
      interviewsStarted7d: started,
      interviewsCompleted7d: completed,
      interviewCompletionRate7d: started > 0 ? Math.round((completed / started) * 100) : null,
      foundingBetaTotal: betaTotal,
      foundingBetaActive7d: Number(h.beta_active_7d ?? 0),
      foundingBetaDormant14d: Number(h.beta_dormant_14d ?? 0),
      foundingBetaActivated: betaActivated,
      foundingBetaActivationRate: betaTotal > 0 ? Math.round((betaActivated / betaTotal) * 100) : null,
      foundingBetaFeedbackContributors: Number(h.beta_feedback_contributors ?? 0),
    },
  };
});
