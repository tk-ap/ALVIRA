// ── Verification script: first-party funnel tracking + email-queue hardening ──
// Run with: bun run verify:tracking
//
// Exercises, against throwaway temp dirs (never the production DB at
// /home/team/shared/site/.data or the production queues):
//   - events schema + indexes + PRAGMA foreign_keys enforcement
//   - raw insert/count helpers
//   - owner-metrics funnel = DISTINCT people (repeated actions count once;
//     identifier-less rows excluded) + pendingInterviews draft-count fix
//   - recordEvent identifier requirement and per-identity rate limiting
//   - bounded retention: pruneOldEvents + prune-on-DB-init (restart simulation)
//     + opportunistic daily prune on event writes (long-lived server, not restart)
//   - FK deletion behavior: user delete SET NULLs events.user_id so the event
//     survives de-identified, retaining only its pseudonymous anonymous_id;
//     CASCADE rules still honored
//   - draft-transfer/recovery still works with FK enforcement ON
//   - hardened email queue (configurable dir + fail-open/non-throwing enqueue)
// Env vars are restored and temp data removed in `finally` no matter what.
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dataDir = mkdtempSync(join(tmpdir(), "alvira-events-test-"));
const queueDir = mkdtempSync(join(tmpdir(), "alvira-queue-test-"));
const dataDir2 = mkdtempSync(join(tmpdir(), "alvira-events-restart-"));

// Snapshot env so the finally block can restore it exactly.
const envSnapshot = {
  ALVIRA_DATA_DIR: process.env.ALVIRA_DATA_DIR,
  EMAIL_QUEUE_DIR: process.env.EMAIL_QUEUE_DIR,
};

process.env.ALVIRA_DATA_DIR = dataDir;

