import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { VersionHistoryGraphic } from "~/components/VersionHistoryGraphic";
import { PortabilityGraphic } from "~/components/PortabilityGraphic";
import { MeOSCTA } from "~/components/MeOSCTA";
import { ComparisonTable } from "~/components/ComparisonTable";
import { COMPARISON_COMPETITORS, COMPARISON_DIMENSIONS } from "~/lib/comparison";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: 'ALVIRA — Build the context your AI is missing' }, { name: "description", content: 'Discover, organize, and compile your knowledge so ChatGPT, Claude, Gemini, and Cursor actually understand you.' }],
  }),
  component: Home,
});

// --- Components ---
function Home() {
  const [activePreview, setActivePreview] = useState("overview.md");

  const profilePreviews = [
    {
      filename: "overview.md",
      label: "Profile overview",
      lines: [
        "# Alex Chen",
        "",
        "> Product designer focused on making complex tools feel clear and useful.",
        "",
        "## How I work",
        "I look for the simplest path through a problem, then test it with real users.",
        "I value thoughtful constraints, direct feedback, and decisions that stay reversible.",
      ],
    },
    {
      filename: "constraints.md",
      label: "Boundaries & preferences",
      lines: [
        "# Constraints",
        "",
        "- Cannot use tools or deploy changes that require admin approval without notice.",
        "- Prefers async communication over meetings; include context and a clear decision ask.",
        "- Protects focused design time from 9:00–11:30 AM Pacific.",
        "- Accessibility is a release requirement, not a follow-up improvement.",
      ],
    },
    {
      filename: "workflows.md",
      label: "How work gets done",
      lines: [
        "# Workflows",
        "",
        "## How I approach design reviews",
        "1. Share the decision to be made and the evidence behind it.",
        "2. Ask reviewers for risks and unanswered questions before preferences.",
        "3. Synthesize feedback, call out trade-offs, and document the decision.",
        "4. Run a small usability check before handing off to engineering.",
      ],
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col">
      {/* --- Header --- */}
      <Header />

      <main id="main-content" className="flex-1 flex flex-col">

      {/* ================================================================ */}
      {/* 1. Hero */}
      {/* ================================================================ */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 sm:px-8 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-5xl text-center w-full">
          {/* Technical eyebrow */}
          <div className="inline-block mb-6 sm:mb-8">
            <span className="font-mono text-xs text-system-dark dark:text-system border border-system/30 dark:border-system/40 rounded-md px-3 py-1.5 tracking-wide">
              &lt;personal-ai-knowledge-system /&gt;
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-mineral-dark dark:text-mineral sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02]">
            Build the context
            <br />
            your AI is missing.
          </h1>

          <p className="mt-6 sm:mt-8 text-base leading-relaxed text-warm-gray-dark dark:text-warm-gray sm:text-lg max-w-2xl mx-auto">
            A 10–15 minute guided interview uncovers how you think, work, and decide — then compiles it into a portable AI profile for ChatGPT, Claude, Gemini, and Cursor.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <a
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-mineral-dark dark:bg-mineral text-ink-light dark:text-ink px-7 py-3.5 text-base font-semibold hover:bg-mineral-dark/90 dark:hover:bg-mineral/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system dark:focus-visible:outline-system motion-reduce:transition-none transition-colors duration-200"
            >
              Build my AI profile
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="/interview"
              className="inline-flex items-center justify-center rounded-lg border border-warm-gray/30 dark:border-warm-gray/30 px-7 py-3.5 text-base font-semibold text-warm-gray-dark hover:text-mineral-dark dark:text-warm-gray dark:hover:text-mineral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system dark:focus-visible:outline-system motion-reduce:transition-none transition-colors duration-200"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 font-mono text-xs text-warm-gray-dark dark:text-warm-gray">
            Already have notes, a résumé, or a journal? <a href="/interview" className="underline underline-offset-2 hover:text-system-dark dark:hover:text-system">Upload it and skip ahead.</a>
          </p>
          <p className="mt-2 font-mono text-xs text-warm-gray-dark/70 dark:text-warm-gray/70">
            Free to start · No credit card
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. Problem / benefit summary */}
      {/* ================================================================ */}
      <section className="border-t border-gray-100 bg-white px-6 py-20 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto max-w-4xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Why ALVIRA</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Stop starting from scratch with AI.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Every new chat starts the same way: your AI doesn't know how you think or how you want it to help. ALVIRA finds that context once and makes it reusable.
            </p>
          </div>

          <div className="mt-20 grid gap-x-16 gap-y-14 sm:grid-cols-2">
            {[
              ["Stop re-explaining yourself", "No more retyping your background, goals, and working style into every new chat. Keep instructions in one organized AI profile."],
              ["Discover context you'd have missed", "Adaptive interviews surface knowledge and patterns you wouldn't think to tell an AI on your own."],
              ["Stays current as you change", "Update your profile anytime instead of rebuilding from scratch. Your knowledge evolves with you."],
              ["Get answers shaped around you", "When your AI knows how you think and decide, every answer is more relevant and personal."],
            ].map(([headline, body], index) => (
              <div key={headline} className="border-t border-gray-200 pt-5 text-left dark:border-gray-800">
                <p className="font-mono text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-gray-100">{headline}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. Profile preview, comparison, and portability */}
      {/* ================================================================ */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-20 dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">What you get</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              See what your knowledge becomes
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Structured, portable Markdown files that work across every AI tool — not lossy memory features locked to one platform.
            </p>
          </div>

          <div className="mt-16 overflow-hidden border-y border-gray-200 bg-gray-950 dark:border-gray-700">
            <div className="flex overflow-x-auto border-b border-gray-800 bg-gray-900" role="tablist" aria-label="Example profile files">
              {profilePreviews.map((preview) => {
                const isActive = preview.filename === activePreview;
                return (
                  <button
                    key={preview.filename}
                    type="button"
                    role="tab"
                    id={`profile-tab-${preview.filename}`}
                    aria-selected={isActive}
                    aria-controls="profile-preview-panel"
                    onClick={() => setActivePreview(preview.filename)}
                    className={`shrink-0 border-r border-gray-800 px-5 py-3 font-mono text-xs transition-colors ${
                      isActive ? "bg-gray-950 text-emerald-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    {preview.filename}
                  </button>
                );
              })}
            </div>
            <div className="min-h-[16rem] p-5 sm:p-8" id="profile-preview-panel" role="tabpanel" aria-labelledby={`profile-tab-${activePreview}`}>
              <div className="mb-5 flex items-center gap-2 font-mono text-xs text-gray-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                {profilePreviews.find((p) => p.filename === activePreview)?.label}
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-7 text-gray-300 sm:text-sm">
                {profilePreviews.find((p) => p.filename === activePreview)?.lines.join("\n")}
              </pre>
            </div>
          </div>
          <p className="mt-4 text-center font-mono text-xs text-gray-500 dark:text-gray-400">
            Sample profile — your results will reflect your unique knowledge.
          </p>

          <div className="mt-24 grid items-center gap-14 border-t border-gray-200 pt-12 dark:border-gray-800  lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Living profile</span>
              <h3 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">Your AI profile grows with you.</h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-400">Keep your context current as your work, priorities, and preferences evolve. A visible version history of your updates is coming soon.</p>
            </div>
            <VersionHistoryGraphic />
          </div>

      <div className="mt-24 border-t border-gray-200 pt-12 dark:border-gray-800">
          <ComparisonTable competitors={COMPARISON_COMPETITORS} dimensions={COMPARISON_DIMENSIONS} highlightRow={5} />

          <div className="mt-24 flex flex-col items-center border-t border-gray-200 pt-14 dark:border-gray-800">
            <div>
              <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Works everywhere</span>
              <h3 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">One profile. Every AI tool.</h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-gray-600 dark:text-gray-400">Open Markdown keeps your knowledge useful across the tools you already use — and the ones you have not met yet.</p>
            </div>
            <div className="mt-10 w-full max-w-3xl"><PortabilityGraphic /></div>
          </div>
        </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 4. Free-plan CTA */}
      {/* ================================================================ */}
      <section className="border-t border-gray-100 bg-white px-6 py-20 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Start free</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Start free. Upgrade when it sticks.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Start free — no credit card, no time limit. When ALVIRA becomes part of how you work, upgrade for more profiles and continuous updates.
            </p>
          </div>

          <div className="mt-14 max-w-2xl border-y border-emerald-500/40 py-8 dark:border-emerald-400/30 sm:py-10">
            <div>
              <h3 className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">Free</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">$0</span>
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">forever</span>
              </div>
              <ul className="mt-6 space-y-3 border-t border-emerald-200/60 pt-5 dark:border-emerald-800/40">
                {[
                  "1 AI profile",
                  "3 guided interviews",
                  "All 19 personal knowledge domains",
                  "Portable Markdown output",
                ].map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/app"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors duration-200 dark:bg-emerald-500 dark:text-gray-950 dark:hover:bg-emerald-400 dark:focus-visible:outline-emerald-400"
              >
                Start building — free
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <p className="mt-3 text-center">
                <a href="/pricing" className="font-mono text-xs text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400">
                  Compare plans →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 5. Privacy & trust */}
      {/* ================================================================ */}
      <section id="privacy" className="border-t border-gray-100 bg-white px-6 py-20 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Privacy &amp; trust</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Your knowledge stays yours.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              You should never have to wonder where the most personal context about you goes. ALVIRA is designed around ownership and control from the start.
            </p>
          </div>

          <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {[
              ["01", "Secure storage", "Your interviews and profiles are stored securely on ALVIRA's servers. Export them as Markdown files anytime — the files are yours to keep and take anywhere."],
              ["02", "No training", "We never use your knowledge to train AI models. Your answers are processed by OpenAI's API for question generation — they do not train on your data. Your data belongs to you: export or delete it anytime."],
              ["03", "Portable format", "Open Markdown means no vendor lock-in. Read, edit, and use your files with any tool."],
              ["04", "You control sharing", "Share files with specific AI tools or team members, or keep them completely private. Your data is never shared or sold — there's nothing to opt out of."],
            ].map(([number, title, body]) => (
              <div key={title} className="border-l-2 border-emerald-200 pl-4 text-left dark:border-emerald-800">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400" aria-hidden="true">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-gray-600 dark:text-gray-400">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 6. MeOS expansion card (cross-sell) */}
      {/* ================================================================ */}
      <section className="border-t border-human/30 bg-human-soft/70 px-6 py-20 dark:border-human-dark/40 dark:bg-human-dark/10 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <div className="flex justify-center">
            <MeOSCTA placement="homepage" variant="default" dismissible={false} />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* ================================================================ */}
      {/* 7. Final CTA */}
      {/* ================================================================ */}
      <section className="border-t border-gray-100 bg-white px-6 py-20 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">Ready to build your AI profile?</h3>
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">The first interview takes about 10–15 minutes. You can pause anytime and pick up where you left off.</p>
          <a
            href="/app"
            className="mt-7 inline-flex items-center justify-center rounded-lg bg-gray-900 px-7 py-3.5 text-base font-semibold text-white transition-colors duration-200 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus-visible:outline-emerald-400"
          >
            Start free <span aria-hidden="true" className="ml-2">→</span>
          </a>
        </div>
      </section>
      </main>

      <TrustFooter />
    </div>
  );
}
