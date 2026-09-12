import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALVIRA — Context before capability" },
      {
        name: "description",
        content:
          "AI can do almost anything. ALVIRA helps you understand what actually matters, then gives AI the context to help in a direction that fits you.",
      },
    ],
  }),
  component: Home,
});

const contextSignals = [
  ["Goals", "Known", "What you are trying to move toward."],
  ["Priorities", "Known", "What matters when choices compete."],
  ["Constraints", "Changing", "Time, money, responsibilities, and limits."],
  ["Preferences", "Reusable", "How you like to work and receive help."],
  ["History", "Reusable", "Background that should not need repeating."],
  ["Open questions", "Uncertain", "What still needs clarification."],
] as const;

const understandingStates = [
  ["Known", "Established enough to rely on."],
  ["Changing", "Updated when new evidence changes the picture."],
  ["Uncertain", "Visible instead of silently guessed."],
  ["Reusable", "Available to carry into future AI work when appropriate."],
] as const;

const systemStages = ["Capture", "Understand", "Reflect", "Update", "Reuse"] as const;
const inputSources = ["Conversation", "Documents", "Links", "Files"] as const;
const tools = ["ChatGPT", "Claude", "Gemini", "Cursor", "Supported agents"] as const;

function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <Header />

      <main id="main-content" className="flex-1">
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-14 sm:px-8 sm:py-20 lg:min-h-[78vh] lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">
              ALVIRA
            </p>

            <h1 className="mt-6 max-w-5xl font-display text-[clamp(3rem,6.2vw,6rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-[#191715] dark:text-[#f4f0e9]">
              AI can do almost anything. <span className="text-[#685e54] dark:text-[#b8ada1]">The harder part is knowing what matters.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg sm:leading-8">
              ALVIRA builds and maintains an understanding of your goals, priorities, constraints, experiences, and preferences — so AI can help in a direction that actually fits you.
            </p>

            <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-system-dark dark:text-system">
              Context before capability.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/app"
                className="inline-flex min-h-13 items-center justify-center bg-[#191715] px-7 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]"
              >
                Start with a conversation <span className="ml-3" aria-hidden="true">→</span>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex min-h-13 items-center justify-center border border-[#191715]/20 px-7 text-sm font-semibold text-[#4d453e] transition-colors hover:border-[#191715]/40 hover:text-[#191715] dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white"
              >
                See how ALVIRA works
              </a>
            </div>

            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#74685e] dark:text-[#93877c]">
              No AI experience required.
            </p>
          </div>

          <aside className="lg:justify-self-end" aria-label="ALVIRA Context example">
            <div className="border border-[#191715]/14 bg-[#ebe4d8]/75 p-5 shadow-[0_20px_70px_rgba(25,23,21,0.08)] dark:border-white/12 dark:bg-white/[0.025] sm:p-6 lg:max-w-md">
              <div className="flex items-start justify-between gap-6 border-b border-[#191715]/12 pb-5 dark:border-white/12">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-system-dark dark:text-system">ALVIRA Context</p>
                  <p className="mt-2 font-display text-2xl leading-tight tracking-[-0.025em] text-[#27231f] dark:text-[#ece4da]">A living model of what matters.</p>
                </div>
                <span className="mt-1 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#6d6258] dark:text-white/45">
                  <span className="h-2 w-2 rounded-full bg-system motion-safe:animate-pulse" aria-hidden="true" />
                  maintained
                </span>
              </div>

              <div className="divide-y divide-[#191715]/10 dark:divide-white/10">
                {contextSignals.map(([label, state, description]) => (
                  <div key={label} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-[#27231f] dark:text-[#ece4da]">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6d6258] dark:text-[#a99f94]">{description}</p>
                    </div>
                    <span className="self-start border border-[#191715]/12 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5f554c] dark:border-white/12 dark:text-white/50">
                      {state}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 border-l border-system/55 pl-4">
                <p className="text-xs leading-5 text-[#5f554c] dark:text-[#b8ada1]">
                  You can inspect, correct, and evolve the understanding instead of leaving AI to infer it from scratch.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section id="why-context" className="border-y border-[#191715]/10 bg-[#191715] text-[#f4f0e9] dark:border-white/10 dark:bg-[#111513]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">The missing layer</p>
                <h2 className="mt-5 max-w-2xl font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">
                  Better AI still needs the useful background.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
                  Goals, constraints, history, preferences, decisions, and change are usually scattered across conversations or missing entirely. ALVIRA turns that fragmented background into maintained Context.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/48">
                  {["Goals", "Constraints", "History", "Preferences", "Decisions", "Change"].map((item) => (
                    <span key={item} className="border border-white/14 px-3 py-2">{item}</span>
                  ))}
                  <span className="px-2 text-system" aria-hidden="true">→</span>
                  <span className="border border-system/55 bg-system/[0.08] px-3 py-2 text-system">ALVIRA Context</span>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3 lg:pt-5">
                <div className="border-t border-white/18 pt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">Inference</p>
                  <p className="mt-4 font-display text-2xl leading-[1.04] tracking-[-0.02em] text-white">Less guessing.</p>
                  <p className="mt-3 text-sm leading-6 text-white/58">Useful background reduces the amount an AI has to reconstruct from one prompt or conversation.</p>
                </div>
                <div className="border-t border-white/18 pt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">Autonomy</p>
                  <p className="mt-4 font-display text-2xl leading-[1.04] tracking-[-0.02em] text-white">Better direction.</p>
                  <p className="mt-3 text-sm leading-6 text-white/58">As AI does more, knowing your priorities and boundaries matters more, not less.</p>
                </div>
                <div className="border-t border-system/60 pt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system">Capability</p>
                  <p className="mt-4 font-display text-2xl leading-[1.04] tracking-[-0.02em] text-white">More relevant use.</p>
                  <p className="mt-3 text-sm leading-6 text-white/58">The question is not only what AI can do. It is what is worth doing for you.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#12100e]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">How ALVIRA works</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.94] tracking-[-0.035em] sm:text-6xl">
                  Build the understanding once. Keep making it better.
                </h2>
                <p className="mt-6 max-w-lg text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg">
                  Start with conversation or material you already have. ALVIRA organizes what matters, exposes gaps, and keeps the Context useful as things change.
                </p>
              </div>

              <div className="border border-[#191715]/14 bg-[#f4f0e9] p-5 dark:border-white/12 dark:bg-[#0b0e0e] sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#74685e] dark:text-white/38">Inputs</p>
                <div className="mt-4 grid gap-px border border-[#191715]/10 bg-[#191715]/10 sm:grid-cols-4 dark:border-white/10 dark:bg-white/10">
                  {inputSources.map((source) => (
                    <div key={source} className="bg-[#f4f0e9] px-4 py-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#5f554c] dark:bg-[#0b0e0e] dark:text-white/55">
                      {source}
                    </div>
                  ))}
                </div>

                <div className="flex justify-center py-5 text-system" aria-hidden="true">↓</div>

                <div className="border border-system/45 bg-system/[0.06] p-6 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-system-dark dark:text-system">ALVIRA Context</p>
                  <p className="mt-3 font-display text-3xl leading-tight tracking-[-0.025em] text-[#27231f] dark:text-[#ece4da]">Maintained understanding</p>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">What is known, what is changing, what is uncertain, and what is appropriate to reuse.</p>
                </div>

                <div className="flex justify-center py-5 text-system" aria-hidden="true">↓</div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#74685e] dark:text-white/38">Living loop</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    {systemStages.map((stage, index) => (
                      <div key={stage} className="border-t border-[#191715]/18 pt-3 text-center dark:border-white/18">
                        <p className="font-mono text-[9px] text-system-dark dark:text-system">0{index + 1}</p>
                        <p className="mt-1 text-xs font-semibold text-[#3f3933] dark:text-white/72">{stage}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-l border-system/55 pl-5">
                  <p className="text-sm leading-7 text-[#5f554c] dark:text-[#b8ada1]">
                    <strong className="font-semibold text-[#27231f] dark:text-[#ece4da]">Context</strong> builds the understanding. <strong className="font-semibold text-[#27231f] dark:text-[#ece4da]">Reflect</strong> helps you review and evolve it. <strong className="font-semibold text-[#27231f] dark:text-[#ece4da]">Bridge</strong> can carry selected, approved Context into other AI tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Inspectable understanding</p>
              <h2 className="mt-5 max-w-2xl font-display text-5xl leading-[0.94] tracking-[-0.035em] sm:text-6xl">
                You should be able to see what the system thinks it knows.
              </h2>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {understandingStates.map(([title, body]) => (
                  <div key={title} className="border-t border-[#191715]/18 pt-5 dark:border-white/18">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-system-dark dark:text-system">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#191715]/18 pt-5 dark:border-white/18 lg:mt-24">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Portable by design</p>
              <h3 className="mt-5 font-display text-4xl leading-[0.98] tracking-[-0.03em] text-[#27231f] dark:text-[#ece4da] sm:text-5xl">
                Your understanding should not be trapped in one conversation — or in ALVIRA.
              </h3>
              <p className="mt-6 text-base leading-7 text-[#5f554c] dark:text-[#b8ada1]">
                You can start inside ALVIRA. Bridge can carry only the Context you approve for reuse with supported tools. The longer-term direction is a private, portable record you control rather than a hidden behavioral profile owned by one platform.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <span key={tool} className="border border-[#191715]/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[#5f574f] dark:border-white/15 dark:text-white/55">
                    {tool}
                  </span>
                ))}
              </div>

              <p className="mt-7 border-l border-system/55 pl-4 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">
                ALVIRA can maintain your Context without owning your Context. Richer encrypted Dossier portability remains forthcoming and will be labeled as it ships.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#12100e]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Start wherever you are</p>
                <h2 className="mt-6 max-w-5xl font-display text-5xl leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  Give AI more than a prompt to infer from.
                </h2>
                <p className="mt-7 max-w-2xl text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg">
                  Start with a conversation. ALVIRA can build the useful Context with you, then help you keep it current.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <a href="/app" className="inline-flex min-h-14 items-center justify-center bg-[#191715] px-8 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]">
                  Start with a conversation <span className="ml-3" aria-hidden="true">→</span>
                </a>
                <a href="/context" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-system-dark underline decoration-system/35 underline-offset-4 hover:decoration-system dark:text-system">
                  Already have context? Bring it with you.
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <TrustFooter />
    </div>
  );
}
