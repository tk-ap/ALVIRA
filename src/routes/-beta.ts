import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDb, getSessionByToken, getUserById } from "~/db";
import { sendEmail } from "~/email";
import { ensureFoundingBetaSchema, syncFoundingBetaTier } from "~/lib/founding-beta";

const SESSION_COOKIE = "alvira_session";
const FEEDBACK_INBOX = "alvira@agentmail.to";

async function getOptionalUser() {
  let token: string | null = null;
  try { token = getCookie(SESSION_COOKIE) ?? null; } catch { token = null; }
  if (!token) return null;
  const session = await getSessionByToken(token);
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) return null;
  return getUserById(session.user_id);
}

async function requireBetaUser() {
  const user = await getOptionalUser();
  if (!user) throw new Error("Authentication required.");
  const beta = await syncFoundingBetaTier(user);
  if (!beta.active) throw new Error("Founding Beta access is not active for this account.");
  return { user, beta };
}

async function ensureBetaApplicationSchema() {
  await getDb().query(`
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
  await getDb().query("CREATE INDEX IF NOT EXISTS idx_founding_beta_applications_created ON founding_beta_applications(created_at DESC)");
  await getDb().query("CREATE INDEX IF NOT EXISTS idx_founding_beta_applications_email ON founding_beta_applications(LOWER(email))");
}

export const getFoundingBetaStatus = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getOptionalUser();
  if (!user) return null;
  await ensureFoundingBetaSchema();
  const beta = await syncFoundingBetaTier(user);
  if (!beta.active) return null;
  return {
    active: true,
    email: user.email,
    expiresAt: beta.expiresAt,
  };
});

export const submitFoundingBetaApplication = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as Record<string, unknown>;
    const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
    const email = clean(d.email, 320).toLowerCase();
    if (!email || !email.includes("@")) throw new Error("A valid email is required.");
    const useCase = clean(d.useCase, 1800);
    const frequency = clean(d.frequency, 80);
    const commitment = clean(d.commitment, 1200);
    const motivation = clean(d.motivation, 1800);
    if (!useCase || !frequency || !commitment || !motivation) throw new Error("Please answer the required application questions.");
    return {
      name: clean(d.name, 160),
      email,
      useCase,
      aiTools: clean(d.aiTools, 800),
      frequency,
      commitment,
      motivation,
      source: clean(d.source, 80) || "alvira",
    };
  })
  .handler(async ({ data }) => {
    await ensureBetaApplicationSchema();
    const existing = (await getDb().query(
      "SELECT id FROM founding_beta_applications WHERE LOWER(email) = LOWER($1) AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [data.email],
    ))[0] as { id: string } | undefined;
    if (existing) return { success: true, id: existing.id, alreadyApplied: true };

    const id = crypto.randomUUID();
    await getDb().query(
      `INSERT INTO founding_beta_applications
       (id, email, name, use_case, ai_tools, ai_frequency, feedback_commitment, motivation, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, data.email, data.name || null, data.useCase, data.aiTools || null, data.frequency, data.commitment, data.motivation, data.source],
    );

    const subject = `[FOUNDING BETA APPLICATION] ${data.email}`;
    const body = [
      `Application ${id}`,
      `Source: ${data.source}`,
      `Name: ${data.name || "not supplied"}`,
      `Email: ${data.email}`,
      "",
      "What they want ALVIRA to understand:",
      data.useCase,
      "",
      `AI use frequency: ${data.frequency}`,
      `Current tools: ${data.aiTools || "not supplied"}`,
      "",
      "Feedback commitment:",
      data.commitment,
      "",
      "Why they want to test ALVIRA:",
      data.motivation,
      "",
      "No Founding Beta entitlement has been granted automatically. Review this application before approving a limited slot.",
    ].join("\n");

    try {
      await sendEmail({
        to: (process.env.BETA_FEEDBACK_EMAIL || FEEDBACK_INBOX).trim(),
        replyTo: data.email,
        subject,
        text: body,
      });
    } catch (error) {
      console.warn(`[founding-beta] application ${id} persisted but email delivery failed`, error instanceof Error ? error.message : "unknown error");
    }

    return { success: true, id, alreadyApplied: false };
  });

type FeedbackKind = "problem" | "observation" | "pulse";
type FeedbackSeverity = "blocker" | "major" | "minor" | "note";
type FeedbackSignal = "worked" | "confusing" | "broke" | null;

