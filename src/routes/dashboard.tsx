import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { MeOSCTA } from "~/components/MeOSCTA";
import { getCurrentUser, listProfiles, deleteProfile } from "./-auth";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

type Profile = { id: string; topic: string; tier: string; updated_at: string };

function DashboardPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) { navigate({ to: "/login" }); return; }
      const rows = await listProfiles();
      setProfiles(rows as Profile[]);
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load profiles.")).finally(() => setLoading(false));
  }, [navigate]);
  const remove = async (id: string) => {
    if (!confirm("Delete this profile?")) return;
    await deleteProfile({ data: { profileId: id } });
    setProfiles((p) => p.filter((x) => x.id !== id));
  };
  return <div className="min-h-dvh flex flex-col"><Header /><main className="flex-1 px-6 py-10"><div className="mx-auto max-w-3xl">
    <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1><p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">Your saved knowledge profiles</p></div><a href="/app" className="rounded-lg bg-emerald-700 dark:bg-emerald-600 px-4 py-2.5 font-mono text-sm text-white hover:bg-emerald-800 dark:hover:bg-emerald-500">+ New interview</a></div>
    {loading ? <p className="font-mono text-sm text-gray-500 dark:text-gray-400">Loading...</p> : error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : profiles.length === 0 ? <div className="border border-gray-200 dark:border-gray-700 px-6 py-12 text-center"><p className="text-gray-600 dark:text-gray-400">No saved profiles yet. Start your first interview.</p><a href="/app" className="mt-4 inline-block font-mono text-sm text-emerald-700 dark:text-emerald-400 underline">Start an interview →</a></div> : <div className="space-y-3">{profiles.map((p) => <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-200 dark:border-gray-700 px-5 py-4"><div><h2 className="font-mono text-gray-900 dark:text-gray-100">{p.topic}</h2><div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400"><span className="border border-emerald-600 dark:border-emerald-400 px-2 py-0.5 text-emerald-700 dark:text-emerald-400">{p.tier}</span><span>Updated {new Date(p.updated_at).toLocaleDateString()}</span></div></div><div className="flex gap-4"><a href={`/app?profile=${p.id}`} className="font-mono text-sm text-emerald-700 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300">Resume →</a><button type="button" onClick={() => remove(p.id)} className="font-mono text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400">Delete</button></div></div>)}</div>}
    <div className="mt-8"><MeOSCTA placement="dashboard" variant="compact" /></div>
    </div></main></div>;
}
