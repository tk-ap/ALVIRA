import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Build your ALVIRA profile — ALVIRA" },
      {
        name: "description",
        content:
          "Start the ALVIRA interview and turn your knowledge into structured guidance for AI tools.",
      },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-14 sm:px-8">
        <section className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-gray-50 p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-12">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">
            &lt; app /&gt;
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
            Build your ALVIRA profile.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            Turn your context into a reusable, portable AI profile that reflects how
            you think, decide, and work.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/interview"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-system dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Start the interview
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3.5 font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-system dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              View your profiles
            </a>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              ["Structured", "Turn a conversation into portable Markdown files."],
              ["Personal", "Capture the context your AI should know about you."],
              ["Reusable", "Keep your profile current and share it across tools."],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950"
              >
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-system-dark dark:text-system">
                  {title}
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
