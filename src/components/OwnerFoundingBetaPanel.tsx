import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  getOwnerCohortMetrics,
  retryFoundingBetaDecisionEmail,
  reviewFoundingBetaApplication,
  sendFoundingBetaReservationInvite,
  type OwnerCohortMetrics,
} from "~/routes/-ownerCohort";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeDate(value: string | null) {
  if (!value) return "No meaningful use yet";
  const ms = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ms)) return "—";
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function OwnerFoundingBetaPanel() {
  const location = useLocation();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [metrics, setMetrics] = useState<OwnerCohortMetrics | null>(null);
  const [denied, setDenied] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sendMessage, setSendMessage] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string>("");

  const refresh = () => getOwnerCohortMetrics().then(setMetrics).catch(() => setDenied(true));

  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      setTarget(null);
      setMetrics(null);
      setDenied(false);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setTarget(document.querySelector<HTMLElement>("main#main-content .mx-auto.max-w-4xl"));
    });
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [location.pathname]);

  if (location.pathname !== "/dashboard" || !target || denied || !metrics) return null;

  const sendReservationInvite = async (email: string) => {
    setSendingTo(email);
    setSendMessage((current) => ({ ...current, [email]: "" }));
    try {
      await sendFoundingBetaReservationInvite({ data: { email } });
      setSendMessage((current) => ({ ...current, [email]: "Sent via AgentMail." }));
      await refresh();
    } catch (error) {
      setSendMessage((current) => ({ ...current, [email]: error instanceof Error ? error.message : "Invitation could not be sent." }));
    } finally {
      setSendingTo(null);
    }
  };

  const reviewApplication = async (applicationId: string, decision: "approve" | "deny") => {
    if (decision === "deny" && !window.confirm("Deny this Founding Beta application? No entitlement will be granted.")) return;
    setReviewingId(applicationId);
    setReviewNotice("");
    try {
      const result = await reviewFoundingBetaApplication({ data: { applicationId, decision } });
      const outcome = decision === "approve" ? "Approved" : "Denied";
      setReviewNotice(
        result.notificationSent
          ? `${outcome}. Applicant notification sent via AgentMail.`
          : `${outcome}. The entitlement decision was saved, but the applicant email failed: ${result.notificationError ?? "unknown error"}`,
      );
      await refresh();
    } catch (error) {
      setReviewNotice(error instanceof Error ? error.message : "Application review failed.");
    } finally {
      setReviewingId(null);
    }
  };

  const retryDecisionEmail = async (applicationId: string) => {
    setRetryingId(applicationId);
    setReviewNotice("");
    try {
      await retryFoundingBetaDecisionEmail({ data: { applicationId } });
      setReviewNotice("Applicant decision notification sent via AgentMail.");
      await refresh();
    } catch (error) {
      setReviewNotice(error instanceof Error ? error.message : "Decision email could not be sent.");
    } finally {
      setRetryingId(null);
    }
  };

  return createPortal(
    <section className="mb-10 border border-system/30 bg-system-soft/20 dark:bg-ink/35" aria-labelledby="founding-beta-cohort-title">
      <div className="flex flex-col gap-5 border-b border-system/20 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-system-dark dark:text-system">Owner · Founding Beta</p>
          <h2 id="founding-beta-cohort-title" className="mt-2 font-display text-3xl tracking-[-0.025em] text-ink dark:text-mineral">Who needs a decision, invitation, or follow-up?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Applications, reserved access, and active Founding Beta members stay in one owner-only operating surface. New application state refreshes automatically while this dashboard is open.</p>
          {reviewNotice ? <p className="mt-3 border-l border-system/40 pl-3 text-xs leading-5 text-ink dark:text-mineral">{reviewNotice}</p> : null}
        </div>
        <div className="flex shrink-0 gap-6">
          <div className={metrics.applications.length > 0 ? "border-l border-human/50 pl-5" : "border-l border-system/35 pl-5"}>
            <p className="font-display text-4xl text-ink dark:text-mineral">{metrics.applications.length}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-human-dark dark:text-human">Pending applications</p>
          </div>
          <div className="border-l border-system/35 pl-5">
            <p className="font-display text-4xl text-ink dark:text-mineral">{metrics.foundingBetaCount}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-system-dark dark:text-system">Beta members</p>
          </div>
        </div>
      </div>

      <div className="border-b border-human/25 bg-human-soft/20 px-5 py-5 dark:bg-human-soft/10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-human-dark dark:text-human">Application review</p>
            <h3 className="mt-2 font-display text-2xl text-ink dark:text-mineral">Approve or deny directly here.</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Approval immediately grants permanent Founding Beta to an existing account, or creates a durable reservation for a pre-account applicant. Denial grants nothing. Either decision automatically attempts an AgentMail notification.</p>
          </div>
          <span className="font-display text-3xl text-ink dark:text-mineral">{metrics.applications.length}</span>
        </div>
        {metrics.applications.length === 0 ? (
          <p className="mt-4 text-sm text-warm-gray-dark dark:text-warm-gray">No Founding Beta applications are waiting for review.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {metrics.applications.map((application) => (
              <article key={application.id} className="border-t border-human/25 pt-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink dark:text-mineral">{application.name || application.email}</p>
                      <span className="border border-human/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-human-dark dark:text-human">{application.source}</span>
                      {application.source.toLowerCase() === "ashwood" ? <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-human-dark dark:text-human">Ashwood referral</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-warm-gray-dark dark:text-warm-gray">{application.email} · Applied {formatDate(application.created_at)}</p>
                    <dl className="mt-4 grid gap-3 text-xs leading-5 sm:grid-cols-2">
                      <div><dt className="font-mono text-[9px] uppercase tracking-[0.09em] text-warm-gray-dark dark:text-warm-gray">What ALVIRA should understand</dt><dd className="mt-1 text-ink dark:text-mineral">{application.use_case}</dd></div>
                      <div><dt className="font-mono text-[9px] uppercase tracking-[0.09em] text-warm-gray-dark dark:text-warm-gray">Why they want to test</dt><dd className="mt-1 text-ink dark:text-mineral">{application.motivation}</dd></div>
                      <div><dt className="font-mono text-[9px] uppercase tracking-[0.09em] text-warm-gray-dark dark:text-warm-gray">AI use</dt><dd className="mt-1 text-ink dark:text-mineral">{application.ai_frequency}{application.ai_tools ? ` · ${application.ai_tools}` : ""}</dd></div>
                      <div><dt className="font-mono text-[9px] uppercase tracking-[0.09em] text-warm-gray-dark dark:text-warm-gray">Feedback commitment</dt><dd className="mt-1 text-ink dark:text-mineral">{application.feedback_commitment}</dd></div>
                    </dl>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => void reviewApplication(application.id, "deny")} disabled={reviewingId === application.id} className="border border-human/35 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-human-dark transition hover:border-human disabled:cursor-wait disabled:opacity-50 dark:text-human">Deny</button>
                    <button type="button" onClick={() => void reviewApplication(application.id, "approve")} disabled={reviewingId === application.id} className="border border-system/50 bg-system-soft/30 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-system-dark transition hover:border-system disabled:cursor-wait disabled:opacity-50 dark:text-system">{reviewingId === application.id ? "Saving…" : "Approve"}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {metrics.recentApplicationDecisions.length > 0 ? (
          <div className="mt-6 border-t border-human/20 pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-warm-gray-dark dark:text-warm-gray">Recent decisions</p>
            <div className="mt-2 space-y-2">
              {metrics.recentApplicationDecisions.map((application) => (
                <div key={application.id} className="grid gap-2 border-t border-ink/10 pt-2 text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center dark:border-mineral/10">
                  <div><span className="font-medium text-ink dark:text-mineral">{application.email}</span><span className="ml-2 text-warm-gray-dark dark:text-warm-gray">{application.status} · {application.entitlement_mode ?? "none"} · {formatDate(application.reviewed_at)}</span></div>
                  <span className={application.decision_email_sent_at ? "text-system-dark dark:text-system" : "text-human-dark dark:text-human"}>{application.decision_email_sent_at ? "Email sent" : "Email needs retry"}</span>
                  {!application.decision_email_sent_at ? <button type="button" onClick={() => void retryDecisionEmail(application.id)} disabled={retryingId === application.id} className="border border-human/30 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-human-dark disabled:opacity-50 dark:text-human">{retryingId === application.id ? "Sending…" : "Retry email"}</button> : <span />}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-b border-system/20 px-5 py-5 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-system-dark dark:text-system">Reserved access</p>
            <h3 className="mt-2 font-display text-2xl text-ink dark:text-mineral">Pre-account invitations</h3>
            <p className="mt-2 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Only the owner can send these invitations. A reservation is rechecked before sending, and the AgentMail receipt is stored so the same initial invitation cannot be sent twice.</p>
          </div>
          <span className="font-display text-3xl text-ink dark:text-mineral">{metrics.reservations.length}</span>
        </div>
        {metrics.reservations.length === 0 ? (
          <p className="mt-4 text-sm text-warm-gray-dark dark:text-warm-gray">No unclaimed Founding Beta reservations.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {metrics.reservations.map((reservation) => (
              <div key={reservation.email} className="grid gap-3 border-t border-system/15 pt-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-mineral">{reservation.email}</p>
                  <p className="mt-1 font-mono text-[9px] text-warm-gray-dark dark:text-warm-gray">Reserved {formatDate(reservation.reserved_at)} · {reservation.source}</p>
                  {reservation.invite_sent_at ? <p className="mt-1 text-xs text-system-dark dark:text-system">Invited {formatDate(reservation.invite_sent_at)}</p> : null}
                  {sendMessage[reservation.email] ? <p className="mt-1 text-xs text-warm-gray-dark dark:text-warm-gray">{sendMessage[reservation.email]}</p> : null}
                </div>
                {reservation.invite_sent_at ? (
                  <span className="border border-system/30 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-system-dark dark:text-system">Invited</span>
                ) : (
                  <button type="button" onClick={() => void sendReservationInvite(reservation.email)} disabled={sendingTo === reservation.email} className="border border-system/40 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-system-dark transition hover:border-system disabled:cursor-wait disabled:opacity-50 dark:text-system">{sendingTo === reservation.email ? "Sending…" : "Send invitation"}</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {metrics.members.length === 0 ? (
        <p className="px-6 py-8 text-sm text-warm-gray-dark dark:text-warm-gray">No Founding Beta entitlements are currently recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-ink/[0.035] font-mono text-[10px] uppercase tracking-[0.11em] text-warm-gray-dark dark:bg-white/[0.035] dark:text-warm-gray">
              <tr>
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Entitlement</th>
                <th className="px-4 py-3 font-medium">Contexts</th>
                <th className="px-4 py-3 font-medium">Feedback</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Last meaningful use</th>
              </tr>
            </thead>
            <tbody>
              {metrics.members.map((member) => (
                <tr key={member.user_id} className="border-t border-ink/10 align-top dark:border-mineral/10">
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink dark:text-mineral">{member.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="border border-system/35 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-system-dark dark:text-system">Founding Beta</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-warm-gray-dark dark:text-warm-gray">{member.tier}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-warm-gray-dark dark:text-warm-gray">{formatDate(member.granted_at)}</td>
                  <td className="px-4 py-4 font-display text-xl text-ink dark:text-mineral">{member.profile_count}</td>
                  <td className="px-4 py-4 font-display text-xl text-ink dark:text-mineral">{member.feedback_count}</td>
                  <td className="px-4 py-4"><p className="text-ink dark:text-mineral">{formatDate(member.last_login_at)}</p></td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-ink dark:text-mineral">{relativeDate(member.last_meaningful_at)}</p>
                    <p className="mt-1 text-xs text-warm-gray-dark dark:text-warm-gray">{member.last_meaningful_action ?? "Signed in, but no qualifying progress recorded yet."}</p>
                    {member.last_meaningful_at && <p className="mt-1 font-mono text-[9px] text-warm-gray-dark/80 dark:text-warm-gray/80">{formatDate(member.last_meaningful_at)}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>,
    target,
  );
}
