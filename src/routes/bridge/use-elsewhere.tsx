import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { buildPortableContextView, portableContextSections, type PortableContextProfile } from "~/lib/portable-context";
import { getCurrentUser, listProfiles, loadProfile } from "../-auth";

export const Route = createFileRoute("/bridge/use-elsewhere")({
  head: () => ({
    meta: [
      { title: "Use Context elsewhere — ALVIRA" },
      { name: "description", content: "Take a reviewed, task-sized ALVIRA Context view into any AI tool." },
    ],
  }),
  component: UseElsewherePage,
});

type ProfileSummary = {
  id: string;
  topic: string;
  offering: "context" | "meos";
  tier: string;
  updated_at: string;
};

function UseElsewherePage() {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [profile, setProfile] = useState<PortableContextProfile | null>(null);
  const [task, setTask] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then(async (user) => {
        if (!user) {
          window.location.replace("/app");
          return;
        }
        const saved = await listProfiles() as ProfileSummary[];
        if (cancelled) return;
        if (!saved.length) {
          window.location.replace("/app");
          return;
        }
        setProfiles(saved);
        setSelectedProfileId(saved[0].id);
        setReady(true);
      })
      .catch(() => window.location.replace("/app"));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedProfileId) return;
    let cancelled = false;
    setLoadingProfile(true);
    setMessage("");
    loadProfile({ data: { profileId: selectedProfileId } })
      .then((loaded) => {
        if (cancelled) return;
        const next = loaded as PortableContextProfile;
        setProfile(next);
        setSelectedDomains(new Set(portableContextSections(next).map((section) => section.id)));
      })
      .catch(() => {
        if (!cancelled) setMessage("ALVIRA could not load that Context. Try another saved Context or refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });
    return () => { cancelled = true; };
  }, [selectedProfileId]);

  const sections = useMemo(() => profile ? portableContextSections(profile) : [], [profile]);
  const view = useMemo(() => profile
    ? buildPortableContextView(profile, { task, includedDomainIds: Array.from(selectedDomains) })
    : null, [profile, task, selectedDomains]);

  const toggleDomain = (id: string) => {
    setSelectedDomains((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setMessage("");
  };

  const copyView = async () => {
    if (!view) return;
    try {
      await navigator.clipboard.writeText(view.markdown);
      setMessage("Copied. Paste this Context View into the AI you want to use.");
    } catch {
      setMessage("Your browser blocked copy. Use Download .md instead.");
    }
  };

  const downloadView = () => {
    if (!view || !profile) return;
    const blob = new Blob([view.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeTopic = profile.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "context";
    anchor.href = url;
    anchor.download = `alvira-context-${safeTopic}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage("Downloaded. Upload the .md file to any AI that accepts files.");
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 items-center justify-center px-6">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">Preparing your Context…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <a href="/bridge" className="font-mono text-xs text-gray-500 hover:text-system">← Bridge</a>
          <p className="mt-7 font-mono text-xs uppercase tracking-[0.22em] text-system">&lt; alvira / use elsewhere &gt;</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Take your Context into any AI.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600 dark:text-gray-400">No paid connector or agent harness is required. Choose what leaves ALVIRA, review it, then copy or download a portable Context View.</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <section className="space-y-6" aria-labelledby="share-heading">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-gray-500">01 · Choose</p>
                <h2 id="share-heading" className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">What should this AI know?</h2>
              </div>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wider text-gray-500">Source Context</span>
                <select value={selectedProfileId} onChange={(event) => setSelectedProfileId(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                  {profiles.map((item) => <option key={item.id} value={item.id}>{item.topic}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wider text-gray-500">What are you trying to do?</span>
                <textarea value={task} onChange={(event) => setTask(event.target.value)} rows={3} placeholder="Example: Help me prepare for a collaboration kickoff." className="mt-2 w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm leading-6 text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                <span className="mt-2 block text-xs leading-5 text-gray-500">This labels the Context View for the destination AI. ALVIRA does not silently infer or add new facts.</span>
              </label>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-gray-500">Include only what matters</span>
                  <button type="button" onClick={() => setSelectedDomains(new Set())} className="font-mono text-xs text-gray-500 hover:text-system">Clear all</button>
                </div>
                {loadingProfile ? (
                  <p className="mt-3 text-sm text-gray-500">Loading Context…</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {sections.map((section) => (
                      <label key={section.id} className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
                        <input type="checkbox" checked={selectedDomains.has(section.id)} onChange={() => toggleDomain(section.id)} className="mt-1 h-4 w-4 accent-current" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{section.label}</span>
                          <span className="mt-1 block text-xs text-gray-500">{section.answers.length} item{section.answers.length === 1 ? "" : "s"} · {Math.round(section.confidence * 100)}% confidence{section.needsVerification ? " · needs verification" : ""}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section aria-labelledby="review-heading">
              <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 sm:p-7">
                <p className="font-mono text-xs uppercase tracking-wider text-gray-500">02 · Review</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="review-heading" className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Exactly what leaves ALVIRA</h2>
                  <span className="rounded-full border border-system/40 bg-system-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-system-dark dark:bg-ink dark:text-system">Free · portable</span>
                </div>

                <div className="mt-5 max-h-[32rem] overflow-auto rounded-xl bg-gray-50 p-4 dark:bg-gray-950">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-gray-700 dark:text-gray-300">{view?.markdown || "Choose a saved Context to create a portable view."}</pre>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={copyView} disabled={!view} className="rounded-lg bg-system px-4 py-2.5 font-mono text-xs font-semibold text-ink disabled:opacity-50">Copy for any AI</button>
                  <button type="button" onClick={downloadView} disabled={!view} className="rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-xs font-semibold text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200">Download .md</button>
                </div>

                {message && <p className="mt-4 text-sm leading-6 text-system-dark dark:text-system" role="status">{message}</p>}
                <p className="mt-5 text-xs leading-5 text-gray-500">Portable views are copies. They cannot edit ALVIRA, grant account access, or update themselves after you download them.</p>
              </div>
            </section>
          </div>

          <section className="mt-12 rounded-2xl border border-gray-200 p-6 dark:border-gray-700 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-wider text-gray-500">03 · Connect when available</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">Want less copy-and-paste?</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">ALVIRA Connect adds native adapters, MCP, and a browser extension where the destination permits them. The portable Context View remains the free fallback, so another company's paid connector tier is never required.</p>
            <a href="/bridge" className="mt-5 inline-flex font-mono text-sm font-semibold text-system-dark hover:underline dark:text-system">See connection options →</a>
          </section>
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