let failures = 0;
const check = (label: string, cond: boolean) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}`);
  if (!cond) failures++;
};

try {
  // Import AFTER setting env — db.ts reads ALVIRA_DATA_DIR at module load.
  const dbModule = await import("../src/db.ts");
  const {
    getDb,
    insertEvent,
    countEvent,
    getOwnerMetrics,
    createUser,
    recordEvent,
    pruneOldEvents,
    forceNextEventPruneForTest,
    isEventRateLimited,
    executeDraftTransfer,
    EVENT_RATE_LIMIT_MAX,
  } = dbModule;
  const { enqueueEmail } = await import("../src/emailQueue.ts");

  const db = getDb();

  // ── Schema + FK enforcement ──
  const tables = db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'events'").all();
  check("events table created", tables.length === 1);
  const indexes = db.query("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_events_%'").all();
  check("events indexes created (3)", indexes.length === 3);
  const fk = db.query("PRAGMA foreign_keys").get() as { foreign_keys: number };
  check("PRAGMA foreign_keys is ON (FK enforcement enabled)", fk.foreign_keys === 1);

  // ── Fixture: users MUST exist before user-attributed events (FK enforced) ──
  createUser("u1", "u1@example.com", "hash");
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

  // ── Owner metrics: funnel = DISTINCT people + pendingInterviews fix ──
  let m = getOwnerMetrics();
  check("funnel.signupCompleted.d30 = 1", m.funnel.signupCompleted.d30 === 1);
  check("funnel.interviewStarted.d30 = 2", m.funnel.interviewStarted.d30 === 2);
  check("funnel.interviewCompleted.d7 = 1", m.funnel.interviewCompleted.d7 === 1);
  check("funnel.exportPerformed.d30 = 1", m.funnel.exportPerformed.d30 === 1);
  check("pendingInterviews = 0 with no drafts or profiles yet", m.pendingInterviews === 0);

  // Repeated actions by the same person must count once (five exports ≠ five people).
  insertEvent("interview_started", { userId: "u1", props: {} });
  insertEvent("interview_started", { userId: "u1", props: {} });
  insertEvent("interview_started", { userId: "u1", props: {} });
  m = getOwnerMetrics();
  check("funnel.interviewStarted.d30 = 2 despite 4 raw events from u1 (unique people)", m.funnel.interviewStarted.d30 === 2);
  check("raw rows still stored individually (countEvent = 5)", countEvent("interview_started", 30) === 5);

  // Rows with neither identifier are excluded from funnel counts.
  insertEvent("interview_started", { props: {} });
  m = getOwnerMetrics();
  check("funnel.interviewStarted.d30 = 2 excludes identifier-less row", m.funnel.interviewStarted.d30 === 2);

  // ── recordEvent: identifier requirement + rate limit ──
  const beforeRecord = countEvent("interview_started", 30);
  const noId = recordEvent("interview_started", { props: {} });
  check("recordEvent drops event with no identifier (returns false)", noId === false);
  check("dropped identifier-less event not persisted", countEvent("interview_started", 30) === beforeRecord);
  const withAnon = recordEvent("interview_started", { anonymousId: "anon-rate", props: {} });
  check("recordEvent persists with anonymous identifier", withAnon === true && countEvent("interview_started", 30) === beforeRecord + 1);

  // Rate limit: fresh identity starts unlimited; floods over the cap are dropped.
  check("isEventRateLimited false for fresh identity", isEventRateLimited(null, "anon-rl") === false);
  for (let i = 0; i < EVENT_RATE_LIMIT_MAX - 1; i++) {
    insertEvent("meos_cta_impression", { anonymousId: "anon-rl" });
  }
  check("not rate-limited at cap-1 events in window", isEventRateLimited(null, "anon-rl") === false);
  insertEvent("meos_cta_impression", { anonymousId: "anon-rl" });
  check("rate-limited at cap events in window", isEventRateLimited(null, "anon-rl") === true);
  const rlDropped = recordEvent("interview_started", { anonymousId: "anon-rl", props: {} });
  check("recordEvent drops rate-limited write (returns false)", rlDropped === false);
  check("rate-limited write not persisted", countEvent("interview_started", 30) === beforeRecord + 1);

  // ── Retention: pruneOldEvents + prune on DB initialization ──
  db.run("INSERT INTO events (id, name, anonymous_id, props_json, created_at) VALUES (?, 'interview_started', 'anon-old', '{}', datetime('now', '-200 days'))", [crypto.randomUUID()]);
  const oldExists = (db.query("SELECT COUNT(*) AS count FROM events WHERE anonymous_id = 'anon-old'").get() as { count: number }).count === 1;
  check("old (>180d) event present before prune", oldExists);
  db.run("INSERT INTO events (id, name, anonymous_id, props_json, created_at) VALUES (?, 'interview_started', 'anon-recent', '{}', datetime('now'))", [crypto.randomUUID()]);
  pruneOldEvents();
  check("pruneOldEvents removes events older than 180 days", (db.query("SELECT COUNT(*) AS count FROM events WHERE anonymous_id = 'anon-old'").get() as { count: number }).count === 0);
  check("pruneOldEvents keeps recent events", (db.query("SELECT COUNT(*) AS count FROM events WHERE anonymous_id = 'anon-recent'").get() as { count: number }).count === 1);

  // Restart simulation: a fresh module init (fresh getDb) prunes stale rows.
  const prevDir = process.env.ALVIRA_DATA_DIR;
  process.env.ALVIRA_DATA_DIR = dataDir2;
  // @ts-ignore query-string import busts Bun module cache (runtime-only; tsc cannot resolve it)
  const db2 = (await import(`../src/db.ts?restart=1`)).getDb();
  db2.run("INSERT INTO events (id, name, anonymous_id, props_json, created_at) VALUES (?, 'interview_started', 'anon-old2', '{}', datetime('now', '-200 days'))", [crypto.randomUUID()]);
  db2.run("INSERT INTO events (id, name, anonymous_id, props_json, created_at) VALUES (?, 'interview_started', 'anon-new2', '{}', datetime('now', '-1 days'))", [crypto.randomUUID()]);
  // @ts-ignore query-string import busts Bun module cache (runtime-only; tsc cannot resolve it)
  const db3 = (await import(`../src/db.ts?restart=2`)).getDb(); // second init == server restart
  check("DB init prunes events older than 180 days", (db3.query("SELECT COUNT(*) AS count FROM events WHERE anonymous_id = 'anon-old2'").get() as { count: number }).count === 0);
  check("DB init keeps events inside retention window", (db3.query("SELECT COUNT(*) AS count FROM events WHERE anonymous_id = 'anon-new2'").get() as { count: number }).count === 1);
  process.env.ALVIRA_DATA_DIR = prevDir;

  // Opportunistic daily prune on event writes: advancing the last-prune condition
  // makes the next write prune old rows — so a long-lived server stays bounded
  // without a restart and without pruning on every request.
  db.run("INSERT INTO events (id, name, anonymous_id, props_json, created_at) VALUES (?, 'interview_started', 'anon-daily', '{}', datetime('now', '-200 days'))", [crypto.randomUUID()]);
  check("old (>180d) event present before daily-prune check", (db.query("SELECT COUNT(*) AS count FROM events WHERE anonymous_id = 'anon-daily'").get() as { count: number }).count === 1);
  forceNextEventPruneForTest(); // reset the module-level last-prune timestamp
  insertEvent("interview_started", { anonymousId: "anon-daily-trigger", props: {} }); // any write triggers the prune
  check("event write prunes >180d rows after last-prune advanced (daily prune)", (db.query("SELECT COUNT(*) AS count FROM events WHERE anonymous_id = 'anon-daily'").get() as { count: number }).count === 0);
  check("daily prune keeps the triggering write itself", (db.query("SELECT COUNT(*) AS count FROM events WHERE anonymous_id = 'anon-daily-trigger'").get() as { count: number }).count === 1);

  // ── FK deletion behavior: ON DELETE SET NULL for events.user_id ──
  // The event carries BOTH identifiers: after account deletion the user link is
  // removed (user_id → NULL) while the de-identified row survives with only its
  // pseudonymous anonymous_id — matching the privacy copy (account/profile content
  // permanently deleted; de-identified analytics may remain up to 180 days).
  createUser("u-fk", "fk@example.com", "hash");
  insertEvent("signup_completed", { userId: "u-fk", anonymousId: "anon-fk", props: { tier: "free", marker: "fk" } });
  check("event row attributed to u-fk exists", (db.query("SELECT COUNT(*) AS count FROM events WHERE user_id = 'u-fk'").get() as { count: number }).count === 1);
  db.run("DELETE FROM users WHERE id = 'u-fk'");
  check("deleting user NULLs events.user_id (no identified link remains)", (db.query("SELECT COUNT(*) AS count FROM events WHERE user_id = 'u-fk'").get() as { count: number }).count === 0);
  check("de-identified event survives with user_id = NULL, retaining only anonymous_id", (db.query("SELECT COUNT(*) AS count FROM events WHERE name = 'signup_completed' AND user_id IS NULL AND anonymous_id = 'anon-fk' AND props_json LIKE '%\"marker\":\"fk\"%'").get() as { count: number }).count === 1);

  // ── pendingInterviews counts interview_drafts, not profiles ──
  createUser("u-prof", "profile-only@example.com", "hash");
  db.run("INSERT INTO profiles (id, user_id, topic, tier, state_json) VALUES ('u-prof-p', 'u-prof', 'context', 'free', '{}')");
  m = getOwnerMetrics();
  check("pendingInterviews = 0 with a profile but no draft (profiles don't count)", m.pendingInterviews === 0);
  createUser("u-draft", "draft-test@example.com", "hash");
  db.run("INSERT INTO interview_drafts (user_id, offering, topic, state_json) VALUES ('u-draft', 'context', 't', '{}')");
  m = getOwnerMetrics();
  check("pendingInterviews counts interview_drafts (1)", m.pendingInterviews === 1);

  // ── Draft transfer / recovery still works with FK enforcement ON ──
  createUser("u-src", "src@example.com", "hash");
  createUser("u-dst", "dst@example.com", "hash");
  db.run("INSERT INTO interview_drafts (user_id, offering, topic, state_json) VALUES ('u-src', 'context', 't', '{}')");
  db.run("INSERT INTO draft_transfers (id, target_email, source_user_id, source_offering) VALUES ('transfer-test', 'dst@example.com', 'u-src', 'context')");
  const transfer = executeDraftTransfer("transfer-test", "u-dst");
  check("executeDraftTransfer succeeds with FK enforcement ON", transfer.transferred === true);
  check("draft moved to target user", (db.query("SELECT COUNT(*) AS count FROM interview_drafts WHERE user_id = 'u-dst' AND offering = 'context'").get() as { count: number }).count === 1);
  check("source draft removed after transfer", (db.query("SELECT COUNT(*) AS count FROM interview_drafts WHERE user_id = 'u-src'").get() as { count: number }).count === 0);
  check("transfer row consumed after transfer", (db.query("SELECT COUNT(*) AS count FROM draft_transfers WHERE id = 'transfer-test'").get() as { count: number }).count === 0);

  // ── Email queue: configurable dir + non-throwing failure ──
  process.env.EMAIL_QUEUE_DIR = queueDir;
  const welcomeOk = enqueueEmail("welcome", { email: "x@example.com", timestamp: "t" });
  const resetOk = enqueueEmail("reset", { email: "y@example.com", resetUrl: "https://example.com/r?token=abc", timestamp: "t" });
  check("enqueueEmail writes welcome queue to EMAIL_QUEUE_DIR", welcomeOk && existsSync(join(queueDir, "pending-welcome-emails.txt")));
  check("enqueueEmail writes reset queue to EMAIL_QUEUE_DIR", resetOk && existsSync(join(queueDir, "pending-password-reset-emails.txt")));

  // Failure path: unwritable target → returns false, does not throw.
  process.env.EMAIL_QUEUE_DIR = "/proc/definitely-not-writable/alvira-queue";
  const bad = enqueueEmail("welcome", { email: "z@example.com" });
  check("enqueueEmail returns false on filesystem failure (no throw)", bad === false);
} finally {
  // Restore env vars and remove all temp data regardless of pass/fail.
  for (const [key, value] of Object.entries(envSnapshot)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(queueDir, { recursive: true, force: true });
  rmSync(dataDir2, { recursive: true, force: true });
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
