import { useEffect, useMemo, useRef, useState } from "react";
import { deriveOpportunityCandidates, opportunityFeedbackKey, type OpportunityCandidate } from "~/lib/opportunity-candidates";
import { trackEvent } from "../routes/-tracking";

type DraftState = {
  topic?: string;
  currentDomain?: string | null;
  generatedAt?: number;
  domains?: Record<string, { answers?: string[]; confidence?: number; covered?: boolean }>;
};

type DraftEnvelope = { state?: DraftState; offering?: string; topic?: string; savedAt?: number };
type OpportunityFeedback = Record<string, "not_for_me">;

const LABELS: Record<string, string> = {
  goals: "Goals",
  constraints: "Constraints",
  decisionFrameworks: "Decision frameworks",
  identity: "Identity & values",
  communication: "Communication",
  preferences: "Preferences",
  currentProjects: "Current projects",
  dailyLife: "Daily life",
  processes: "Processes",
  knowledgeGaps: "Knowledge gaps",
  updates: "Living updates",
  productsAndServices: "Products & services",
  customers: "Customers",
  currentChapter: "Current chapter",
  desiredOutcomes: "Desired outcomes",
  values: "Values",
  boundaries: "Boundaries",
  decisionPatterns: "Decision patterns",
  workHistory: "Work history",
  definitionOfSuccess: "Definition of success",
};

const labelFor = (id: string) => LABELS[id] ?? id
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/[-_]/g, " ")
  .replace(/^./, (c) => c.toUpperCase());

function readLiveDraft(): DraftEnvelope | null {
  if (typeof window === "undefined") return null;
  const candidates: Array<{ key: string; value: DraftEnvelope; savedAt: number }> = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith("alvira:interview-draft:")) continue;
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || "{}") as DraftEnvelope;
      if (value?.state) candidates.push({ key, value, savedAt: value.savedAt ?? 0 });
    } catch { /* ignore malformed drafts */ }
  }
  candidates.sort((a, b) => b.savedAt - a.savedAt);
  return candidates[0]?.value ?? null;
}

function candidateHref(candidate: OpportunityCandidate, topic?: string) {
  const params = new URLSearchParams({ candidate: candidate.id });
  if (topic) params.set("topic", topic);
  return `/integrations?${params.toString()}`;
}

