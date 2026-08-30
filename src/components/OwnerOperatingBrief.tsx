import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getOwnerOperatingBrief, type OwnerOperatingBrief as Brief } from "~/routes/-ownerOperatingBrief";

function fmt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function OwnerOperatingBrief() {
  const location = useLocation();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      setTarget(null);
      setBrief(null);
      setDenied(false);
      return;
    }
    const frame = requestAnimationFrame(() => {
      setTarget(document.querySelector<HTMLElement>("main#main-content .mx-auto.max-w-4xl"));
    });
    getOwnerOperatingBrief().then(setBrief).catch(() => setDenied(true));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  if (location.pathname !== "/dashboard" || !target || denied || !brief) return null;

  const alerts = [
    brief.changes.newSignupCount > 0 ? `${brief.changes.newSignupCount} new signup${brief.changes.newSignupCount === 1 ? "" : "s"}` : null,
    brief.changes.newFoundingBetaCount > 0 ? `${brief.changes.newFoundingBetaCount} new Founding Beta member${brief.changes.newFoundingBetaCount === 1 ? "" : "s"}` : null,
    brief.changes.newFeedbackCount > 0 ? `${brief.changes.newFeedbackCount} new beta feedback submission${brief.changes.newFeedbackCount === 1 ? "" : "s"}` : null,
    brief.changes.newlyMeaningfulUsers > 0 ? `${brief.changes.newlyMeaningfulUsers} user${brief.changes.newlyMeaningfulUsers === 1 ? "" : "s"} made meaningful product progress` : null,
  ].filter(Boolean) as string[];

  const kpis = [
    ["New signups · 7d", brief.health.signups7d],
    ["Meaningful users · 7d", brief.health.meaningfulUsers7d],
    ["Meaningful users · 30d", brief.health.meaningfulUsers30d],
    ["Contexts updated · 7d", brief.health.contextsUpdated7d],
    ["Interview completion · 7d", brief.health.interviewCompletionRate7d == null ? "—" : `${brief.health.interviewCompletionRate7d}%`],
    ["Beta activated", brief.health.foundingBetaActivationRate == null ? "—" : `${brief.health.foundingBetaActivationRate}%`],
    ["Beta active · 7d", `${brief.health.foundingBetaActive7d}/${brief.health.foundingBetaTotal}`],
    ["Beta dormant · 14d", brief.health.foundingBetaDormant14d],
    ["Beta feedback contributors", brief.health.foundingBetaFeedbackContributors],
  ] as const;

  return createPortal(
    <section className="mb-10 border border-ink/12 bg-[#f4f0e9] dark:border-mineral/12 dark:bg-[#0d1110]" aria-labelledby="owner-operating-brief-title">
      <div className="grid gap-6 border-b border-ink/10 px-5 py-5 dark:border-mineral/10 sm:px-6 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-system-dark dark:text-system">Owner operating brief</p>
          <h2 id="owner-operating-brief-title" className="mt-2 font-display text-3xl tracking-[-0.025em] text-ink dark:text-mineral">What changed since you were here?</h2>
          <p className="mt-2 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">
            {brief.firstBrief ? "First brief uses the last 7 days as its baseline." : `Since ${fmt(brief.since)}.`} Passive page views are excluded from meaningful-use KPIs.
          </p>
        </div>
        <div className="border-l border-system/30 pl-5">
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => <p key={alert} className="font-mono text-xs leading-5 text-ink dark:text-mineral"><span className="mr-2 text-system-dark dark:text-system">●</span>{alert}</p>)}
            </div>
          ) : (
            <p className="text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">No new owner alerts since the previous dashboard check.</p>
          )}
        </div>
      </div>

      {brief.changes.newSignups.length > 0 && (
        <div className="border-b border-ink/10 px-5 py-4 dark:border-mineral/10 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">New accounts</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {brief.changes.newSignups.map((signup) => (
              <div key={`${signup.email}-${signup.created_at}`} className="flex items-center justify-between gap-4 border-t border-ink/10 pt-2 dark:border-mineral/10">
                <div><p className="text-sm font-medium text-ink dark:text-mineral">{signup.email}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-warm-gray-dark dark:text-warm-gray">{signup.tier}</p></div>
                <span className="whitespace-nowrap font-mono text-[9px] text-warm-gray-dark dark:text-warm-gray">{fmt(signup.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-px bg-ink/10 dark:bg-mineral/10 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map(([label, value]) => (
          <div key={label} className="bg-[#f4f0e9] px-4 py-5 dark:bg-[#0d1110]">
            <p className="font-display text-3xl tracking-[-0.025em] text-ink dark:text-mineral">{value}</p>
            <p className="mt-2 font-mono text-[9px] uppercase leading-4 tracking-[0.1em] text-warm-gray-dark dark:text-warm-gray">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 border-t border-ink/10 px-5 py-4 text-xs leading-5 text-warm-gray-dark dark:border-mineral/10 dark:text-warm-gray sm:grid-cols-3 sm:px-6">
        <p><strong className="text-ink dark:text-mineral">Meaningful user</strong><br />Interview progress, Context/Reflect update, Bridge connection, reuse/export, or Dossier activity.</p>
        <p><strong className="text-ink dark:text-mineral">Beta activated</strong><br />A Founding Beta member has completed at least one meaningful product action after entitlement.</p>
        <p><strong className="text-ink dark:text-mineral">Beta dormant</strong><br />Entitled at least 14 days ago with no meaningful product use in the last 14 days.</p>
      </div>
    </section>,
    target,
  );
}
