import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDb } from "~/db";
import { sendEmail } from "~/email";
import { ensureFoundingBetaSchema } from "~/lib/founding-beta";

const SESSION_COOKIE = "alvira_session";
const TEST_EMAILS = ["codex-smoke-1786676512909@example.com", "alvira@agentmail.to"];

type InterviewFollowUpKind = "interview_not_started" | "interview_incomplete";

export type OwnerDashboardDepth = {
  commercial: {
    customerAccounts: number;
    paidAccounts: number;
    proAccounts: number;
    lifetimeAccounts: number;
    paidConversionRate: number | null;
    revenueLedgerInstrumented: false;
  };
  interventions: Array<{
    userId: string;
    email: string;
    reason: string;
    ageDays: number;
    severity: "attention" | "risk";
    followUpKind: InterviewFollowUpKind | null;
    lastFollowUpAt: string | null;
    followUpCount: number;
  }>;
  adoption: {
    activeUsers30d: number;
    contextUsers30d: number;
    reflectUsers30d: number;
    bridgeUsers30d: number;
    exportUsers30d: number;
  };
  feedback: {
    total30d: number;
    blockers30d: number;
    majors30d: number;
    confusing30d: number;
    broke30d: number;
    pendingApplications: number;
    betaMembersWithoutFeedback: number;
  };
  telemetry: {
    persistedRuntimeErrorLedger: false;
    note: string;
  };
};

async function requireOwner() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("Authentication required.");
  const db = getDb();
  const row = (await db.query(
    `SELECT u.id, u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires_at>NOW() LIMIT 1`,
    [token],
  ))[0] as { id: string; email: string } | undefined;
  if (!row) throw new Error("Authentication required.");
  const ownerEmail = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com").trim().toLowerCase();
  if (row.email.trim().toLowerCase() !== ownerEmail) throw new Error("Owner access required.");
  return { ...row, ownerEmail };
}

async function ensureSources() {
  await ensureFoundingBetaSchema();
  const db = getDb();
  await db.query(`CREATE TABLE IF NOT EXISTS founding_beta_applications (
    id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT, use_case TEXT NOT NULL, ai_tools TEXT,
    ai_frequency TEXT NOT NULL, feedback_commitment TEXT NOT NULL, motivation TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'alvira', status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS bridge_access_tokens (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL, scope TEXT NOT NULL DEFAULT 'context:read profile:read',
    expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), revoked_at TIMESTAMPTZ
  )`);
  await db.query(`CREATE TABLE IF NOT EXISTS lifecycle_email_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    kind TEXT NOT NULL,
    message_id TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL
  )`);
  await db.query("CREATE INDEX IF NOT EXISTS idx_lifecycle_email_events_user_kind_sent ON lifecycle_email_events(user_id, kind, sent_at DESC)");
}

