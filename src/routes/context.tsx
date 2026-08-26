import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { CONTEXT_SOURCE_OPTIONS, makeSource, type ContextSource, type ContextSourceType } from "~/lib/context-engine";

export const Route = createFileRoute("/context")({
  head: () => ({ meta: [{ title: "Your Context — ALVIRA" }, { name: "description", content: "Build, inspect, and improve the living context ALVIRA uses to understand you." }] }),
  component: ContextEnginePage,
});

function ContextEnginePage() {
  const [sources, setSources] = useState<ContextSource[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ContextSourceType[]>(["website"]);
  const [locators, setLocators] = useState<Partial<Record<ContextSourceType, string>>>({});
  const [notice, setNotice] = useState("");
  const selectedOptions = useMemo(() => CONTEXT_SOURCE_OPTIONS.filter((option) => selectedTypes.includes(option.type)), [selectedTypes]);
  const queuedCount = sources.filter((source) => source.status === "queued").length;

  function toggleSource(type: ContextSourceType) {
    setSelectedTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
    setNotice("");
  }

  function addUrlSource(event: FormEvent<HTMLFormElement>, type: ContextSourceType) {
    event.preventDefault();
    const locator = locators[type]?.trim() ?? "";
    if (!locator) return;
    const source = makeSource(locator);
    setSources((current) => [...current, { ...source, type }]);
    setLocators((current) => ({ ...current, [type]: "" }));
    setNotice(`${source.label} added. ALVIRA will treat it as source evidence, not as confirmed truth.`);
  }

  function addWorkflowSource(type: ContextSourceType, label: string) {
    if (sources.some((source) => source.type === type && source.locator === label)) return;
    setSources((current) => [...current, { id: crypto.randomUUID(), type, label, locator: label, status: "ready", addedAt: new Date().toISOString() }]);
    setNotice(`${label} is ready to contribute to this context session.`);
  }

  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main id="main-content">
        <section className="border-b border-gray-200 px-6 py-14 dark:border-gray-800 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Your Context</span>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">The information ALVIRA knows about you.</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">Context is the destination. Documents, websites, profiles, and interviews are different sources ALVIRA can observe together.</p>
          </div>
        </section>

        <section className="px-6 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-3xl">
              <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Add Context</span>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">What do you want to add?</h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Choose one or more sources. ALVIRA can use them together while keeping each source identifiable.</p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CONTEXT_SOURCE_OPTIONS.map((option) => {
                const active = selectedTypes.includes(option.type);
                return <button key={option.type} type="button" aria-pressed={active} onClick={() => toggleSource(option.type)} className={`min-h-32 border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system ${active ? "border-system bg-system/5 dark:bg-system/10" : "border-gray-200 hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600"}`}>
                  <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{option.label}</h3><span className="font-mono text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{active ? "Selected" : "Select"}</span></div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{option.description}</p>
                  <p className="mt-3 font-mono text-xs text-gray-500 dark:text-gray-500">{option.examples}</p>
                </button>;
              })}
            </div>
            <div className="mt-6 flex flex-col gap-3 border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{selectedTypes.length} source{selectedTypes.length === 1 ? "" : "s"} selected</span>
              <a href="#provide-sources" className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Continue →</a>
            </div>
          </div>
        </section>

        <section id="provide-sources" className="border-y border-gray-200 px-6 py-14 dark:border-gray-800 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Your Sources</span>
            <h2 className="mt-3 text-2xl font-bold">Provide each selected source.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">Sources feed one context-building session. Their provenance stays separate from the evidence ALVIRA derives from them.</p>
            <div className="mt-8 space-y-4">
              {selectedOptions.map((option) => {
                const isUrl = option.type === "website" || option.type === "professional" || option.type === "social";
                const ready = sources.some((source) => source.type === option.type);
                return <div key={option.type} className="border border-gray-200 p-5 dark:border-gray-800 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold">{option.label}</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{option.description}</p></div><span className="border border-gray-200 px-2 py-1 font-mono text-[10px] uppercase text-gray-500 dark:border-gray-700">{ready ? "Ready" : "Needs source"}</span></div>
                  {isUrl ? <form onSubmit={(event) => addUrlSource(event, option.type)} className="mt-5"><label htmlFor={`source-${option.type}`} className="font-mono text-xs uppercase text-gray-500 dark:text-gray-400">URL</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input id={`source-${option.type}`} value={locators[option.type] ?? ""} onChange={(event) => setLocators((current) => ({ ...current, [option.type]: event.target.value }))} placeholder="https://yourwebsite.com" inputMode="url" className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-system focus:ring-2 focus:ring-system/20 dark:border-gray-700 dark:bg-gray-950" /><button type="submit" className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Add source</button></div></form> : option.type === "file" || option.type === "ai-context" ? <a href="/app" onClick={() => addWorkflowSource(option.type, option.label)} className="mt-5 inline-flex items-center rounded-lg border border-system px-5 py-3 font-semibold text-system-dark hover:bg-system/10 dark:text-system">Open existing workflow →</a> : <a href="/interview" onClick={() => addWorkflowSource(option.type, option.label)} className="mt-5 inline-flex items-center rounded-lg border border-system px-5 py-3 font-semibold text-system-dark hover:bg-system/10 dark:text-system">Start interview →</a>}
                </div>;
              })}
              {selectedOptions.length === 0 && <p className="border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">Select at least one source above.</p>}
            </div>
            {notice && <p role="status" className="mt-5 border-l-2 border-system pl-3 text-xs text-gray-600 dark:text-gray-400">{notice}</p>}
          </div>
        </section>

        <section className="bg-gray-950 px-6 py-14 text-white sm:px-8 sm:py-16"><div className="mx-auto max-w-5xl"><span className="font-mono text-xs uppercase tracking-wide text-system">Observe → Ask → Build</span><h2 className="mt-3 max-w-2xl text-2xl font-bold sm:text-3xl">Evidence is not the same thing as truth.</h2><div className="mt-8 grid gap-3 md:grid-cols-3">{[["01 / OBSERVE", "Extract supported signals from every selected source."],["02 / ASK", "Find missing, conflicting, stale, or low-confidence context and ask targeted questions."],["03 / BUILD", "Turn confirmed understanding into reusable context."]].map(([title, body]) => <div key={title} className="border border-gray-800 bg-gray-900 p-6"><p className="font-mono text-xs text-system">{title}</p><p className="mt-4 text-sm leading-relaxed text-gray-300">{body}</p></div>)}</div></div></section>

        <section className="px-6 py-14 sm:px-8 sm:py-16"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Context Queue</span><h2 className="mt-3 text-2xl font-bold">One session, traceable sources.</h2></div><span className="font-mono text-xs text-gray-500 dark:text-gray-400">{sources.length} source{sources.length === 1 ? "" : "s"} · {queuedCount} queued</span></div>{sources.length === 0 ? <div className="mt-8 border border-dashed border-gray-300 p-8 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">No sources added yet. Select sources above to begin building context.</div> : <div className="mt-8 space-y-3">{sources.map((source) => <div key={source.id} className="flex flex-col gap-3 border border-gray-200 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">{source.label}</h3><p className="mt-1 break-all font-mono text-xs text-gray-500 dark:text-gray-400">{source.locator}</p></div><span className="border border-gray-200 px-2 py-1 font-mono text-[10px] uppercase text-gray-500 dark:border-gray-700">{source.status === "ready" ? "Ready" : "Queued"}</span></div>)}</div>}</div></section>

        <section className="border-t border-gray-200 bg-gray-50 px-6 py-14 dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-16"><div className="mx-auto max-w-5xl"><span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">Trust model</span><h2 className="mt-3 text-2xl font-bold">Observed · Inferred · Confirmed · Outdated</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">Every useful signal should remain traceable to its source and separated from inference. Your confirmation is what turns an observation into trusted context.</p></div></section>
      </main>
      <TrustFooter />
    </div>
  );
}
