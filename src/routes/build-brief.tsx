import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles, loadProfile } from "./-auth";
import { generateBuildBrief, type BuildBrief } from "./-buildBrief";

export const Route = createFileRoute("/build-brief")({
  head: () => ({
    meta: [
      { title: "Build with my Context — ALVIRA" },
      { name: "description", content: "Turn maintained ALVIRA Context into a reviewable, portable Build Brief for the AI builder or developer you choose." },
    ],
  }),
  component: BuildBriefPage,
});

type Profile = { id: string; topic: string; offering: "context" | "meos"; tier: string; updated_at: string };
type User = { id: string; email: string; tier: string };

type Builder = { id: "generic" | "cto" | "base44"; label: string; url?: string };
const BUILDERS: Builder[] = [
  { id: "generic", label: "Any AI builder / developer" },
  { id: "cto", label: "cto.new", url: "https://cto.new/" },
  { id: "base44", label: "Base44", url: "https://base44.com/" },
];

const section = (title: string, value: string | string[]) => {
  const items = Array.isArray(value) ? value.filter(Boolean) : [];
  if (Array.isArray(value) && items.length === 0) return "";
  if (!Array.isArray(value) && !value.trim()) return "";
  return Array.isArray(value)
    ? `## ${title}\n${items.map((item) => `- ${item}`).join("\n")}`
    : `## ${title}\n${value.trim()}`;
};

function buildBriefMarkdown(brief: BuildBrief): string {
  return [
    `# ${brief.projectName || "Build Brief"}`,
    "",
    "> Generated from current build intent + selected ALVIRA Context. Review and correct this before handing it to a builder. Missing information should remain an open question rather than becoming an assumption.",
    "",
    section("Goal", brief.goal),
    section("Problem", brief.problem),
    section("Target user", brief.targetUser),
    section("Desired outcome", brief.desiredOutcome),
    section("User stories", brief.userStories),
    section("Relevant Context", brief.relevantContext),
    section("Desired experience / visual direction", brief.desiredExperience),
    section("Existing assets", brief.existingAssets),
    section("Must-haves", brief.mustHaves),
    section("Non-goals", brief.nonGoals),
    section("Constraints", brief.constraints),
    section("References", brief.references),
    section("Technical requirements", brief.technicalRequirements),
    section("Acceptance criteria", brief.acceptanceCriteria),
    section("Open questions", brief.openQuestions),
  ].filter(Boolean).join("\n\n");
}

function serializeSavedContext(topic: string, offering: string, state: any): string {
  const lines = [
    `# Saved ALVIRA ${offering === "meos" ? "Reflect" : "Context"}: ${topic}`,
    "",
    "Use only details that materially change the requested build. Do not infer unstated requirements from unrelated personal information.",
  ];
  const domains = state?.domains && typeof state.domains === "object" ? state.domains : {};
  for (const [domain, value] of Object.entries(domains as Record<string, any>)) {
    const answers = Array.isArray(value?.answers)
      ? value.answers.map((answer: unknown) => String(answer).trim()).filter(Boolean)
      : [];
    if (!answers.length) continue;
    const label = domain.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
    lines.push("", `## ${label}`);
    answers.forEach((answer: string) => lines.push(`- ${answer}`));
  }
  return lines.join("\n").slice(0, 30_000);
}

function adapterText(builder: Builder, markdown: string): string {
  const destination = builder.id === "generic" ? "your build environment" : builder.label;
  return `Use the reviewed Build Brief below as the source of truth for this build in ${destination}.\n\nDo not silently invent missing product requirements. Preserve the stated constraints and non-goals. If an open question materially affects architecture, scope, data, permissions, cost, or the user experience, ask before deciding. Work toward the acceptance criteria and surface any conflict between the requested implementation and the brief.\n\n---\n\n${markdown}`;
}

function BuildBriefPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [intent, setIntent] = useState("");
  const [brief, setBrief] = useState("");
  const [builderId, setBuilderId] = useState<Builder["id"]>("generic");
  const [status, setStatus] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getCurrentUser().then(async (current) => {
      if (!current) { setUser(null); return; }
      setUser(current as User);
      const rows = await listProfiles() as Profile[];
      setProfiles(rows);
      const contextFirst = rows.find((profile) => profile.offering === "context") ?? rows[0];
      if (contextFirst) setProfileId(contextFirst.id);
    }).catch(() => setUser(null));
  }, []);

  const selected = useMemo(() => profiles.find((profile) => profile.id === profileId), [profiles, profileId]);
  const selectedBuilder = useMemo(() => BUILDERS.find((builder) => builder.id === builderId) ?? BUILDERS[0], [builderId]);

  const generate = async () => {
    if (!selected) return;
    if (intent.trim().length < 12) { setStatus("Describe what you want to build in a little more detail."); return; }
    setGenerating(true);
    setStatus("Selecting relevant Context and compiling your Build Brief…");
    try {
      const row = await loadProfile({ data: { profileId: selected.id } });
      const context = serializeSavedContext(row.topic, row.offering, row.state);
      const result = await generateBuildBrief({ data: { intent: intent.trim(), context } });
      setBrief(buildBriefMarkdown(result));
      setStatus("Draft ready. Review and edit it before you hand it off.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to generate this Build Brief.");
    } finally {
      setGenerating(false);
    }
  };

  const copy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(message);
    } catch {
      setStatus("Copy failed. Select the text manually and copy it.");
    }
  };

  const download = () => {
    if (!brief) return;
    const blob = new Blob([brief], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const name = (selected?.topic || "alvira-build").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "alvira-build";
    anchor.href = url;
    anchor.download = `${name}-build-brief.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setStatus("Build Brief downloaded as Markdown.");
  };

  const copyForBuilder = async () => {
    if (!brief) return;
    await copy(adapterText(selectedBuilder, brief), `Copied for ${selectedBuilder.label}.`);
  };

  return <div className="min-h-dvh flex flex-col bg-mineral text-ink dark:bg-ink dark:text-mineral">
    <Header />
    <main id="main-content" className="flex-1">
      <section className="border-b border-ink/10 px-6 py-16 dark:border-mineral/10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-system-dark dark:text-system">Build Brief / Context → specification</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div><h1 className="max-w-4xl font-display text-5xl leading-[0.92] tracking-[-0.04em] sm:text-7xl">Build with what ALVIRA already understands.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-warm-gray-dark dark:text-warm-gray">Describe what you want to make. ALVIRA combines that intent with the relevant parts of your maintained Context to produce a portable specification you can inspect before another AI starts building.</p></div>
            <div className="border-l border-system/50 pl-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Prototype boundary</p><p className="mt-3 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">The Build Brief is not memory and it is not execution authority. Nothing is sent to a builder automatically. You review the artifact first.</p></div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:px-8 lg:px-10"><div className="mx-auto max-w-6xl">
        {user === undefined ? <p className="font-mono text-sm text-warm-gray-dark dark:text-warm-gray">Loading Build Brief workspace…</p> : user === null ? <div className="max-w-2xl border border-ink/12 p-8 dark:border-mineral/12"><h2 className="font-display text-3xl">Sign in to build with your Context.</h2><p className="mt-3 text-warm-gray-dark dark:text-warm-gray">Build Brief uses Context saved in your ALVIRA account.</p><a href="/login" className="mt-6 inline-flex bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-mineral dark:bg-mineral dark:text-ink">Sign in →</a></div> : profiles.length === 0 ? <div className="max-w-2xl border border-ink/12 p-8 dark:border-mineral/12"><h2 className="font-display text-3xl">Build a Context first.</h2><p className="mt-3 text-warm-gray-dark dark:text-warm-gray">ALVIRA needs maintained Context before it can distinguish what matters to this build.</p><a href="/app" className="mt-6 inline-flex bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-mineral dark:bg-mineral dark:text-ink">Build Context →</a></div> : <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-7 lg:sticky lg:top-24 lg:self-start">
            <div><label className="font-mono text-[10px] uppercase tracking-[0.14em] text-warm-gray-dark dark:text-warm-gray">Saved Context<select value={profileId} onChange={(event) => setProfileId(event.target.value)} className="mt-2 block w-full border border-ink/15 bg-transparent px-3 py-3 font-sans text-sm normal-case tracking-normal dark:border-mineral/15">{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.topic} · {profile.offering === "meos" ? "Reflect" : "Context"}</option>)}</select></label><p className="mt-2 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">ALVIRA uses this as background and should pull only details that materially change the build.</p></div>
            <div><label htmlFor="build-intent" className="font-mono text-[10px] uppercase tracking-[0.14em] text-warm-gray-dark dark:text-warm-gray">What do you want to build?</label><textarea id="build-intent" value={intent} onChange={(event) => setIntent(event.target.value)} rows={10} placeholder="Example: I want to build a portfolio site for my modeling work. It should feel editorial rather than like a SaaS dashboard…" className="mt-2 w-full resize-y border border-ink/15 bg-white/45 p-4 text-sm leading-6 outline-none focus:border-system dark:border-mineral/15 dark:bg-black/20" /></div>
            <button type="button" onClick={generate} disabled={generating} className="min-h-12 w-full bg-ink px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-mineral disabled:opacity-50 dark:bg-mineral dark:text-ink">{generating ? "Compiling…" : brief ? "Regenerate Build Brief" : "Generate Build Brief →"}</button>
            <div className="border-t border-ink/10 pt-5 dark:border-mineral/10"><a href="/integrations" className="font-mono text-[10px] uppercase tracking-[0.12em] text-system-dark underline underline-offset-4 dark:text-system">← Reuse Context</a></div>
          </aside>

          <div>
            {!brief ? <div className="min-h-[520px] border border-dashed border-ink/20 p-8 dark:border-mineral/20 sm:p-12"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Canonical artifact</p><h2 className="mt-4 max-w-xl font-display text-4xl leading-none sm:text-5xl">The prompt is the adapter. The brief is the asset.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-warm-gray-dark dark:text-warm-gray">Your generated brief will separate goals, users, requirements, non-goals, constraints, references, acceptance criteria, and open questions. Edit anything ALVIRA gets wrong before you copy it elsewhere.</p></div> : <>
              <div className="flex flex-col gap-5 border-b border-ink/10 pb-6 dark:border-mineral/10 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Review / edit</p><h2 className="mt-2 font-display text-4xl">Canonical Build Brief</h2></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => copy(brief, "Build Brief copied.")} className="min-h-11 border border-ink/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] dark:border-mineral/20">Copy Markdown</button><button type="button" onClick={download} className="min-h-11 border border-ink/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] dark:border-mineral/20">Download .md</button></div></div>
              <textarea aria-label="Editable Build Brief Markdown" value={brief} onChange={(event) => setBrief(event.target.value)} rows={30} className="mt-6 w-full resize-y border border-ink/15 bg-white/50 p-5 font-mono text-xs leading-6 outline-none focus:border-system dark:border-mineral/15 dark:bg-black/20" />
              <div className="mt-7 border border-system/35 p-6"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Builder adapter</p><h3 className="mt-3 text-2xl font-semibold">Hand off the reviewed brief.</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">The destination wrapper can change. The Build Brief remains the source of truth.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><select value={builderId} onChange={(event) => setBuilderId(event.target.value as Builder["id"])} className="min-h-11 flex-1 border border-ink/15 bg-transparent px-3 text-sm dark:border-mineral/15">{BUILDERS.map((builder) => <option key={builder.id} value={builder.id}>{builder.label}</option>)}</select><button type="button" onClick={copyForBuilder} className="min-h-11 border border-system/55 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-system-dark dark:text-system">Copy for builder</button>{selectedBuilder.url ? <button type="button" onClick={() => window.open(selectedBuilder.url, "_blank", "noopener,noreferrer")} className="min-h-11 bg-ink px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mineral dark:bg-mineral dark:text-ink">Open {selectedBuilder.label} ↗</button> : null}</div></div>
            </>}
            {status && <p className="mt-5 font-mono text-xs leading-5 text-system-dark dark:text-system" role="status">{status}</p>}
          </div>
        </div>}
      </div></section>
    </main>
    <TrustFooter />
  </div>;
}
