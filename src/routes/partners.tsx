import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "ALVIRA — Design Partners" },
      { name: "description", content: "Pilot Context Intelligence in a real AI workflow and measure whether persistent, user-controlled context improves the work." },
    ],
  }),
  component: Partners,
});

const flow = ["Interview", "Context", "Review + correct", "Select", "Bridge", "AI tool", "Measure", "Context evolves"];
const proof = [
  ["Context Lift", "Compare equivalent work with and without ALVIRA-supplied context."],
  ["Re-explanation", "Measure how often people have to repeat useful background."],
  ["Correction", "Track where context is wrong, incomplete, or stale."],
  ["Reuse", "See whether people voluntarily bring their Context into another task or tool."],
];

function Partners() {
  return (
    <div className="min-h-screen bg-mineral text-ink dark:bg-ink dark:text-mineral">
      <Header />
      <main id="main-content">
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 sm:pt-32">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">ALVIRA · Design partners</p>
          <h1 className="mt-7 max-w-5xl font-display text-5xl leading-[0.94] tracking-[-0.045em] sm:text-7xl">
            AI keeps getting more capable. Context is still fragmented.
          </h1>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-warm-gray-dark dark:text-warm-gray">
            Every AI product is independently trying to learn the same person, team, and work. ALVIRA is building Context Intelligence: a user-controlled layer for learning, maintaining, reviewing, and selectively supplying the context AI needs to work effectively.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="mailto:alvira@agentmail.to?subject=ALVIRA%20design%20partner" className="border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-mineral dark:border-mineral dark:bg-mineral dark:text-ink">Pilot ALVIRA with us</a>
            <a href="/founding-beta" className="border border-ink/30 px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] dark:border-mineral/30">Individual beta</a>
          </div>
        </section>

        <section className="border-y border-ink/15 dark:border-mineral/15">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="max-w-4xl font-display text-3xl leading-tight sm:text-5xl">
              Your useful context should not have to start over every time you change models, tools, or workflows.
            </p>
            <div className="mt-12 grid gap-px overflow-hidden border border-ink/15 bg-ink/15 dark:border-mineral/15 dark:bg-mineral/15 sm:grid-cols-4 lg:grid-cols-8">
              {flow.map((item, i) => <div key={item} className="bg-mineral p-4 dark:bg-ink"><span className="font-mono text-[10px] opacity-50">0{i + 1}</span><p className="mt-5 text-sm">{item}</p></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">What exists now</p>
            <h2 className="mt-5 font-display text-4xl tracking-tight">A working loop, not a finished claim.</h2>
          </div>
          <div className="space-y-6 text-base leading-7 text-warm-gray-dark dark:text-warm-gray">
            <p>ALVIRA can interview a person, turn that conversation into structured Context, let them review and correct it, and selectively carry useful context into another AI workflow through Bridge.</p>
            <p>The next question is measurable: does that Context produce better work, less repetition, greater continuity, or enough economic value to become infrastructure a person or organization will keep using?</p>
          </div>
        </section>

        <section className="bg-ink text-mineral dark:bg-mineral dark:text-ink">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-mono text-xs uppercase tracking-[0.18em] opacity-60">Proof framework</p>
            <h2 className="mt-5 max-w-3xl font-display text-4xl tracking-tight sm:text-5xl">Pilot it in work that already matters.</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {proof.map(([title, body]) => <div key={title} className="border-t border-current/25 pt-5"><h3 className="font-display text-2xl">{title}</h3><p className="mt-3 max-w-xl leading-7 opacity-75">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div><p className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">Two evidence tracks</p><h2 className="mt-5 font-display text-4xl">People + organizations.</h2></div>
            <div className="space-y-8">
              <div><h3 className="font-display text-2xl">Context Lift Founding Beta</h3><p className="mt-2 leading-7 text-warm-gray-dark dark:text-warm-gray">Individuals test whether persistent Context makes the AI tools they already use more useful.</p></div>
              <div><h3 className="font-display text-2xl">Design Partner / POC</h3><p className="mt-2 leading-7 text-warm-gray-dark dark:text-warm-gray">Teams choose a recurring AI workflow, establish a baseline, add ALVIRA Context, and measure the difference.</p></div>
            </div>
          </div>
          <div className="mt-20 border-t border-ink/15 pt-12 dark:border-mineral/15">
            <p className="max-w-4xl font-display text-4xl leading-tight">If your team repeatedly teaches AI the same business, project, constraints, or preferences, that is the workflow we want to test.</p>
            <a href="mailto:alvira@agentmail.to?subject=ALVIRA%20design%20partner" className="mt-8 inline-block border-b border-current pb-1 font-mono text-sm">alvira@agentmail.to →</a>
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
