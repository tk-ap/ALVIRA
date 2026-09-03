import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getOwnerDashboardDepth, sendInterviewFollowUp, type OwnerDashboardDepth as Depth } from "~/routes/-ownerDashboardDepth";

function percent(part: number, total: number) {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "—";
}

function followUpLabel(kind: "interview_not_started" | "interview_incomplete") {
  return kind === "interview_incomplete" ? "Send continue reminder" : "Send start reminder";
}

export function OwnerDashboardDepth() {
  const location = useLocation();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [data, setData] = useState<Depth | null>(null);
  const [denied, setDenied] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sendMessage, setSendMessage] = useState<Record<string, string>>({});

  const refresh = () => getOwnerDashboardDepth().then(setData).catch(() => setDenied(true));

  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      setTarget(null);
      setData(null);
      setDenied(false);
      return;
    }
    const frame = requestAnimationFrame(() => {
      setTarget(document.querySelector<HTMLElement>("main#main-content .mx-auto.max-w-4xl"));
    });
    refresh();
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  if (location.pathname !== "/dashboard" || !target || denied || !data) return null;

  const adoption = [
    ["Context", data.adoption.contextUsers30d],
    ["Reflect", data.adoption.reflectUsers30d],
    ["Bridge", data.adoption.bridgeUsers30d],
    ["Export / reuse", data.adoption.exportUsers30d],
  ] as const;

  const sendFollowUp = async (email: string) => {
    setSendingTo(email);
    setSendMessage((current) => ({ ...current, [email]: "" }));
    try {
      await sendInterviewFollowUp({ data: { email } });
      setSendMessage((current) => ({ ...current, [email]: "Sent via AgentMail." }));
      await refresh();
    } catch (error) {
      setSendMessage((current) => ({ ...current, [email]: error instanceof Error ? error.message : "Follow-up could not be sent." }));
    } finally {
      setSendingTo(null);
    }
  };

  return createPortal(
    <section className="mb-10 space-y-6" aria-labelledby="owner-depth-title">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-system-dark dark:text-system">Owner · operating depth</p>
        <h2 id="owner-depth-title" className="mt-2 font-display text-3xl tracking-[-0.025em] text-ink dark:text-mineral">Where is the product working — and where does it need intervention?</h2>
      </div>

      <div className="grid gap-px border border-ink/10 bg-ink/10 dark:border-mineral/10 dark:bg-mineral/10 md:grid-cols-4">
        {[
          ["Customer accounts", data.commercial.customerAccounts],
          ["Paid accounts", data.commercial.paidAccounts],
          ["Pro", data.commercial.proAccounts],
          ["Lifetime", data.commercial.lifetimeAccounts],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#f4f0e9] p-5 dark:bg-[#0d1110]">
            <p className="font-display text-3xl text-ink dark:text-mineral">{value}</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-warm-gray-dark dark:text-warm-gray">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="border border-ink/12 bg-[#f4f0e9] p-5 dark:border-mineral/12 dark:bg-[#0d1110] sm:p-6">
          <div className="flex items-end justify-between gap-4 border-b border-ink/10 pb-4 dark:border-mineral/10">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Commercial proof</p><h3 className="mt-2 font-display text-2xl text-ink dark:text-mineral">Conversion, not vanity growth.</h3></div>
            <p className="font-display text-4xl text-ink dark:text-mineral">{data.commercial.paidConversionRate == null ? "—" : `${data.commercial.paidConversionRate}%`}</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Paid conversion is calculated from non-owner, non-test customer accounts currently marked Pro or Lifetime.</p>
          <div className="mt-5 border-l border-human/50 pl-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-human-dark dark:text-human">Revenue instrumentation gap</p>
            <p className="mt-2 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Exact MRR, ARR-equivalent, refunds, and realized Lifetime revenue are not shown yet because ALVIRA does not persist a trustworthy billing ledger. Tier counts are visible; revenue is intentionally not inferred.</p>
          </div>
        </article>

        <article className="border border-ink/12 bg-[#f4f0e9] p-5 dark:border-mineral/12 dark:bg-[#0d1110] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Feature adoption · 30d</p>
          <h3 className="mt-2 font-display text-2xl text-ink dark:text-mineral">Are people reaching the deeper loop?</h3>
          <p className="mt-2 text-sm text-warm-gray-dark dark:text-warm-gray">{data.adoption.activeUsers30d} meaningful users observed in the last 30 days.</p>
          <div className="mt-5 space-y-3">
            {adoption.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-ink/10 pt-3 dark:border-mineral/10">
                <span className="text-sm text-ink dark:text-mineral">{label}</span>
                <span className="font-display text-xl text-ink dark:text-mineral">{value}</span>
                <span className="w-12 text-right font-mono text-[9px] text-warm-gray-dark dark:text-warm-gray">{percent(value, data.adoption.activeUsers30d)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <article className="border border-human/25 bg-human-soft/25 p-5 dark:bg-human-soft/15 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-human-dark dark:text-human">Intervention queue</p><h3 className="mt-2 font-display text-2xl text-ink dark:text-mineral">People who may need attention.</h3></div>
            <span className="font-display text-3xl text-ink dark:text-mineral">{data.interventions.length}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">Incomplete first-Context signals include a private owner-only AgentMail follow-up. ALVIRA rechecks eligibility at send time, so users who have since completed Context cannot be emailed by this control.</p>
          {data.interventions.length === 0 ? (
            <p className="mt-5 text-sm text-warm-gray-dark dark:text-warm-gray">No current intervention signals matched the dashboard rules.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {data.interventions.map((item) => (
                <div key={`${item.email}-${item.reason}`} className="border-t border-human/20 pt-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                    <p className="text-sm font-medium text-ink dark:text-mineral">{item.email}</p>
                    <p className="text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">{item.reason}</p>
                    <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${item.severity === "risk" ? "text-human-dark dark:text-human" : "text-warm-gray-dark dark:text-warm-gray"}`}>{item.ageDays}d</span>
                  </div>
                  {item.followUpKind ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void sendFollowUp(item.email)}
                        disabled={sendingTo === item.email}
                        className="border border-ink/20 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ink transition hover:border-ink/50 disabled:cursor-wait disabled:opacity-50 dark:border-mineral/25 dark:text-mineral dark:hover:border-mineral/60"
                      >
                        {sendingTo === item.email ? "Sending…" : followUpLabel(item.followUpKind)}
                      </button>
                      {item.lastFollowUpAt ? (
                        <span className="font-mono text-[9px] text-warm-gray-dark dark:text-warm-gray">Last sent {new Date(item.lastFollowUpAt).toLocaleDateString()} · {item.followUpCount} total</span>
                      ) : (
                        <span className="font-mono text-[9px] text-warm-gray-dark dark:text-warm-gray">No follow-up sent</span>
                      )}
                      {sendMessage[item.email] ? <span className="text-xs text-warm-gray-dark dark:text-warm-gray">{sendMessage[item.email]}</span> : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="border border-ink/12 bg-[#f4f0e9] p-5 dark:border-mineral/12 dark:bg-[#0d1110] sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Feedback health · 30d</p>
          <div className="mt-5 grid grid-cols-2 gap-px bg-ink/10 dark:bg-mineral/10">
            {[
              ["Total", data.feedback.total30d],
              ["Blockers", data.feedback.blockers30d],
              ["Major", data.feedback.majors30d],
              ["Confusing", data.feedback.confusing30d],
              ["Broke", data.feedback.broke30d],
              ["Pending beta apps", data.feedback.pendingApplications],
            ].map(([label, value]) => <div key={label} className="bg-[#f4f0e9] p-4 dark:bg-[#0d1110]"><p className="font-display text-2xl text-ink dark:text-mineral">{value}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.09em] text-warm-gray-dark dark:text-warm-gray">{label}</p></div>)}
          </div>
          <p className="mt-4 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray"><strong className="text-ink dark:text-mineral">{data.feedback.betaMembersWithoutFeedback}</strong> Founding Beta member{data.feedback.betaMembersWithoutFeedback === 1 ? "" : "s"} have not submitted feedback yet.</p>
        </article>
      </div>

      <div className="border-l border-iridescent/45 pl-4 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">
        <p><strong className="text-ink dark:text-mineral">System-health boundary:</strong> {data.telemetry.note}</p>
      </div>
    </section>,
    target,
  );
}
