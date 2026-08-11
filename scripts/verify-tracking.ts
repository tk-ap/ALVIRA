// ── Verification script: first-party funnel tracking + email-queue hardening ──
// Run with: bun scripts/verify-tracking.ts
//
// Exercises the events store (schema, insert, counts, owner-metrics funnel, the
// pendingInterviews draft-count fix) and the hardened email queue (configurable
// dir via EMAIL_QUEUE_DIR, and fail-closed enqueue) against throwaway temp dirs.
// Never touches the production DB (/home/team/shared/site/.data) or queues.
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dataDir = mkdtempSync(join(tmpdir(), "alvira-events-test-"));
process.env.ALVIRA_DATA_DIR = dataDir;

// Import AFTER setting env — db.ts reads ALVIRA_DATA_DIR at module load.
const { getDb, insertEvent, countEvent, getOwnerMetrics, createUser } = await import("../src/db.ts");
const { enqueueEmail } = await import("../src/emailQueue.ts");

let failures = 0;
const check = (label: string, cond: boolean) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}`);
  if (!cond) failures++;
};

// ── Schema ──
const db = getDb();
const tables = db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'events'").all();
check("events table created", tables.length === 1);
const indexes = db.query("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_events_%'").all();
check("events indexes created (3)", indexes.length === 3);

// ── Insert + count helpers ──
insertEvent("signup_completed", { userId: "u1", anonymousId: "anon-abc", props: { tier: "free" } });
insertEvent("interview_started", { userId: "u1", props: { offering: "context", seeded: false } });
insertEvent("interview_started", { anonymousId: "anon-abc", props: { offering: "meos", seeded: true } });
insertEvent("interview_completed", { userId: "u1", props: { covered: 5, total: 19 } });
insertEvent("export_performed", { userId: "u1", props: { kind: "zip", output: "context" } });
check("countEvent signup_completed d30 = 1", countEvent("signup_completed", 30) === 1);
check("countEvent interview_started d30 = 2", countEvent("interview_started", 30) === 2);
check("countEvent export_performed d30 = 1", countEvent("export_performed", 30) === 1);
check("countEvent unknown event d30 = 0", countEvent("nope", 30) === 0);
check("countEvent interview_completed d7 = d30 = 1", countEvent("interview_completed", 7) === 1 && countEvent("interview_completed", 30) === 1);

// ── Owner metrics: funnel + pendingInterviews fix ──
let m = getOwnerMetrics();
check("funnel.signupCompleted.d30 = 1", m.funnel.signupCompleted.d30 === 1);
check("funnel.interviewStarted.d30 = 2", m.funnel.interviewStarted.d30 === 2);
check("funnel.interviewCompleted.d7 = 1", m.funnel.interviewCompleted.d7 === 1);
check("funnel.exportPerformed.d30 = 1", m.funnel.exportPerformed.d30 === 1);
check("pendingInterviews = 0 with no drafts (not profiles)", m.pendingInterviews === 0);

createUser("u-draft", "draft-test@example.com", "hash");
db.run("INSERT INTO interview_drafts (user_id, offering, topic, state_json) VALUES ('u-draft', 'context', 't', '{}')");
m = getOwnerMetrics();
check("pendingInterviews counts interview_drafts (1)", m.pendingInterviews === 1);

// ── Email queue: configurable dir + non-throwing failure ──
const queueDir = mkdtempSync(join(tmpdir(), "alvira-queue-test-"));
process.env.EMAIL_QUEUE_DIR = queueDir;
const welcomeOk = enqueueEmail("welcome", { email: "x@example.com", timestamp: "t" });
const resetOk = enqueueEmail("reset", { email: "y@example.com", resetUrl: "https://example.com/r?token=abc", timestamp: "t" });
check("enqueueEmail writes welcome queue to EMAIL_QUEUE_DIR", welcomeOk && existsSync(join(queueDir, "pending-welcome-emails.txt")));
check("enqueueEmail writes reset queue to EMAIL_QUEUE_DIR", resetOk && existsSync(join(queueDir, "pending-password-reset-emails.txt")));

// Failure path: unwritable target → returns false, does not throw.
process.env.EMAIL_QUEUE_DIR = "/proc/definitely-not-writable/alvira-queue";
const bad = enqueueEmail("welcome", { email: "z@example.com" });
check("enqueueEmail returns false on filesystem failure (no throw)", bad === false);

// ── Cleanup ──
rmSync(dataDir, { recursive: true, force: true });
rmSync(queueDir, { recursive: true, force: true });
delete process.env.ALVIRA_DATA_DIR;
delete process.env.EMAIL_QUEUE_DIR;

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
