import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles } from "./-auth";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "AI Integrations — ALVIRA" },
      { name: "description", content: "Bring your ALVIRA profile into ChatGPT, Claude, Gemini, Cursor, and the AI tools you use." },
    ],
  }),
  component: IntegrationsPage,
});

type Profile = { id: string; topic: string; tier: string; updated_at: string };
type User = { id: string; email: string; tier: string };

const providers = [
  { name: "ChatGPT", mark: "GPT", description: "Use your ALVIRA profile as durable instructions for conversations and custom GPT workflows.", url: "https://chatgpt.com/", status: "Guided setup" },
  { name: "Claude", mark: "CL", description: "Bring your profile into Claude projects so new conversations begin with your working context.", url: "https://claude.ai/", status: "Guided setup" },
  { name: "Gemini", mark: "GE", description: "Prepare your profile for Gemini's reusable assistants and personalized workflows.", url: "https://gemini.google.com/", status: "Guided setup" },
  { name: "Cursor", mark: "CU", description: "Turn your profile into durable project context for Cursor and AI-assisted development.", url: "https://cursor.com/", status: "Guided setup" },
] as const;

function IntegrationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<(typeof providers)[number] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser().then(async (current) => {
      if (!current) { setUser(null); return; }
      setUser(current as User);
      const rows = await listProfiles() as Profile[];
      setProfiles(rows);
      if (rows[0]) setSelectedProfile(rows[0].id);
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load integrations."));
  }, []);

  const paid = user?.tier === "pro" || user?.tier === "lifetime";
  const profile = profiles.find((item) => item.id === selectedProfile);

  return <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <Header />
    <main id="main-content">
      <section className="border-b border-gray-200 px-6 py-16 dark:border-gray-800 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-700 dark:text-emerald-400">&lt;ai-integrations /&gt; · beta</span>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_330px] lg:items-end">
            <div><h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Build your profile once. Put it to work everywhere.</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">Connect ALVIRA to ChatGPT, Claude, Gemini, Cursor, and the rest of your AI stack—with a clear preview of what you share.</p></div>
            <div className="border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="font-mono text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">Connection standard</p><p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">ALVIRA uses native authorization where supported and a guided, provider-specific install everywhere else. We never call an export-only workflow a live sync.</p></div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-5xl">
          {user === undefined && <p className="font-mono text-sm text-gray-500">Loading your integration workspace…</p>}
          {user === null && <div className="border border-gray-200 p-8 text-center dark:border-gray-800"><h2 className="text-2xl font-semibold">Sign in to connect your profile.</h2><p className="mt-3 text-gray-600 dark:text-gray-400">Your integration workspace is tied to your ALVIRA account.</p><a href="/login" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800">Sign in →</a></div>}
          {error && <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          {user && <>
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 sm:flex-row sm:items-end">
              <div><h2 className="text-2xl font-semibold">Your AI tools</h2><p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Choose the profile you want to share, then review each provider's setup.</p></div>
              {profiles.length > 0 ? <label className="font-mono text-xs text-gray-500 dark:text-gray-400">Profile<select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className="mt-2 block min-w-64 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">{profiles.map((item) => <option key={item.id} value={item.id}>{item.topic}</option>)}</select></label> : <a href="/app" className="font-mono text-sm text-emerald-700 underline dark:text-emerald-400">Build a profile first →</a>}
            </div>

            {!paid && <div className="mb-8 flex flex-col justify-between gap-5 border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30 sm:flex-row sm:items-center"><div><p className="font-mono text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Paid feature</p><h3 className="mt-2 text-xl font-semibold">Direct and guided AI integrations are included with Pro and Lifetime.</h3><p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Free profiles still include portable Markdown downloads you own.</p></div><a href="/pricing" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-950">Compare plans →</a></div>}

            <div className="grid gap-4 md:grid-cols-2">{providers.map((provider) => <article key={provider.name} className="flex flex-col border border-gray-200 p-6 dark:border-gray-800"><div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 font-mono text-xs font-bold dark:border-gray-700">{provider.mark}</span><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">{provider.status}</span></div><h3 className="mt-5 text-xl font-semibold">{provider.name}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{provider.description}</p><button type="button" disabled={!paid || !profile} onClick={() => setSelectedProvider(provider)} className="mt-6 min-h-11 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800">{paid ? (profile ? `Set up ${provider.name}` : "Create a profile first") : "Upgrade to connect"}</button></article>)}</div>
          </>}
        </div>
      </section>
    </main>
    <TrustFooter />

    {selectedProvider && profile && <div role="dialog" aria-modal="true" aria-labelledby="integration-dialog-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900 sm:p-8"><p className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Review before sharing</p><h2 id="integration-dialog-title" className="mt-3 text-2xl font-semibold">Set up {selectedProvider.name}</h2><div className="mt-5 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-700"><p><strong>Profile:</strong> {profile.topic}</p><p className="mt-2"><strong>Destination:</strong> {selectedProvider.name}</p><p className="mt-2"><strong>Method:</strong> Guided one-time setup</p></div><p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">ALVIRA will open {selectedProvider.name} in a new tab. Review and copy only the profile sections you want to share. This beta does not silently transfer data or maintain a background connection.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSelectedProvider(null)} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold dark:border-gray-700">Cancel</button><button type="button" onClick={() => { window.open(selectedProvider.url, "_blank", "noopener,noreferrer"); navigate({ to: "/app", search: { profile: profile.id } as never }); }} className="min-h-11 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Open profile and {selectedProvider.name} →</button></div></div></div>}
  </div>;
}
