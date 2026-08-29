import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles, loadProfile } from "./-auth";

export const Route = createFileRoute("/integrations")({
  head: () => ({ meta: [{ title: "Reuse your Context — ALVIRA" }, { name: "description", content: "Carry your ALVIRA Context into the AI tools and agents you choose." }] }),
  component: ReuseContextPage,
});

type Profile = { id: string; topic: string; offering: "context" | "meos"; tier: string; updated_at: string };
type User = { id: string; email: string; tier: string; accessMode?: string | null };
type Provider = { name: string; mark: string; url: string; status: string; description: string };

const providers: Provider[] = [
  { name: "ChatGPT", mark: "GPT", url: "https://chatgpt.com/", status: "Guided reuse", description: "Copy only the Context you choose, then bring it into a conversation, project, or custom workflow." },
  { name: "Claude", mark: "CL", url: "https://claude.ai/", status: "Guided reuse", description: "Prepare a portable Context block for Claude projects or conversations without claiming a background sync." },
  { name: "Gemini", mark: "GE", url: "https://gemini.google.com/", status: "Guided reuse", description: "Carry your maintained Context into Gemini when it is relevant to the work you are doing." },
  { name: "Cursor", mark: "CU", url: "https://cursor.com/", status: "Guided reuse", description: "Use selected ALVIRA Context as durable project guidance for AI-assisted development." },
];

function serializeContext(topic: string, offering: string, state: any): string {
  const lines = [
    `# ALVIRA ${offering === "meos" ? "Reflect" : "Context"} — ${topic}`,
    "",
    "Use this as background context, not as an instruction to ignore the current conversation. Treat uncertainty as uncertainty and ask when something appears stale or contradictory.",
  ];
  const domains = state?.domains && typeof state.domains === "object" ? state.domains : {};
  for (const [domain, value] of Object.entries(domains as Record<string, any>)) {
    const answers = Array.isArray(value?.answers) ? value.answers.map((answer: unknown) => String(answer).trim()).filter(Boolean) : [];
    if (!answers.length) continue;
    lines.push("", `## ${domain.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ")}`);
    answers.forEach((answer: string) => lines.push(`- ${answer}`));
  }
  return lines.join("\n");
}

function ReuseContextPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [prepared, setPrepared] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getCurrentUser().then(async (current) => {
      if (!current) { setUser(null); return; }
      setUser(current as User);
      const rows = await listProfiles() as Profile[];
      setProfiles(rows);
      if (rows[0]) setProfileId(rows[0].id);
    }).catch(() => setUser(null));
  }, []);

  const selected = useMemo(() => profiles.find((profile) => profile.id === profileId), [profiles, profileId]);

  const prepare = async (nextProvider: Provider) => {
    if (!selected) return;
    setMessage("Preparing selected Context…");
    try {
      const row = await loadProfile({ data: { profileId: selected.id } });
      setPrepared(serializeContext(row.topic, row.offering, row.state));
      setProvider(nextProvider);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to prepare this Context.");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(prepared);
    setMessage("Context copied. Review it before sharing.");
  };

  return <div className="min-h-dvh flex flex-col bg-mineral text-ink dark:bg-ink dark:text-mineral">
    <Header />
    <main id="main-content" className="flex-1">
      <section className="border-b border-ink/10 px-6 py-16 dark:border-mineral/10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-system-dark dark:text-system">Reuse / Context portability</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">
            <div><h1 className="max-w-4xl font-display text-5xl leading-[0.92] tracking-[-0.04em] sm:text-7xl">Maintain once. Carry forward where appropriate.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-warm-gray-dark dark:text-warm-gray">ALVIRA does not need to own every AI interaction. Reuse lets you take selected, maintained Context into the tools you already use.</p></div>
            <div className="border-l border-system/50 pl-5"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Consent boundary</p><p className="mt-3 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Nothing is silently synced. You preview and copy what will leave ALVIRA. Live authorization is reserved for Bridge and other explicitly connected surfaces.</p></div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:px-8 lg:px-10"><div className="mx-auto max-w-6xl">
        {user === undefined ? <p className="font-mono text-sm text-warm-gray-dark dark:text-warm-gray">Loading reuse workspace…</p> : user === null ? <div className="max-w-2xl border border-ink/12 p-8 dark:border-mineral/12"><h2 className="font-display text-3xl">Sign in to reuse your Context.</h2><p className="mt-3 text-warm-gray-dark dark:text-warm-gray">Portability is tied to the Context saved in your ALVIRA account.</p><a href="/login" className="mt-6 inline-flex bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-mineral dark:bg-mineral dark:text-ink">Sign in →</a></div> : profiles.length === 0 ? <div className="max-w-2xl border border-ink/12 p-8 dark:border-mineral/12"><h2 className="font-display text-3xl">Build a Context first.</h2><p className="mt-3 text-warm-gray-dark dark:text-warm-gray">Reuse becomes useful once ALVIRA has a maintained Context to carry forward.</p><a href="/app" className="mt-6 inline-flex bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-mineral dark:bg-mineral dark:text-ink">Build Context →</a></div> : <>
          <div className="mb-9 flex flex-col justify-between gap-5 border-b border-ink/10 pb-7 dark:border-mineral/10 sm:flex-row sm:items-end">
            <div><h2 className="font-display text-3xl">Choose what you are carrying forward.</h2><p className="mt-2 text-sm text-warm-gray-dark dark:text-warm-gray">The prepared text is generated from your saved interview state for review before copying.</p></div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-warm-gray-dark dark:text-warm-gray">Saved Context<select value={profileId} onChange={(event) => setProfileId(event.target.value)} className="mt-2 block min-w-72 border border-ink/15 bg-transparent px-3 py-3 font-sans text-sm normal-case tracking-normal dark:border-mineral/15">{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.topic} · {profile.offering === "meos" ? "Reflect" : "Context"}</option>)}</select></label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">{providers.map((item) => <article key={item.name} className="flex min-h-64 flex-col border border-ink/12 p-6 dark:border-mineral/12"><div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 font-mono text-[10px] dark:border-mineral/15">{item.mark}</span><span className="border border-system/35 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-system-dark dark:text-system">{item.status}</span></div><h3 className="mt-5 text-xl font-semibold">{item.name}</h3><p className="mt-3 flex-1 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">{item.description}</p><button type="button" onClick={() => prepare(item)} className="mt-6 min-h-11 border border-system/50 px-4 py-2.5 font-mono text-xs font-semibold text-system-dark hover:bg-system-soft/40 dark:text-system">Prepare for {item.name} →</button></article>)}</div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2"><a href="/bridge" className="border border-iridescent/40 p-6 transition-colors hover:bg-iridescent-soft/25"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-iridescent-dark dark:text-iridescent">Bridge / authorization beta</p><h3 className="mt-3 text-xl font-semibold">Let an authorized agent request Context.</h3><p className="mt-3 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Bridge is the governed path for connected access. It is different from manual reuse and should remain consent-scoped.</p></a><a href="/history" className="border border-human/35 p-6 transition-colors hover:bg-human-soft/20"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-human-dark dark:text-human">History / what changed</p><h3 className="mt-3 text-xl font-semibold">Inspect how this Context has evolved.</h3><p className="mt-3 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">Version history makes change visible instead of treating the latest state as if it had always been true.</p></a></div>
          {message && <p className="mt-5 font-mono text-xs text-system-dark dark:text-system">{message}</p>}
        </>}
      </div></section>
    </main>
    <TrustFooter />

    {provider && selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="reuse-dialog-title"><div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto bg-mineral p-6 text-ink shadow-2xl dark:bg-ink-light dark:text-mineral sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Review before sharing</p><h2 id="reuse-dialog-title" className="mt-3 font-display text-3xl">Prepare for {provider.name}</h2><p className="mt-3 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">ALVIRA has not sent anything to {provider.name}. Review the portable Context below, copy it when ready, then decide where to use it.</p><pre className="mt-6 max-h-80 overflow-auto whitespace-pre-wrap border border-ink/12 bg-white/40 p-4 text-xs leading-6 dark:border-mineral/12 dark:bg-black/20">{prepared}</pre><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => { setProvider(null); setPrepared(""); }} className="min-h-11 border border-ink/20 px-4 py-2.5 font-mono text-xs dark:border-mineral/20">Cancel</button><button type="button" onClick={copy} className="min-h-11 border border-system/50 px-4 py-2.5 font-mono text-xs text-system-dark dark:text-system">Copy Context</button><button type="button" onClick={() => window.open(provider.url, "_blank", "noopener,noreferrer")} className="min-h-11 bg-ink px-5 py-2.5 font-mono text-xs text-mineral dark:bg-mineral dark:text-ink">Open {provider.name} →</button></div></div></div>}
  </div>;
}
