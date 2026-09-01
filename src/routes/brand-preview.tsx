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

const advancedPrinciples = [
  ["Portable context", "Your working context should not belong to one AI vendor, one model, or one session."],
  ["Continuity", "The tools you use should be able to work from what came before instead of repeatedly starting from zero."],
  ["Reflection", "Context should change when your goals, assumptions, projects, and circumstances change."],
  ["Selective access", "Give each tool the context relevant to its task instead of handing everything to everything."],
];

function BrandPreview() {
  return (
    <div className="min-h-dvh bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <header className="border-b border-[#191715]/10 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <a href="/brand-preview" aria-label="ALVIRA brand preview home" className="flex items-center">
            <img src="/brand/alvira-wordmark-primary-light.svg" alt="ALVIRA" className="h-7 w-auto dark:hidden" />
            <img src="/brand/alvira-wordmark-primary-dark.svg" alt="ALVIRA" className="hidden h-7 w-auto dark:block" />
          </a>

          <div className="flex items-center gap-5">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-[#6d6258] dark:text-[#a99f94] sm:inline">Context Intelligence</span>
            <a href="/app" className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#191715]/65 underline decoration-[#191715]/20 underline-offset-4 hover:text-[#191715] dark:text-white/60 dark:decoration-white/20 dark:hover:text-white">Build context ↗</a>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-14 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-32">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">ALVIRA / Context Intelligence</p>

            <h1 className="mt-7 max-w-5xl font-display text-[clamp(4rem,9vw,8.8rem)] leading-[0.82] tracking-[-0.055em] text-[#191715] dark:text-[#f4f0e9]">
              AI knows
              <br />
              a lot.
            </h1>

            <div className="mt-10 max-w-2xl border-l border-system/60 pl-5 sm:mt-12 sm:pl-7">
              <p className="font-display text-3xl leading-[1.02] tracking-[-0.025em] text-[#5c5148] dark:text-[#c9bdb0] sm:text-4xl">What changes when it does not have to start over with you?</p>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94] sm:text-lg">ALVIRA builds a living context layer from what matters about you, your work, and your goals — then keeps that understanding useful as you change and as the AI tools around you change.</p>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#start" className="inline-flex min-h-12 items-center justify-center bg-[#191715] px-6 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]">Choose your starting point <span className="ml-3" aria-hidden="true">↓</span></a>
              <a href="/app" className="inline-flex min-h-12 items-center justify-center border border-[#191715]/20 px-6 text-sm font-semibold text-[#4d453e] hover:border-[#191715]/40 hover:text-[#191715] dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white">Build my context</a>
            </div>
          </div>

          <aside className="lg:justify-self-end">
            <div className="max-w-md border-t border-[#191715]/20 pt-5 dark:border-white/20">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#74685e] dark:text-[#93877c]">The missing layer</p>
              <p className="mt-5 font-display text-4xl leading-[0.98] tracking-[-0.03em] text-[#2c2824] dark:text-[#e0d7cd] sm:text-5xl">Your AI tools are powerful. Their understanding of you is fragmented.</p>
              <p className="mt-7 text-sm leading-7 text-[#6d6258] dark:text-[#a99f94]">Prompts, chats, documents, decisions, preferences, and project history live in different places. ALVIRA turns those fragments into context that can carry forward.</p>
            </div>
          </aside>
        </section>

        <section id="start" className="border-y border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#111513]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Start where you are</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.04em] text-[#27231f] dark:text-[#ece4da] sm:text-6xl">You do not need the same explanation as everyone else.</h2>
                <p className="mt-7 max-w-md text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">ALVIRA is one product. The entry point changes based on what you already understand about working with AI.</p>
              </div>

              <div className="grid gap-px overflow-hidden border border-[#191715]/12 bg-[#191715]/12 dark:border-white/12 dark:bg-white/12 md:grid-cols-2">
                <a href="#foundational" className="group flex min-h-[26rem] flex-col justify-between bg-[#f4f0e9] p-7 transition-colors hover:bg-[#efe8dd] dark:bg-[#0b0e0e] dark:hover:bg-[#121615] sm:p-9">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#74685e] dark:text-[#93877c]">01 / New to AI continuity</p>
                    <h3 className="mt-7 font-display text-4xl leading-[0.98] tracking-[-0.03em] text-[#2c2824] dark:text-[#e0d7cd] sm:text-5xl">I want AI to understand me better.</h3>
                    <p className="mt-6 text-sm leading-7 text-[#6d6258] dark:text-[#a99f94]">Start with the problem: why useful AI still makes you repeat yourself, lose continuity, and rebuild context from scratch.</p>
                  </div>
                  <span className="mt-10 text-sm font-semibold text-[#2d2925] underline decoration-system/50 underline-offset-4 group-hover:decoration-system dark:text-[#ece4da]">Help me understand why this matters →</span>
                </a>

                <a href="#experienced" className="group flex min-h-[26rem] flex-col justify-between bg-[#191715] p-7 text-[#f4f0e9] transition-colors hover:bg-[#23201d] dark:bg-[#171b19] dark:hover:bg-[#1d221f] sm:p-9">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-system">02 / Already working with AI</p>
                    <h3 className="mt-7 font-display text-4xl leading-[0.98] tracking-[-0.03em] sm:text-5xl">I already use AI. I want it to stop starting over.</h3>
                    <p className="mt-6 text-sm leading-7 text-white/58">Skip the AI primer. See how a portable context layer changes the way your existing agents and tools work with you.</p>
                  </div>
                  <span className="mt-10 text-sm font-semibold underline decoration-system/50 underline-offset-4 group-hover:decoration-system">Show me the better architecture →</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="foundational" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Path 01 / The problem first</p>
              <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.04em] text-[#27231f] dark:text-[#ece4da] sm:text-6xl">You should not have to become the prompt every time.</h2>
              <p className="mt-7 max-w-md text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">AI can be useful without really knowing you. That gap becomes obvious when every new conversation asks you to reconstruct your goals, history, preferences, constraints, and decisions.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-start xl:flex-row">
                <a href="/app" className="inline-flex min-h-12 items-center justify-center bg-[#191715] px-6 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]">Build my context <span className="ml-3" aria-hidden="true">→</span></a>
                <a href="#system" className="inline-flex min-h-12 items-center justify-center border border-[#191715]/20 px-6 text-sm font-semibold text-[#4d453e] hover:border-[#191715]/40 hover:text-[#191715] dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white">See what happens next</a>
              </div>
            </div>

            <div className="divide-y divide-[#191715]/12 border-y border-[#191715]/12 dark:divide-white/12 dark:border-white/12">
              {[
                ["01", "You already have the context", "Your goals, preferences, history, projects, decisions, and working patterns already exist — mostly in your head and across scattered places."],
                ["02", "AI sees fragments", "A model can respond intelligently to what is in front of it while still missing the larger picture of you and the work that came before."],
                ["03", "Continuity breaks", "The next chat, tool, or agent often begins with only part of what the last one learned, which means you spend time rebuilding the relationship."],
                ["04", "ALVIRA carries understanding forward", "ALVIRA turns those fragments into living context that can be reviewed, updated, and reused instead of reconstructed every time."],
              ].map(([number, title, body]) => (
                <div key={title} className="grid gap-3 py-7 sm:grid-cols-[4rem_12rem_1fr] sm:items-baseline sm:gap-5">
                  <span className="font-mono text-xs text-system-dark dark:text-system">{number}</span>
                  <h3 className="text-base font-semibold text-[#2d2925] dark:text-[#ece4da]">{title}</h3>
                  <p className="text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="experienced" className="scroll-mt-8 border-y border-white/10 bg-[#191715] text-[#f4f0e9] dark:bg-[#111513]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">Path 02 / The architecture first</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.04em] sm:text-6xl">Stop rebuilding context for every agent.</h2>
                <p className="mt-7 max-w-md text-base leading-7 text-white/58">If you already know what AI can do, the bottleneck is not capability. It is continuity. ALVIRA gives the tools you already use a living intelligence layer to work from.</p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-start xl:flex-row">
                  <a href="/app" className="inline-flex min-h-12 items-center justify-center bg-[#f4f0e9] px-6 text-sm font-semibold text-[#191715] transition-opacity hover:opacity-85">Create my context layer <span className="ml-3" aria-hidden="true">→</span></a>
                  <a href="#system" className="inline-flex min-h-12 items-center justify-center border border-white/20 px-6 text-sm font-semibold text-white/75 hover:border-white/40 hover:text-white">See how it stays current</a>
                </div>
              </div>

              <div className="grid gap-px border border-white/12 bg-white/12 sm:grid-cols-2">
                {advancedPrinciples.map(([title, body], index) => (
                  <div key={title} className="min-h-56 bg-[#191715] p-7 dark:bg-[#111513]">
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-system">0{index + 1}</span>
                    <h3 className="mt-8 font-display text-3xl leading-none tracking-[-0.025em]">{title}</h3>
                    <p className="mt-5 text-sm leading-6 text-white/55">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="system" className="border-b border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#0b0e0e]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">One living system</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.035em] text-[#27231f] dark:text-[#ece4da] sm:text-6xl">Context should not end when onboarding does.</h2>
                <p className="mt-7 max-w-md text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">Both entry paths arrive here: one ALVIRA Context that learns, reflects, updates, and becomes reusable across future AI work.</p>
              </div>

              <div className="divide-y divide-[#191715]/12 border-y border-[#191715]/12 dark:divide-white/12 dark:border-white/12">
                {loop.map(([number, title, body]) => (
                  <div key={title} className="grid gap-3 py-6 sm:grid-cols-[4rem_9rem_1fr] sm:items-baseline sm:gap-5">
                    <span className="font-mono text-xs text-system-dark dark:text-system">{number}</span>
                    <h3 className="text-base font-semibold text-[#2d2925] dark:text-[#ece4da]">{title}</h3>
                    <p className="text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="grid gap-12 border-b border-[#191715]/10 pb-16 dark:border-white/10 lg:grid-cols-3">
            <div className="lg:col-span-1"><p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Evidence of understanding</p></div>
            <div className="lg:col-span-2">
              <h2 className="max-w-4xl font-display text-5xl leading-[0.95] tracking-[-0.035em] text-[#27231f] dark:text-[#ece4da] sm:text-6xl">Do not just store what I said. Show me what you understand.</h2>
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {[
                  ["Carried forward", "Context already established remains available instead of being repeatedly re-collected."],
                  ["Still uncertain", "Gaps and inferences stay legible so ALVIRA can ask only what genuinely needs clarification."],
                  ["Changed", "New evidence can challenge an older assumption rather than silently overwrite it."],
                  ["Ready to reuse", "Confirmed understanding becomes durable context for future AI work."],
                ].map(([title, body]) => (
                  <div key={title} className="border-t border-[#191715]/18 pt-5 dark:border-white/18">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#2d2925] dark:text-[#e5ddd4]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Same product. Different starting point.</p>
              <h2 className="mt-5 max-w-4xl font-display text-5xl leading-[0.93] tracking-[-0.04em] text-[#27231f] dark:text-[#ece4da] sm:text-6xl">One living context. Many ways to work.</h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">Whether you came here to understand why continuity matters or because you already need a better architecture for your agents, the destination is the same: an ALVIRA Context that can grow with you.</p>
            </div>
            <div className="lg:justify-self-end">
              <a href="/app" className="inline-flex min-h-12 items-center justify-center bg-[#191715] px-7 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]">Build your ALVIRA Context <span className="ml-3" aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
