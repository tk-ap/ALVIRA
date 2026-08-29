import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/")({
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
  component: Home,
});

const loop = [
  ["01", "Capture", "Conversation, documents, links, files, and context you already have."],
  ["02", "Understand", "ALVIRA organizes evidence into a coherent model of how you think, work, and decide."],
  ["03", "Reflect", "Patterns, gaps, contradictions, and changes become visible instead of disappearing between chats."],
  ["04", "Update", "Your context remains living: editable, reviewable, and able to evolve as you do."],
  ["05", "Reuse", "Carry durable context into future AI work instead of rebuilding yourself from scratch."],
];

function Home() {
  return (
    <div className="min-h-dvh flex flex-col bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <Header />

      <main id="main-content" className="flex-1">
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
                href="/interview"
                className="inline-flex min-h-12 items-center justify-center border border-[#191715]/20 px-6 text-sm font-semibold text-[#4d453e] hover:border-[#191715]/40 hover:text-[#191715] dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white"
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#74685e] dark:text-[#93877c]">
              Already have context? <a href="/context" className="underline decoration-system/40 underline-offset-4 hover:decoration-system">Bring it with you.</a>
            </p>
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

        <section className="border-y border-[#191715]/10 bg-[#191715] text-[#f4f0e9] dark:border-white/10 dark:bg-[#111513]">
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
          <div className="grid gap-12 lg:grid-cols-[0.55fr_1.45fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Evidence of understanding</p>
            </div>
            <div>
              <h2 className="max-w-4xl font-display text-5xl leading-[0.95] tracking-[-0.035em] text-[#27231f] dark:text-[#ece4da] sm:text-6xl">
                The interface should show what ALVIRA understands — not just what you uploaded.
              </h2>
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {[
                  ["Carried forward", "Context already established should remain visible and trusted instead of being repeatedly re-collected."],
                  ["Still uncertain", "Gaps and inferences stay legible so ALVIRA can ask only what genuinely needs clarification."],
                  ["Changed", "New evidence can challenge an older assumption rather than silently overwrite it."],
                  ["Ready to reuse", "Confirmed understanding becomes durable context that travels into future AI work."],
                ].map(([title, body]) => (
                  <div key={title} className="border-t border-[#191715]/18 pt-5 dark:border-white/18">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#2d2925] dark:text-[#e5ddd4]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#12100e]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Start with what exists</p>
              </div>
              <div className="lg:col-span-2">
                <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl">Your context is already out there.</h2>
                <p className="mt-6 max-w-2xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94] sm:text-lg">
                  Bring the parts of yourself you want ALVIRA to understand. Existing sources become evidence; ALVIRA can then ask about genuine gaps instead of making you repeat what is already known.
                </p>

                <div className="mt-12 grid gap-8 sm:grid-cols-2">
                  {[
                    ["Conversation", "Tell ALVIRA directly through adaptive interviews and ongoing reflection."],
                    ["Documents", "Bring notes, journals, résumés, presentations, and existing AI context."],
                    ["Links", "Use selected websites, portfolios, profiles, and public sources as evidence."],
                    ["Files", "Add source material over time instead of forcing everything into one onboarding session."],
                  ].map(([title, body]) => (
                    <div key={title} className="border-t border-[#191715]/20 pt-5 dark:border-white/20">
                      <h3 className="text-base font-semibold text-[#27231f] dark:text-[#ece4da]">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="grid gap-12 border-b border-[#191715]/10 pb-20 dark:border-white/10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Portable by design</p>
              <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl">Know yourself once. Use that context everywhere.</h2>
            </div>
            <div className="lg:pt-10">
              <p className="max-w-2xl text-lg leading-8 text-[#6d6258] dark:text-[#a99f94]">
                ALVIRA is not meant to become another place where your context gets trapped. Confirmed understanding can be carried into the AI tools and workflows you already use.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                {["ChatGPT", "Claude", "Gemini", "Cursor", "Your agents"].map((tool) => (
                  <span key={tool} className="border border-[#191715]/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#5f574f] dark:border-white/15 dark:text-white/55">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-10 py-20 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Begin with context</p>
              <h2 className="mt-5 max-w-4xl font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-7xl">
                Better AI starts with a better understanding of you.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94] sm:text-lg">
                Start free, add what already exists, and let ALVIRA ask only for the context that is genuinely missing.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href="/app" className="inline-flex min-h-12 items-center justify-center bg-[#191715] px-7 text-sm font-semibold text-[#f4f0e9] hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]">
                Build your ALVIRA Context →
              </a>
              <a href="/pricing" className="inline-flex min-h-12 items-center justify-center border border-[#191715]/20 px-7 text-sm font-semibold text-[#4d453e] hover:border-[#191715]/40 dark:border-white/20 dark:text-white/70 dark:hover:border-white/40">
                View pricing
              </a>
            </div>
          </div>
        </section>
      </main>

      <TrustFooter />
    </div>
  );
}
