import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile, writeFile } from "node:fs/promises";
import { useState } from "react";
import { Header } from "~/components/Header";

// --- Server function: waitlist signup ---
const submitWaitlist = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { email?: string };
    if (!d.email || typeof d.email !== "string" || !d.email.includes("@")) {
      throw new Error("Please provide a valid email address.");
    }
    return { email: d.email.trim().toLowerCase() };
  })
  .handler(async ({ data }) => {
    const filePath = "waitlist.json";
    let entries: { email: string; timestamp: string }[] = [];

    try {
      const raw = await readFile(filePath, "utf8");
      entries = JSON.parse(raw);
    } catch {
      entries = [];
    }

    if (entries.some((e) => e.email === data.email)) {
      return { success: true, message: "You're already on the list!" };
    }

    entries.push({ email: data.email, timestamp: new Date().toISOString() });
    await writeFile(filePath, JSON.stringify(entries, null, 2) + "\n", "utf8");

    return { success: true, message: "You're on the list! We'll be in touch." };
  });

export const Route = createFileRoute("/")({
  component: Home,
});

// --- Components ---
function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("submitting");
    try {
      const result = await submitWaitlist({ data: { email } });
      setStatus("success");
      setMessage(result.message);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      {/* --- Header --- */}
      <Header />

      {/* --- Hero --- */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-8 sm:py-16 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-4xl text-center w-full">
          {/* Technical eyebrow */}
          <div className="inline-block mb-6 sm:mb-8">
            <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-1.5 tracking-wide">
              &lt;personal-ai-knowledge-system /&gt;
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08]">
            Build the context
            <br />
            your AI is missing.
          </h1>

          <p className="mt-6 sm:mt-8 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg max-w-2xl mx-auto">
            ALVIRA interviews you to uncover how you think, work, communicate, and decide—then turns that knowledge into a living AI profile you can use across ChatGPT, Claude, Gemini, Cursor, and future AI tools.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <a
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-7 py-3.5 text-base font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400 motion-reduce:transition-none transition-colors duration-200"
            >
              Build my AI profile
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-7 py-3.5 text-base font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400 motion-reduce:transition-none transition-colors duration-200"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 font-mono text-xs text-gray-500 dark:text-gray-400">
            Free to start · No credit card · Portable Markdown
          </p>
        </div>
      </section>

      {/* --- Why ALVIRA --- */}
      <section className="border-t border-gray-100 bg-white px-6 py-24 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Why ALVIRA</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Stop starting from scratch with AI.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Every new conversation begins with the same problem: your AI doesn't know how you think, what matters to you, or how you want it to help. ALVIRA learns that context through a guided conversation and turns it into a reusable AI profile. Bring it to your favorite AI tools so they can give you more relevant, consistent, and personal help.
            </p>
          </div>

          <div className="mt-16 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {[
              ["Spend less time explaining yourself", "Stop repeatedly typing your preferences, background, goals, working style, and instructions into every new conversation."],
              ["Get answers that fit you", "Give AI the context it needs to tailor its writing, recommendations, plans, and decisions to your actual needs."],
              ["Discover context you would have missed", "ALVIRA asks adaptive questions that uncover useful details most people would never think to include in a prompt."],
              ["Use it with the AI tools you already have", "Your profile works across ChatGPT, Claude, Gemini, Cursor, and future AI tools. You are not locked into one platform."],
              ["Keep it accurate as your life changes", "Update your profile when your priorities, work, routines, or preferences change instead of rebuilding everything from scratch."],
              ["Own the knowledge—not just the account", "Your profile can be exported as readable Markdown. You can inspect it, edit it, save it, and take it with you."],
            ].map(([headline, body], index) => (
              <div key={headline} className="border-t border-gray-200 pt-5 dark:border-gray-800">
                <p className="font-mono text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-gray-100">{headline}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 overflow-x-auto border border-gray-200 dark:border-gray-800">
            <table className="w-full min-w-[30rem] border-collapse text-left">
              <thead>
                <tr className="font-mono text-xs uppercase tracking-wide">
                  <th scope="col" className="w-1/2 border-b border-r border-gray-200 bg-gray-50 px-5 py-4 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">Without ALVIRA</th>
                  <th scope="col" className="w-1/2 border-b border-gray-200 bg-emerald-50 px-5 py-4 text-emerald-800 dark:border-gray-800 dark:bg-emerald-950/40 dark:text-emerald-300">With ALVIRA</th>
                </tr>
              </thead>
              <tbody className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {[
                  ["Re-explain yourself in every chat", "Create reusable context once"],
                  ["Receive generic answers", "Receive answers shaped around you"],
                  ["Keep instructions scattered across chats", "Maintain one organized AI profile"],
                  ["Lose context when switching tools", "Bring your knowledge to any AI"],
                  ["Guess what information AI needs", "Let adaptive interviews uncover it"],
                ].map(([without, withAlvira]) => (
                  <tr key={without}>
                    <td className="border-b border-r border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-950">{without}</td>
                    <td className="border-b border-gray-200 bg-emerald-50/60 px-5 py-4 dark:border-gray-800 dark:bg-emerald-950/20">{withAlvira}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-16 text-center">
            <a
              href="/app"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-7 py-3.5 text-base font-semibold text-white transition-colors duration-200 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus-visible:outline-emerald-400"
            >
              Build my AI profile
              <span aria-hidden="true" className="ml-2">→</span>
            </a>
            <p className="mt-4 font-mono text-xs text-gray-500 dark:text-gray-400">Free to start · No credit card required</p>
          </div>
        </div>
      </section>

      {/* --- Product demonstration --- */}
      <section id="how-it-works" className="border-t border-gray-100 bg-gray-50 px-6 py-24 dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">How it works</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">See ALVIRA in action</h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              A guided conversation uncovers what matters — then turns it into context your AI can use.
            </p>
          </div>

          <ol className="mt-16 space-y-10 border-l border-gray-300 pl-6 dark:border-gray-700 sm:ml-4 sm:pl-10">
            {[
              {
                title: "ALVIRA asks",
                body: "An adaptive question targets what's missing:",
                quote: '“When you\'re making a tough decision, what matters most to you — speed, certainty, consensus, or something else?”',
              },
              {
                title: "You answer",
                body: "You respond in your own words:",
                quote: '“Speed matters most when the decision is reversible. For bigger calls, I want input from at least two people I trust before committing.”',
              },
              {
                title: "ALVIRA follows up",
                body: "It probes for context you wouldn't have volunteered:",
                quote: '“Who are the people you typically consult for those bigger decisions, and what kind of input do you look for from each?”',
              },
              {
                title: "Your profile builds",
                body: "Your answers are validated, organized, and compiled into structured knowledge. You own the files — readable Markdown, portable anywhere.",
              },
              {
                title: "Your AI improves",
                body: "When you share your profile with ChatGPT or Claude, responses reflect your actual decision-making style instead of generic advice.",
              },
            ].map((step, index) => (
              <li key={step.title} className="relative">
                <span className="absolute -left-[2.15rem] flex h-8 w-8 items-center justify-center rounded-full border border-emerald-600 bg-gray-50 font-mono text-sm font-semibold text-emerald-700 dark:border-emerald-500 dark:bg-gray-900 dark:text-emerald-400 sm:-left-[3.15rem]" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{step.title}</h3>
                <p className="mt-2 max-w-3xl text-base leading-relaxed text-gray-600 dark:text-gray-400">{step.body}</p>
                {step.quote && (
                  <p className="mt-4 max-w-3xl border-l-2 border-emerald-500 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-gray-700 shadow-sm dark:bg-gray-950 dark:text-gray-300">
                    {step.quote}
                  </p>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-20">
            <h3 className="font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">The difference in practice</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-950">
                <p className="font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Without your ALVIRA profile</p>
                <blockquote className="mt-5 text-base leading-relaxed text-gray-700 dark:text-gray-300">
                  “To make better decisions, try listing pros and cons. Consider asking a mentor for advice. Trust your gut.”
                </blockquote>
              </div>
              <div className="border border-emerald-600 bg-emerald-50 p-6 dark:border-emerald-500 dark:bg-emerald-950/40">
                <p className="font-mono text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-300">With your ALVIRA profile</p>
                <blockquote className="mt-5 text-base leading-relaxed text-gray-800 dark:text-gray-200">
                  “Since you've said speed is your priority for reversible decisions, I'll give you a quick recommendation: option A based on what you've shared. For the bigger call — given your preference for consulting two trusted people — here are the specific questions worth running by them before you commit.”
                </blockquote>
              </div>
            </div>
            <p className="mt-6 max-w-4xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              ALVIRA builds this context through conversation. You don't write or organize it yourself. And because it's portable Markdown, it works across ChatGPT, Claude, Gemini, Cursor, and future AI tools.
            </p>
          </div>
        </div>
      </section>

      {/* --- Your knowledge, preserved --- */}
      <section className="py-32 px-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20">
            <span className="font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase">Artifacts</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Your knowledge, preserved
            </h2>
          </div>

          <div className="grid gap-16 md:grid-cols-3">
            <div>
              <p className="font-mono text-base text-gray-900 dark:text-gray-100">
                overview.md{" "}
                <span className="text-gray-300 dark:text-gray-600">{"/* human-readable + machine-readable */"}</span>
              </p>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                A simple, universal text format — human-readable <em>and</em> machine-readable.
                No proprietary format, no vendor lock-in. Any AI agent can read it. So can you.
              </p>
            </div>
            <div>
              <p className="font-mono text-base text-gray-900 dark:text-gray-100">
                constraints.md{" "}
                <span className="text-gray-300 dark:text-gray-600">{"/* durable context */"}</span>
              </p>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Most people give AI agents scattered instructions in chat windows. Those vanish.
                Markdown knowledge files are durable — version-controlled and always available
                for consistent behavior across sessions.
              </p>
            </div>
            <div>
              <p className="font-mono text-base text-gray-900 dark:text-gray-100">
                workflows.md{" "}
                <span className="text-gray-300 dark:text-gray-600">{"/* future-proof */"}</span>
              </p>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Models change. Platforms come and go. Your knowledge shouldn't be tied to any
                single AI. One interview, one knowledge package, every agent — now and in the future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Not sure what to capture? --- */}
      <section className="py-32 px-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16">
            <span className="font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase">Discovery</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Not sure what to capture?
            </h2>
          </div>

          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-16">
            Most people don't know what their AI is missing. Here's what ALVIRA helps you uncover.
          </p>

          {/* Categories grid: Personal | Team */}
          <div className="grid gap-16 md:grid-cols-2 mb-16">
            {/* Personal */}
            <div>
              <h3 className="font-mono text-xs text-gray-400 dark:text-gray-500 mb-8 uppercase tracking-widest">
                For individuals
              </h3>
              {[
                { label: "communication-style", desc: "How you write, your tone, preferred channels" },
                { label: "decision-making", desc: "How you evaluate options, who you consult, what you prioritize" },
                { label: "routines-and-habits", desc: "Your daily workflow, recurring tasks, tools you use" },
                { label: "relationships", desc: "Key people, how you collaborate, communication norms" },
                { label: "values-and-boundaries", desc: "What matters to you, what you won't compromise on" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-b border-gray-200 dark:border-gray-800 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0"
                >
                  <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400 mb-1">{item.label}</p>
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Team / Enterprise */}
            <div>
              <h3 className="font-mono text-xs text-gray-400 dark:text-gray-500 mb-8 uppercase tracking-widest">
                For teams
              </h3>
              {[
                { label: "workflows", desc: "Step-by-step processes, handoffs, tools involved" },
                { label: "standards", desc: "Code style, review processes, quality expectations" },
                { label: "escalation", desc: "Who approves what, when to escalate, decision thresholds" },
                { label: "domain-knowledge", desc: "Industry context, customer insights, institutional memory" },
                { label: "constraints", desc: "Compliance rules, budget limits, technical boundaries" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-b border-gray-200 dark:border-gray-800 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0"
                >
                  <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400 mb-1">{item.label}</p>
                  <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <a
            href="/app"
            className="inline-flex items-center gap-2 font-mono text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
          >
            Start your interview →
          </a>
        </div>
      </section>

      {/* --- How It Works --- */}
      <section id="how-it-works" className="py-32 px-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20">
            <span className="font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase">Process</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              How it works
            </h2>
          </div>

          <div className="grid gap-16 md:grid-cols-3">
            {/* Step 1 */}
            <div>
              <p className="font-mono text-sm text-emerald-500 dark:text-emerald-400 tabular-nums">01</p>
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">ALVIRA interviews you</h3>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Instead of filling out forms, ALVIRA asks adaptive questions. Each answer shapes the
                next, uncovering context you wouldn't think to provide.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <p className="font-mono text-sm text-emerald-500 dark:text-emerald-400 tabular-nums">02</p>
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">Knowledge gets compiled</h3>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Your answers are structured into standardized, version-controlled Markdown files —
                durable, portable, and AI-ready.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <p className="font-mono text-sm text-emerald-500 dark:text-emerald-400 tabular-nums">03</p>
              <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">Use across any agent</h3>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Feed the knowledge into any AI agent or framework. Consistent context means consistent
                results — fewer hallucinations, less prompt engineering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Why ALVIRA --- */}
      <section className="py-32 px-8 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20">
            <span className="font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase">Rationale</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Why ALVIRA?
            </h2>
          </div>

          <div className="grid gap-y-16 gap-x-20 sm:grid-cols-2">
            {[
              {
                label: "discovery",
                title: "Discover what's missing",
                body: "Most people don't know what to tell an AI. ALVIRA asks the right questions and adapts based on your answers, uncovering blind spots.",
              },
              {
                label: "portability",
                title: "Framework-agnostic",
                body: "Works with any AI agent framework. No lock-in. Standardized Markdown is the universal interface.",
              },
              {
                label: "durability",
                title: "One interview, lifelong value",
                body: "Your knowledge gets better over time. Revisit and refine as your needs evolve — the profile grows with you.",
              },
              {
                label: "output",
                title: "AI-ready output",
                body: "Standardized Markdown knowledge files that any AI agent can immediately consume. No lock-in, no proprietary formats.",
              },
            ].map((item) => (
              <div key={item.title}>
                <p className="font-mono text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
                <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{item.title}</h3>
                <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MeOS --- */}
      <section id="meos" className="py-32 px-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20">
            <span className="inline-block font-mono text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-1.5 tracking-wide mb-5">
              &lt;me-os /&gt;
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Your Personal Operating System
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-400 max-w-3xl">
              ALVIRA captures what to share with AI. MeOS applies that same discovery process to your life — building a private operating system for personal and professional alignment.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* MeOS Build */}
            <div className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
              <div className="flex-1">
                <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400">MeOS Build</p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">$149</p>
                <span className="mt-3 inline-block font-mono text-xs text-emerald-700 dark:text-emerald-400">One-time payment</span>
                <ul className="mt-8 space-y-4 text-base text-gray-600 dark:text-gray-400">
                  {[
                    "Adaptive Alvira interviews for personal discovery",
                    "Optional symbolic frameworks (astrology, Human Design, Enneagram, etc.)",
                    "LLM-powered integrated portrait with source traceability",
                    "Personal and professional purpose statements",
                    "Decision compass and daily alignment",
                    "Private authenticated MeOS site",
                    "Downloadable reference documents",
                    "Owner review and validation of every important claim",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="https://buy.stripe.com/aFa8wP5pM6C7bHz57uf7i04"
                className="mt-10 inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-6 py-3.5 text-base font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
              >
                Get MeOS Build
              </a>
            </div>

            {/* MeOS Care */}
            <div className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
              <div className="flex-1">
                <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400">MeOS Care</p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">$29<span className="text-lg font-medium text-gray-600 dark:text-gray-400">/mo</span></p>
                <ul className="mt-8 space-y-4 text-base text-gray-600 dark:text-gray-400">
                  {[
                    "Updated portraits as your life evolves",
                    "Refreshed symbolic cycles and countdowns",
                    "Ongoing private site hosting",
                    "Periodic regeneration sessions",
                    "Continuous alignment support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="https://buy.stripe.com/14A9AT2dAbWr12V7fCf7i05"
                className="mt-10 inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-6 py-3.5 text-base font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
              >
                Get MeOS Care
              </a>
            </div>
          </div>

          <p className="mt-8 font-mono text-xs text-gray-500 dark:text-gray-500 leading-relaxed max-w-3xl">
            Symbolic frameworks are optional lenses for self-reflection. ALVIRA never presents them as scientific, diagnostic, predictive, or deterministic. Your lived experience remains the highest validation layer.
          </p>
        </div>
      </section>

      {/* --- Pricing --- */}
      <section id="pricing" className="py-32 px-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16">
            <span className="font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase">Pricing</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Start building your AI profile
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Pro */}
            <div className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
              <div className="flex-1">
                <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400">Pro</p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">$20<span className="text-lg font-medium text-gray-600 dark:text-gray-400">/mo</span></p>
                <ul className="mt-8 space-y-4 text-base text-gray-600 dark:text-gray-400">
                  {[
                    "Unlimited interviews",
                    "Multiple AI profiles",
                    "Markdown & JSON exports",
                    "Version history",
                    "Continuous updates",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="https://buy.stripe.com/5kQdR97xU0dJ3b30Ref7i02"
                className="mt-10 inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-6 py-3.5 text-base font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
              >
                Get Pro
              </a>
            </div>

            {/* Lifetime */}
            <div className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
              <div className="flex-1">
                <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400">Lifetime</p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">$199</p>
                <span className="mt-3 inline-block font-mono text-xs text-emerald-700 dark:text-emerald-400">One-time payment</span>
                <ul className="mt-8 space-y-4 text-base text-gray-600 dark:text-gray-400">
                  {["Everything in Pro", "Permanent profile — no subscription", "Priority support"].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 flex-shrink-0" aria-hidden="true">+</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="https://buy.stripe.com/cNi6oH7xUbWr5jb2Zmf7i03"
                className="mt-10 inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-6 py-3.5 text-base font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
              >
                Get Lifetime
              </a>
            </div>

            {/* MeOS Build */}
            <div className="flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8">
              <div className="flex-1">
                <p className="font-mono text-sm text-emerald-700 dark:text-emerald-400">MeOS Build</p>
                <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">$149</p>
                <span className="mt-3 inline-block font-mono text-xs text-emerald-700 dark:text-emerald-400">One-time</span>
                <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  Personal Operating System
                </p>
                <p className="mt-3 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  Integrated portrait, private site, decision compass, daily alignment.
                </p>
              </div>
              <a
                href="https://buy.stripe.com/aFa8wP5pM6C7bHz57uf7i04"
                className="mt-10 inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-6 py-3.5 text-base font-semibold text-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
              >
                Get MeOS Build
              </a>
            </div>
          </div>

          <p className="mt-8 font-mono text-xs text-gray-500 dark:text-gray-400">
            // <a href="/app" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Free tier available. Try it first — no credit card required.</a>
            <span className="mx-2 text-gray-300 dark:text-gray-700">·</span>
            <a href="/why-alvira" className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors">Why upgrade?</a>
          </p>
        </div>
      </section>

      {/* --- Waitlist --- */}
      <section id="waitlist" className="py-32 px-8 bg-gray-950 dark:bg-black scroll-mt-20">
        <div className="mx-auto max-w-xl text-center">
          <span className="font-mono text-xs text-emerald-400 tracking-wide uppercase">Launch</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join the waitlist
          </h2>
          <p className="mt-4 text-lg text-gray-400 leading-relaxed">
            Be the first to know when ALVIRA launches. Early access members get priority onboarding.
          </p>

          {status === "success" ? (
            <div className="mt-12 border border-gray-800 rounded-lg px-8 py-10">
              <p className="text-xl font-semibold text-white">{message}</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-6 font-mono text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                sign_up_another()
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-12">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="you@company.com"
                  required
                  className="flex-1 min-w-0 rounded-lg border border-gray-700 bg-gray-900 px-5 py-4 text-base text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-0 outline-none transition-colors duration-200"
                />
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {status === "submitting" ? "Joining..." : "Join the waitlist"}
                </button>
              </div>
              {status === "error" && (
                <p className="mt-3 text-sm text-red-400">{message}</p>
              )}
              <p className="mt-4 font-mono text-xs text-gray-600">
                // No spam. Launch updates only.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-gray-950 py-8 px-8 border-t border-gray-800">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-700 text-white text-[10px] font-mono font-bold">
              A
            </span>
            <span className="font-mono text-sm text-gray-400 tracking-tight">ALVIRA</span>
          </div>
          <p className="font-mono text-xs text-gray-600 tabular-nums">
            &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
