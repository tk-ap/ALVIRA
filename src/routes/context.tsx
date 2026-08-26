import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import {
  CONTEXT_SOURCE_OPTIONS,
  makeSource,
  type ContextSource,
  type ContextSourceType,
} from "~/lib/context-engine";

export const Route = createFileRoute("/context")({
  head: () => ({
    meta: [
      { title: "Context Engine — ALVIRA" },
      { name: "description", content: "Bring the context you have already expressed. ALVIRA connects sources, finds gaps, and asks what it still needs to know." },
    ],
  }),
  component: ContextEnginePage,
});

function ContextEnginePage() {
  const [sources, setSources] = useState<ContextSource[]>([]);
  const [selectedType, setSelectedType] = useState<ContextSourceType>("website");
  const [locator, setLocator] = useState("");
  const [notice, setNotice] = useState("");

  const selected = CONTEXT_SOURCE_OPTIONS.find((option) => option.type === selectedType)!;
  const sourceCount = sources.length;
  const queuedCount = useMemo(() => sources.filter((source) => source.status === "queued").length, [sources]);

  function addSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!locator.trim()) return;
    const source = makeSource(locator);
    const typedSource = { ...source, type: selectedType };
    setSources((current) => [...current, typedSource]);
    setLocator("");
    setNotice(`${typedSource.label} added. ALVIRA will treat it as source evidence, not as confirmed truth.`);
  }

  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main id="main-content">
        <section className="border-b border-gray-200 px-6 py-20 dark:border-gray-800 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">ALVIRA Context Engine</span>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Start with what already exists.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              Your context is already spread across the internet, your files, and other AI tools. Bring the sources you want ALVIRA to understand. It will use them as evidence, then interview you about what is missing or unclear.
            </p>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <div className="grid gap-3 sm:grid-cols-2">
                {CONTEXT_SOURCE_OPTIONS.map((option) => {
                  const active = option.type === selectedType;
                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setSelectedType(option.type)}
                      className={`border p-5 text-left transition-colors ${active ? "border-system bg-system/5 dark:bg-system/10" : "border-gray-200 hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600"}`}
                      aria-pressed={active}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-semibold">{option.label}</h2>
                        {active && <span className="font-mono text-xs text-system-dark dark:text-system">SELECTED</span>}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{option.description}</p>
                      <p className="mt-3 font-mono text-xs text-gray-500 dark:text-gray-500">{option.examples}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900 sm:p-8">
              <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Add a source</span>
              <h2 className="mt-3 text-2xl font-bold">{selected.label}</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{selected.description}</p>

              {selectedType === "file" || selectedType === "ai-context" ? (
                <div className="mt-7 rounded-md border border-dashed border-gray-300 bg-white p-5 dark:border-gray-700 dark:bg-gray-950">
                  <p className="text-sm font-medium">File intake is the next processing step.</p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">The existing ALVIRA document extractor can seed claims from uploaded text. This screen establishes the same source → evidence model for those files.</p>
                </div>
              ) : selectedType === "interview" ? (
                <a href="/interview" className="mt-7 inline-flex rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
                  Start the interview →
                </a>
              ) : (
                <form onSubmit={addSource} className="mt-7">
                  <label htmlFor="source-locator" className="font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">URL</label>
                  <input
                    id="source-locator"
                    value={locator}
                    onChange={(event) => setLocator(event.target.value)}
                    placeholder="https://yourwebsite.com"
                    inputMode="url"
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-system focus:ring-2 focus:ring-system/20 dark:border-gray-700 dark:bg-gray-950"
                  />
                  <button type="submit" className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
                    Add source
                  </button>
                </form>
              )}

              {notice && <p className="mt-5 border-l-2 border-system pl-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{notice}</p>}
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-gray-950 px-6 py-16 text-white dark:border-gray-800 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-3">
              {[
                ["01 / OBSERVE", "ALVIRA extracts supported signals from the sources you choose."],
                ["02 / ASK", "It finds missing, conflicting, stale, or low-confidence context and asks targeted follow-ups."],
                ["03 / BUILD", "Confirmed understanding becomes reusable AI context you can carry to other tools."],
              ].map(([title, body]) => (
                <div key={title} className="border border-gray-800 bg-gray-900 p-6">
                  <p className="font-mono text-xs text-system">{title}</p>
                  <p className="mt-4 text-sm leading-relaxed text-gray-300">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Your sources</span>
                <h2 className="mt-3 text-2xl font-bold">Context queue</h2>
              </div>
              <div className="font-mono text-xs text-gray-500 dark:text-gray-400">{sourceCount} source{sourceCount === 1 ? "" : "s"} · {queuedCount} queued</div>
            </div>

            {sources.length === 0 ? (
              <div className="mt-8 border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
                <p className="font-mono text-sm text-gray-500 dark:text-gray-400">No sources yet.</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Add a website, professional profile, social profile, or start with the interview.</p>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {sources.map((source) => (
                  <div key={source.id} className="flex flex-col gap-3 border border-gray-200 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-system" aria-hidden="true" />
                        <h3 className="font-semibold">{source.label}</h3>
                      </div>
                      <p className="mt-2 break-all font-mono text-xs text-gray-500 dark:text-gray-400">{source.locator}</p>
                    </div>
                    <span className="self-start rounded border border-gray-200 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:self-auto">Queued for analysis</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-gray-200 bg-gray-50 px-6 py-16 dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-3xl">
              <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Trust model</span>
              <h2 className="mt-3 text-2xl font-bold">ALVIRA does not assume that everything it finds is true.</h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Every useful signal should be traceable to a source and separated from inference. User confirmation is what turns an observation into trusted context.</p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              {[
                ["Observed", "Found in a source"],
                ["Inferred", "Pattern suggested by evidence"],
                ["Confirmed", "You say it is true"],
                ["Outdated", "Previously true, no longer current"],
              ].map(([title, body]) => (
                <div key={title} className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
                  <p className="font-mono text-xs text-system-dark dark:text-system">{title}</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to fill the gaps?</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Sources give ALVIRA a head start. The interview turns uncertainty into understanding.</p>
            <a href="/app" className="mt-7 inline-flex rounded-lg bg-gray-900 px-6 py-3.5 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Continue to ALVIRA →</a>
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
