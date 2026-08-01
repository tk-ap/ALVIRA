import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { getMeosProfiles } from "./-auth";
import { getCurrentUser } from "./-auth";
import { compileMeosKnowledge, type MeosPortrait } from "./-meosCompiler";
import { getMeosGraph } from "./-meosGraph";

export const Route = createFileRoute("/meos")({ component: MeosPage });
type Profile = { id: string; topic: string; state: unknown; portrait: MeosPortrait | null; updated_at: string };
const tabs = ["Portrait", "Purpose", "Compass", "Daily", "Cycles", "Files"] as const;

function MeosPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState<typeof tabs[number]>("Portrait");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) { navigate({ to: "/login", search: { redirect: "/meos" } as never }); return; }
        const result = await getMeosProfiles();
        setProfiles(result as Profile[]); setSelected((result[0] as Profile | undefined)?.id ?? "");
      } catch { navigate({ to: "/login", search: { redirect: "/meos" } as never }); }
      finally { setLoading(false); }
    })();
  }, [navigate]);
  const profile = useMemo(() => profiles.find(p => p.id === selected), [profiles, selected]);
  const portrait = profile?.portrait;
  const markdownFiles = useMemo(() => {
    if (!profile?.state) return {};
    return compileMeosKnowledge(profile.state as Parameters<typeof compileMeosKnowledge>[0], getMeosGraph()).allFiles;
  }, [profile]);
  const download = (name: string, content: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
  if (loading) return <><Header /><main className="mx-auto max-w-4xl px-6 py-20 text-gray-500">Loading your MeOS...</main></>;
  return <div className="min-h-dvh"><Header /><main className="mx-auto max-w-4xl px-6 py-14">
    <div className="flex flex-wrap items-end justify-between gap-5 mb-10"><div><p className="font-mono text-xs uppercase tracking-widest text-emerald-500 mb-3">&lt; me-os /&gt;</p><h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Your Personal Operating System</h1><p className="mt-2 text-gray-600 dark:text-gray-400">A private reflection of what you know, value, and are becoming.</p></div>
      {profiles.length > 1 && <select value={selected} onChange={e => setSelected(e.target.value)} className="border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 font-mono text-sm text-gray-800 dark:text-gray-200">{profiles.map(p => <option key={p.id} value={p.id}>{p.topic}</option>)}</select>}
    </div>
    {!profile ? <div className="border border-gray-200 dark:border-gray-800 p-8"><h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your MeOS is ready to begin.</h2><p className="mt-3 text-gray-600 dark:text-gray-400">Complete a MeOS interview and your integrated portrait will appear here.</p><a href="/app" className="mt-6 inline-block font-mono text-sm text-emerald-500">Start your interview →</a></div> : <>
      <nav className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-800 mb-8">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 font-mono text-xs uppercase tracking-wider ${tab === t ? "text-emerald-500 border-b-2 border-emerald-500" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}>{t}</button>)}</nav>
      {!portrait ? <div className="border border-amber-300/50 p-6 text-gray-600 dark:text-gray-400">Your interview is saved. Your portrait is being prepared; return here after compilation.</div> : <section className="max-w-[65ch] text-gray-700 dark:text-gray-300 leading-8">
        {tab === "Portrait" && <div className="space-y-5">{portrait.portrait.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>}
        {tab === "Purpose" && <div className="space-y-6"><Purpose label="Personal purpose" text={portrait.purposeStatements.personal} /><Purpose label="Professional purpose" text={portrait.purposeStatements.professional} /></div>}
        {tab === "Compass" && <div><h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Decision compass</h2><p className="whitespace-pre-line">{portrait.decisionCompass}</p></div>}
        {tab === "Daily" && <p className="italic">{portrait.dailyAlignment}</p>}
        {tab === "Cycles" && <div><h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Cycles & progression</h2><p>{portrait.cycles}</p></div>}
        {tab === "Files" && <div><h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Your MeOS files</h2><p className="mb-5 text-sm">Download the source portrait and your interview state.</p><div className="flex flex-col items-start gap-3">{[["portrait.json", JSON.stringify(portrait, null, 2)], ["interview-state.json", JSON.stringify(profile.state, null, 2)], ...Object.entries(markdownFiles)].map(([name, body]) => <button key={name} onClick={() => download(name, body)} className="font-mono text-sm text-emerald-500 hover:text-emerald-400">↓ {name}</button>)}</div></div>}
      </section>}
    </>}
  </main></div>;
}
function Purpose({ label, text }: { label: string; text: string }) { return <div className="border-l-2 border-emerald-500 pl-5"><p className="font-mono text-xs uppercase tracking-wider text-emerald-500 mb-2">{label}</p><p className="text-lg leading-8">{text || "Not yet defined."}</p></div>; }
