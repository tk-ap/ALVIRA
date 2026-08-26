import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles } from "../-auth";

export const Route = createFileRoute("/bridge/")({
  head: () => ({
    meta: [
      { title: "Bridge — ALVIRA" },
      { name: "description", content: "Carry your ALVIRA context into the AI tools you choose." },
    ],
  }),
  component: BridgePage,
});

type ProfileSummary = {
  id: string;
  topic: string;
  offering: "context" | "meos";
  updated_at: string;
};

function BridgePage() {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then(async (user) => {
        if (cancelled) return;
        if (!user) {
          window.location.replace("/app");
          return;
        }
        const savedProfiles = await listProfiles() as ProfileSummary[];
        if (cancelled) return;
        if (savedProfiles.length === 0) {
          window.location.replace("/app");
          return;
        }
        setProfiles(savedProfiles);
        setReady(true);
      })
      .catch(() => window.location.replace("/app"));
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 items-center justify-center px-6">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">Checking your ALVIRA context…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-system">&lt; alvira / bridge &gt;</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start">
            <section>
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Carry your context into the tools you choose.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">Bridge is ALVIRA's distribution layer. Your profile remains the source of truth inside ALVIRA; Bridge gives approved AI tools read-only access to the context you select.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ["01", "Choose", "Select the ALVIRA profile you want a tool to use."],
                  ["02", "Authorize", "Approve a narrow, read-only connection."],
                  ["03", "Revoke", "Remove access or rotate the connection when needed."],
                ].map(([number, title, body]) => <div key={number} className="border border-gray-200 p-4 dark:border-gray-700"><p className="font-mono text-xs text-system">{number}</p><h2 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{body}</p></div>)}
              </div>
            </section>

            <aside className="rounded-xl border border-system/30 bg-system-soft/40 p-6 dark:bg-ink/30">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Your Bridge readiness</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{profiles.length} saved {profiles.length === 1 ? "profile is" : "profiles are"} available to connect.</p>
              <a href="/bridge/connect" className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-system-dark px-4 py-3 font-mono text-sm font-semibold text-white dark:bg-system">Authorize a connection →</a>
              <p className="mt-4 text-xs leading-5 text-gray-500 dark:text-gray-400">Bridge does not create a second profile or change your source context. First-release access is limited to profile and context reading.</p>
            </aside>
          </div>
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
