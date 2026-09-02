import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

const helpTopics = [
  {
    label: "Make a decision",
    starter: "I am trying to decide between two options and I am not sure what matters most.",
    explanation:
      "AI can help you compare the options, organize the tradeoffs, notice questions you have not considered, and think through what fits your priorities.",
  },
  {
    label: "Write something",
    starter: "I know what I want to say, but I do not know how to word it.",
    explanation:
      "AI can help you draft a message, letter, résumé, invitation, explanation, or idea — then revise it until it sounds more like you.",
  },
  {
    label: "Plan something",
    starter: "I have a lot to organize and I do not know where to start.",
    explanation:
      "AI can help you turn a trip, event, project, move, busy week, or personal goal into a practical plan and checklist.",
  },
  {
    label: "Learn something",
    starter: "I want someone to explain this in a way that makes sense to me.",
    explanation:
      "AI can explain unfamiliar ideas, answer follow-up questions, give examples, quiz you, or help connect new information to what you already know.",
  },
  {
    label: "Work or business",
    starter: "I have an idea or problem at work and I want help thinking it through.",
    explanation:
      "AI can help brainstorm, research, prepare, organize, draft, compare approaches, and turn a rough idea into clearer next steps.",
  },
  {
    label: "Everyday life",
    starter: "There is something in my life I want to get clearer or more organized about.",
    explanation:
      "AI can help you think through routines, family logistics, personal projects, questions, appointments, purchases, or the many small things competing for your attention.",
  },
] as const;

const contextPieces = [
  ["Goals", "What you are trying to move toward."],
  ["Priorities", "What matters most when choices compete."],
  ["Preferences", "How you like to work, communicate, and receive help."],
  ["History", "Useful background that should not need repeating."],
  ["Constraints", "Time, money, responsibilities, boundaries, and limits."],
  ["Change", "What is different now from what used to be true."],
] as const;

const steps = [
  [
    "01",
    "Start with a conversation",
    "Tell ALVIRA what is on your mind, answer guided questions, or bring in useful context you already have.",
  ],
  [
    "02",
    "Build an understanding",
    "ALVIRA organizes what matters, carries forward what is already known, and asks about genuine gaps instead of making you start over.",
  ],
  [
    "03",
    "Keep it useful as life changes",
    "Review what ALVIRA understands, correct it, add new information, and reuse the parts that are appropriate in future AI work.",
  ],
] as const;

const understandingStates = [
  ["Known", "Established enough to rely on."],
  ["Uncertain", "Visible as something that still needs clarification."],
  ["Changing", "Updated when new evidence changes the picture."],
  ["Reusable", "Available to carry into future AI interactions when appropriate."],
] as const;

