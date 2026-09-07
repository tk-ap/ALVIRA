export function BuildBriefEducation() {
  return (
    <section
      aria-labelledby="build-brief-explainer"
      className="border-b border-ink/10 px-6 py-8 dark:border-mineral/10 sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">
              Explain this
            </p>
            <h2 id="build-brief-explainer" className="mt-3 font-display text-3xl leading-none sm:text-4xl">
              What is a Build Brief?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-warm-gray-dark dark:text-warm-gray">
              A Build Brief tells an AI builder what you want made, why it should exist, what it needs to do, what matters about the experience, and where the first version should stop. ALVIRA uses the relevant parts of your Context so you do not have to remember and re-explain everything from scratch.
            </p>
          </div>

          <div className="divide-y divide-ink/10 border-y border-ink/10 dark:divide-mineral/10 dark:border-mineral/10">
            <details className="group py-4">
              <summary className="cursor-pointer list-none font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink dark:text-mineral">
                Why you care
              </summary>
              <p className="mt-3 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">
                A one-line idea leaves a builder room to guess. A reviewed brief makes the important goals, constraints, non-goals, and success criteria explicit before work starts, which should reduce avoidable corrections later.
              </p>
            </details>
            <details className="group py-4">
              <summary className="cursor-pointer list-none font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink dark:text-mineral">
                Go deeper
              </summary>
              <p className="mt-3 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">
                The Build Brief is the canonical, human-reviewable artifact. The prompt or wrapper sent to cto.new, Base44, or another builder is only an adapter. Context provides understanding; the brief captures the current intent; the execution environment does the building.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
