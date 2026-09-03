import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDb } from "~/db";
import { sendEmail } from "~/email";
import {
  ensureFoundingBetaSchema,
  FOUNDING_BETA_PERMANENT_EXPIRY,
  normalizeFoundingBetaEmail,
} from "~/lib/founding-beta";

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

export type FoundingBetaApplicationActivity = {
  id: string;
  email: string;
  name: string | null;
  use_case: string;
  ai_tools: string | null;
  ai_frequency: string;
  feedback_commitment: string;
  motivation: string;
  source: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
  reviewed_at: string | null;
  entitlement_mode: "account" | "reservation" | "none" | null;
  decision_email_sent_at: string | null;
  decision_message_id: string | null;
  decision_email_error: string | null;
};

export type OwnerCohortMetrics = {
  foundingBetaCount: number;
  members: FoundingBetaMemberActivity[];
  reservations: FoundingBetaReservationActivity[];
  applications: FoundingBetaApplicationActivity[];
  recentApplicationDecisions: FoundingBetaApplicationActivity[];
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
  await db.query(`
    CREATE TABLE IF NOT EXISTS founding_beta_applications (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      use_case TEXT NOT NULL,
      ai_tools TEXT,
      ai_frequency TEXT NOT NULL,
      feedback_commitment TEXT NOT NULL,
      motivation TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'alvira',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query("ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ");
  await db.query("ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS reviewed_by TEXT");
  await db.query("ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS entitlement_mode TEXT");
  await db.query("ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS decision_email_sent_at TIMESTAMPTZ");
  await db.query("ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS decision_message_id TEXT");
  await db.query("ALTER TABLE founding_beta_applications ADD COLUMN IF NOT EXISTS decision_email_error TEXT");
  await db.query("CREATE INDEX IF NOT EXISTS idx_founding_beta_applications_pending ON founding_beta_applications(created_at DESC) WHERE status='pending'");
}

const APPLICATION_COLUMNS = `id, email, name, use_case, ai_tools, ai_frequency, feedback_commitment, motivation,
  source, status, created_at, reviewed_at, entitlement_mode, decision_email_sent_at, decision_message_id, decision_email_error`;

export const getOwnerCohortMetrics = createServerFn({ method: "GET" }).handler(async (): Promise<OwnerCohortMetrics> => {
  await requireOwner();
  await ensureActivitySources();
  const db = getDb();

  const [members, reservations, applications, recentApplicationDecisions] = await Promise.all([
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
    db.query(`SELECT ${APPLICATION_COLUMNS} FROM founding_beta_applications WHERE status='pending' ORDER BY created_at ASC`),
    db.query(`SELECT ${APPLICATION_COLUMNS} FROM founding_beta_applications WHERE status IN ('approved','denied') ORDER BY reviewed_at DESC NULLS LAST LIMIT 8`),
  ]);

  return {
    foundingBetaCount: members.length,
    members: members as FoundingBetaMemberActivity[],
    reservations: reservations as FoundingBetaReservationActivity[],
    applications: applications as FoundingBetaApplicationActivity[],
    recentApplicationDecisions: recentApplicationDecisions as FoundingBetaApplicationActivity[],
  };
});

export function buildFoundingBetaDecisionEmail(input: {
  decision: "approve" | "deny";
  name?: string | null;
  hasAccount: boolean;
  siteUrl?: string;
}) {
  const siteUrl = (input.siteUrl || "https://alviratech.vercel.app").replace(/\/$/, "");
  const greeting = input.name?.trim() ? `Hi ${input.name.trim()},` : "Hi there,";
  if (input.decision === "approve") {
    const nextStep = input.hasAccount
      ? `Your complimentary Founding Beta access is now active. Continue in ALVIRA here:\n${siteUrl}/app`
      : `Your complimentary Founding Beta place is now reserved. Create your account using the same email address you applied with:\n${siteUrl}/signup\n\nYour Founding Beta access will be applied automatically when you sign up.`;
    return {
      subject: "You’re approved for ALVIRA Founding Beta",
      text: `${greeting}\n\nYour application for ALVIRA’s Founding Beta has been approved.\n\n${nextStep}\n\nIf anything is confusing, or you want help getting started, just reply to this email.\n\n— ALVIRA`,
    };
  }
  return {
    subject: "Update on your ALVIRA Founding Beta application",
    text: `${greeting}\n\nThank you for applying to ALVIRA’s Founding Beta. We’re keeping this early group intentionally small, and we aren’t able to offer a Founding Beta place for this application right now.\n\nWe appreciate the time you took to tell us how you hoped to use ALVIRA. If you have any questions, you can reply directly to this email.\n\n— ALVIRA`,
  };
}

async function sendApplicationDecisionEmail(application: FoundingBetaApplicationActivity) {
  const hasAccount = application.entitlement_mode === "account";
  const copy = buildFoundingBetaDecisionEmail({
    decision: application.status === "approved" ? "approve" : "deny",
    name: application.name,
    hasAccount,
    siteUrl: process.env.PUBLIC_SITE_URL,
  });
  const receipt = await sendEmail({
    to: application.email,
    subject: copy.subject,
    text: copy.text,
    replyTo: "alvira@agentmail.to",
  });
  if (receipt.provider !== "agentmail") throw new Error(`Expected AgentMail delivery; got ${receipt.provider}.`);
  return receipt;
}

export const reviewFoundingBetaApplication = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { applicationId?: string; decision?: string };
    const applicationId = String(d.applicationId ?? "").trim();
    if (!applicationId) throw new Error("Application ID is required.");
    if (d.decision !== "approve" && d.decision !== "deny") throw new Error("Decision must be approve or deny.");
    return { applicationId, decision: d.decision as "approve" | "deny" };
  })
  .handler(async ({ data }) => {
    const owner = await requireOwner();
    await ensureActivitySources();
    const db = getDb();
    const application = (await db.query(
      `SELECT ${APPLICATION_COLUMNS} FROM founding_beta_applications WHERE id=$1 AND status='pending' LIMIT 1`,
      [data.applicationId],
    ))[0] as FoundingBetaApplicationActivity | undefined;
    if (!application) throw new Error("This application has already been reviewed or no longer exists.");

    let entitlementMode: "account" | "reservation" | "none" = "none";
    if (data.decision === "approve") {
      const normalizedEmail = normalizeFoundingBetaEmail(application.email);
      const user = (await db.query(
        `SELECT id, email, tier FROM users WHERE LOWER(TRIM(email))=$1 LIMIT 1`,
        [normalizedEmail],
      ))[0] as { id: string; email: string; tier: string } | undefined;

      if (user) {
        entitlementMode = "account";
        await db.transaction([
          db.query(
            `INSERT INTO founding_beta_access (user_id, previous_tier, expires_at)
             VALUES ($1, CASE WHEN $2='founding_beta' THEN 'free' ELSE $2 END, $3::timestamptz)
             ON CONFLICT (user_id) DO UPDATE SET expires_at=EXCLUDED.expires_at`,
            [user.id, user.tier, FOUNDING_BETA_PERMANENT_EXPIRY],
          ),
          db.query(`UPDATE users SET tier='founding_beta' WHERE id=$1 AND tier='free'`, [user.id]),
          db.query(
            `UPDATE founding_beta_reservations
             SET claimed_at=COALESCE(claimed_at, NOW()), claimed_user_id=COALESCE(claimed_user_id, $2)
             WHERE email=$1 AND revoked_at IS NULL`,
            [normalizedEmail, user.id],
          ),
          db.query(
            `UPDATE founding_beta_applications
             SET status='approved', reviewed_at=NOW(), reviewed_by=$2, entitlement_mode='account', decision_email_error=NULL
             WHERE id=$1 AND status='pending'`,
            [application.id, owner.id],
          ),
        ]);
      } else {
        entitlementMode = "reservation";
        const reservationSource = `application:${application.source || "alvira"}`.slice(0, 120);
        await db.transaction([
          db.query(
            `INSERT INTO founding_beta_reservations (email, source, reserved_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (email) DO UPDATE
               SET source=EXCLUDED.source, revoked_at=NULL
             WHERE founding_beta_reservations.claimed_at IS NULL`,
            [normalizedEmail, reservationSource],
          ),
          db.query(
            `UPDATE founding_beta_applications
             SET status='approved', reviewed_at=NOW(), reviewed_by=$2, entitlement_mode='reservation', decision_email_error=NULL
             WHERE id=$1 AND status='pending'`,
            [application.id, owner.id],
          ),
        ]);
      }
    } else {
      await db.query(
        `UPDATE founding_beta_applications
         SET status='denied', reviewed_at=NOW(), reviewed_by=$2, entitlement_mode='none', decision_email_error=NULL
         WHERE id=$1 AND status='pending'`,
        [application.id, owner.id],
      );
    }

    const decided = (await db.query(
      `SELECT ${APPLICATION_COLUMNS} FROM founding_beta_applications WHERE id=$1 LIMIT 1`,
      [application.id],
    ))[0] as FoundingBetaApplicationActivity;

    try {
      const receipt = await sendApplicationDecisionEmail(decided);
      const sentAt = new Date().toISOString();
      await db.query(
        `UPDATE founding_beta_applications
         SET decision_email_sent_at=$2, decision_message_id=$3, decision_email_error=NULL
         WHERE id=$1`,
        [decided.id, sentAt, receipt.messageId ?? null],
      );
      return { ok: true, decision: data.decision, entitlementMode, notificationSent: true, sentAt };
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown AgentMail delivery error";
      await db.query(`UPDATE founding_beta_applications SET decision_email_error=$2 WHERE id=$1`, [decided.id, message]);
      return { ok: true, decision: data.decision, entitlementMode, notificationSent: false, notificationError: message };
    }
  });

export const retryFoundingBetaDecisionEmail = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const applicationId = String((input as { applicationId?: string })?.applicationId ?? "").trim();
    if (!applicationId) throw new Error("Application ID is required.");
    return { applicationId };
  })
  .handler(async ({ data }) => {
    await requireOwner();
    await ensureActivitySources();
    const db = getDb();
    const application = (await db.query(
      `SELECT ${APPLICATION_COLUMNS} FROM founding_beta_applications
       WHERE id=$1 AND status IN ('approved','denied') AND decision_email_sent_at IS NULL LIMIT 1`,
      [data.applicationId],
    ))[0] as FoundingBetaApplicationActivity | undefined;
    if (!application) throw new Error("This decision email has already been sent or the application is not review-complete.");
    const receipt = await sendApplicationDecisionEmail(application);
    const sentAt = new Date().toISOString();
    await db.query(
      `UPDATE founding_beta_applications
       SET decision_email_sent_at=$2, decision_message_id=$3, decision_email_error=NULL
       WHERE id=$1 AND decision_email_sent_at IS NULL`,
      [application.id, sentAt, receipt.messageId ?? null],
    );
    return { ok: true, sentAt, messageId: receipt.messageId ?? null };
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