export const submitBetaFeedback = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as Record<string, unknown>;
    const kind = d.kind;
    const severity = d.severity;
    const signal = d.signal ?? null;
    if (kind !== "problem" && kind !== "observation" && kind !== "pulse") throw new Error("Unsupported feedback type.");
    if (severity !== "blocker" && severity !== "major" && severity !== "minor" && severity !== "note") throw new Error("Unsupported severity.");
    if (signal !== null && signal !== "worked" && signal !== "confusing" && signal !== "broke") throw new Error("Unsupported feedback signal.");

    const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
    const details = clean(d.details, 4000);
    if (!details) throw new Error("Tell us what happened or what you noticed.");
    const screenshotDataUrl = clean(d.screenshotDataUrl, 1_200_000);
    if (screenshotDataUrl && !/^data:image\/(png|jpeg|webp);base64,/i.test(screenshotDataUrl)) throw new Error("Screenshot must be a PNG, JPEG, or WebP image.");

    return {
      kind: kind as FeedbackKind,
      severity: severity as FeedbackSeverity,
      signal: signal as FeedbackSignal,
      surface: clean(d.surface, 120) || "ALVIRA",
      route: clean(d.route, 300) || "/",
      details,
      expected: clean(d.expected, 2000),
      contextExcerpt: clean(d.contextExcerpt, 2000),
      screenshotDataUrl,
      userAgent: clean(d.userAgent, 800),
      viewport: clean(d.viewport, 100),
      profileId: clean(d.profileId, 200),
      interviewId: clean(d.interviewId, 200),
    };
  })
  .handler(async ({ data }) => {
    const { user } = await requireBetaUser();
    await ensureFoundingBetaSchema();
    const id = crypto.randomUUID();

    await getDb().query(
      `INSERT INTO beta_feedback (
        id, user_id, email, kind, severity, signal, surface, route, details, expected,
        context_excerpt, screenshot_data_url, user_agent, viewport, profile_id, interview_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id,
        user.id,
        user.email,
        data.kind,
        data.severity,
        data.signal,
        data.surface,
        data.route,
        data.details,
        data.expected || null,
        data.contextExcerpt || null,
        data.screenshotDataUrl || null,
        data.userAgent || null,
        data.viewport || null,
        data.profileId || null,
        data.interviewId || null,
      ],
    );

    const signalLabel = data.signal === "worked" ? "Worked as expected" : data.signal === "confusing" ? "Confusing" : data.signal === "broke" ? "Something broke" : null;
    const reportLabel = data.kind === "problem" ? "QA report" : data.kind === "observation" ? "Observation" : signalLabel ?? "Pulse";
    const subject = `[FOUNDING BETA] [${data.severity.toUpperCase()}] ${data.surface} — ${reportLabel}`;
    const body = [
      `Founding Beta feedback ${id}`,
      "",
      `Tester: ${user.email}`,
      `User ID: ${user.id}`,
      `Surface: ${data.surface}`,
      `Route: ${data.route}`,
      `Type: ${data.kind}`,
      `Severity: ${data.severity}`,
      data.signal ? `Signal: ${data.signal}` : "",
      data.profileId ? `Profile ID: ${data.profileId}` : "",
      data.interviewId ? `Interview ID: ${data.interviewId}` : "",
      "",
      "What happened / observation:",
      data.details,
      data.expected ? `\nExpected:\n${data.expected}` : "",
      data.contextExcerpt ? `\nTester-approved contextual excerpt:\n${data.contextExcerpt}` : "",
      `\nScreenshot: ${data.screenshotDataUrl ? "stored with the persisted feedback record" : "none"}`,
      `Browser/device: ${data.userAgent || "not supplied"}`,
      `Viewport: ${data.viewport || "not supplied"}`,
      "",
      "No ALVIRA Context answers, uploads, or documents were automatically attached.",
    ].filter(Boolean).join("\n");

    try {
      await sendEmail({
        to: (process.env.BETA_FEEDBACK_EMAIL || FEEDBACK_INBOX).trim(),
        replyTo: user.email,
        subject,
        text: body,
      });
    } catch (error) {
      console.warn(`[founding-beta] feedback ${id} persisted but email delivery failed`, error instanceof Error ? error.message : "unknown error");
    }

    return { success: true, id };
  });
