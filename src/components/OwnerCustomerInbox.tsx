import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  getOwnerCustomerInbox,
  markCustomerThreadRead,
  resolveCustomerThread,
  type OwnerCustomerInbox as InboxData,
} from "~/routes/-ownerCustomerInbox";

function when(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function OwnerCustomerInbox() {
  const location = useLocation();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [data, setData] = useState<InboxData | null>(null);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () => getOwnerCustomerInbox().then(setData).catch(() => setDenied(true));

  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      setTarget(null);
      setData(null);
      setDenied(false);
      return;
    }
    const frame = requestAnimationFrame(() => setTarget(document.querySelector<HTMLElement>("main#main-content .mx-auto.max-w-4xl")));
    refresh();
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  if (location.pathname !== "/dashboard" || !target || denied || !data) return null;

  return createPortal(
    <section className="mb-10 border border-iridescent/30 bg-[#f4f0e9] dark:bg-[#0d1110]" aria-labelledby="owner-customer-inbox-title">
      <div className="flex flex-col gap-4 border-b border-ink/10 px-5 py-5 dark:border-mineral/10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-iridescent-dark dark:text-iridescent">Owner · customer replies</p>
          <h2 id="owner-customer-inbox-title" className="mt-2 font-display text-3xl tracking-[-0.025em] text-ink dark:text-mineral">Who replied — and who still needs you?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Verified replies to alvira@agentmail.to appear here automatically. ALVIRA does not auto-respond.</p>
        </div>
        <div className="flex gap-5">
          <div><p className="font-display text-3xl text-ink dark:text-mineral">{data.unreadCount}</p><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-warm-gray-dark dark:text-warm-gray">Unread</p></div>
          <div><p className="font-display text-3xl text-ink dark:text-mineral">{data.needsReplyCount}</p><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-human-dark dark:text-human">Need reply</p></div>
        </div>
      </div>

      {data.threads.length === 0 ? (
        <p className="px-6 py-8 text-sm text-warm-gray-dark dark:text-warm-gray">No verified customer replies have been received yet.</p>
      ) : (
        <div className="divide-y divide-ink/10 dark:divide-mineral/10">
          {data.threads.map((thread) => (
            <article key={thread.threadId} className="px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink dark:text-mineral">{thread.correspondentEmail}</p>
                    <span className="border border-ink/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.09em] text-warm-gray-dark dark:border-mineral/15 dark:text-warm-gray">{thread.matchType}</span>
                    {thread.unreadCount > 0 && <span className="border border-iridescent/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.09em] text-iridescent-dark dark:text-iridescent">{thread.unreadCount} unread</span>}
                    {thread.needsReply && <span className="border border-human/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.09em] text-human-dark dark:text-human">needs reply</span>}
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink dark:text-mineral">{thread.subject ?? "(No subject)"}</p>
                  {thread.preview && <p className="mt-1 max-w-3xl text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">{thread.preview}</p>}
                  <p className="mt-2 font-mono text-[9px] text-warm-gray-dark/80 dark:text-warm-gray/80">{when(thread.lastReceivedAt)} · {thread.messageCount} inbound message{thread.messageCount === 1 ? "" : "s"}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {thread.unreadCount > 0 && (
                    <button type="button" disabled={busy === thread.threadId} onClick={async () => { setBusy(thread.threadId); try { await markCustomerThreadRead({ data: { threadId: thread.threadId } }); await refresh(); } finally { setBusy(null); } }} className="border border-ink/15 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink disabled:opacity-50 dark:border-mineral/20 dark:text-mineral">Mark read</button>
                  )}
                  {thread.needsReply && (
                    <button type="button" disabled={busy === thread.threadId} onClick={async () => { setBusy(thread.threadId); try { await resolveCustomerThread({ data: { threadId: thread.threadId } }); await refresh(); } finally { setBusy(null); } }} className="border border-human/40 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-human-dark disabled:opacity-50 dark:text-human">Resolve</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>,
    target,
  );
}
