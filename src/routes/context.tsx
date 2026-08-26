import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { CONTEXT_SOURCE_OPTIONS, makeSource, type ContextSource, type ContextSourceType } from "~/lib/context-engine";

export const Route = createFileRoute("/context")({
  head: () => ({
    meta: [
      { title: "Your Context — ALVIRA" },
      { name: "description", content: "Build, inspect, and improve the living context ALVIRA uses to understand you." },
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
  const queuedCount = useMemo(() => sources.filter((source) => source.status === "queued").length, [sources]);
  const hasSources = sources.length > 0;

  function addSource(event: FormEvent<HTMLFormElement>) {
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
        <section className="border-b border-gray-200 px-6 py-14 dark:border-gray-800 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Your Context</span>
                <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">The information ALVIRA knows about you.</h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">Build a living context from what you have already expressed, then let ALVIRA find the gaps and ask what it still needs to know.</p>
              </div>
              <a href="/app" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Start from a document →</a>
            </div>
          </div>
        </section>

        {!hasSources ? (
          <section className="px-6 py-14 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-5xl">
              <div className="border border-system/30 bg-system/5 p-8 dark:bg-system/10 sm:p-10">
                <div className="max-w-2xl">
                  <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Your context is empty</span>
                  <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Give ALVIRA something to work with.</h2>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">You do not need to type everything manually. Start from a document, bring an existing source, or let the interview fill the gaps.</p>
                </div>
                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  <a href="/app" className="border border-gray-200 bg-white p-5 transition-colors hover:border-system dark:border-gray-800 dark:bg-gray-950">
                    <p className="font-mono text-xs text-system-dark dark:text-system">01 / FASTEST</p>
                    <h3 className="mt-3 font-semibold">Start from a document</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Use a résumé, notes, project brief, or other material you already have.</p>
                  </a>
                  <button type="button" onClick={() => setSelectedType("website")} className="border border-gray-200 bg-white p-5 text-left transition-colors hover:border-system dark:border-gray-800 dark:bg-gray-950">
                    <p className="font-mono text-xs text-system-dark dark:text-system">02 / BRING SOURCES</p>
                    <h3 className="mt-3 font-semibold">Add a website or profile</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Give ALVIRA a URL and let it use the source as evidence.</p>
                  </button>
                  <a href="/interview" className="border border-gray-200 bg-white p-5 transition-colors hover:border-system dark:border-gray-800 dark:bg-gray-950">
                    <p className="font-mono text-xs text-system-dark dark:text-system">03 / BUILD WITH ALVIRA</p>
                    <h3 className="mt-3 font-semibold">Start the interview</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Answer targeted questions and let ALVIRA surface context you might not think to provide.</p>
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="px-6 py-12 sm:px-8 sm:py-16">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-4 md:grid-cols-3">
                {[["Sources", `${sources.length}`, "Added to your context"], ["Queued", `${queuedCount}`, "Waiting for analysis"], ["Next step", "Fill gaps", "Use the interview to confirm what matters"]].map(([title, value, body]) => (
                  <div key={title} className="border border-gray-200 p-5 dark:border-gray-800">
                    <p className="font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="mt-3 text-2xl font-bold">{value}</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-y border-gray-200 px-6 py-14 dark:border-gray-800 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Build your context</span>
                  <h2 className="mt-3 text-2xl font-bold">Bring in what already exists.</h2>
                </div>
                <span className="hidden font-mono text-xs text-gray-500 dark:text-gray-400 sm:block">Sources → evidence → context</span>
              </div>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {CONTEXT_SOURCE_OPTIONS.map((option) => {
                  const active = option.type === selectedType;
                  return (
                    <button key={option.type} type="button" onClick={() => { setSelectedType(option.type); setNotice(""); }} className={`border p-5 text-left transition-colors ${active ? "border-system bg-system/5 dark:bg-system/10" : "border-gray-200 hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600"}`} aria-pressed={active}>
                      <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{option.label}</h3>{active && <span className="font-mono text-xs text-system-dark dark:text-system">SELECTED</span>}</div>
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
                <a href="/app" className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Open document workflow →</a>
              ) : selectedType === "interview" ? (
                <a href="/interview" className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Start the interview →</a>
              ) : (
                <form onSubmit={addSource} className="mt-7">
                  <label htmlFor="source-locator" className="font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">URL</label>
                  <input id="source-locator" value={locator} onChange={(event) => setLocator(event.target.value)} placeholder="https://yourwebsite.com" inputMode="url" className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-system focus:ring-2 focus:ring-system/20 dark:border-gray-700 dark:bg-gray-950" />
                  <button type="submit" className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Add source</button>
                </form>
              )}
              {notice && <p className="mt-5 border-l-2 border-system pl-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{notice}</p>}
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 bg-gray-950 px-6 py-14 text-white dark:border-gray-800 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl"><span className="font-mono text-xs uppercase tracking-wide text-system">How context gets built</span><h2 className="mt-3 text-2xl font-bold sm:text-3xl">ALVIRA separates what it finds from what you confirm.</h2></div>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[["01 / OBSERVE", "ALVIRA extracts supported signals from the sources you choose."], ["02 / ASK", "It finds missing, conflicting, stale, or low-confidence context and asks targeted follow-ups."], ["03 / BUILD", "Confirmed understanding becomes reusable AI context you can carry to other tools."]].map(([title, body]) => <div key={title} className="border border-gray-800 bg-gray-900 p-6"><p className="font-mono text-xs text-system">{title}</p><p className="mt-4 text-sm leading-relaxed text-gray-300">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section className="px-6 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap items-end justify-between gap-4"><div><span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Your sources</span><h2 className="mt-3 text-2xl font-bold">Context queue</h2></div><div className="font-mono text-xs text-gray-500 dark:text-gray-400">{sources.length} source{sources.length === 1 ? "" : "s"} · {queuedCount} queued</div></div>
            {sources.length === 0 ? (
              <div className="mt-8 border border-dashed border-gray-300 p-8 dark:border-gray-700"><p className="text-sm font-medium">No sources added yet.</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Start with a document, a URL, or the interview above. You can build context without manually filling every field.</p></div>
            ) : (
              <div className="mt-8 space-y-3">{sources.map((source) => <div key={source.id} className="flex flex-col gap-3 border border-gray-200 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-system" aria-hidden="true" /><h3 className="font-semibold">{source.label}</h3></div><p className="mt-2 break-all font-mono text-xs text-gray-500 dark:text-gray-400">{source.locator}</p></div><span className="self-start rounded border border-gray-200 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:self-auto">Queued for analysis</span></div>)}</div>
            )}
          </div>
        </section>

        <section className="border-t border-gray-200 bg-gray-50 px-6 py-14 dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-3xl"><span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Trust model</span><h2 className="mt-3 text-2xl font-bold">Evidence is not the same thing as truth.</h2><p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Every useful signal should be traceable to a source and separated from inference. Your confirmation is what turns an observation into trusted context.</p></div>
            <div className="mt-8 grid gap-3 sm:grid-cols-4">{[["Observed", "Found in a source"], ["Inferred", "Pattern suggested by evidence"], ["Confirmed", "You say it is true"], ["Outdated", "Previously true, no longer current"]].map(([title, body]) => <div key={title} className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950"><p className="font-mono text-xs text-system-dark dark:text-system">{title}</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{body}</p></div>)}</div>
          </div>
        </section>

        <section className="px-6 py-14 sm:px-8 sm:py-16"><div className="mx-auto max-w-3xl text-center"><h2 className="text-2xl font-bold sm:text-3xl">Your context gets better from here.</h2><p className="mt-4 text-gray-600 dark:text-gray-400">Start with what you already have. Then let ALVIRA interview you about what is missing.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><a href="/app" className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3.5 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Start from a document</a><a href="/interview" className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3.5 font-semibold hover:border-gray-500 dark:border-gray-700 dark:hover:border-gray-500">Start the interview</a></div></div></section>
      </main>
      <TrustFooter />
    </div>
  );
}
