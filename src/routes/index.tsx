import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { DossierOwnershipPositioning } from "~/components/DossierOwnershipPositioning";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALVIRA — Context that moves with you" },
      {
        name: "description",
        content:
          "ALVIRA builds a living context layer you can inspect, correct, and selectively carry between the AI tools you use.",
      },
    ],
  }),
  component: Home,
});

const understandingStates = [
  ["Known", "Established enough to rely on."],
  ["Uncertain", "Visible instead of silently treated as fact."],
  ["Changing", "Updated when new evidence changes the picture."],
  ["Reusable", "Available to carry into future AI interactions when appropriate."],
] as const;

const flow = [
  ["Context", "Build a maintained understanding of your goals, constraints, decisions, preferences, and project history."],
  ["Reflect", "Inspect it, correct it, and keep it current instead of trusting an invisible memory layer."],
  ["Bridge", "Carry selected, approved context into the AI tool that fits the work."],
] as const;

function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-14 sm:px-8 sm:py-20 lg:min-h-[78vh] lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Context Intelligence</p>
            <h1 className="mt-6 max-w-5xl font-display text-[clamp(3rem,6.4vw,6.2rem)] font-semibold leading-[0.91] tracking-[-0.05em]">
              You use more than one AI. <span className="text-[#685e54] dark:text-[#b8ada1]">Why are you the only thing connecting them?</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#5f554c] dark:text-[#b8ada1]">
              Your AI tools have memory. ALVIRA gives your context somewhere to live between them — a living context layer you can inspect, correct, and selectively carry wherever you work.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="/app" className="inline-flex min-h-13 items-center justify-center bg-[#191715] px-7 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]">
                Build my context <span className="ml-3" aria-hidden="true">→</span>
              </a>
              <a href="#portability" className="inline-flex min-h-13 items-center justify-center border border-[#191715]/20 px-7 text-sm font-semibold text-[#4d453e] dark:border-white/20 dark:text-white/70">
                See how portability works
              </a>
            </div>
          </div>

          <aside className="border-t border-[#191715]/20 pt-6 dark:border-white/20">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-system-dark dark:text-system">The current workflow</p>
            <div className="mt-6 space-y-5">
              <div><p className="font-semibold">ChatGPT</p><p className="mt-1 text-sm text-[#6d6258] dark:text-[#a99f94]">Knows the project history.</p></div>
              <div><p className="font-semibold">Claude</p><p className="mt-1 text-sm text-[#6d6258] dark:text-[#a99f94]">Knows the decisions you copied over.</p></div>
              <div><p className="font-semibold">Your next agent</p><p className="mt-1 text-sm text-[#6d6258] dark:text-[#a99f94]">Knows whatever you remembered to explain.</p></div>
            </div>
            <p className="mt-7 border-l border-system/55 pl-5 font-display text-3xl leading-[1.02] tracking-[-0.025em]">You appear to be the API.</p>
          </aside>
        </section>

        <section id="portability" className="border-y border-[#191715]/10 bg-[#191715] text-[#f4f0e9] dark:border-white/10 dark:bg-[#111513]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">The problem</p>
            <h2 className="mt-5 max-w-5xl font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-7xl">Your context should not start over when your AI does.</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="border-t border-white/18 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Without ALVIRA</p>
                <p className="mt-4 font-display text-3xl">Copy → paste → summarize → correct → repeat.</p>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/58">Each tool accumulates a different version of your projects, preferences, decisions, and constraints. Switching models means reconstructing the useful parts yourself.</p>
              </div>
              <div className="border-t border-system/60 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system">With ALVIRA</p>
                <p className="mt-4 font-display text-3xl">One maintained context layer. Use the model that fits.</p>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/64">ALVIRA keeps the human-side context independent from any one AI provider, so you can review what is known and choose what travels with you.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Context → Reflect → Bridge</p>
              <h2 className="mt-5 font-display text-5xl leading-[0.94] tracking-[-0.035em] sm:text-6xl">The context layer belongs on your side.</h2>
            </div>
            <div className="grid gap-8">
              {flow.map(([title, body], index) => (
                <div key={title} className="grid gap-3 border-t border-[#191715]/18 pt-5 sm:grid-cols-[4rem_1fr] dark:border-white/18">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">0{index + 1}</p>
                  <div><h3 className="font-display text-3xl tracking-[-0.02em]">{title}</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#12100e]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Built for multi-model work</p>
            <div className="mt-5 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <h2 className="font-display text-5xl leading-[0.94] tracking-[-0.035em] sm:text-6xl">Use the best tool for the job without rebuilding yourself for each one.</h2>
              <div>
                <div className="flex flex-wrap gap-3">
                  {["ChatGPT", "Claude", "Gemini", "Cursor", "Supported agents"].map((tool) => (
                    <span key={tool} className="border border-[#191715]/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#5f574f] dark:border-white/15 dark:text-white/55">{tool}</span>
                  ))}
                </div>
                <p className="mt-7 max-w-2xl text-base leading-7 text-[#5f554c] dark:text-[#b8ada1]">Bridge carries selected context you approve. ALVIRA does not replace the memory inside these tools or control what they retain; it maintains a context layer you can take between them.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#191715]/10 bg-[#0d1110] text-[#f4f0e9] dark:border-white/10 dark:bg-[#080b0a]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">Context Intelligence</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">More than memory.</h2>
                <p className="mt-6 max-w-md text-base leading-7 text-white/58">A living, inspectable, portable understanding — designed to show uncertainty and change rather than silently turning old context into permanent fact.</p>
              </div>
              <div className="grid gap-7 sm:grid-cols-2">
                {understandingStates.map(([title, body]) => (
                  <div key={title} className="border-t border-white/18 pt-5"><h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-system">{title}</h3><p className="mt-3 text-sm leading-6 text-white/58">{body}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Stop being the memory layer</p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-5xl font-display text-5xl leading-[0.92] tracking-[-0.04em] sm:text-7xl">Your AI tools can change. Your context can keep moving.</h2>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5f554c] dark:text-[#b8ada1]">Build it once. Keep it current. Decide what each AI gets to know.</p>
            </div>
            <a href="/app" className="inline-flex min-h-14 items-center justify-center bg-[#191715] px-8 text-sm font-semibold text-[#f4f0e9] dark:bg-[#f4f0e9] dark:text-[#191715]">Build my context <span className="ml-3">→</span></a>
          </div>
        </section>
      </main>
      <DossierOwnershipPositioning />
      <TrustFooter />
    </div>
  );
}