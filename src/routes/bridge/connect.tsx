import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles } from "../-auth";

const ALVIRA_PUBLIC_URL = "https://alviratech.vercel.app";

export const Route = createFileRoute("/bridge/connect")({
  head: () => ({ meta: [{ title: "Authorize Bridge — ALVIRA" }, { name: "description", content: "Authorize an AI tool to read your selected ALVIRA context." }] }),
  component: BridgeConnectPage,
});

function BridgeConnectPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then(async (user) => {
        if (!user) {
          window.location.replace("/app");
          return;
        }
        const profiles = await listProfiles();
        if (cancelled) return;
        if (profiles.length === 0) {
          window.location.replace("/app");
          return;
        }
        setReady(true);
      })
      .catch(() => window.location.replace("/app"));
    return () => { cancelled = true; };
  }, []);

  const defaultCallback = typeof window !== "undefined"
    ? `${window.location.origin}/api/bridge/auth/callback`
    : `${ALVIRA_PUBLIC_URL}/api/bridge/auth/callback`;
  const returnTo = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("return_to") || defaultCallback
    : defaultCallback;
  const authorizeUrl = `/api/bridge/authorize?return_to=${encodeURIComponent(returnTo)}`;

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
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-16">
        <section className="mx-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="font-mono text-xs uppercase tracking-widest text-system">&lt; bridge / authorize &gt;</p>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">Authorize an ALVIRA Bridge connection</h1>
          <p className="mt-4 leading-7 text-gray-600 dark:text-gray-400">Bridge is ALVIRA's distribution layer. It lets an approved AI tool read your existing ALVIRA profile without rebuilding, copying, or replacing your source context.</p>
          <div className="mt-6 space-y-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-700">
            <p><strong>Shared:</strong> your selected ALVIRA Profile context.</p>
            <p><strong>Control:</strong> revoke Bridge access from your account or rotate the connection later.</p>
            <p><strong>Scope:</strong> profile and context read access only in this first release.</p>
          </div>
          <a href={authorizeUrl} className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-system-dark px-5 py-3.5 font-semibold text-white transition hover:opacity-90 dark:bg-system">Authorize Bridge →</a>
          <a href="/bridge" className="mt-4 block text-center font-mono text-sm text-system-dark underline dark:text-system">Back to ALVIRA Bridge</a>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
