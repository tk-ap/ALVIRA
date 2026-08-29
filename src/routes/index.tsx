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
  ["01", "Capture", "Bring conversation, documents, links, files, and context you already have."],
  ["02", "Understand", "ALVIRA organizes that evidence into a coherent model of how you think, work, and decide."],
  ["03", "Reflect", "Patterns, gaps, contradictions, and meaningful changes become visible instead of disappearing between chats."],
  ["04", "Update", "Your context stays living: editable, reviewable, and able to evolve as you do."],
  ["05", "Reuse", "Carry durable context into future AI work instead of rebuilding yourself from scratch."],
];

const sources = [
  ["Conversation", "Tell ALVIRA directly through adaptive interviews and ongoing reflection."],
  ["Documents", "Bring notes, journals, résumés, presentations, and existing AI context."],
  ["Links", "Use selected websites, portfolios, profiles, and public sources as evidence."],
  ["Files", "Add source material over time instead of forcing everything into one onboarding session."],
];

const evidence = [
  ["Carried forward", "Established context stays visible and trusted instead of being repeatedly re-collected."],
  ["Still uncertain", "Gaps and inferences remain legible so ALVIRA can ask only what genuinely needs clarification."],
  ["Changed", "New evidence can challenge an older assumption rather than silently overwrite it."],
  ["Ready to reuse", "Confirmed understanding becomes durable context that can move into future AI work."],
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

            <h1 className="mt-7 max-w-none font-display text-[clamp(3rem,6.7vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-[#191715] dark:text-[#f4f0e9]">
              AI infers. Context matters.
            </h1>

            <div className="mt-10 max-w-2xl border-l border-system/60 pl-5 sm:mt-12 sm:pl-7">
              <p className="max-w-xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94] sm:text-lg">
                ALVIRA identifies and houses the durable context AI needs to understand your goals, constraints, history, and intent before it responds or acts.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="/app" className="inline-flex min-h-12 items-center justify-center bg-[#191715] px-6 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]">
                Build your ALVIRA Context <span className="ml-3" aria-hidden="true">→</span>
              </a>
              <a href="#why-context" className="inline-flex min-h-12 items-center justify-center border border-[#191715]/20 px-6 text-sm font-semibold text-[#4d453e] hover:border-[#191715]/40 hover:text-[#191715] dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white">
                Why context matters
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
                Inference is useful. Context tells it what matters.
              </p>
              <p className="mt-7 text-sm leading-7 text-[#6d6258] dark:text-[#a99f94]">
                Most AI begins with fragments. ALVIRA gives those fragments continuity: what is known, what changed, what is uncertain, and what should guide the next response or action.
              </p>
            </div>
          </aside>
        </section>

        <section id="why-context" className="border-y border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#12100e]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Why Context Intelligence</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">When context is missing, inference fills the gap.</h2>
                <p className="mt-6 max-w-md text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">Your context already exists. The problem is that it is fragmented across conversations, files, decisions, tools, and memory.</p>
              </div>

              <div className="relative overflow-hidden border border-[#191715]/12 bg-[#f4f0e9]/60 p-6 dark:border-white/12 dark:bg-white/[0.025] sm:p-8">
                <div className="grid gap-7 sm:grid-cols-[1fr_auto_1.05fr] sm:items-center">
                  <div className="grid grid-cols-2 gap-3">
                    {["Goals", "Constraints", "History", "Preferences", "Decisions", "Projects"].map((fragment, index) => (
                      <div
                        key={fragment}
                        className={`border px-3 py-4 font-mono text-[11px] uppercase tracking-[0.11em] ${
                          index % 3 === 0
                            ? "border-human/35 text-human-dark dark:text-human"
                            : index % 3 === 1
                              ? "border-iridescent/35 text-iridescent-dark dark:text-iridescent"
                              : "border-[#191715]/15 text-[#6d6258] dark:border-white/15 dark:text-white/48"
                        }`}
                      >
                        {fragment}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center py-1 font-mono text-xl text-system sm:px-2" aria-hidden="true">→</div>

                  <div className="border border-system/45 bg-system/[0.055] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4 border-b border-system/25 pb-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-system-dark dark:text-system">ALVIRA Context</p>
                      <span className="h-2.5 w-2.5 rounded-full bg-system shadow-[0_0_18px_color-mix(in_srgb,var(--color-system)_60%,transparent)]" aria-hidden="true" />
                    </div>
                    <div className="mt-5 space-y-3">
                      {["Known", "Changing", "Uncertain", "Reusable"].map((state, index) => (
                        <div key={state} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                          <span className="font-mono text-[10px] text-system">0{index + 1}</span>
                          <span className="h-px bg-system/25" aria-hidden="true" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#5f574f] dark:text-white/55">{state}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 text-sm leading-6 text-[#5f574f] dark:text-white/58">Fragments become one maintained frame for what AI should understand before it responds or acts.</p>
                  </div>
                </div>

                <div className="mt-7 flex items-center gap-3 border-t border-[#191715]/10 pt-5 dark:border-white/10">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-system-dark dark:text-system">Continuity</span>
                  <span className="h-px flex-1 bg-system/30" aria-hidden="true" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#74685e] dark:text-white/42">less reconstruction · better judgment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#191715]/10 bg-[#0d1110] text-[#f4f0e9] dark:border-white/10 dark:bg-[#080b0a]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-human">Autonomy without context</p>
                <h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.92] tracking-[-0.04em] sm:text-6xl">Without context, autonomy is just inference with permission.</h2>
                <p className="mt-7 max-w-lg text-base leading-7 text-white/55">AI can search, write, plan, execute, spend, message, and decide. None of those capabilities tell it what matters to you.</p>
              </div>

              <div className="space-y-8">
                <div className="border border-white/12 bg-white/[0.025] p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.13em] text-white/46">
                    <span>PROMPT</span><span className="text-human">→</span><span>INFERENCE</span><span className="text-human">→</span><span>ACTION</span>
                  </div>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {["NO DURABLE CONTEXT", "NO SHARED INTENT", "NO CONTINUITY"].map((item) => (
                      <div key={item} className="border-t border-human/55 pt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-human">{item}</div>
                    ))}
                  </div>
                  <p className="mt-8 max-w-2xl text-lg leading-8 text-white/68">The system can move quickly while optimizing for the wrong objective. More autonomy can simply make a bad assumption travel farther.</p>
                </div>

                <div className="border border-system/35 bg-system/[0.035] p-6 sm:p-8">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-system">With Context Intelligence</p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.13em] text-white/72">
                    <span>PROMPT</span><span className="text-system">+</span><span className="text-system">CONTEXT</span><span className="text-system">→</span><span>JUDGMENT</span><span className="text-system">→</span><span>ACTION</span>
                  </div>
                  <p className="mt-7 max-w-2xl font-display text-3xl leading-[1.02] tracking-[-0.025em] text-white sm:text-4xl">Context gives capability something to judge against.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#191715]/10 bg-[#191715] text-[#f4f0e9] dark:border-white/10 dark:bg-[#111513]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">Capability is not understanding</p>
                <h2 className="mt-5 max-w-2xl font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">Capability can increase while understanding stays flat.</h2>
                <p className="mt-7 max-w-lg text-base leading-7 text-white/58">A model can know an extraordinary amount about the world and still know almost nothing about the situation, person, priorities, constraints, or history that should shape its answer.</p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="border-t border-white/18 pt-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">Without context / LLMs</p>
                  <h3 className="mt-4 text-xl font-semibold text-white">Capability becomes generic.</h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">The model fills missing information with inference. You get plausible answers that may ignore your actual goals, preferences, constraints, prior decisions, or definition of success.</p>
                </div>
                <div className="border-t border-white/18 pt-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">Without context / Agents</p>
                  <h3 className="mt-4 text-xl font-semibold text-white">Autonomy amplifies the gap.</h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">Giving an agent more tools, memory, or permission does not tell it what matters to you. It can act faster while still optimizing for an incomplete understanding of the task.</p>
                </div>
                <div className="border-t border-system/55 pt-5 sm:col-span-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-system">With Context Intelligence</p>
                  <h3 className="mt-4 max-w-2xl font-display text-3xl leading-[1.02] tracking-[-0.025em] text-white sm:text-4xl">Context turns raw capability into situated judgment.</h3>
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-white/58">It gives models and agents a maintained frame for judgment: what is true about you, what has already been decided, what changed, what remains uncertain, and what should guide the next action.</p>
                  <p className="mt-7 font-mono text-xs uppercase tracking-[0.13em] text-system">The more autonomous the system, the more consequential missing context becomes.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">How ALVIRA builds context</p>
              <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl">Context starts with what already exists.</h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">You should not have to complete one giant interview to become understood. Existing context becomes the starting point; ALVIRA can focus attention on what is actually missing.</p>
            </div>
            <div className="lg:col-span-2">
              <div className="grid gap-8 sm:grid-cols-2">
                {sources.map(([title, body]) => (
                  <div key={title} className="border-t border-[#191715]/20 pt-5 dark:border-white/20">
                    <h3 className="text-base font-semibold text-[#27231f] dark:text-[#ece4da]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12 border-l border-system/50 pl-6">
                <p className="font-display text-3xl leading-[1.05] tracking-[-0.025em] text-[#4f4740] dark:text-[#c9bdb0] sm:text-4xl">Seed what is known. Trust strong context. Ask only for genuine gaps.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="system" className="border-y border-[#191715]/10 bg-[#191715] text-[#f4f0e9] dark:border-white/10 dark:bg-[#111513]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">A living system</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">Context only matters if it stays current.</h2>
                <p className="mt-7 max-w-md text-base leading-7 text-white/58">That is why ALVIRA is a loop, not an onboarding artifact: understanding should deepen, change, and remain useful as new evidence appears.</p>
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
            <div><p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Evidence of understanding</p></div>
            <div>
              <h2 className="max-w-4xl font-display text-5xl leading-[0.95] tracking-[-0.035em] text-[#27231f] dark:text-[#ece4da] sm:text-6xl">Understanding should be inspectable, not assumed.</h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94] sm:text-lg">If context is going to guide future AI behavior, you should be able to see what ALVIRA believes it knows, where confidence is still developing, and when new evidence changes the picture.</p>
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {evidence.map(([title, body]) => (
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
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Portable by design</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl">Context compounds when it can move with you.</h2>
              </div>
              <div className="lg:pt-10">
                <p className="max-w-2xl text-lg leading-8 text-[#6d6258] dark:text-[#a99f94]">ALVIRA is not meant to become another place where your context gets trapped. Confirmed understanding should remain useful across the AI tools, agents, and workflows you choose to use.</p>
                <div className="mt-10 flex flex-wrap gap-3">
                  {["ChatGPT", "Claude", "Gemini", "Cursor", "Your agents"].map((tool) => (
                    <span key={tool} className="border border-[#191715]/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#5f574f] dark:border-white/15 dark:text-white/55">{tool}</span>
                  ))}
                </div>
                <p className="mt-8 max-w-xl text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">The value is continuity: each future interaction can begin with more understanding and less reconstruction.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24 sm:px-8 sm:py-28 lg:px-10">
          <div className="border-t border-[#191715]/15 pt-10 dark:border-white/15">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Begin with context</p>
            <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="max-w-5xl font-display text-5xl leading-[0.9] tracking-[-0.04em] sm:text-7xl lg:text-8xl">Give AI more than a prompt to infer from.</h2>
                <p className="mt-7 max-w-2xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94] sm:text-lg">Start with what already exists. Let ALVIRA identify what matters, fill genuine gaps, and keep that understanding useful as you change.</p>
              </div>
              <a href="/app" className="inline-flex min-h-14 items-center justify-center bg-[#191715] px-8 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]">Build your ALVIRA Context <span className="ml-3" aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
      </main>

      <TrustFooter />
    </div>
  );
}