function Home() {
  const [activeHelpIndex, setActiveHelpIndex] = useState(0);
  const activeHelp = helpTopics[activeHelpIndex];

  return (
    <div className="flex min-h-dvh flex-col bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <Header />

      <main id="main-content" className="flex-1">
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-14 sm:px-8 sm:py-20 lg:min-h-[78vh] lg:grid-cols-[1.18fr_0.82fr] lg:items-center lg:px-10 lg:py-28">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">
              ALVIRA
            </p>

            <h1 className="mt-6 max-w-5xl font-display text-[clamp(2.9rem,6.3vw,6rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-[#191715] dark:text-[#f4f0e9]">
              AI can do almost anything. <span className="text-[#685e54] dark:text-[#b8ada1]">The harder part is knowing what matters.</span>
            </h1>

            <div className="mt-8 max-w-2xl border-l border-system/50 pl-5 sm:pl-6">
              <p className="text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg sm:leading-8">
                AI can help you do almost anything. The harder part is knowing what actually matters.
              </p>
              <div className="mt-5 space-y-1 font-display text-xl leading-7 tracking-[-0.015em] text-[#2c2824] dark:text-[#e0d7cd] sm:text-2xl sm:leading-8">
                <p>What deserves your attention.</p>
                <p>What problem is worth solving.</p>
                <p>What should change.</p>
                <p>What should stay the same.</p>
                <p>What’s worth building — and what doesn’t need to be built at all.</p>
              </div>
            </div>

            <div className="mt-8 max-w-2xl">
              <p className="font-display text-3xl font-semibold leading-[1.02] tracking-[-0.025em] text-[#191715] dark:text-[#f4f0e9] sm:text-4xl">
                ALVIRA starts there.
              </p>
              <p className="mt-4 text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg sm:leading-8">
                It builds an understanding of your goals, priorities, constraints, experiences, and preferences — so AI can help you move in a direction that actually fits you.
              </p>
              <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-system-dark dark:text-system">
                Context before capability.
              </p>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="/app"
                className="inline-flex min-h-13 items-center justify-center bg-[#191715] px-7 text-sm font-semibold text-[#f4f0e9] transition-opacity hover:opacity-85 dark:bg-[#f4f0e9] dark:text-[#191715]"
              >
                Start with a conversation <span className="ml-3" aria-hidden="true">→</span>
              </a>
              <a
                href="#possibilities"
                className="inline-flex min-h-13 items-center justify-center border border-[#191715]/20 px-7 text-sm font-semibold text-[#4d453e] transition-colors hover:border-[#191715]/40 hover:text-[#191715] dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white"
              >
                See what AI can help with
              </a>
            </div>

            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#74685e] dark:text-[#93877c]">
              No AI experience required.
            </p>
          </div>

          <aside className="hidden lg:block lg:justify-self-end">
            <div className="max-w-md border-t border-[#191715]/20 pt-6 dark:border-white/20">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-system-dark dark:text-system">
                If you have never used AI this way
              </p>
              <p className="mt-5 font-display text-4xl leading-[0.98] tracking-[-0.03em] text-[#2c2824] dark:text-[#e0d7cd]">
                You do not need to learn the technology before you can ask for help.
              </p>
              <div className="mt-7 space-y-4 text-sm leading-7 text-[#6d6258] dark:text-[#a99f94]">
                <p>Tell it what you are trying to do.</p>
                <p>Ask questions the way you would ask a person.</p>
                <p>Keep talking until the answer becomes useful.</p>
              </div>
              <p className="mt-7 border-l border-system/50 pl-5 text-sm leading-6 text-[#5f554c] dark:text-[#b8ada1]">
                ALVIRA makes those conversations more personal over time by keeping the useful background about you.
              </p>
            </div>
          </aside>
        </section>

        <section id="possibilities" className="border-y border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#12100e]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">
                What AI can help with
              </p>
              <h2 className="mt-5 font-display text-5xl leading-[0.94] tracking-[-0.035em] sm:text-6xl">
                What could you use some help with?
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg">
                AI is not only for coding, technology, or people who already know the right prompts. It can help you think, write, organize, compare, explain, and plan.
              </p>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1" role="group" aria-label="Choose something you want help with">
                {helpTopics.map((topic, index) => {
                  const isActive = activeHelpIndex === index;
                  return (
                    <button
                      key={topic.label}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveHelpIndex(index)}
                      className={`min-h-12 border px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system ${
                        isActive
                          ? "border-system bg-system/[0.08] text-[#191715] dark:text-white"
                          : "border-[#191715]/14 bg-[#f4f0e9]/50 text-[#4d453e] hover:border-[#191715]/30 dark:border-white/14 dark:bg-white/[0.025] dark:text-white/70 dark:hover:border-white/30"
                      }`}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>

              <div className="border border-[#191715]/14 bg-[#f4f0e9] p-6 dark:border-white/14 dark:bg-[#0b0e0e] sm:p-8" aria-live="polite">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-system-dark dark:text-system">
                  You could start by saying
                </p>
                <p className="mt-5 font-display text-3xl leading-[1.03] tracking-[-0.025em] text-[#27231f] dark:text-[#ece4da] sm:text-4xl">
                  “{activeHelp.starter}”
                </p>
                <p className="mt-6 text-base leading-7 text-[#5f554c] dark:text-[#b8ada1]">
                  {activeHelp.explanation}
                </p>
                <a href="/app" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-system-dark underline decoration-system/35 underline-offset-4 hover:decoration-system dark:text-system">
                  Try this with ALVIRA <span className="ml-2" aria-hidden="true">→</span>
                </a>
              </div>
            </div>

            <p className="mt-8 max-w-2xl text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">
              Not sure yet? That is a perfectly good place to start. ALVIRA can begin by learning what is going on in your life and showing you where AI may be useful.
            </p>
          </div>
        </section>

        <section className="border-b border-[#191715]/10 bg-[#191715] text-[#f4f0e9] dark:border-white/10 dark:bg-[#111513]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">
                  Why ALVIRA
                </p>
                <h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">
                  AI can help. ALVIRA helps it help you.
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="border-t border-white/18 pt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Without ALVIRA</p>
                  <p className="mt-4 font-display text-2xl leading-[1.05] tracking-[-0.02em] text-white sm:text-3xl">
                    You explain the situation from the beginning.
                  </p>
                  <p className="mt-4 text-sm leading-6 text-white/58">
                    The AI mostly knows what is in the current conversation, so you repeat background and it may guess what matters to you.
                  </p>
                </div>

                <div className="border-t border-system/60 pt-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system">With ALVIRA</p>
                  <p className="mt-4 font-display text-2xl leading-[1.05] tracking-[-0.02em] text-white sm:text-3xl">
                    The useful background can already be there.
                  </p>
                  <p className="mt-4 text-sm leading-6 text-white/64">
                    Your goals, priorities, preferences, history, constraints, and changes can become part of a maintained understanding instead of disappearing after one chat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why-context" className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">
                What “context” means
              </p>
              <h2 className="mt-5 font-display text-5xl leading-[0.94] tracking-[-0.035em] sm:text-6xl">
                Context is just the useful background.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#5f554c] dark:text-[#b8ada1]">
                Think about what a thoughtful person would want to know before giving you advice. ALVIRA helps capture that background and keep it available.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {contextPieces.map(([title, body]) => (
                <div key={title} className="border-t border-[#191715]/18 pt-5 dark:border-white/18">
                  <h3 className="text-base font-semibold text-[#27231f] dark:text-[#ece4da]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#12100e]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">How it works</p>
              <h2 className="mt-5 font-display text-5xl leading-[0.94] tracking-[-0.035em] sm:text-6xl">
                You do not build a perfect profile before ALVIRA becomes useful.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg">
                The conversation itself can help you discover what AI could do for you while ALVIRA gradually builds a better understanding of your situation.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {steps.map(([number, title, body]) => (
                <div key={number} className="border-t border-[#191715]/20 pt-5 dark:border-white/20">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">{number}</p>
                  <h3 className="mt-4 font-display text-2xl leading-[1.04] tracking-[-0.02em] text-[#27231f] dark:text-[#ece4da]">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 border-l border-system/55 pl-5 sm:pl-6">
              <p className="max-w-3xl text-sm leading-7 text-[#5f554c] dark:text-[#b8ada1]">
                Inside ALVIRA, <strong className="font-semibold text-[#27231f] dark:text-[#ece4da]">Context</strong> builds the understanding, <strong className="font-semibold text-[#27231f] dark:text-[#ece4da]">Reflect</strong> helps you review and evolve it, and <strong className="font-semibold text-[#27231f] dark:text-[#ece4da]">Bridge</strong> can carry selected, approved context into other AI tools. You do not need to learn those parts before you begin.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#191715]/10 bg-[#0d1110] text-[#f4f0e9] dark:border-white/10 dark:bg-[#080b0a]">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">The technical category</p>
                <h2 className="mt-5 font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">
                  Context Intelligence.
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-white/58">
                  ALVIRA is building a living, inspectable, portable understanding of the person — not a one-time questionnaire that becomes stale.
                </p>
              </div>

              <div className="grid gap-7 sm:grid-cols-2">
                {understandingStates.map(([title, body]) => (
                  <div key={title} className="border-t border-white/18 pt-5">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-system">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/58">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Use it where it helps</p>
              <h2 className="mt-5 font-display text-5xl leading-[0.94] tracking-[-0.035em] sm:text-6xl">
                Your understanding should not be trapped in one conversation.
              </h2>
            </div>

            <div className="lg:pt-8">
              <p className="max-w-2xl text-lg leading-8 text-[#5f554c] dark:text-[#b8ada1]">
                You can start inside ALVIRA. Later, selected context can be reused with tools such as ChatGPT, Claude, Gemini, Cursor, and supported agents. You do not need multiple AI tools to get started.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["ChatGPT", "Claude", "Gemini", "Cursor", "Supported agents"].map((tool) => (
                  <span key={tool} className="border border-[#191715]/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#5f574f] dark:border-white/15 dark:text-white/55">
                    {tool}
                  </span>
                ))}
              </div>
              <p className="mt-8 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">
                ALVIRA builds and reflects living context. Bridge carries only the context you approve for reuse.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#191715]/10 bg-[#ebe4d8] dark:border-white/10 dark:bg-[#12100e]">
          <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Start wherever you are</p>
            <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="max-w-5xl font-display text-5xl leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                  What could AI help you with if it understood more about your life?
                </h2>
                <p className="mt-7 max-w-2xl text-base leading-7 text-[#5f554c] dark:text-[#b8ada1] sm:text-lg">
                  You do not need to know the answer yet. Start with a conversation and let ALVIRA help you find out.
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
