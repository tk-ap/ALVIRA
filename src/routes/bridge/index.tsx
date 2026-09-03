import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles } from "../-auth";

export const Route = createFileRoute("/bridge/")({
  head: () => ({
    meta: [
      { title: "Bridge — ALVIRA" },
      { name: "description", content: "Use selected ALVIRA Context in other AI tools without rebuilding it." },
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

type ActiveConnection = {
  connection_id: string;
  client_id: string;
  client_name: string;
  selected_profile_id: string | null;
  profile_topic: string | null;
  destination: "mcp" | "api" | null;
  scope: string;
  expires_at: string;
  created_at: string;
};

type BrowserBridgeStatus = {
  connected: boolean;
  connection?: {
    selectedProfileId: string | null;
    destination: "mcp" | "api" | null;
    scope: string;
    expiresAt: string;
    legacyWideAccess: boolean;
  };
};

function BridgePage() {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [connections, setConnections] = useState<ActiveConnection[]>([]);
  const [legacyConnection, setLegacyConnection] = useState<BrowserBridgeStatus["connection"] | null>(null);
  const [statusError, setStatusError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then(async (user) => {
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
          const [connectionsResponse, browserResponse] = await Promise.all([
            fetch("/api/bridge/connections", { credentials: "same-origin", cache: "no-store" }),
            fetch("/api/bridge/context", { credentials: "same-origin", cache: "no-store" }),
          ]);

          if (connectionsResponse.ok) {
            const result = await connectionsResponse.json() as { connections?: ActiveConnection[] };
            if (!cancelled) setConnections(result.connections || []);
          } else if (!cancelled) {
            setStatusError("ALVIRA could not verify your connections. Refresh and try again.");
          }

          if (browserResponse.ok) {
            const result = await browserResponse.json() as BrowserBridgeStatus;
            if (!cancelled && result.connection?.legacyWideAccess) setLegacyConnection(result.connection);
          }
        } catch {
          if (!cancelled) setStatusError("ALVIRA could not verify your connections. Refresh and try again.");
        }

        if (!cancelled) setReady(true);
      })
      .catch(() => window.location.replace("/app"));
    return () => { cancelled = true; };
  }, []);

  const revokeConnection = async (connectionId: string) => {
    setBusyId(connectionId);
    setStatusError("");
    try {
      const response = await fetch("/api/bridge/connections", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: connectionId }),
      });
      if (!response.ok) throw new Error("ALVIRA could not revoke that connection.");
      setConnections((current) => current.filter((item) => item.connection_id !== connectionId));
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "ALVIRA could not revoke that connection.");
    } finally {
      setBusyId("");
    }
  };

  const revokeLegacy = async () => {
    setBusyId("legacy");
    try {
      const response = await fetch("/api/bridge/context", { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) throw new Error("ALVIRA could not remove the old Bridge connection.");
      setLegacyConnection(null);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "ALVIRA could not remove the old Bridge connection.");
    } finally {
      setBusyId("");
    }
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 items-center justify-center px-6">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">Checking your connections…</p>
        </main>
      </div>
    );
  }

  const notice = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("connection") : null;
  const justConnected = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("connected") === "1";

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-system">&lt; alvira / bridge &gt;</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Use your ALVIRA Context in another AI tool.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">Bridge carries only the Context you approve. You do not need to move files, copy a profile, or manage security keys yourself.</p>

          {(justConnected || connections.length > 0) && (
            <div className="mt-6 rounded-xl border border-system/40 bg-system-soft/60 px-5 py-4 dark:bg-ink/40" role="status">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Connected ✓</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">ALVIRA can verify {connections.length === 1 ? "an active connection" : `${connections.length} active connections`} below.</p>
            </div>
          )}

          {notice === "cancelled" && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" role="status">Connection cancelled. Nothing was shared.</div>
          )}

          {statusError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">
              <strong>Connection check failed.</strong> {statusError}
            </div>
          )}

          <section className="mt-10" aria-labelledby="connected-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-gray-500">Your connections</p>
                <h2 id="connected-heading" className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">What can use ALVIRA right now</h2>
              </div>
              <span className="font-mono text-xs uppercase tracking-wide text-system">{connections.length} active</span>
            </div>

            {connections.length === 0 && !legacyConnection ? (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-300 p-6 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-gray-100">No active connections yet.</p>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">That is normal. Pick an option below when you want another AI tool to use your ALVIRA Context.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {connections.map((connection) => (
                  <article key={connection.connection_id} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex rounded-full border border-system/40 bg-system-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-system-dark dark:bg-ink dark:text-system">Connected</span>
                        <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{connection.client_name}</h3>
                      </div>
                    </div>
                    <dl className="mt-5 space-y-3 text-sm">
                      <div><dt className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Can read</dt><dd className="mt-1 text-gray-900 dark:text-gray-100">{connection.profile_topic || "Approved ALVIRA Context"}</dd></div>
                      <div><dt className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Permission</dt><dd className="mt-1 text-gray-900 dark:text-gray-100">Read only</dd></div>
                      <div><dt className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Renews access</dt><dd className="mt-1 text-gray-900 dark:text-gray-100">Reconnect after {new Date(connection.expires_at).toLocaleDateString()}</dd></div>
                    </dl>
                    <button type="button" onClick={() => revokeConnection(connection.connection_id)} disabled={busyId === connection.connection_id} className="mt-5 rounded-lg border border-red-300 px-4 py-2.5 font-mono text-xs font-semibold text-red-700 disabled:opacity-60 dark:border-red-800 dark:text-red-300">
                      {busyId === connection.connection_id ? "Removing…" : "Revoke connection"}
                    </button>
                  </article>
                ))}

                {legacyConnection && (
                  <article className="rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">Old Bridge connection</span>
                    <h3 className="mt-3 text-lg font-semibold text-amber-950 dark:text-amber-100">Needs an update</h3>
                    <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">This was created before Bridge could limit a connection to one Context. Remove it and reconnect through the new flow.</p>
                    <button type="button" onClick={revokeLegacy} disabled={busyId === "legacy"} className="mt-5 rounded-lg bg-amber-900 px-4 py-2.5 font-mono text-xs font-semibold text-white disabled:opacity-60">
                      {busyId === "legacy" ? "Removing…" : "Remove old connection"}
                    </button>
                  </article>
                )}
              </div>
            )}
          </section>

          <section className="mt-12" aria-labelledby="available-heading">
            <p className="font-mono text-xs uppercase tracking-wider text-gray-500">Available connections</p>
            <h2 id="available-heading" className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">Where do you want to use your Context?</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <a href="/bridge/connect" className="group rounded-2xl border border-system/40 bg-system-soft/30 p-6 transition hover:border-system dark:bg-ink/20">
                <p className="font-mono text-xs uppercase tracking-wider text-system">Recommended</p>
                <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">AI app or agent</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">Choose this when an AI app gives you an option such as “Add MCP server,” “Add tool,” or “Custom connector.”</p>
                <span className="mt-5 inline-flex font-mono text-sm font-semibold text-system-dark group-hover:underline dark:text-system">Show me how →</span>
              </a>

              <a href="/bridge/connect?destination=api" className="group rounded-2xl border border-gray-200 p-6 transition hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500">
                <p className="font-mono text-xs uppercase tracking-wider text-gray-500">Advanced</p>
                <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Custom app or API</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">For a developer building a direct integration with ALVIRA's read-only Bridge API.</p>
                <span className="mt-5 inline-flex font-mono text-sm font-semibold text-system-dark group-hover:underline dark:text-system">Developer setup →</span>
              </a>
            </div>
          </section>

          <section className="mt-12 rounded-2xl border border-gray-200 p-6 dark:border-gray-700 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-wider text-gray-500">What happens when you connect</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div><span className="font-mono text-xs text-system">01</span><h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">The other app asks</h3><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Your AI app opens ALVIRA when it needs permission.</p></div>
              <div><span className="font-mono text-xs text-system">02</span><h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">You choose</h3><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">You select one saved Context. Nothing else is shared.</p></div>
              <div><span className="font-mono text-xs text-system">03</span><h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">ALVIRA handles the rest</h3><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Secure credentials stay in the background. A successful connection appears above as Connected.</p></div>
            </div>
          </section>

          <p className="mt-8 text-xs leading-5 text-gray-500 dark:text-gray-400">{profiles.length} saved {profiles.length === 1 ? "Context is" : "Contexts are"} available for Bridge. Bridge is read-only: connected tools cannot change ALVIRA's source Context.</p>
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
