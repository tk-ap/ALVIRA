import { useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getOwnerCohortMetrics, type FoundingBetaApplicationActivity } from "~/routes/-ownerCohort";
import { getFoundingBetaAIRecommendation, type FoundingBetaAIReview } from "~/routes/-foundingBetaAIReview";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function labelRecommendation(value: FoundingBetaAIReview["recommendation"]) {
  return value === "approve" ? "Recommend approve" : value === "deny" ? "Recommend deny" : "Needs owner review";
}

export function OwnerFoundingBetaAIReview() {
  const location = useLocation();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [applications, setApplications] = useState<FoundingBetaApplicationActivity[]>([]);
  const [reviews, setReviews] = useState<Record<string, FoundingBetaAIReview>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      setTarget(null);
      setApplications([]);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setTarget(document.querySelector<HTMLElement>("main#main-content .mx-auto.max-w-4xl"));
    });
    const load = async () => {
      try {
        const metrics = await getOwnerCohortMetrics();
        setApplications(metrics.applications);
      } catch {
        setApplications([]);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 30_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [location.pathname]);

  const missingIds = useMemo(
    () => applications.map((app) => app.id).filter((id) => !reviews[id] && !errors[id]),
    [applications, reviews, errors],
  );

  useEffect(() => {
    if (missingIds.length === 0) return;
    let cancelled = false;
    const run = async () => {
      for (const applicationId of missingIds) {
        if (cancelled) return;
        try {
          const review = await getFoundingBetaAIRecommendation({ data: { applicationId } });
          if (!cancelled) setReviews((current) => ({ ...current, [applicationId]: review }));
        } catch (error) {
          if (!cancelled) setErrors((current) => ({ ...current, [applicationId]: error instanceof Error ? error.message : "AI review unavailable." }));
        }
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [missingIds]);

  if (location.pathname !== "/dashboard" || !target || applications.length === 0) return null;

  return createPortal(
    <section className="mb-10 border border-iridescent/30 bg-[#f4f0e9] p-5 dark:bg-[#0d1110] sm:p-6" aria-labelledby="founding-beta-ai-review-title">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-4 dark:border-mineral/10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Owner · AI application review</p>
          <h3 id="founding-beta-ai-review-title" className="mt-2 font-display text-2xl text-ink dark:text-mineral">A recommendation, not a decision.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">The model evaluates only the submitted application fields. It cannot approve or deny anyone, and it is instructed not to infer or use sensitive personal characteristics.</p>
        </div>
        <span className="font-display text-3xl text-ink dark:text-mineral">{applications.length}</span>
      </div>

      <div className="mt-4 space-y-5">
        {applications.map((application) => {
          const review = reviews[application.id];
          const error = errors[application.id];
          return (
            <article key={application.id} className="border-t border-ink/10 pt-4 dark:border-mineral/10">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-ink dark:text-mineral">{application.name || application.email}</p>
                <span className="border border-ink/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.09em] text-warm-gray-dark dark:border-mineral/15 dark:text-warm-gray">{application.source}</span>
                {application.source.toLowerCase() === "ashwood" ? <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-human-dark dark:text-human">Ashwood referral</span> : null}
              </div>
              <p className="mt-1 text-xs text-warm-gray-dark dark:text-warm-gray">{application.email} · {formatDate(application.created_at)}</p>

              <dl className="mt-4 grid gap-3 text-xs leading-5 sm:grid-cols-2">
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-warm-gray-dark dark:text-warm-gray">Use case / context need</dt><dd className="mt-1 text-ink dark:text-mineral">{application.use_case}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-warm-gray-dark dark:text-warm-gray">Motivation</dt><dd className="mt-1 text-ink dark:text-mineral">{application.motivation}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-warm-gray-dark dark:text-warm-gray">AI habits</dt><dd className="mt-1 text-ink dark:text-mineral">{application.ai_frequency}{application.ai_tools ? ` · ${application.ai_tools}` : ""}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.08em] text-warm-gray-dark dark:text-warm-gray">Feedback commitment</dt><dd className="mt-1 text-ink dark:text-mineral">{application.feedback_commitment}</dd></div>
              </dl>

              <div className="mt-4 border-l border-iridescent/45 pl-4">
                {!review && !error ? <p className="text-xs text-warm-gray-dark dark:text-warm-gray">Generating advisory recommendation…</p> : null}
                {error ? <p className="text-xs text-human-dark dark:text-human">{error}</p> : null}
                {review ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <strong className="text-sm text-ink dark:text-mineral">{labelRecommendation(review.recommendation)}</strong>
                      <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-warm-gray-dark dark:text-warm-gray">{Math.round(review.confidence * 100)}% confidence</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">{review.reasoning}</p>
                    <p className="mt-2 font-mono text-[9px] text-warm-gray-dark/80 dark:text-warm-gray/80">Advisory only · {review.model}</p>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>,
    target,
  );
}
