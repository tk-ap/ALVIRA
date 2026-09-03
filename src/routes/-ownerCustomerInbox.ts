import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getDb } from "~/db";
import { ensureCustomerEmailSchema } from "~/lib/customer-email";

const SESSION_COOKIE = "alvira_session";

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
  return row;
}

export type CustomerInboxThread = {
  threadId: string;
  correspondentEmail: string;
  subject: string | null;
  preview: string | null;
  lastReceivedAt: string | null;
  unreadCount: number;
  needsReply: boolean;
  matchType: "account" | "reservation" | "unknown";
  messageCount: number;
};

export type OwnerCustomerInbox = {
  unreadCount: number;
  needsReplyCount: number;
  threads: CustomerInboxThread[];
};

export const getOwnerCustomerInbox = createServerFn({ method: "GET" }).handler(async (): Promise<OwnerCustomerInbox> => {
  await requireOwner();
  await ensureCustomerEmailSchema();
  const db = getDb();
  const summary = (await db.query(`SELECT COALESCE(SUM(unread_count),0)::int AS unread_count, COUNT(*) FILTER (WHERE needs_reply)::int AS needs_reply_count FROM customer_email_threads`))[0] as Record<string, number>;
  const rows = await db.query(`
    SELECT t.thread_id, t.correspondent_email, t.subject, t.last_preview, t.last_received_at,
           t.unread_count, t.needs_reply,
           CASE WHEN t.user_id IS NOT NULL THEN 'account' WHEN t.reservation_email IS NOT NULL THEN 'reservation' ELSE 'unknown' END AS match_type,
           (SELECT COUNT(*)::int FROM customer_email_events e WHERE e.thread_id=t.thread_id) AS message_count
      FROM customer_email_threads t
     ORDER BY t.needs_reply DESC, t.last_received_at DESC NULLS LAST
     LIMIT 30`);
  return {
    unreadCount: Number(summary?.unread_count ?? 0),
    needsReplyCount: Number(summary?.needs_reply_count ?? 0),
    threads: (rows as Array<Record<string, unknown>>).map((row) => ({
      threadId: String(row.thread_id),
      correspondentEmail: String(row.correspondent_email),
      subject: row.subject ? String(row.subject) : null,
      preview: row.last_preview ? String(row.last_preview) : null,
      lastReceivedAt: row.last_received_at ? String(row.last_received_at) : null,
      unreadCount: Number(row.unread_count ?? 0),
      needsReply: Boolean(row.needs_reply),
      matchType: row.match_type === "account" ? "account" : row.match_type === "reservation" ? "reservation" : "unknown",
      messageCount: Number(row.message_count ?? 0),
    })),
  };
});

export const markCustomerThreadRead = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ threadId: String((input as { threadId?: string })?.threadId ?? "").trim() }))
  .handler(async ({ data }) => {
    await requireOwner();
    if (!data.threadId) throw new Error("Thread ID is required.");
    await ensureCustomerEmailSchema();
    await getDb().query("UPDATE customer_email_threads SET unread_count=0, updated_at=NOW() WHERE thread_id=$1", [data.threadId]);
    return { ok: true };
  });

export const resolveCustomerThread = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ threadId: String((input as { threadId?: string })?.threadId ?? "").trim() }))
  .handler(async ({ data }) => {
    await requireOwner();
    if (!data.threadId) throw new Error("Thread ID is required.");
    await ensureCustomerEmailSchema();
    await getDb().query("UPDATE customer_email_threads SET unread_count=0, needs_reply=FALSE, resolved_at=NOW(), updated_at=NOW() WHERE thread_id=$1", [data.threadId]);
    return { ok: true };
  });
