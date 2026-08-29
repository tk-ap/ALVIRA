import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles } from "./-auth";
import { listContextHistory } from "./-contextVersions";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "What changed — ALVIRA" }, { name: "description", content: "Inspect how your ALVIRA Context has evolved over time." }] }),
  component: HistoryPage,
});

type Profile = { id: string; topic: string; offering: "context" | "meos"; tier: string; updated_at: string };
type Version = { version: number; current: boolean; source: string; createdAt: string; topic: string; offering: string; changedDomains: string[] };

const domainLabel = (value: string) => value
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/[-_]/g, " ")
  .replace(/^./, (char) => char.toUpperCase());

function HistoryPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) { navigate({ to: "/login" }); return; }
      const rows = await listProfiles() as Profile[];
      setProfiles(rows);
      if (rows[0]) setProfileId(rows[0].id);
    }).catch((err) => setError(err instanceof Error ? err.message : "Unable to load Context history."))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!profileId) { setVersions([]); return; }
    setError("");
    listContextHistory({ data: { profileId } })
      .then((result) => setVersions(result.versions as Version[]))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load this history."));
  }, [profileId]);

  const selected = useMemo(() => profiles.find((profile) => profile.id === profileId), [profiles, profileId]);
  const updateHref = selected ? `/app?offering=${encodeURIComponent(selected.offering)}&profile=${encodeURIComponent(selected.id)}` : "/app";

  return <div className="min-h-dvh flex flex-col bg-mineral text-ink dark:bg-ink dark:text-mineral">
    <Header />
    <main id="main-content" className="flex-1 px-6 py-14 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 border-b border-ink/12 pb-10 dark:border-mineral/12 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-system-dark dark:text-system">Context Intelligence / History</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">What changed?</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-warm-gray-dark dark:text-warm-gray">ALVIRA keeps earlier Context states so change can be inspected instead of silently overwritten. History begins as updates occur after versioning is enabled.</p>
          </div>
          {profiles.length > 0 && <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-warm-gray-dark dark:text-warm-gray">Context
            <select value={profileId} onChange={(event) => setProfileId(event.target.value)} className="mt-2 block w-full border border-ink/15 bg-transparent px-3 py-3 font-sans text-sm normal-case tracking-normal dark:border-mineral/15">
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.topic} · {profile.offering === "meos" ? "Reflect" : "Context"}</option>)}
            </select>
          </label>}
        </div>

        {loading ? <p className="py-12 font-mono text-sm text-warm-gray-dark dark:text-warm-gray">Loading…</p> : error ? <p className="mt-8 border border-human/40 bg-human-soft/30 px-4 py-3 text-sm text-human-dark dark:text-human">{error}</p> : profiles.length === 0 ? <section className="py-16"><h2 className="font-display text-3xl">No saved Context yet.</h2><p className="mt-3 text-warm-gray-dark dark:text-warm-gray">History starts once you have a saved Context to maintain.</p><a href="/app" className="mt-6 inline-flex border border-system px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-system-dark dark:text-system">Build Context →</a></section> : <section className="py-10">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-warm-gray-dark dark:text-warm-gray">Selected Context</p><h2 className="mt-2 font-display text-3xl">{selected?.topic}</h2></div>
            <div className="flex flex-wrap items-center gap-3">
              <a href={updateHref} className="inline-flex min-h-10 items-center justify-center border border-system bg-system-soft/35 px-4 py-2.5 font-mono text-xs font-semibold text-system-dark transition-colors hover:bg-system-soft dark:text-system">Update / add context →</a>
              <a href="/integrations" className="font-mono text-xs text-system-dark underline decoration-system/35 underline-offset-4 dark:text-system">Reuse this Context →</a>
            </div>
          </div>
          <div className="space-y-4">
            {[...versions].reverse().map((version, index) => <article key={`${version.version}-${version.current}`} className={`border p-5 sm:p-6 ${version.current ? "border-system/55 bg-system-soft/25" : "border-ink/12 dark:border-mineral/12"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3"><span className="font-mono text-xs text-system-dark dark:text-system">V{version.version}</span>{version.current && <span className="border border-system/50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-system-dark dark:text-system">Current</span>}{index === 0 && !version.current ? <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-warm-gray-dark dark:text-warm-gray">Latest snapshot</span> : null}</div>
                <time className="font-mono text-[10px] text-warm-gray-dark dark:text-warm-gray">{new Date(version.createdAt).toLocaleString()}</time>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{version.changedDomains.length ? `${version.changedDomains.length} Context ${version.changedDomains.length === 1 ? "area" : "areas"} changed` : version.current ? "Current maintained state" : "Snapshot captured"}</h3>
              {version.changedDomains.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{version.changedDomains.map((domain) => <span key={domain} className="border border-ink/12 px-2.5 py-1.5 font-mono text-[10px] text-warm-gray-dark dark:border-mineral/12 dark:text-warm-gray">{domainLabel(domain)}</span>)}</div> : <p className="mt-3 text-sm text-warm-gray-dark dark:text-warm-gray">No domain-level difference was detected from the prior stored state.</p>}
            </article>)}
          </div>
        </section>}
      </div>
    </main>
    <TrustFooter />
  </div>;
}
