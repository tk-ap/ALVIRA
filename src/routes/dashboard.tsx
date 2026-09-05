import { createFileRoute, useNavigate } from "@tanstack/react-router";
import JSZip from "jszip";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { MeOSCTA } from "~/components/MeOSCTA";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles, deleteProfile, getInterviewDraft, getOwnerMetrics, loadProfile, finalizeInterviewDraft } from "./-auth";
import { compileInterviewMarkdown } from "./-meosCompiler";
import { getMeosGraph } from "./-meosGraph";
import { compileKnowledge } from "./-knowledgeCompiler";
import { getKnowledgeGraph } from "./-knowledgeGraph";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ALVIRA" }, { name: "description", content: "Your saved ALVIRA Context and interview history." }] }),
  component: DashboardPage,
});

type Profile = { id: string; topic: string; offering: "context" | "meos"; tier: string; updated_at: string };
type OwnerMetrics = Awaited<ReturnType<typeof getOwnerMetrics>>;

function DashboardPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [draft, setDraft] = useState<{ offering: string; topic: string; updated_at: string } | null>(null);
  const [owner, setOwner] = useState(false);
  const [metrics, setMetrics] = useState<OwnerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportStatus, setExportStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showContextChoice, setShowContextChoice] = useState(false);

  useEffect(() => {
    const ownerEmail = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com").trim().toLowerCase();
    getCurrentUser().then(async (user) => {
      if (!user) { navigate({ to: "/login" }); return; }
      const rows = await listProfiles();
      setProfiles(rows as Profile[]);
      const inProgress = await getInterviewDraft();
      if (inProgress) setDraft(inProgress as { offering: string; topic: string; updated_at: string });
      if (user.email.toLowerCase() === ownerEmail) {
        setOwner(true);
        setMetrics(await getOwnerMetrics());
      }
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load saved Context.")).finally(() => setLoading(false));
  }, [navigate]);

  const remove = async (id: string) => {
    if (!confirm("Delete this saved Context?")) return;
    await deleteProfile({ data: { profileId: id } });
    setProfiles((p) => p.filter((x) => x.id !== id));
  };

  const finalizeDraft = async () => {
    if (!draft) return;
    const result = await finalizeInterviewDraft({ data: { topic: draft.topic } });
    if ("error" in result && result.error === "limit_reached") {
      setExportStatus({ type: "error", text: "Free-tier saved Context limit reached. Delete a saved Context or upgrade to keep this interview." });
      return;
    }
    const updated = await listProfiles();
    setProfiles(updated as Profile[]);
    setDraft(null);
    setExportStatus({ type: "success", text: "Your interview has been saved to your Context." });
  };

  const exportProfileKnowledge = async (profile: Profile) => {
    setExportStatus(null);
    try {
      const row = await loadProfile({ data: { profileId: profile.id } });
      const state = row.state as any;
      if (!state || typeof state !== "object" || !state.domains || Object.keys(state.domains).length === 0) {
        throw new Error("This saved Context has no interview data to export yet.");
      }
      const timeoutMs = 30_000;
      const filesPromise = profile.offering === "meos"
        ? Promise.resolve(compileInterviewMarkdown(state, getMeosGraph()).allFiles)
        : Promise.resolve(compileKnowledge(state, getKnowledgeGraph(state.tier))).then((compiled) => ({
            "context.md": compiled,
          }));
      const files = await Promise.race([
        filesPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Context export timed out after ${timeoutMs / 1000} seconds.`)), timeoutMs)),
      ]);
      if (!files || Object.keys(files).length === 0) {
        throw new Error("No Context files were generated for this saved Context.");
      }
      const zip = new JSZip();
      Object.entries(files).forEach(([name, content]) => zip.file(name, content));
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${(row.topic || "alvira-context").replace(/\s+/g, "-").toLowerCase()}-context-files.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportStatus({ type: "success", text: "Context files created successfully. Your ZIP download has started." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Context export failed. Please try again.";
      setExportStatus({ type: "error", text: message });
    }
  };

  return <div className="min-h-dvh flex flex-col"><Header /><main id="main-content" className="flex-1 px-6 py-10"><div className="mx-auto max-w-4xl">
    <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{owner ? "Owner dashboard" : "Dashboard"}</h1><p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">{owner ? "ALVIRA business overview" : "Your saved Context"}</p></div><div className="flex items-center gap-3"><a href="/account" className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 font-mono text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Account</a><button type="button" onClick={() => profiles.length > 0 ? setShowContextChoice(true) : navigate({ to: "/app" })} className="rounded-lg bg-system-dark dark:bg-system px-4 py-2.5 font-mono text-sm text-white hover:bg-system-dark dark:hover:bg-system">+ Add Context</button></div></div>
    {loading ? <p className="font-mono text-sm text-gray-500 dark:text-gray-400">Loading...</p> : error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : <>
      {owner && metrics && <OwnerDashboard metrics={metrics} />}
      <ProfileSection profiles={profiles} draft={draft} remove={remove} owner={owner} onFinalizeDraft={finalizeDraft} onGenerateKnowledgeFiles={exportProfileKnowledge} exportStatus={exportStatus} />
    </>}
  </div></main><TrustFooter />
  {showContextChoice && <ContextChoiceDialog profiles={profiles} onClose={() => setShowContextChoice(false)} />}
  </div>;
}

function ContextChoiceDialog({ profiles, onClose }: { profiles: Profile[]; onClose: () => void }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="context-choice-title" onClick={onClose}>
    <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto border border-warm-gray/25 bg-mineral p-6 shadow-2xl dark:bg-ink sm:p-8" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-5">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-system-dark dark:text-system">Maintain or separate</p><h2 id="context-choice-title" className="mt-3 font-display text-3xl tracking-tight text-ink dark:text-mineral">What are you trying to do?</h2></div>
        <button type="button" onClick={onClose} className="min-h-11 min-w-11 text-xl text-warm-gray-dark hover:text-ink dark:text-warm-gray dark:hover:text-mineral" aria-label="Close">×</button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="border border-system/45 bg-system-soft/35 p-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Same thing · new understanding</p><h3 className="mt-2 text-lg font-semibold text-ink dark:text-mineral">Update existing Context</h3><p className="mt-2 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Use this when something changed, became clearer, needs correction, or has new evidence.</p></div>
        <div className="border border-ink/12 p-5 dark:border-mineral/15"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-warm-gray-dark dark:text-warm-gray">Different thing · separate history</p><h3 className="mt-2 text-lg font-semibold text-ink dark:text-mineral">Create separate Context</h3><p className="mt-2 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Use this for a different project, product, client, role, person, or subject that should evolve independently.</p></div>
      </div>
      <div className="mt-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-warm-gray-dark dark:text-warm-gray">Choose an existing Context to update</p>
        <div className="mt-3 space-y-2">{profiles.map((profile) => <a key={profile.id} href={`/app?continue=${profile.id}`} className="flex min-h-14 items-center justify-between gap-4 border border-ink/12 px-4 py-3 transition-colors hover:border-system/60 hover:bg-system-soft/20 dark:border-mineral/12"><span><span className="block text-sm font-semibold text-ink dark:text-mineral">{profile.topic}</span><span className="mt-1 block font-mono text-[10px] text-warm-gray-dark dark:text-warm-gray">{profile.offering === "meos" ? "ALVIRA Reflect" : "ALVIRA Context"} · updated {new Date(profile.updated_at).toLocaleDateString()}</span></span><span className="shrink-0 font-mono text-xs text-system-dark dark:text-system">Update →</span></a>)}</div>
      </div>
      <div className="mt-6 border-t border-ink/12 pt-6 dark:border-mineral/12">
        <p className="text-sm text-warm-gray-dark dark:text-warm-gray"><strong className="text-ink dark:text-mineral">Rule of thumb:</strong> same thing, new understanding → update. Different thing, separate understanding → new Context.</p>
        <a href="/app" className="mt-4 inline-flex min-h-11 items-center border border-system bg-system-dark px-5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-white dark:bg-system dark:text-ink">Create separate Context →</a>
      </div>
    </div>
  </div>;
}

function OwnerDashboard({ metrics }: { metrics: OwnerMetrics }) {
  const stats = [
    ["Total users", metrics.userCounts.total], ["Free users", metrics.userCounts.free], ["Pro users", metrics.userCounts.pro],
    ["Lifetime users", metrics.userCounts.lifetime], ["Saved Contexts", metrics.profileCount], ["Pending interviews", metrics.pendingInterviews],
  ];
  const date = (value: string) => new Date(value).toLocaleDateString();
  return <div className="mb-10 space-y-8">
    <section><h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Metrics at a glance</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{stats.map(([label, value]) => <div key={label} className="border border-[#d8cbb8] bg-[#f7f1e8] px-4 py-5 dark:border-gray-700 dark:bg-gray-800"><p className="text-3xl font-bold text-[#3d342b] dark:text-gray-100">{value}</p><p className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">{label}</p></div>)}</div></section>
    <section><h2 className="mb-1 font-mono text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Funnel — unique people (7d / 30d)</h2><p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Each row counts distinct people (account or pseudonymous browser id), not repeated actions. Events are retained for 180 days.</p><div className="overflow-x-auto border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><thead className="bg-[#f7f1e8] font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"><tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Last 7 days</th><th className="px-4 py-3">Last 30 days</th></tr></thead><tbody>{([
      ["Signups completed", metrics.funnel.signupCompleted],
      ["Interviews started", metrics.funnel.interviewStarted],
      ["Interviews completed", metrics.funnel.interviewCompleted],
      ["Exports performed", metrics.funnel.exportPerformed],
    ] as const).map(([label, counts]) => <tr key={label} className="border-t border-gray-200 dark:border-gray-700"><td className="px-4 py-3 text-gray-900 dark:text-gray-100">{label}</td><td className="px-4 py-3 text-gray-600 dark:text-gray-400">{counts.d7}</td><td className="px-4 py-3 text-gray-600 dark:text-gray-400">{counts.d30}</td></tr>)}</tbody></table></div></section>
    <section><div className="mb-3 flex items-baseline justify-between"><h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Team waitlist</h2><span className="font-mono text-sm text-gray-600 dark:text-gray-400">{metrics.waitlistCount} total</span></div><div className="overflow-x-auto border border-gray-200 dark:border-gray-700"><table className="w-full text-left text-sm"><thead className="bg-[#f7f1e8] font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Team size</th><th className="px-4 py-3">Date</th></tr></thead><tbody>{metrics.recentWaitlist.map((entry) => <tr key={`${entry.email}-${entry.created_at}`} className="border-t border-gray-200 dark:border-gray-700"><td className="px-4 py-3 text-gray-900 dark:text-gray-100">{entry.name}</td><td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.email}</td><td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.company || "—"}</td><td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.team_size || "—"}</td><td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">{date(entry.created_at)}</td></tr>)}</tbody></table>{metrics.recentWaitlist.length === 0 && <p className="px-4 py-5 text-sm text-gray-500">No waitlist signups yet.</p>}</div></section>
    <section><h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent signups</h2><div className="border border-gray-200 dark:border-gray-700">{metrics.recentUsers.map((user) => <div key={`${user.email}-${user.created_at}`} className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 last:border-0 dark:border-gray-700"><span className="text-sm text-gray-800 dark:text-gray-200">{user.email}</span><span className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400"><span className="border border-system px-2 py-0.5 text-system-dark dark:border-system dark:text-system">{user.tier}</span><span>{date(user.created_at)}</span></span></div>)}</div></section>
  </div>;
}

function ProfileSection({ profiles, draft, remove, owner, onFinalizeDraft, onGenerateKnowledgeFiles, exportStatus }: { profiles: Profile[]; draft: { offering: string; topic: string; updated_at: string } | null; remove: (id: string) => Promise<void>; owner: boolean; onFinalizeDraft: () => Promise<void>; onGenerateKnowledgeFiles: (profile: Profile) => Promise<void>; exportStatus: { type: "success" | "error"; text: string } | null }) {
  const matchingProfile = draft ? profiles.find((profile) => profile.topic === draft.topic && profile.offering === draft.offering) : undefined;
  const unmatchedDraft = draft && !matchingProfile ? draft : null;
  const primaryActionClass = "inline-flex min-h-10 items-center justify-center rounded-md bg-system-dark px-4 py-2 font-mono text-xs font-semibold text-white transition-colors hover:bg-system dark:bg-system dark:text-ink dark:hover:bg-system-dark";
  const secondaryActionClass = "inline-flex min-h-10 items-center justify-center rounded-md border border-system/50 px-3.5 py-2 font-mono text-xs font-semibold text-system-dark transition-colors hover:border-system hover:bg-system-soft dark:border-system/60 dark:text-system dark:hover:bg-ink/40";
  const quietActionClass = "inline-flex min-h-10 items-center justify-center px-2 py-2 font-mono text-xs text-gray-500 transition-colors hover:text-system-dark dark:text-gray-400 dark:hover:text-system";

  return <section className={owner ? "border-t border-gray-200 pt-8 dark:border-gray-700" : ""}>
    {owner && <h2 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Your Context</h2>}
    {exportStatus && <div className={`mb-5 rounded-md border px-4 py-3 text-sm ${exportStatus.type === "error" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300" : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"}`}>{exportStatus.text}</div>}

    {profiles.length === 0 && !unmatchedDraft ? <div className="border border-gray-200 px-6 py-12 text-center dark:border-gray-700"><p className="text-gray-600 dark:text-gray-400">No saved Context yet. Start your first interview.</p><a href="/app" className="mt-4 inline-block font-mono text-sm text-system-dark underline dark:text-system">Start an interview →</a></div> : <div className="space-y-3">
      {unmatchedDraft && <div className="border border-system/70 bg-system-soft/30 px-5 py-5 dark:border-system-dark dark:bg-ink/30"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full border border-system/60 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-system-dark dark:text-system">Interview in progress</span><span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">Updated {new Date(unmatchedDraft.updated_at).toLocaleDateString()}</span></div><h2 className="font-mono text-gray-900 dark:text-gray-100">{unmatchedDraft.topic}</h2><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Not yet saved as a Context.</p></div><div className="flex flex-wrap items-center gap-2"><a href={`/app?offering=${unmatchedDraft.offering}`} className={primaryActionClass}>Continue interview →</a><button type="button" onClick={() => void onFinalizeDraft()} className={secondaryActionClass}>Save to Context</button></div></div></div>}

      {profiles.map((p) => {
        const activeDraft = draft?.topic === p.topic && draft.offering === p.offering ? draft : null;
        return <div key={p.id} className={`border px-5 py-5 ${activeDraft ? "border-system/70 bg-system-soft/20 dark:border-system-dark dark:bg-ink/20" : "border-gray-200 dark:border-gray-700"}`}><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2">{activeDraft && <span className="rounded-full border border-system/60 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-system-dark dark:text-system">Interview in progress</span>}<span className="border border-system px-2 py-0.5 font-mono text-[10px] text-system-dark dark:border-system dark:text-system">{p.offering === "meos" ? "ALVIRA Reflect" : "ALVIRA Context"}</span><span className="border border-gray-300 px-2 py-0.5 font-mono text-[10px] text-gray-500 dark:border-gray-700 dark:text-gray-400">{p.tier}</span></div><h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{p.topic}</h2><p className="mt-1 font-mono text-[11px] text-gray-500 dark:text-gray-400">{activeDraft ? `Draft updated ${new Date(activeDraft.updated_at).toLocaleDateString()} · Saved Context updated ${new Date(p.updated_at).toLocaleDateString()}` : `Updated ${new Date(p.updated_at).toLocaleDateString()}`}</p></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><a href={activeDraft ? `/app?offering=${activeDraft.offering}` : `/app?continue=${p.id}`} className={primaryActionClass}>{activeDraft ? "Continue interview →" : "Update / add context →"}</a>{activeDraft && <button type="button" onClick={() => void onFinalizeDraft()} className={secondaryActionClass}>Save update</button>}<button type="button" onClick={() => void onGenerateKnowledgeFiles(p)} className={secondaryActionClass}>Export files</button><a href={`/app?handoff=${p.id}`} className={secondaryActionClass}>{p.offering === "meos" ? "Carry into Context" : "Carry into Reflect"}</a><button type="button" onClick={() => void remove(p.id)} className={`${quietActionClass} hover:text-red-600 dark:hover:text-red-400`}>Delete</button></div></div></div>;
      })}
    </div>}

    {profiles.length > 0 && <div className="mt-8 flex flex-col gap-4 rounded-lg border border-system/30 bg-system-soft/40 px-5 py-4 dark:bg-ink/30 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-xs font-semibold uppercase tracking-wide text-system-dark dark:text-system">Unlocked with your first Context</p><h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Use your ALVIRA Context in other AI tools</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Bridge gives approved tools controlled, read-only access to the Context you choose.</p></div><a href="/bridge" className="shrink-0 font-mono text-sm font-semibold text-system-dark dark:text-system">Connect an AI tool →</a></div>}
    <div className="mt-4"><MeOSCTA placement="dashboard" variant="compact" /></div>
  </section>;
}