export function LiveContextMirror() {
  const [draft, setDraft] = useState<DraftEnvelope | null>(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [interviewActive, setInterviewActive] = useState(false);
  const [cueSeen, setCueSeen] = useState<string[]>([]);
  const [cueExpanded, setCueExpanded] = useState(false);
  const [feedback, setFeedback] = useState<OpportunityFeedback>({});
  const [recapOpen, setRecapOpen] = useState(false);
  const impressionRef = useRef<Set<string>>(new Set());
  const recapImpressionRef = useRef<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      const onApp = window.location.pathname === "/app";
      // The accessibility label is a stable marker for the actual interview screen.
      const activeInterview = Boolean(document.querySelector('textarea[aria-label="Your answer"]'));
      setVisible(onApp);
      setInterviewActive(onApp && activeInterview);
      if (onApp) setDraft(readLiveDraft());
    };
    refresh();
    const timer = window.setInterval(refresh, 750);
    window.addEventListener("popstate", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("popstate", refresh); };
  }, []);

  const topic = draft?.state?.topic ?? draft?.topic ?? "";
  const feedbackKey = useMemo(() => opportunityFeedbackKey(topic), [topic]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setFeedback(JSON.parse(window.localStorage.getItem(feedbackKey) || "{}") as OpportunityFeedback);
    } catch {
      setFeedback({});
    }
  }, [feedbackKey]);

  const items = useMemo(() => {
    const domains = draft?.state?.domains ?? {};
    return Object.entries(domains)
      .filter(([, value]) => (value.answers ?? []).some((answer) => answer.trim().length > 0))
      .map(([id, value]) => ({
        id,
        label: labelFor(id),
        text: (value.answers ?? []).filter(Boolean).at(-1) ?? "",
        status: value.covered || (value.confidence ?? 0) >= 0.9 ? "Captured" : "Developing",
      }))
      .slice(0, 6);
  }, [draft]);

  const candidates = useMemo(
    () => deriveOpportunityCandidates(draft?.state).filter((candidate) => feedback[candidate.id] !== "not_for_me"),
    [draft, feedback],
  );

  const generatedAt = draft?.state?.generatedAt;
  const cueCandidate = interviewActive && !generatedAt
    ? candidates.find((candidate) => !cueSeen.includes(candidate.id)) ?? null
    : null;
  const cueActive = visible && interviewActive && Boolean(cueCandidate);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.alviraOpportunityCue = cueActive ? "active" : "inactive";
    window.dispatchEvent(new CustomEvent("alvira:opportunity-cue", { detail: { active: cueActive } }));
    return () => {
      document.documentElement.dataset.alviraOpportunityCue = "inactive";
      window.dispatchEvent(new CustomEvent("alvira:opportunity-cue", { detail: { active: false } }));
    };
  }, [cueActive]);

  useEffect(() => {
    if (!cueCandidate || impressionRef.current.has(cueCandidate.id)) return;
    impressionRef.current.add(cueCandidate.id);
    trackEvent("opportunity_cue_impression", { domain: cueCandidate.domainId });
  }, [cueCandidate]);

  useEffect(() => {
    if (!generatedAt || candidates.length === 0) return;
    const dismissedKey = `alvira:opportunity-recap-dismissed:${generatedAt}`;
    if (window.sessionStorage.getItem(dismissedKey)) return;
    setRecapOpen(true);
    if (recapImpressionRef.current !== generatedAt) {
      recapImpressionRef.current = generatedAt;
      trackEvent("opportunity_recap_impression", { count: candidates.length });
    }
  }, [generatedAt, candidates.length]);

  const persistNotForMe = (candidate: OpportunityCandidate) => {
    const next: OpportunityFeedback = { ...feedback, [candidate.id]: "not_for_me" };
    setFeedback(next);
    setCueSeen((seen) => seen.includes(candidate.id) ? seen : [...seen, candidate.id]);
    setCueExpanded(false);
    try { window.localStorage.setItem(feedbackKey, JSON.stringify(next)); } catch { /* local feedback is best effort */ }
    trackEvent("opportunity_cue_not_for_me", { domain: candidate.domainId });
  };

  const dismissCue = (candidate: OpportunityCandidate) => {
    setCueSeen((seen) => seen.includes(candidate.id) ? seen : [...seen, candidate.id]);
    setCueExpanded(false);
    trackEvent("opportunity_cue_dismiss", { domain: candidate.domainId });
  };

  const dismissRecap = () => {
    if (generatedAt) window.sessionStorage.setItem(`alvira:opportunity-recap-dismissed:${generatedAt}`, "1");
    setRecapOpen(false);
    trackEvent("opportunity_recap_dismiss", { count: candidates.length });
  };

  if (!visible || items.length === 0) return null;

  const currentDomain = draft?.state?.currentDomain;
  const panel = <div className="w-full border border-system/30 bg-ink-light/98 p-5 shadow-2xl backdrop-blur dark:bg-ink/98">
    <div className="flex items-start justify-between gap-4">
      <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-system-dark dark:text-system">Live Context</p><h2 className="mt-1 font-display text-xl text-ink dark:text-mineral">Context Mirror</h2></div>
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-warm-gray-dark dark:text-warm-gray">{items.length} areas</span>
    </div>
    <p className="mt-3 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">What ALVIRA is carrying forward right now. This mirror reflects the live interview draft; your durable saved Context changes when you save or update it.</p>
    <div className="mt-5 space-y-4">
      {items.map((item) => <section key={item.id} className="border-t border-ink/10 pt-3 dark:border-mineral/10">
        <div className="flex items-center justify-between gap-3"><h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink dark:text-mineral">{item.label}</h3><span className="font-mono text-[9px] text-system-dark dark:text-system">{item.status}</span></div>
        <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">{item.text}</p>
      </section>)}
    </div>
    {currentDomain && <div className="mt-5 border-t border-human/25 pt-4"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-human-dark dark:text-human">Still clarifying</p><p className="mt-1 text-xs text-warm-gray-dark dark:text-warm-gray">{labelFor(currentDomain)}</p></div>}
    {candidates.length > 0 && <button type="button" onClick={() => setRecapOpen(true)} className="mt-5 w-full border-t border-system/20 pt-4 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-system-dark dark:text-system">AI possibilities noticed · {candidates.length} →</button>}
  </div>;

  return <>
    <aside className="fixed right-5 top-[88px] z-40 hidden w-[330px] xl:block" aria-label="Live Context Mirror">{panel}</aside>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-40 border border-system/50 bg-ink px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-system shadow-lg xl:hidden">Context Mirror{candidates.length > 0 ? ` · ${candidates.length}` : ""}</button>

    {cueCandidate && <aside className="fixed bottom-20 left-4 right-4 z-[65] ml-auto max-w-sm border border-system/40 bg-mineral p-4 shadow-2xl dark:bg-ink sm:left-auto sm:right-5" aria-live="polite" aria-label="AI-assisted possibility">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-system-dark dark:text-system">Possible AI entry point</p><p className="mt-1 text-sm font-semibold text-ink dark:text-mineral">There may be an AI-assisted next step here.</p></div>
        <button type="button" onClick={() => dismissCue(cueCandidate)} aria-label="Dismiss possibility" className="px-1 text-sm text-warm-gray-dark dark:text-warm-gray">×</button>
      </div>
      {cueExpanded && <div className="mt-3 border-t border-ink/10 pt-3 dark:border-mineral/10"><p className="line-clamp-3 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">“{cueCandidate.sourceAnswer}”</p><p className="mt-2 text-xs leading-5 text-ink dark:text-mineral">{cueCandidate.suggestedUse}</p></div>}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.08em]">
        <button type="button" onClick={() => { setCueExpanded((value) => !value); trackEvent("opportunity_cue_open", { domain: cueCandidate.domainId }); }} className="text-system-dark underline underline-offset-4 dark:text-system">{cueExpanded ? "Hide possibility" : "See possibility"}</button>
        {cueExpanded && <a href={candidateHref(cueCandidate, topic)} onClick={() => trackEvent("opportunity_use", { source: "cue" })} className="text-system-dark underline underline-offset-4 dark:text-system">Use this →</a>}
        <button type="button" onClick={() => persistNotForMe(cueCandidate)} className="text-warm-gray-dark underline underline-offset-4 dark:text-warm-gray">Not for me</button>
      </div>
    </aside>}

    {recapOpen && candidates.length > 0 && <div className="fixed inset-0 z-[85] flex items-end bg-black/45 p-3 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="opportunity-recap-title">
      <div className="max-h-[82dvh] w-full max-w-2xl overflow-y-auto border border-system/35 bg-mineral p-5 shadow-2xl dark:bg-ink sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-system-dark dark:text-system">From your Context</p><h2 id="opportunity-recap-title" className="mt-1 font-display text-3xl leading-none text-ink dark:text-mineral">Possibilities ALVIRA noticed.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">These are optional ways AI might help with things you already described. They are possibilities, not instructions, and nothing happens until you choose one.</p></div><button type="button" onClick={dismissRecap} aria-label="Close possibilities" className="px-2 py-1 text-lg text-warm-gray-dark dark:text-warm-gray">×</button></div>
        <div className="mt-6 space-y-3">{candidates.slice(0, 4).map((candidate) => <article key={candidate.id} className="border border-ink/10 p-4 dark:border-mineral/10"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-warm-gray-dark dark:text-warm-gray">{labelFor(candidate.domainId)}</p><p className="mt-2 text-sm leading-6 text-ink dark:text-mineral">{candidate.suggestedUse}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">From: “{candidate.sourceAnswer}”</p><div className="mt-3 flex gap-4 font-mono text-[10px] uppercase tracking-[0.08em]"><a href={candidateHref(candidate, topic)} onClick={() => trackEvent("opportunity_use", { source: "recap" })} className="text-system-dark underline underline-offset-4 dark:text-system">Use this →</a><button type="button" onClick={() => persistNotForMe(candidate)} className="text-warm-gray-dark underline underline-offset-4 dark:text-warm-gray">Not for me</button></div></article>)}</div>
        <button type="button" onClick={dismissRecap} className="mt-5 font-mono text-[10px] uppercase tracking-[0.1em] text-warm-gray-dark underline underline-offset-4 dark:text-warm-gray">Not now — keep my Context</button>
      </div>
    </div>}

    {open && <div className="fixed inset-0 z-[80] flex items-end bg-black/50 p-4 xl:hidden" role="dialog" aria-modal="true" aria-label="Context Mirror"><div className="w-full"><div className="mb-2 flex justify-end"><button type="button" onClick={() => setOpen(false)} className="border border-mineral/20 bg-ink px-3 py-2 font-mono text-xs text-mineral">Close</button></div>{panel}</div></div>}
  </>;
}
