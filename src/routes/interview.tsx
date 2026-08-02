import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";

export const Route = createFileRoute("/interview")({
  component: InterviewPage,
});

const files = [
  ["overview.md", "Who you are, in your own words."],
  ["communication.md", "How you prefer to think and communicate."],
  ["decision-making.md", "The principles behind your choices."],
  ["workflows.md", "The repeatable ways you get things done."],
];

function Arrow() {
  return <span aria-hidden="true"> →</span>;
}

function InterviewPage() {
  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main>
        <section className="border-b border-gray-200 px-6 py-20 dark:border-gray-800 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                The ALVIRA interview
              </span>
              <h1 className="mt-5 max-w-xl text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
                Build the context your AI is missing.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                A guided conversation turns the way you think, work, and decide
                into a profile your AI can actually use.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="/app"
                  className="inline-flex rounded-lg bg-gray-900 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  Start the interview <Arrow />
                </a>
                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  Free to start · No credit card
                </span>
              </div>
            </div>
            <InterviewCard />
          </div>
        </section>

        <section className="bg-gray-50 px-6 py-20 dark:bg-gray-900 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              01 / How it works
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              A conversation, not a questionnaire.
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                [
                  "01",
                  "Describe",
                  "Start with what you want your AI to understand: your work, goals, preferences, and boundaries.",
                ],
                [
                  "02",
                  "Interview",
                  "ALVIRA asks adaptive follow-ups. Each answer helps it find the next useful question.",
                ],
                [
                  "03",
                  "Compile",
                  "Validated answers become organized Markdown files you can read, edit, and use anywhere.",
                ],
              ].map(([number, title, body]) => (
                <div
                  key={number}
                  className="border-t border-gray-300 pt-5 dark:border-gray-700"
                >
                  <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                    {number}
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 px-6 py-20 dark:border-gray-800 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                02 / In practice
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                The useful detail is in the follow-up.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
                ALVIRA goes beyond what you think to ask. It listens for the
                context that makes an answer useful.
              </p>
            </div>
            <div className="mt-12 grid overflow-hidden rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 lg:grid-cols-[1.1fr_.9fr]">
              <div className="border-b border-gray-300 p-6 dark:border-gray-700 lg:border-b-0 lg:border-r">
                <p className="font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  ALVIRA · question 08
                </p>
                <p className="mt-5 text-lg font-medium leading-relaxed">
                  When you are making a difficult decision, what helps you move
                  forward with confidence?
                </p>
                <div className="mt-7 rounded-md border border-gray-300 bg-white p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                  I want to understand the trade-offs first. If the decision is
                  reversible, I prefer to move quickly and learn. If it is hard
                  to undo, I need time to hear from people I trust.
                </div>
                <div className="mt-5 flex items-center gap-2 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
                  Answer saved
                </div>
              </div>
              <div className="p-6">
                <p className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Next question
                </p>
                <p className="mt-5 text-base font-medium leading-relaxed">
                  Who do you typically consult for the decisions that are hard
                  to undo — and what do you want from their input?
                </p>
                <p className="mt-8 border-l-2 border-emerald-500 pl-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  One answer gives ALVIRA enough signal to ask a better next
                  question.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                03 / Good answers
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Give your AI something to work with.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
                The more real detail you share, the more useful your profile becomes.
                A single sentence with specifics beats a one-word answer every time.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {/* Bad examples */}
              <div className="rounded-lg border border-red-200 bg-red-50/60 p-6 dark:border-red-800 dark:bg-red-950/20">
                <p className="font-mono text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                  Not very helpful
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                  Too short for your AI to learn anything real.
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    ["Q: How do you make decisions?", "A: I think about it."],
                    ["Q: What matters most in your work?", "A: Getting it done."],
                    ["Q: How do you prefer to communicate?", "A: Directly."],
                    ["Q: What gives you energy?", "A: idk."],
                  ].map(([q, a]) => (
                    <div key={q} className="rounded border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-gray-950">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{q}</p>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300 line-through">{a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Good examples */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-800 dark:bg-emerald-950/20">
                <p className="font-mono text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Much more useful
                </p>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                  Specific, honest, and personal — your AI can actually use this.
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    ["Q: How do you make decisions?", "A: I list the trade-offs first, then sit with it overnight if it's reversible. For bigger calls, I talk to two or three people I trust before committing."],
                    ["Q: What matters most in your work?", "A: Clarity of expectations and autonomy in how I get there. I do my best work when I know the destination but own the route."],
                    ["Q: How do you prefer to communicate?", "A: Writing over meetings when I can. I like time to think before responding — especially if the topic is new or sensitive."],
                    ["Q: What gives you energy?", "A: Solving a hard problem with someone who is just as invested. Also: a clean slate in the morning and a clear win before lunch."],
                  ].map(([q, a]) => (
                    <div key={q} className="rounded border border-emerald-200 bg-white p-3 dark:border-emerald-800 dark:bg-gray-950">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{q}</p>
                      <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                A good rule of thumb
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Answer like you are explaining yourself to a thoughtful colleague — not filling out a form.
                If your answer is shorter than this tip, it is probably too short.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 px-6 py-20 dark:bg-gray-900 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
              <div>
                <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  04 / Your output
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  A profile you can inspect.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-gray-600 dark:text-gray-400">
                  Your answers are compiled into clear, focused files—not hidden
                  inside a black box. Keep the parts that matter. Update them as
                  you change.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {files.map(([name, description]) => (
                  <div
                    key={name}
                    className="rounded-md border border-gray-300 bg-white p-5 dark:border-gray-700 dark:bg-gray-950"
                  >
                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                      {name}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {description}
                    </p>
                    <span className="mt-5 block font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      validated · ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 px-6 py-20 dark:border-gray-800 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                05 / Portable by design
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                One profile. Every AI tool.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400">
                Bring your context to the tools you already use. Your knowledge
                stays readable and yours.
              </p>
            </div>
            <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:items-stretch sm:justify-center">
              <div className="flex w-full max-w-xs items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-50 p-6 text-center dark:bg-emerald-950/30">
                <div>
                  <p className="font-mono text-lg font-semibold">ALVIRA</p>
                  <p className="mt-2 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                    your Markdown profile
                  </p>
                </div>
              </div>
              <div
                className="flex items-center text-2xl text-emerald-600"
                aria-hidden="true"
              >
                →
              </div>
              <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                <Tool name="ChatGPT" />
                <Tool name="Claude" />
                <Tool name="Gemini" />
                <Tool name="Cursor" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-950 px-6 py-20 text-center text-white dark:bg-black sm:px-8 sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Give your AI a better starting point.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Start with a free interview. You can see what ALVIRA learns before
            you decide what comes next.
          </p>
          <a
            href="/app"
            className="mt-8 inline-flex rounded-lg bg-emerald-600 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-emerald-400"
          >
            Start your free interview <Arrow />
          </a>
        </section>
      </main>
    </div>
  );
}

function InterviewCard() {
  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-7">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          ALVIRA / interview
        </span>
        <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
          03 / 19 domains
        </span>
      </div>
      <p className="mt-7 text-lg font-medium leading-relaxed">
        What does a good working day look like for you?
      </p>
      <p className="mt-5 rounded-md border border-gray-300 bg-white p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
        I need a quiet start to think before I collaborate. By afternoon, I like
        having decisions made and clear next steps.
      </p>
      <div className="mt-5 flex items-center justify-between">
        <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
          ✓ captured
        </span>
        <span className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <span className="block h-full w-1/4 rounded-full bg-emerald-500" />
        </span>
      </div>
    </div>
  );
}

function Tool({ name }: { name: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-4 text-center font-mono text-sm dark:border-gray-800 dark:bg-gray-900">
      {name}
    </div>
  );
}
