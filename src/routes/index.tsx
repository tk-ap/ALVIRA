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
  const [activePreview, setActivePreview] = useState("overview.md");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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

      {/* --- Platform memory comparison --- */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-24 dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Comparison</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Your knowledge, not their platform
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Most AI platforms remember you in ways you can't see, edit, or take with you. ALVIRA builds knowledge you own — open Markdown files that work everywhere, stay current, and never lock you in.
            </p>
          </div>

          {/* --- Desktop table --- */}
          <div className="mt-14 hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th scope="col" className="w-1/6 py-3 pr-4 font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Dimension</th>
                  <th scope="col" className="w-[17%] py-3 px-3 font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30">ALVIRA</th>
                  <th scope="col" className="w-[17%] py-3 px-3 font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">ChatGPT Memory</th>
                  <th scope="col" className="w-[17%] py-3 px-3 font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Claude Projects</th>
                  <th scope="col" className="w-[17%] py-3 px-3 font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Custom GPTs</th>
                  <th scope="col" className="w-[17%] py-3 px-3 font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Cursor Rules</th>
                </tr>
              </thead>
              <tbody className="text-sm leading-relaxed">
                {[
                  {
                    dim: "Portability",
                    alvira: { text: "Works with any AI tool", positive: true },
                    gptMem: { text: "ChatGPT only", positive: false },
                    claude: { text: "Claude only", positive: false },
                    gpts: { text: "ChatGPT only", positive: false },
                    cursor: { text: "Cursor IDE only", positive: false },
                  },
                  {
                    dim: "File format",
                    alvira: { text: "Open Markdown, you own it", positive: true },
                    gptMem: { text: "Hidden, proprietary", positive: false },
                    claude: { text: "Hidden project config", positive: false },
                    gpts: { text: "Hidden GPT config", positive: false },
                    cursor: { text: "Plain text, but dev-only", positive: false },
                  },
                  {
                    dim: "Editability",
                    alvira: { text: "Full control — edit anything", positive: true },
                    gptMem: { text: "Cannot view or export", positive: false },
                    claude: { text: "Limited to project UI", positive: false },
                    gpts: { text: "Limited to builder UI", positive: false },
                    cursor: { text: "Manual file edits", positive: false },
                  },
                  {
                    dim: "Depth",
                    alvira: { text: "19 domains, adaptive interviews", positive: true },
                    gptMem: { text: "Surface memory from chats", positive: false },
                    claude: { text: "Project-level context", positive: false },
                    gpts: { text: "Single-purpose instructions", positive: false },
                    cursor: { text: "Code-style rules only", positive: false },
                  },
                  {
                    dim: "Updates",
                    alvira: { text: "Continuous, versioned, you control", positive: true },
                    gptMem: { text: "Automatic, unpredictable", positive: false },
                    claude: { text: "Manual per project", positive: false },
                    gpts: { text: "Static unless rebuilt", positive: false },
                    cursor: { text: "Manual file edits", positive: false },
                  },
                  {
                    dim: "Privacy",
                    alvira: { text: "Your files, your storage", positive: true },
                    gptMem: { text: "OpenAI servers", positive: false },
                    claude: { text: "Anthropic servers", positive: false },
                    gpts: { text: "OpenAI servers", positive: false },
                    cursor: { text: "Local file on disk", positive: true },
                  },
                ].map((row) => (
                  <tr key={row.dim} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                    <td className="py-3.5 pr-4 font-semibold text-gray-900 dark:text-gray-100">{row.dim}</td>
                    {[row.alvira, row.gptMem, row.claude, row.gpts, row.cursor].map((cell, ci) => (
                      <td
                        key={ci}
                        className={`py-3.5 px-3 ${ci === 0 ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {cell.positive ? (
                            <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 shrink-0 text-red-400 dark:text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className={cell.positive ? "text-gray-800 dark:text-gray-200" : "text-gray-500 dark:text-gray-400"}>{cell.text}</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- Mobile cards --- */}
          <div className="mt-12 sm:hidden space-y-6">
            {[
              {
                dim: "Portability",
                alvira: "Works with any AI tool",
                others: ["ChatGPT Memory: ChatGPT only", "Claude Projects: Claude only", "Custom GPTs: ChatGPT only", "Cursor Rules: Cursor IDE only"],
              },
              {
                dim: "File format",
                alvira: "Open Markdown, you own it",
                others: ["ChatGPT Memory: Hidden, proprietary", "Claude Projects: Hidden project config", "Custom GPTs: Hidden GPT config", "Cursor Rules: Plain text, dev-only"],
              },
              {
                dim: "Editability",
                alvira: "Full control — edit anything",
                others: ["ChatGPT Memory: Cannot view or export", "Claude Projects: Limited to project UI", "Custom GPTs: Limited to builder UI", "Cursor Rules: Manual file edits"],
              },
              {
                dim: "Depth",
                alvira: "19 domains, adaptive interviews",
                others: ["ChatGPT Memory: Surface memory from chats", "Claude Projects: Project-level context", "Custom GPTs: Single-purpose instructions", "Cursor Rules: Code-style rules only"],
              },
              {
                dim: "Updates",
                alvira: "Continuous, versioned, you control",
                others: ["ChatGPT Memory: Automatic, unpredictable", "Claude Projects: Manual per project", "Custom GPTs: Static unless rebuilt", "Cursor Rules: Manual file edits"],
              },
              {
                dim: "Privacy",
                alvira: "Your files, your storage",
                others: ["ChatGPT Memory: OpenAI servers", "Claude Projects: Anthropic servers", "Custom GPTs: OpenAI servers", "Cursor Rules: Local file on disk"],
              },
            ].map((card) => (
              <div key={card.dim} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 px-5 py-3 border-b border-emerald-200 dark:border-emerald-900">
                  <span className="font-mono text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-300">{card.dim}</span>
                </div>
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-emerald-50/30 dark:bg-emerald-950/10">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <svg className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    ALVIRA: {card.alvira}
                  </span>
                </div>
                <div className="px-5 py-3 space-y-2.5">
                  {card.others.map((o) => (
                    <div key={o} className="flex items-start gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <svg className="h-4 w-4 shrink-0 mt-0.5 text-red-400 dark:text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                      {o}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-12 max-w-3xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Platform memory features are designed to keep you on their platform. ALVIRA's Markdown knowledge files are designed to go wherever you go — into any AI tool, any editor, any workflow.{" "}
            <span className="text-gray-700 dark:text-gray-300">You own the files. You control the updates. You decide where they live.</span>
          </p>
        </div>
      </section>

      {/* --- Example profile preview --- */}
      <section className="border-t border-gray-100 bg-white px-6 py-24 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Example profile</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              See what your knowledge becomes.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              ALVIRA turns a conversation into practical context your AI can actually use—not a vague personality summary.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-xl border border-gray-200 bg-gray-950 shadow-sm dark:border-gray-700">
            <div className="flex overflow-x-auto border-b border-gray-800 bg-gray-900" role="tablist" aria-label="Example profile files">
              {profilePreviews.map((preview) => {
                const isActive = preview.filename === activePreview;
                return (
                  <button
                    key={preview.filename}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActivePreview(preview.filename)}
                    className={`shrink-0 border-r border-gray-800 px-5 py-3 font-mono text-xs transition-colors ${
                      isActive ? "bg-gray-950 text-emerald-400" : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    {preview.filename}
                  </button>
                );
              })}
            </div>
            <div className="min-h-[16rem] p-5 sm:p-8" role="tabpanel" aria-label={profilePreviews.find((p) => p.filename === activePreview)?.filename}>
              <div className="mb-5 flex items-center gap-2 font-mono text-xs text-gray-500">
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
        </div>
      </section>

      {/* --- Your knowledge, preserved --- */}
      <section className="py-32 px-8 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
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

      {/* --- Free plan card --- */}
      <section className="border-t border-gray-100 bg-white px-6 py-24 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Start free</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Everything you need to build your first AI profile.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Start free — no credit card, no time limit. When ALVIRA becomes part of how you work, upgrade for more profiles and continuous updates.
            </p>
          </div>

          <div className="mt-12 max-w-md">
            <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 p-6 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-950/20 sm:p-8">
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
                  "No credit card required",
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
                <a href="/pricing" className="font-mono text-xs text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors">
                  Compare plans →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Privacy & trust --- */}
      <section id="privacy" className="border-t border-gray-100 bg-white px-6 py-20 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
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
              ["01", "Local-first", "Your interviews and profiles are stored as Markdown files. You decide where they live — your computer, a private repo, or nowhere at all."],
              ["02", "No training", "We never use your knowledge to train AI models. Your data is yours, period."],
              ["03", "Portable format", "Open Markdown means no vendor lock-in. Read, edit, and use your files with any tool, forever."],
              ["04", "You control sharing", "Share files with specific AI tools or team members, or keep them completely private. There is no opt-out because you are never opted in."],
            ].map(([number, title, body]) => (
              <div key={title} className="border-t border-gray-200 pt-5 dark:border-gray-800">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-600 font-mono text-xs font-semibold text-emerald-700 dark:border-emerald-500 dark:text-emerald-400" aria-hidden="true">
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

          <p className="mt-12 max-w-3xl border-l-2 border-emerald-500 pl-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            ALVIRA is built on the belief that your knowledge should belong to you — not to us, and not to any AI platform.
          </p>
        </div>
      </section>

      {/* --- Continuous value lifecycle --- */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-24 dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Continuous value</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Not a one-time profile. A living knowledge system.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              The interview is just the beginning. ALVIRA's real value is how your knowledge stays current, grows with you, and keeps making every AI interaction better.
            </p>
          </div>

          <div className="mt-16">
            {/* Desktop: horizontal 4-step flow */}
            <div className="hidden sm:flex sm:items-start sm:justify-center">
              {[
                { title: "Interview", desc: "ALVIRA asks adaptive questions to discover your knowledge." },
                { title: "Compile", desc: "Your answers become structured Markdown files you own." },
                { title: "Use", desc: "Copy-paste into any AI tool — ChatGPT, Claude, Cursor, and beyond." },
                { title: "Update", desc: "Return anytime. New interviews build on what you've already captured. Your knowledge stays current." },
              ].map((step, i) => (
                <div key={step.title} className="flex items-start">
                  <div className="flex flex-col items-center text-center w-48 px-2">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-600 bg-gray-50 dark:border-emerald-500 dark:bg-gray-900 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {i + 1}
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-gray-100">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="flex items-center justify-center pt-8 shrink-0 w-10 sm:w-14" aria-hidden="true">
                      <div className="h-px w-full bg-gray-300 dark:bg-gray-600 relative">
                        <div className="absolute -right-0.5 -top-1 w-2.5 h-2.5 border-t-2 border-r-2 border-gray-300 dark:border-gray-600 rotate-45" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: vertical stack */}
            <div className="sm:hidden space-y-8">
              {[
                { title: "Interview", desc: "ALVIRA asks adaptive questions to discover your knowledge." },
                { title: "Compile", desc: "Your answers become structured Markdown files you own." },
                { title: "Use", desc: "Copy-paste into any AI tool — ChatGPT, Claude, Cursor, and beyond." },
                { title: "Update", desc: "Return anytime. New interviews build on what you've already captured. Your knowledge stays current." },
              ].map((step, i) => (
                <div key={step.title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 bg-gray-50 dark:border-emerald-500 dark:bg-gray-900 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-14 max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300 font-medium">
            The more you use it, the better your AI gets at working with you.
          </p>
        </div>
      </section>

      {/* --- Everyday use cases --- */}
      <section className="border-t border-gray-100 bg-white px-6 py-24 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Everyday use cases</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              ALVIRA in your daily workflow.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Whatever your work looks like, give your AI the context to make every interaction more useful.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: "💻",
                title: "Developer",
                body: "Paste your coding preferences, stack choices, and conventions into Cursor or Copilot. Get PR reviews and code suggestions that actually match how you work.",
              },
              {
                icon: "🧭",
                title: "Consultant / Freelancer",
                body: "Share your methodologies, client communication style, and deliverable standards with Claude. Get proposals, emails, and analysis in your voice.",
              },
              {
                icon: "🤝",
                title: "Team Lead",
                body: "Give your team's AI tools shared context about processes, decisions, and constraints. Every team member gets aligned AI assistance.",
              },
              {
                icon: "✍️",
                title: "Creator / Writer",
                body: "Feed ChatGPT your voice, audience, and content philosophy. Drafts come back sounding like you, not generic AI.",
              },
            ].map((useCase) => (
              <article key={useCase.title} className="border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900 sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">{useCase.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{useCase.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{useCase.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-medium leading-relaxed text-gray-800 dark:text-gray-200 sm:text-lg">
              Whatever you build, ALVIRA makes sure your AI knows how you work.
            </p>
            <a
              href="/app"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus-visible:outline-emerald-400"
            >
              Build my AI profile <span aria-hidden="true" className="ml-2">→</span>
            </a>
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

      {/* --- FAQ --- */}
      <section id="faq" className="border-t border-gray-100 bg-white px-6 py-24 dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">Questions, answered.</h2>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800">
            {[
              {
                question: "How is this different from ChatGPT's memory?",
                answer: "ALVIRA builds portable, editable Markdown files you own—not hidden memory tied to one platform. You can inspect, update, and take your profile anywhere.",
              },
              {
                question: "What happens to my data?",
                answer: "Your knowledge stays in the Markdown files you control. We never train on it.",
              },
              {
                question: "Can I use this with Claude, Gemini, or Cursor?",
                answer: "Yes. Markdown works everywhere, so you can copy-paste your profile into Claude, Gemini, Cursor, ChatGPT, or any other AI tool.",
              },
              {
                question: "How long does an interview take?",
                answer: "About 10–15 minutes gives you a solid foundation. Return anytime to go deeper or update your profile as things change.",
              },
              {
                question: "Is there a free plan?",
                answer: "Yes: 1 profile, 3 interviews, and all 19 knowledge domains—with no credit card required.",
              },
              {
                question: "What's the difference between ALVIRA Personal and MeOS?",
                answer: "ALVIRA Personal builds your AI profile. MeOS turns what ALVIRA discovers into a personal operating system for decisions, direction, work, and daily life.",
              },
            ].map((item, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={item.question} className="border-b border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-semibold text-gray-900 transition-colors hover:text-emerald-700 dark:text-gray-100 dark:hover:text-emerald-400 sm:text-lg"
                  >
                    <span>{item.question}</span>
                    <span className="shrink-0 font-mono text-xl font-normal text-emerald-700 dark:text-emerald-400" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <p className="max-w-2xl pb-5 pr-10 text-base leading-relaxed text-gray-600 dark:text-gray-400">{item.answer}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <a
              href="/app"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-7 py-3.5 text-base font-semibold text-white transition-colors duration-200 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 dark:focus-visible:outline-emerald-400"
            >
              Ready to build your AI profile? → Start free
            </a>
          </div>
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
