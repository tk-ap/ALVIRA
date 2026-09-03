import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDb } from "~/db";
import { sendEmail } from "~/email";
import { ensureFoundingBetaSchema } from "~/lib/founding-beta";

const SESSION_COOKIE = "alvira_session";

export type FoundingBetaMemberActivity = {
  user_id: string;
  email: string;
  tier: string;
  granted_at: string;
  profile_count: number;
  feedback_count: number;
  last_login_at: string | null;
  last_meaningful_at: string | null;
  last_meaningful_action: string | null;
};

export type FoundingBetaReservationActivity = {
  email: string;
  source: string;
  reserved_at: string;
  invite_sent_at: string | null;
  invite_message_id: string | null;
};

export type OwnerCohortMetrics = {
  foundingBetaCount: number;
  members: FoundingBetaMemberActivity[];
  reservations: FoundingBetaReservationActivity[];
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

async function ensureActivitySources() {
  await ensureFoundingBetaSchema();
  const db = getDb();
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
  await db.query("CREATE INDEX IF NOT EXISTS idx_bridge_tokens_user_id ON bridge_access_tokens(user_id)");
  await db.query("ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ");
  await db.query("ALTER TABLE founding_beta_reservations ADD COLUMN IF NOT EXISTS invite_message_id TEXT");
}

export const getOwnerCohortMetrics = createServerFn({ method: "GET" }).handler(async (): Promise<OwnerCohortMetrics> => {
  await requireOwner();
  await ensureActivitySources();
  const db = getDb();

  const [members, reservations] = await Promise.all([
    db.query(`
      SELECT
        u.id AS user_id,
        u.email,
        u.tier,
        f.granted_at,
        COALESCE(pc.profile_count, 0)::int AS profile_count,
        COALESCE(bf.feedback_count, 0)::int AS feedback_count,
        ll.last_login_at,
        ma.last_meaningful_at,
        ma.last_meaningful_action
      FROM founding_beta_access f
      JOIN users u ON u.id = f.user_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS profile_count
        FROM profiles p
        WHERE p.user_id = u.id
      ) pc ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS feedback_count
        FROM beta_feedback b
        WHERE b.user_id = u.id
      ) bf ON TRUE
      LEFT JOIN LATERAL (
        SELECT MAX(s.created_at) AS last_login_at
        FROM sessions s
        WHERE s.user_id = u.id
      ) ll ON TRUE
      LEFT JOIN LATERAL (
        SELECT activity_at AS last_meaningful_at, action AS last_meaningful_action
        FROM (
          SELECT p.updated_at AS activity_at,
                 CASE WHEN p.offering = 'meos' THEN 'Reflect updated' ELSE 'Context saved / updated' END AS action
            FROM profiles p
           WHERE p.user_id = u.id
          UNION ALL
          SELECT d.updated_at AS activity_at, 'Interview progress' AS action
            FROM interview_drafts d
           WHERE d.user_id = u.id
          UNION ALL
          SELECT t.created_at AS activity_at, 'Bridge connected' AS action
            FROM bridge_access_tokens t
           WHERE t.user_id = u.id
          UNION ALL
          SELECT e.created_at AS activity_at,
                 CASE e.name
                   WHEN 'interview_started' THEN 'Interview started'
                   WHEN 'interview_completed' THEN 'Interview completed'
                   WHEN 'export_performed' THEN 'Context exported / reused'
                   WHEN 'context_updated' THEN 'Context updated'
                   WHEN 'reflect_completed' THEN 'Reflect completed'
                   WHEN 'reuse_performed' THEN 'Context reused'
                   WHEN 'dossier_built' THEN 'Dossier built'
                   WHEN 'bridge_connected' THEN 'Bridge connected'
                   ELSE 'Product progress'
                 END AS action
            FROM events e
           WHERE e.user_id = u.id
             AND e.name IN (
               'interview_started', 'interview_completed', 'export_performed',
               'context_updated', 'reflect_completed', 'reuse_performed',
               'dossier_built', 'bridge_connected'
             )
        ) activity
        ORDER BY activity_at DESC
        LIMIT 1
      ) ma ON TRUE
      ORDER BY COALESCE(ma.last_meaningful_at, ll.last_login_at, f.granted_at) DESC
    `),
    db.query(`
      SELECT email, source, reserved_at, invite_sent_at, invite_message_id
      FROM founding_beta_reservations
      WHERE claimed_at IS NULL AND revoked_at IS NULL
      ORDER BY reserved_at ASC
    `),
  ]);

  return {
    foundingBetaCount: members.length,
    members: members as FoundingBetaMemberActivity[],
    reservations: reservations as FoundingBetaReservationActivity[],
  };
});

export const sendFoundingBetaReservationInvite = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const email = String((input as { email?: string })?.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("A valid reserved email is required.");
    return { email };
  })
  .handler(async ({ data }) => {
    await requireOwner();
    await ensureActivitySources();
    const db = getDb();
    const reservation = (await db.query(
      `SELECT email FROM founding_beta_reservations
       WHERE email=$1 AND claimed_at IS NULL AND revoked_at IS NULL AND invite_sent_at IS NULL
       LIMIT 1`,
      [data.email],
    ))[0] as { email: string } | undefined;
    if (!reservation) throw new Error("This reservation is no longer eligible for an initial invitation.");

    const siteUrl = (process.env.PUBLIC_SITE_URL || "https://alviratech.vercel.app").replace(/\/$/, "");
    const receipt = await sendEmail({
      to: reservation.email,
      subject: "Your ALVIRA Founding Beta access is ready",
      text: `Hi there,\n\nYou received a reserved place in ALVIRA’s Founding Beta.\n\nThe interface is now ready for you to create your account and use your complimentary Founding Beta access.\n\nCreate your account using this same email address:\n${siteUrl}/signup\n\nOnce you sign up, your Founding Beta access will be applied automatically.\n\nALVIRA helps you give AI the context it usually starts without, so tools like ChatGPT and Claude can understand you better and be more useful in ways that actually fit your life, work, and goals.\n\nIf anything is confusing, or you want help getting started, just reply to this email.\n\n— ALVIRA`,
      replyTo: "alvira@agentmail.to",
    });
    if (receipt.provider !== "agentmail") throw new Error(`Expected AgentMail delivery; got ${receipt.provider}.`);

    const sentAt = new Date().toISOString();
    const updated = await db.query(
      `UPDATE founding_beta_reservations
       SET invite_sent_at=$2, invite_message_id=$3
       WHERE email=$1 AND claimed_at IS NULL AND revoked_at IS NULL AND invite_sent_at IS NULL
       RETURNING email`,
      [reservation.email, sentAt, receipt.messageId ?? null],
    );
    if (!updated[0]) throw new Error("Reservation changed while the invitation was being sent. Review its status before retrying.");

    return { ok: true, sentAt, messageId: receipt.messageId ?? null };
  });
