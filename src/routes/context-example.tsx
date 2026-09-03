import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

const sections = [
  {
    title: "Communication preferences",
    items: [
      "Prefer written context before meetings.",
      "Lead with the decision to be made, then provide supporting detail.",
      "Distinguish verified facts, assumptions, and recommendations.",
    ],
  },
  {
    title: "Decision rules",
    items: [
      "Move quickly when a decision is inexpensive and reversible.",
      "Seek trusted input before difficult-to-reverse decisions.",
      "State what new evidence would change the recommendation.",
    ],
  },
  {
    title: "Constraints and boundaries",
    items: [
      "Do not deploy, purchase, publish, or contact another person without explicit approval.",
      "Protect focused work time in the morning.",
      "Do not present an estimate as a measured result.",
    ],
  },
  {
    title: "Working style",
    items: [
      "Define the user outcome and the decision that needs to be made.",
      "Gather the minimum evidence needed to reduce the largest risk.",
      "Prefer a small, reversible test over a large speculative build.",
    ],
  },
  {
    title: "Instructions for an AI assistant",
    items: [
      "Start with the recommended action and why it fits the stated constraints.",
      "Call out assumptions explicitly.",
      "For reversible decisions, recommend a practical next step rather than prolonged analysis.",
    ],
  },
] as const;

export const Route = createFileRoute("/context-example")({
  head: () => ({
    meta: [
      { title: "Fictional Context Example — ALVIRA" },
      { name: "description", content: "Inspect a fictional example of the kind of user-confirmed context ALVIRA can organize." },
    ],
  }),
  component: ContextExamplePage,
});

function ContextExamplePage() {
  return (
    <div className="min-h-dvh bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <Header />
      <main id="main-content">
        <section className="border-b border-[#191715]/10 px-6 py-14 dark:border-white/10 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">Fictional example / ALVIRA Context</p>
            <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.035em] sm:text-6xl">What useful Context can look like.</h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg">
              This is not a real customer profile. It is a fictional example showing the kinds of user-confirmed preferences, rules, constraints, and working context ALVIRA can organize so future AI interactions do not have to begin from zero.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/context" className="inline-flex min-h-11 items-center border border-[#191715]/20 px-5 text-sm font-semibold hover:border-[#191715]/40 dark:border-white/20 dark:hover:border-white/40">Back to Context</a>
              <a href="/samples/alvira-context-example.md" className="inline-flex min-h-11 items-center text-sm font-semibold text-system-dark underline decoration-system/35 underline-offset-4 dark:text-system">Open the Markdown example →</a>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:px-8 sm:py-16 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="border-l border-system/50 pl-5 sm:pl-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-system-dark dark:text-system">Overview</p>
              <p className="mt-4 max-w-3xl font-display text-2xl leading-[1.08] tracking-[-0.02em] text-[#2c2824] dark:text-[#e0d7cd] sm:text-3xl">
                Alex Chen is an independent product strategist helping small teams clarify products and make practical decisions. Alex values direct communication, reversible decisions, accessible work, and focused execution with clear outcomes.
              </p>
            </div>

            <div className="mt-12 grid gap-px border border-[#191715]/12 bg-[#191715]/12 dark:border-white/12 dark:bg-white/12 sm:grid-cols-2">
              {sections.map((section) => (
                <article key={section.title} className="bg-[#f4f0e9] p-6 dark:bg-[#0b0e0e] sm:p-7">
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">{section.title}</h2>
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-[#5f554c] dark:text-[#b8ada1]">
                    {section.items.map((item) => (
                      <li key={item} className="grid grid-cols-[auto_1fr] gap-3"><span className="font-mono text-system-dark dark:text-system" aria-hidden="true">+</span><span>{item}</span></li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#191715]/10 bg-[#ebe4d8] px-6 py-14 dark:border-white/10 dark:bg-[#12100e] sm:px-8 sm:py-16 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">Context before capability</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[0.98] tracking-[-0.03em] sm:text-5xl">The value is not the document. It is the understanding behind it.</h2>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[#5f554c] dark:text-[#b8ada1]">
              A real Context is built from your own answers and source material, remains reviewable, and can change when the evidence changes. The exact fields and wording depend on what ALVIRA actually learns about you.
            </p>
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
