import { useEffect, useMemo, useState } from "react";

type DraftState = {
  topic?: string;
  currentDomain?: string | null;
  domains?: Record<string, { answers?: string[]; confidence?: number; covered?: boolean }>;
};

type DraftEnvelope = { state?: DraftState; offering?: string; topic?: string };

const LABELS: Record<string, string> = {
  goals: "Goals",
  constraints: "Constraints",
  decisionFrameworks: "Decision frameworks",
  identity: "Identity & values",
  communication: "Communication",
  preferences: "Preferences",
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
      const value = JSON.parse(window.localStorage.getItem(key) || "{}") as DraftEnvelope & { savedAt?: number };
      if (value?.state) candidates.push({ key, value, savedAt: value.savedAt ?? 0 });
    } catch { /* ignore malformed drafts */ }
  }
  candidates.sort((a, b) => b.savedAt - a.savedAt);
  return candidates[0]?.value ?? null;
}

export function LiveContextMirror() {
  const [draft, setDraft] = useState<DraftEnvelope | null>(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const onInterview = window.location.pathname === "/app";
      setVisible(onInterview);
      if (onInterview) setDraft(readLiveDraft());
    };
    refresh();
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("popstate", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("popstate", refresh); };
  }, []);

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
  </div>;

  return <>
    <aside className="fixed right-5 top-[88px] z-40 hidden w-[330px] xl:block" aria-label="Live Context Mirror">{panel}</aside>
    <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 left-5 z-40 border border-system/50 bg-ink px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-system shadow-lg xl:hidden">Context Mirror</button>
    {open && <div className="fixed inset-0 z-[80] flex items-end bg-black/50 p-4 xl:hidden" role="dialog" aria-modal="true" aria-label="Context Mirror"><div className="w-full"><div className="mb-2 flex justify-end"><button type="button" onClick={() => setOpen(false)} className="border border-mineral/20 bg-ink px-3 py-2 font-mono text-xs text-mineral">Close</button></div>{panel}</div></div>}
  </>;
}
