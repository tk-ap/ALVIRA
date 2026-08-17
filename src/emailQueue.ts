// Server-only email queue processor for ALVIRA.
//
// Runs inside serve.ts (the production server on port 3000) — this module is
// NOT part of the TanStack app graph and never reaches the client bundle.
//
// Reads the file-based email queues written by src/routes/-auth.ts (welcome,
// password reset) and src/routes/-teamWaitlist.ts (team waitlist), delivers
// each entry, and removes the entries that were sent.
//
// Delivery:
//   - If EMAIL_API_URL is configured (any HTTP JSON email API: Resend,
//     SendGrid, Postmark, or a platform gateway), POST {to, subject, body}
//     with `Authorization: Bearer $EMAIL_API_KEY` when the key is set.
//     Non-2xx responses are treated as failures and the entry is kept in the
//     queue for the next run.
//   - If no EMAIL_API_URL is configured, the email is logged in full to
//     /home/team/shared/recent-emails.log (marked [SIMULATED]) and the entry
//     is removed, so queues drain automatically and the lead can see exactly
//     what would have been sent. Set EMAIL_API_URL (+ EMAIL_API_KEY) on the
//     server to switch to real delivery without code changes.
//
// Access control: POST /api/send-email is publicly reachable (the site is
// published), so it is gated by a shared secret in
// /home/team/shared/.email-cron-token when that file exists. The cron script
// reads the same file. If the file is absent (dev mode) the endpoint is open.
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Queue base directory — configurable via EMAIL_QUEUE_DIR (used by tests and by
// any deployment that wants queues somewhere other than the shared team dir).
// Read at call time so a test/deploy can point it at a fresh directory.
// Default to a writable temp dir in serverless deployments; local/server installs
// still use /home/team/shared for backward compatibility.
function emailQueueDir(): string {
  const override = process.env.EMAIL_QUEUE_DIR?.trim();
  if (override) return override;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return join(tmpdir(), "alvira-email-queue");
  return "/home/team/shared";
}

export const QUEUES = {
  welcome: {
    file: "pending-welcome-emails.txt",
    subject: "Welcome to ALVIRA",
  },
  reset: {
    file: "pending-password-reset-emails.txt",
    subject: "Reset your ALVIRA password",
  },
  waitlist: {
    file: "pending-team-waitlist-emails.txt",
    subject: null, // subject comes from the payload
  },
} as const;

export type QueueName = keyof typeof QUEUES;

const PUBLIC_SITE_URL = (() => {
  const override = (process.env.PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "").trim();
  if (!override) return "https://alvira.ctonew.app";
  return override.startsWith("http://") || override.startsWith("https://") ? override : `https://${override}`;
})();
const LOG_FILE = () => join(emailQueueDir(), "recent-emails.log");
const TOKEN_FILE = () => join(emailQueueDir(), ".email-cron-token");

const WELCOME_BODY = `Hi there,

Glad you're here. ALVIRA helps you build the context your AI is missing — so ChatGPT, Claude, and other tools actually understand you.

Start your first interview at ${PUBLIC_SITE_URL}/app — it takes about 10 minutes and you'll get structured Markdown files you can use anywhere.

If you have questions or feedback, just reply to this email. I read every one.

Talk soon,
The ALVIRA team`;

const RESET_BODY = (resetUrl: string) =>
  `We received a request to reset your ALVIRA password. Click the link below to choose a new password:

${resetUrl}

This link expires in one hour. If you didn't request this, you can ignore this email.`;

function queuePath(queue: QueueName): string {
  return join(emailQueueDir(), QUEUES[queue].file);
}

/**
 * Append an entry to a queue file without ever throwing. A filesystem failure
 * (missing dir, read-only disk, full disk) logs a server-side warning (queue
 * name + error code only — never the entry contents) and returns false so the
 * caller can continue; it must never 500 an otherwise successful request.
 */
export function enqueueEmail(queue: QueueName, entry: Record<string, unknown>): boolean {
  try {
    const dir = emailQueueDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(queuePath(queue), JSON.stringify(entry) + "\n");
    return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code ?? "unknown";
    console.warn(`[email-queue] enqueue ${queue} failed (${code}); proceeding without queueing`);
    return false;
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Access control ──
function authorized(req: Request): boolean {
  if (!existsSync(TOKEN_FILE())) return true; // dev mode: no token configured
  const expected = readFileSync(TOKEN_FILE(), "utf-8").trim();
  if (!expected) return true;
  const bearer = req.headers.get("authorization") ?? "";
  const x = req.headers.get("x-email-token") ?? "";
  return bearer === `Bearer ${expected}` || x === expected;
}

// ── Delivery ──
export async function deliver(
  to: string,
  subject: string,
  body: string,
): Promise<{ ok: boolean; mode: "api" | "simulated"; error?: string }> {
  const api = (process.env.EMAIL_API_URL ?? "").trim();
  if (api) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const key = (process.env.EMAIL_API_KEY ?? "").trim();
      if (key) headers.Authorization = `Bearer ${key}`;
      const res = await fetch(api, {
        method: "POST",
        headers,
        body: JSON.stringify({ to, subject, body }),
      });
      if (res.ok) return { ok: true, mode: "api" };
      return { ok: false, mode: "api", error: `email API returned HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, mode: "api", error: `email API request failed: ${String(err)}` };
    }
  }
  return { ok: true, mode: "simulated" }; // no API configured → log + drain
}

// ── Logging (Part 4: lead visibility) ──
function recordLog(m: { to: string; subject: string; body: string; mode: "api" | "simulated"; queue: string }): void {
  const flag = m.mode === "api" ? "SENT" : "SIMULATED";
  const line = `[${new Date().toISOString()}] ${flag} queue=${m.queue} to=${m.to} subject=${JSON.stringify(m.subject)} body=${JSON.stringify(m.body)}`;
  try {
    appendFileSync(LOG_FILE(), line + "\n");
  } catch {
    // never let logging break queue processing
  }
}

// ── Queue file access (atomic writes + lock to avoid double-sending) ──
function writeQueueFile(path: string, lines: string[]): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, lines.length > 0 ? lines.join("\n") + "\n" : "");
  renameSync(tmp, path); // atomic on the same filesystem
}

async function acquireLock(lockPath: string, timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  for (;;) {
    try {
      mkdirSync(lockPath);
      return true;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== "EEXIST") return false;
      try {
        const st = statSync(lockPath);
        if (Date.now() - st.mtimeMs > 60_000) {
          // stale lock from a crashed run
          rmSync(lockPath, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue; // lock vanished; retry immediately
      }
      if (Date.now() - start > timeoutMs) return false;
      await sleep(200);
    }
  }
}

function releaseLock(lockPath: string): void {
  try {
    rmSync(lockPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// ── Template building ──
interface BuiltEmail {
  to: string;
  subject: string;
  body: string;
}

function buildEmail(queue: QueueName, entry: Record<string, unknown>): BuiltEmail | null {
  if (queue === "welcome") {
    const to = typeof entry.email === "string" ? entry.email.trim() : "";
    if (!to) return null;
    return { to, subject: QUEUES.welcome.subject as string, body: WELCOME_BODY };
  }
  if (queue === "reset") {
    const to = typeof entry.email === "string" ? entry.email.trim() : "";
    const resetUrl = typeof entry.resetUrl === "string" ? entry.resetUrl : "";
    if (!to || !resetUrl) return null;
    return { to, subject: QUEUES.reset.subject as string, body: RESET_BODY(resetUrl) };
  }
  // waitlist: use the subject/body straight from the payload
  const to = typeof entry.to === "string" ? entry.to.trim() : "";
  const subject = typeof entry.subject === "string" ? entry.subject : "";
  const body = typeof entry.body === "string" ? entry.body : "";
  if (!to || !subject) return null;
  return { to, subject, body };
}

// ── HTTP handler ──
export async function handleSendEmail(req: Request): Promise<Response> {
  const { method } = req;

  // GET → status report (queue sizes + delivery mode) for the lead.
  if (method === "GET") {
    const counts: Record<string, number> = {};
    for (const queue of Object.keys(QUEUES) as QueueName[]) {
      const path = queuePath(queue);
      counts[queue] = existsSync(path)
        ? readFileSync(path, "utf-8").split("\n").filter((l) => l.trim() !== "").length
        : 0;
    }
    return json({
      ok: true,
      mode: (process.env.EMAIL_API_URL ?? "").trim() ? "api" : "simulated",
      queues: counts,
    });
  }

  if (method !== "POST") return json({ error: "Method not allowed. Use POST or GET." }, 405);
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const d = (payload ?? {}) as Record<string, unknown>;

  // Direct-send mode: { to, subject, body } (used for manual/lead sends).
  const toValue = d.to;
  const to = Array.isArray(toValue)
    ? String(toValue[0] ?? "")
    : typeof toValue === "string"
      ? toValue.trim()
      : "";
  if (typeof d.subject === "string" && typeof d.body === "string" && to) {
    const result = await deliver(to, d.subject, d.body);
    if (!result.ok) {
      return json({ ok: false, error: result.error, mode: result.mode }, 502);
    }
    recordLog({ to, subject: d.subject, body: d.body, mode: result.mode, queue: "direct" });
    return json({ ok: true, sent: 1, remaining: 0, mode: result.mode });
  }

  // Queue mode: { queue: "welcome" | "reset" | "waitlist" }
  const queue = d.queue;
  if (queue !== "welcome" && queue !== "reset" && queue !== "waitlist") {
    return json({ error: 'Invalid queue. Use { "queue": "welcome" | "reset" | "waitlist" }.' }, 400);
  }
  const path = queuePath(queue);
  if (!existsSync(path)) return json({ ok: true, sent: 0, remaining: 0, queue });

  const lockPath = `${path}.lock`;
  const locked = await acquireLock(lockPath, 10_000);
  if (!locked) return json({ ok: false, error: "queue is locked by another run" }, 409);
  try {
    // Re-read under the lock so a concurrent writer's lines are not lost.
    const lines = existsSync(path)
      ? readFileSync(path, "utf-8").split("\n").filter((l) => l.trim() !== "")
      : [];
    const remaining: string[] = [];
    let sent = 0;
    let simulated = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as Record<string, unknown>;
        const built = buildEmail(queue, entry);
        if (!built) {
          remaining.push(line); // malformed/untemplatable → keep for inspection
          continue;
        }
        const result = await deliver(built.to, built.subject, built.body);
        if (result.ok) {
          sent++;
          if (result.mode === "simulated") simulated++;
          recordLog({ to: built.to, subject: built.subject, body: built.body, mode: result.mode, queue });
        } else {
          remaining.push(line); // real API failure → retry next run
        }
      } catch {
        remaining.push(line);
      }
    }
    writeQueueFile(path, remaining);
    return json({
      ok: true,
      sent,
      remaining: remaining.length,
      queue,
      mode: (process.env.EMAIL_API_URL ?? "").trim() ? "api" : "simulated",
      simulated,
    });
  } finally {
    releaseLock(lockPath);
  }
}
