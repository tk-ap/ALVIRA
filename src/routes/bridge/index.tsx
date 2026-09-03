import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles } from "../-auth";

export const Route = createFileRoute("/bridge/")({
  head: () => ({
    meta: [
      { title: "Bridge — ALVIRA" },
      { name: "description", content: "Carry selected ALVIRA Context into the AI tools you choose." },
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

type Connection = {
  selectedProfileId: string | null;
  destination: "mcp" | "api" | null;
  scope: string;
  expiresAt: string;
  legacyWideAccess: boolean;
};

type BridgeStatus = {
  connected: boolean;
  profiles?: ProfileSummary[];
  connection?: Connection;
};

const DESTINATION_LABELS: Record<"mcp" | "api", string> = {
  mcp: "MCP-compatible tool / agent",
  api: "Bridge profile API",
};

function BridgePage() {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [connectedProfiles, setConnectedProfiles] = useState<ProfileSummary[]>([]);
  const [statusError, setStatusError] = useState("");
  const [busy, setBusy] = useState(false);

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

        try {
          const response = await fetch("/api/bridge/context", { credentials: "same-origin", cache: "no-store" });
          if (response.ok) {
            const status = await response.json() as BridgeStatus;
            if (!cancelled && status.connected && status.connection) {
              setConnection(status.connection);
              setConnectedProfiles(status.profiles || []);
            }
          } else if (response.status !== 401 && !cancelled) {
            setStatusError("Bridge status could not be verified. Try refreshing this page.");
          }
        } catch {
          if (!cancelled) setStatusError("Bridge status could not be verified. Try refreshing this page.");
        }

        if (!cancelled) setReady(true);
      })
      .catch(() => window.location.replace("/app"));
    return () => { cancelled = true; };
  }, []);

  const revoke = async () => {
    setBusy(true);
    setStatusError("");
    try {
      const response = await fetch("/api/bridge/context", { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) throw new Error("Unable to revoke Bridge connection.");
      setConnection(null);
      setConnectedProfiles([]);
      window.history.replaceState({}, "", "/bridge");
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Unable to revoke Bridge connection.");
    } finally {
      setBusy(false);
    }
  };

  const changeConnection = async () => {
    setBusy(true);
    try {
      await fetch("/api/bridge/context", { method: "DELETE", credentials: "same-origin" });
    } finally {
      window.location.href = "/bridge/connect";
    }
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 items-center justify-center px-6">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">Checking your ALVIRA Context…</p>
        </main>
      </div>
    );
  }

  const selectedProfile = connectedProfiles[0] || (connection?.selectedProfileId ? profiles.find((profile) => profile.id === connection.selectedProfileId) : null);
  const justConnected = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("connected") === "1";

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-system">&lt; alvira / bridge &gt;</p>

          {connection && justConnected && (
            <div className="mt-5 rounded-xl border border-system/40 bg-system-soft/60 px-5 py-4 dark:bg-ink/40" role="status">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Bridge connected.</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Authorization succeeded and ALVIRA can verify the active Bridge connection.</p>
            </div>
          )}

          {statusError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">{statusError}</div>
          )}

          <div className="mt-5 grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-start">
            <section>
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Carry the right context into the tools you choose.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">Bridge is ALVIRA's controlled distribution layer. Your maintained Context remains the source of truth; each new connection can be narrowed to one saved Context and one supported access surface.</p>

              {connection ? (
                <div className="mt-8 space-y-5">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wider text-system">Active connection</p>
                        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">{connection.legacyWideAccess ? "Legacy account-wide Bridge" : selectedProfile?.topic || "ALVIRA Context"}</h2>
                      </div>
                      <span className="rounded-full border border-system/40 bg-system-soft px-3 py-1 font-mono text-xs uppercase tracking-wide text-system-dark dark:bg-ink dark:text-system">Connected</span>
                    </div>

                    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                      <div><dt className="font-mono text-xs uppercase tracking-wide text-gray-500">Context</dt><dd className="mt-1 text-gray-900 dark:text-gray-100">{connection.legacyWideAccess ? "All saved Contexts (legacy)" : selectedProfile?.topic || "Selected Context"}</dd></div>
                      <div><dt className="font-mono text-xs uppercase tracking-wide text-gray-500">Access surface</dt><dd className="mt-1 text-gray-900 dark:text-gray-100">{connection.destination ? DESTINATION_LABELS[connection.destination] : "Legacy compatibility"}</dd></div>
                      <div><dt className="font-mono text-xs uppercase tracking-wide text-gray-500">Permission</dt><dd className="mt-1 text-gray-900 dark:text-gray-100">Read only</dd></div>
                      <div><dt className="font-mono text-xs uppercase tracking-wide text-gray-500">Expires</dt><dd className="mt-1 text-gray-900 dark:text-gray-100">{new Date(connection.expiresAt).toLocaleDateString()}</dd></div>
                    </dl>
                  </div>

                  {connection.legacyWideAccess ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
                      <h2 className="font-semibold text-amber-900 dark:text-amber-200">Reconnect to narrow this connection.</h2>
                      <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">This token was created before Bridge supported per-Context scoping, so it can read every saved Context on the account. Replace it to choose exactly one Context and access surface.</p>
                      <button type="button" onClick={changeConnection} disabled={busy} className="mt-4 rounded-lg bg-amber-900 px-4 py-2.5 font-mono text-sm font-semibold text-white disabled:opacity-60">{busy ? "Replacing…" : "Replace with a scoped connection →"}</button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                      <p className="font-mono text-xs uppercase tracking-wider text-gray-500">Next step · configure the client</p>
                      {connection.destination === "mcp" ? (
                        <>
                          <h2 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">Use the ALVIRA Bridge MCP surface</h2>
                          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">MCP endpoint: <code className="font-mono text-system-dark dark:text-system">https://alviratech.vercel.app/api/bridge/mcp</code></p>
                          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">A third-party MCP client is not connected merely by completing this browser authorization. The client must complete ALVIRA Bridge's OAuth/token flow and send its Bridge bearer token. The browser token stays HTTP-only and is never exposed for copy/paste.</p>
                        </>
                      ) : (
                        <>
                          <h2 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">Use the ALVIRA Bridge profile API</h2>
                          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Profile endpoint: <code className="font-mono text-system-dark dark:text-system">https://alviratech.vercel.app/api/bridge/profiles</code></p>
                          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Approved clients authenticate through <code>/api/bridge/authorize</code> and <code>/api/bridge/token</code>. This browser authorization prepares and verifies the selected Context scope; it does not silently connect an unrelated third-party account.</p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {!connection.legacyWideAccess && <button type="button" onClick={changeConnection} disabled={busy} className="rounded-lg border border-system px-4 py-2.5 font-mono text-sm font-semibold text-system-dark dark:text-system disabled:opacity-60">Change Context / access surface</button>}
                    <button type="button" onClick={revoke} disabled={busy} className="rounded-lg border border-red-300 px-4 py-2.5 font-mono text-sm text-red-700 dark:border-red-800 dark:text-red-300 disabled:opacity-60">{busy ? "Working…" : "Revoke Bridge access"}</button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    ["01", "Choose", "Select one saved ALVIRA Context for this connection."],
                    ["02", "Authorize", "Choose the MCP or API surface and approve read-only access."],
                    ["03", "Manage", "Verify status, configure the client, change scope, or revoke access."],
                  ].map(([number, title, body]) => <div key={number} className="border border-gray-200 p-4 dark:border-gray-700"><p className="font-mono text-xs text-system">{number}</p><h2 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{body}</p></div>)}
                </div>
              )}
            </section>

            <aside className="rounded-xl border border-system/30 bg-system-soft/40 p-6 dark:bg-ink/30">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{connection ? "Bridge status" : "Your Bridge readiness"}</h2>
              {connection ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">The active browser connection has been verified against ALVIRA's Bridge token store.</p>
                  <p className="mt-4 font-mono text-xs uppercase tracking-wide text-system">Read only · revocable · 30-day token</p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{profiles.length} saved {profiles.length === 1 ? "Context is" : "Contexts are"} available to connect.</p>
                  <a href="/bridge/connect" className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-system-dark px-4 py-3 font-mono text-sm font-semibold text-white dark:bg-system">Set up a connection →</a>
                  <p className="mt-4 text-xs leading-5 text-gray-500 dark:text-gray-400">Bridge does not create a second Context or change what ALVIRA maintains.</p>
                </>
              )}
            </aside>
          </div>
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