export const getOwnerDashboardDepth = createServerFn({ method: "GET" }).handler(async (): Promise<OwnerDashboardDepth> => {
  const owner = await requireOwner();
  await ensureSources();
  const db = getDb();
  const excluded = [owner.ownerEmail, ...TEST_EMAILS];

  const [commercialRows, interventionRows, adoptionRows, feedbackRows] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*) FILTER (WHERE LOWER(email) <> ALL($1::text[]))::int AS customer_accounts,
        COUNT(*) FILTER (WHERE LOWER(email) <> ALL($1::text[]) AND tier IN ('pro','lifetime'))::int AS paid_accounts,
        COUNT(*) FILTER (WHERE LOWER(email) <> ALL($1::text[]) AND tier='pro')::int AS pro_accounts,
        COUNT(*) FILTER (WHERE LOWER(email) <> ALL($1::text[]) AND tier='lifetime')::int AS lifetime_accounts
      FROM users`, [excluded]),
    db.query(`
      WITH last_progress AS (
        SELECT user_id, MAX(at) AS last_at FROM (
          SELECT user_id, updated_at AS at FROM profiles
          UNION ALL SELECT user_id, updated_at FROM interview_drafts
          UNION ALL SELECT user_id, created_at FROM bridge_access_tokens
          UNION ALL SELECT user_id, created_at FROM events WHERE user_id IS NOT NULL AND name IN (
            'interview_started','interview_completed','export_performed','context_updated','reflect_completed','reuse_performed','dossier_built','bridge_connected'
          )
        ) q GROUP BY user_id
      ), profile_counts AS (
        SELECT user_id, COUNT(*)::int AS count FROM profiles GROUP BY user_id
      ), draft_age AS (
        SELECT user_id, MAX(updated_at) AS updated_at FROM interview_drafts GROUP BY user_id
      )
      SELECT u.id AS user_id, u.email,
        CASE
          WHEN bf.severity='blocker' THEN 'Founding Beta blocker feedback needs review'
          WHEN da.updated_at IS NOT NULL AND COALESCE(pc.count,0)=0 AND da.updated_at < NOW()-INTERVAL '3 days' THEN 'Interview started but no Context saved'
          WHEN COALESCE(pc.count,0)=0 AND da.updated_at IS NULL AND u.created_at < NOW()-INTERVAL '1 day' THEN 'Signed up but has not started building Context'
          WHEN f.user_id IS NOT NULL AND lp.last_at < NOW()-INTERVAL '14 days' THEN 'Founding Beta member is dormant'
          ELSE NULL
        END AS reason,
        CASE
          WHEN da.updated_at IS NOT NULL AND COALESCE(pc.count,0)=0 AND da.updated_at < NOW()-INTERVAL '3 days' THEN 'interview_incomplete'
          WHEN COALESCE(pc.count,0)=0 AND da.updated_at IS NULL AND u.created_at < NOW()-INTERVAL '1 day' THEN 'interview_not_started'
          ELSE NULL
        END AS follow_up_kind,
        FLOOR(EXTRACT(EPOCH FROM (NOW()-COALESCE(lp.last_at, da.updated_at, u.created_at)))/86400)::int AS age_days,
        CASE WHEN bf.severity='blocker' OR (f.user_id IS NOT NULL AND lp.last_at < NOW()-INTERVAL '14 days') THEN 'risk' ELSE 'attention' END AS severity,
        lf.last_follow_up_at,
        COALESCE(lf.follow_up_count,0)::int AS follow_up_count
      FROM users u
      LEFT JOIN last_progress lp ON lp.user_id=u.id
      LEFT JOIN profile_counts pc ON pc.user_id=u.id
      LEFT JOIN draft_age da ON da.user_id=u.id
      LEFT JOIN founding_beta_access f ON f.user_id=u.id
      LEFT JOIN LATERAL (
        SELECT severity FROM beta_feedback b WHERE b.user_id=u.id AND b.created_at>=NOW()-INTERVAL '30 days' ORDER BY b.created_at DESC LIMIT 1
      ) bf ON TRUE
      LEFT JOIN LATERAL (
        SELECT MAX(sent_at) AS last_follow_up_at, COUNT(*)::int AS follow_up_count
        FROM lifecycle_email_events le
        WHERE le.user_id=u.id AND le.kind IN ('interview_not_started','interview_incomplete')
      ) lf ON TRUE
      WHERE LOWER(u.email) <> ALL($1::text[])
        AND (
          bf.severity='blocker'
          OR (da.updated_at IS NOT NULL AND COALESCE(pc.count,0)=0 AND da.updated_at < NOW()-INTERVAL '3 days')
          OR (COALESCE(pc.count,0)=0 AND da.updated_at IS NULL AND u.created_at < NOW()-INTERVAL '1 day')
          OR (f.user_id IS NOT NULL AND lp.last_at < NOW()-INTERVAL '14 days')
        )
      ORDER BY CASE WHEN bf.severity='blocker' THEN 0 WHEN f.user_id IS NOT NULL THEN 1 ELSE 2 END, age_days DESC
      LIMIT 12`, [excluded]),
    db.query(`
      WITH meaningful AS (
        SELECT user_id, updated_at AS at FROM profiles
        UNION ALL SELECT user_id, updated_at FROM interview_drafts
        UNION ALL SELECT user_id, created_at FROM bridge_access_tokens
        UNION ALL SELECT user_id, created_at FROM events WHERE user_id IS NOT NULL AND name IN (
          'interview_started','interview_completed','export_performed','context_updated','reflect_completed','reuse_performed','dossier_built','bridge_connected'
        )
      )
      SELECT
        (SELECT COUNT(DISTINCT m.user_id)::int FROM meaningful m JOIN users u ON u.id=m.user_id WHERE m.at>=NOW()-INTERVAL '30 days' AND LOWER(u.email)<>ALL($1::text[])) AS active_users_30d,
        (SELECT COUNT(DISTINCT p.user_id)::int FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.updated_at>=NOW()-INTERVAL '30 days' AND LOWER(u.email)<>ALL($1::text[])) AS context_users_30d,
        (SELECT COUNT(DISTINCT p.user_id)::int FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.offering='meos' AND p.updated_at>=NOW()-INTERVAL '30 days' AND LOWER(u.email)<>ALL($1::text[])) AS reflect_users_30d,
        (SELECT COUNT(DISTINCT b.user_id)::int FROM bridge_access_tokens b JOIN users u ON u.id=b.user_id WHERE b.created_at>=NOW()-INTERVAL '30 days' AND LOWER(u.email)<>ALL($1::text[])) AS bridge_users_30d,
        (SELECT COUNT(DISTINCT e.user_id)::int FROM events e JOIN users u ON u.id=e.user_id WHERE e.name='export_performed' AND e.created_at>=NOW()-INTERVAL '30 days' AND LOWER(u.email)<>ALL($1::text[])) AS export_users_30d`, [excluded]),
    db.query(`
      SELECT
        COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '30 days')::int AS total_30d,
        COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '30 days' AND severity='blocker')::int AS blockers_30d,
        COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '30 days' AND severity='major')::int AS majors_30d,
        COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '30 days' AND signal='confusing')::int AS confusing_30d,
        COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '30 days' AND signal='broke')::int AS broke_30d,
        (SELECT COUNT(*)::int FROM founding_beta_applications WHERE status='pending') AS pending_applications,
        (SELECT COUNT(*)::int FROM founding_beta_access f WHERE NOT EXISTS (SELECT 1 FROM beta_feedback b WHERE b.user_id=f.user_id)) AS beta_without_feedback
      FROM beta_feedback`),
  ]);

  const c = (commercialRows[0] ?? {}) as Record<string, number>;
  const a = (adoptionRows[0] ?? {}) as Record<string, number>;
  const f = (feedbackRows[0] ?? {}) as Record<string, number>;
  const customerAccounts = Number(c.customer_accounts ?? 0);
  const paidAccounts = Number(c.paid_accounts ?? 0);

  return {
    commercial: {
      customerAccounts,
      paidAccounts,
      proAccounts: Number(c.pro_accounts ?? 0),
      lifetimeAccounts: Number(c.lifetime_accounts ?? 0),
      paidConversionRate: customerAccounts > 0 ? Math.round((paidAccounts / customerAccounts) * 100) : null,
      revenueLedgerInstrumented: false,
    },
    interventions: (interventionRows as Array<Record<string, unknown>>).map((row) => ({
      userId: String(row.user_id),
      email: String(row.email),
      reason: String(row.reason),
      ageDays: Number(row.age_days ?? 0),
      severity: row.severity === 'risk' ? 'risk' : 'attention',
      followUpKind: row.follow_up_kind === 'interview_incomplete' || row.follow_up_kind === 'interview_not_started'
        ? row.follow_up_kind
        : null,
      lastFollowUpAt: row.last_follow_up_at ? String(row.last_follow_up_at) : null,
      followUpCount: Number(row.follow_up_count ?? 0),
    })),
    adoption: {
      activeUsers30d: Number(a.active_users_30d ?? 0),
      contextUsers30d: Number(a.context_users_30d ?? 0),
      reflectUsers30d: Number(a.reflect_users_30d ?? 0),
      bridgeUsers30d: Number(a.bridge_users_30d ?? 0),
      exportUsers30d: Number(a.export_users_30d ?? 0),
    },
    feedback: {
      total30d: Number(f.total_30d ?? 0),
      blockers30d: Number(f.blockers_30d ?? 0),
      majors30d: Number(f.majors_30d ?? 0),
      confusing30d: Number(f.confusing_30d ?? 0),
      broke30d: Number(f.broke_30d ?? 0),
      pendingApplications: Number(f.pending_applications ?? 0),
      betaMembersWithoutFeedback: Number(f.beta_without_feedback ?? 0),
    },
    telemetry: {
      persistedRuntimeErrorLedger: false,
      note: "Vercel/runtime, email-delivery, auth-diagnostic, and export failures are not yet persisted in one product-owned incident ledger. Do not infer system health from missing error rows.",
    },
  };
});

export const sendInterviewFollowUp = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const email = String((input as { email?: string })?.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("A valid customer email is required.");
    return { email };
  })
  .handler(async ({ data }) => {
    const owner = await requireOwner();
    await ensureSources();
    const db = getDb();
    const excluded = [owner.ownerEmail, ...TEST_EMAILS];

    const target = (await db.query(`
      WITH profile_counts AS (
        SELECT user_id, COUNT(*)::int AS count FROM profiles GROUP BY user_id
      ), draft_age AS (
        SELECT user_id, MAX(updated_at) AS updated_at FROM interview_drafts GROUP BY user_id
      )
      SELECT u.id, u.email,
        CASE
          WHEN da.updated_at IS NOT NULL AND COALESCE(pc.count,0)=0 AND da.updated_at < NOW()-INTERVAL '3 days' THEN 'interview_incomplete'
          WHEN COALESCE(pc.count,0)=0 AND da.updated_at IS NULL AND u.created_at < NOW()-INTERVAL '1 day' THEN 'interview_not_started'
          ELSE NULL
        END AS kind
      FROM users u
      LEFT JOIN profile_counts pc ON pc.user_id=u.id
      LEFT JOIN draft_age da ON da.user_id=u.id
      WHERE LOWER(u.email)=$1
        AND LOWER(u.email) <> ALL($2::text[])
      LIMIT 1`, [data.email, excluded]))[0] as { id: string; email: string; kind: InterviewFollowUpKind | null } | undefined;

    if (!target?.kind) throw new Error("This user no longer qualifies for an incomplete-interview follow-up.");

    const recent = (await db.query(
      `SELECT sent_at FROM lifecycle_email_events
       WHERE user_id=$1 AND kind IN ('interview_not_started','interview_incomplete')
         AND sent_at > NOW()-INTERVAL '5 minutes'
       ORDER BY sent_at DESC LIMIT 1`,
      [target.id],
    ))[0] as { sent_at: string } | undefined;
    if (recent) throw new Error("A follow-up was just sent to this user. Wait before sending another.");

    const siteUrl = (process.env.PUBLIC_SITE_URL || "https://alviratech.vercel.app").replace(/\/$/, "");
    const subject = "Finish building your ALVIRA Context";
    const text = target.kind === "interview_incomplete"
      ? `Hi there,\n\nYou started building your ALVIRA Context, but it looks like you haven't finished it yet. Your progress is saved, so you can pick up where you left off.\n\nContinue your Context here:\n${siteUrl}/app\n\nFinishing your first Context gets you to the part that makes ALVIRA useful: reusable context you can bring to tools like ChatGPT and Claude so they can understand you better and help in ways that fit your life, work, and goals.\n\nIf anything was confusing or got in your way, just reply to this email.\n\n— ALVIRA`
      : `Hi there,\n\nYou created an ALVIRA account, but it looks like you haven't started your first Context yet.\n\nStart building your Context here:\n${siteUrl}/app\n\nYour first Context gives tools like ChatGPT and Claude the background they usually start without, so they can understand you better and help in ways that fit your life, work, and goals.\n\nIf anything is confusing or you want help getting started, just reply to this email.\n\n— ALVIRA`;

    const receipt = await sendEmail({
      to: target.email,
      subject,
      text,
      replyTo: "alvira@agentmail.to",
    });
    if (receipt.provider !== "agentmail") throw new Error(`Expected AgentMail delivery; got ${receipt.provider}.`);

    const sentAt = new Date().toISOString();
    await db.query(
      `INSERT INTO lifecycle_email_events (id, user_id, email, kind, message_id, sent_at, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [crypto.randomUUID(), target.id, target.email, target.kind, receipt.messageId ?? null, sentAt, owner.id],
    );

    return { ok: true, sentAt, messageId: receipt.messageId ?? null };
  });
