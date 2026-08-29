import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/brand-preview")({
  head: () => ({
    meta: [
      { title: "ALVIRA — Context Intelligence" },
      {
        name: "description",
        content:
          "ALVIRA builds living context intelligence so AI can understand how you think, work, decide, and change over time.",
      },
    ],
  }),
  component: BrandPreview,
});

const loop = [
  ["01", "Capture", "Conversation, documents, links, files, and context you already have."],
  ["02", "Understand", "ALVIRA organizes evidence into a coherent model of how you think, work, and decide."],
  ["03", "Reflect", "Patterns, gaps, contradictions, and changes become visible instead of disappearing between chats."],
  ["04", "Update", "Your context remains living: editable, reviewable, and able to evolve as you do."],
  ["05", "Reuse", "Carry durable context into future AI work instead of rebuilding yourself from scratch."],
];

function BrandPreview() {
  return (
    <div className="min-h-dvh bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <header className="border-b border-[#191715]/10 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <a href="/brand-preview" aria-label="ALVIRA brand preview home" className="flex items-center">
            <img
              src="/brand/alvira-wordmark-primary-light.svg"
              alt="ALVIRA"
              className="h-7 w-auto dark:hidden"
            />
            <img
              src="/brand/alvira-wordmark-primary-dark.svg"
              alt="ALVIRA"
              className="hidden h-7 w-auto dark:block"
            />
          </a>

          <div className="flex items-center gap-5">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-[#6d6258] dark:text-[#a99f94] sm:inline">
              Context Intelligence
            </span>
            <a
              href="/"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#191715]/65 underline decoration-[#191715]/20 underline-offset-4 hover:text-[#191715] dark:text-white/60 dark:decoration-white/20 dark:hover:text-white"
            >
              Current site ↗
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-14 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-32">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">
              ALVIRA / Context Intelligence
            </p>

            <h1 className="mt-7 max-w-5xl font-display text-[clamp(4rem,9vw,8.8rem)] leading-[0.82] tracking-[-0.055em] text-[#191715] dark:text-[#f4f0e9]">
              AI knows
              <br />
              a lot.
            </h1>

            <div className="mt-10 max-w-2xl border-l border-system/60 pl-5 sm:mt-12 sm:pl-7">
              <p className="font-display text-3xl leading-[1.02] tracking-[-0.025em] text-[#5c5148] dark:text-[#c9bdb0] sm:text-4xl">
                What becomes possible when it actually knows you?
              </p>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94] sm:text-lg">
                ALVIRA builds a living understanding of your goals, preferences, history, constraints, patterns, projects, and decisions — then keeps that context useful as you change.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/app"
                className="inline-flex min-h-12 items-center justify-center bg-[#191715] px-6 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]"
              >
                Build your ALVIRA Context
                <span className="ml-3" aria-hidden="true">→</span>
              </a>
              <a
                href="#system"
                className="inline-flex min-h-12 items-center justify-center border border-[#191715]/20 px-6 text-sm font-semibold text-[#4d453e] hover:border-[#191715]/40 hover:text-[#191715] dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white"
              >
                See the intelligence loop
              </a>
            </div>
          </div>

          <aside className="lg:justify-self-end">
            <div className="max-w-md border-t border-[#191715]/20 pt-5 dark:border-white/20">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#74685e] dark:text-[#93877c]">The missing layer</p>
              <p className="mt-5 font-display text-4xl leading-[0.98] tracking-[-0.03em] text-[#2c2824] dark:text-[#e0d7cd] sm:text-5xl">
                Intelligence without context is still guessing.
              </p>
              <p className="mt-7 text-sm leading-7 text-[#6d6258] dark:text-[#a99f94]">
                Most AI begins every relationship with fragments. ALVIRA gives that relationship continuity: what is known, what changed, what is uncertain, and what still needs to be understood.
              </p>
            </div>
          </aside>
        </section>

        <section id="system" className="border-y border-[#191715]/10 bg-[#191715] text-[#f4f0e9] dark:border-white/10 dark:bg-[#111513]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">A living system</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">
                  Context should not end when onboarding does.
                </h2>
                <p className="mt-7 max-w-md text-base leading-7 text-white/58">
                  ALVIRA is designed around a continuous loop rather than a one-time profile. Understanding should deepen, change, and remain available to the AI systems you choose to use.
                </p>
              </div>

              <div className="divide-y divide-white/12 border-y border-white/12">
                {loop.map(([number, title, body]) => (
                  <div key={title} className="grid gap-3 py-6 sm:grid-cols-[4rem_9rem_1fr] sm:items-baseline sm:gap-5">
                    <span className="font-mono text-xs text-system">{number}</span>
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="text-sm leading-6 text-white/55">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="grid gap-12 border-b border-[#191715]/10 pb-16 dark:border-white/10 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Evidence of understanding</p>
            </div>
            <div className="lg:col-span-2">
              <h2 className="max-w-4xl font-display text-5xl leading-[0.95] tracking-[-0.035em] text-[#27231f] dark:text-[#ece4da] sm:text-6xl">
                The interface should show what ALVIRA understands — not just what you uploaded.
              </h2>
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {[
                  ["Carried forward", "Context already established should remain visible and trusted instead of being repeatedly re-collected."],
                  ["Still uncertain", "Gaps and inferences should be legible so ALVIRA can ask only what genuinely needs clarification."],
                  ["Changed", "New evidence should be able to challenge an older assumption rather than silently overwrite it."],
                  ["Ready to reuse", "Confirmed understanding should become durable context that travels into future AI work."],
                ].map(([title, body]) => (
                  <div key={title} className="border-t border-[#191715]/18 pt-5 dark:border-white/18">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#2d2925] dark:text-[#e5ddd4]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 py-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#74685e] dark:text-[#93877c]">Brand refresh / Stage 1</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">
                This route is intentionally isolated from the current homepage and product flows so the visual and positioning direction can be evaluated before it inherits into the live application.
              </p>
            </div>
            <a href="/app" className="text-sm font-semibold underline decoration-system/50 underline-offset-4 hover:decoration-system">Enter current product →</a>
          </div>
        </section>
      </main>
    </div>
  );
}
