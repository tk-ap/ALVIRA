import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles } from "../-auth";

const MCP_ENDPOINT = "https://alviratech.vercel.app/api/bridge/mcp";
const API_ENDPOINT = "https://alviratech.vercel.app/api/bridge/profiles";

type ProfileSummary = {
  id: string;
  topic: string;
  offering: "context" | "meos";
  updated_at: string;
};

export const Route = createFileRoute("/bridge/connect")({
  head: () => ({ meta: [{ title: "Connect Bridge — ALVIRA" }, { name: "description", content: "Choose the ALVIRA Context an AI app may use." }] }),
  component: BridgeConnectPage,
});

function BridgeConnectPage() {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [copied, setCopied] = useState(false);

  const params = useMemo(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams(), []);
  const oauthMode = params.get("mode") === "oauth";
  const requestedDestination = params.get("destination") === "api" ? "api" : "mcp";

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then(async (user) => {
        if (!user) {
          const returnTo = `${window.location.pathname}${window.location.search}`;
          window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        const savedProfiles = await listProfiles() as ProfileSummary[];
        if (cancelled) return;
        if (savedProfiles.length === 0) {
          window.location.replace("/app");
          return;
        }
        const requestedProfileId = params.get("profile_id");
        setProfiles(savedProfiles);
        setSelectedProfileId(savedProfiles.some((profile) => profile.id === requestedProfileId) ? requestedProfileId! : savedProfiles[0].id);
        setReady(true);
      })
      .catch(() => window.location.replace("/app"));
    return () => { cancelled = true; };
  }, [params]);

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId);

  const allowUrl = useMemo(() => {
    if (!oauthMode) return "";
    const next = new URLSearchParams(params);
    next.delete("mode");
    next.delete("client_name");
    next.set("profile_id", selectedProfileId);
    return `/api/bridge/authorize?${next.toString()}`;
  }, [oauthMode, params, selectedProfileId]);

  const copyMcpAddress = async () => {
    try {
      await navigator.clipboard.writeText(MCP_ENDPOINT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 items-center justify-center px-6">
          <p className="font-mono text-sm text-gray-500 dark:text-gray-400">Getting Bridge ready…</p>
        </main>
      </div>
    );
  }

  if (oauthMode) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-6 py-14">
          <section className="mx-auto w-full max-w-xl">
            <p className="font-mono text-xs uppercase tracking-widest text-system">&lt; bridge / approve &gt;</p>
            <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">An AI app wants to use your ALVIRA Context.</h1>
            <p className="mt-4 leading-7 text-gray-600 dark:text-gray-400">Choose exactly what it may read. ALVIRA handles the secure connection in the background.</p>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-8">
              <label htmlFor="bridge-context" className="font-mono text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Context this app may use</label>
              <select
                id="bridge-context"
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-system focus:outline-none focus:ring-2 focus:ring-system/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.topic}</option>)}
              </select>

              <div className="mt-6 rounded-xl border border-gray-200 p-4 text-sm leading-6 dark:border-gray-700">
                <p><strong>It can read:</strong> {selectedProfile?.topic || "the Context you selected"}</p>
                <p><strong>It cannot:</strong> edit your Context, see your password, or access your other saved Contexts</p>
                <p><strong>You stay in control:</strong> revoke the connection from Bridge at any time</p>
              </div>

              <a href={allowUrl} className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-system-dark px-5 py-3.5 font-semibold text-white transition hover:opacity-90 dark:bg-system">
                Allow connection →
              </a>
              <a href="/bridge?connection=cancelled" className="mt-4 block text-center text-sm text-gray-500 underline dark:text-gray-400">Cancel</a>
            </div>
          </section>
        </main>
        <TrustFooter />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-14">
        <section className="mx-auto w-full max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-system">&lt; bridge / connect &gt;</p>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">Where do you want to use ALVIRA?</h1>
          <p className="mt-4 max-w-2xl leading-7 text-gray-600 dark:text-gray-400">You do not need to understand the connection technology. Pick the option that matches what you are doing and ALVIRA handles the secure authorization when the other app connects.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className={`rounded-2xl border p-6 ${requestedDestination === "mcp" ? "border-system bg-system-soft/40 dark:bg-ink/30" : "border-gray-200 dark:border-gray-700"}`}>
              <p className="font-mono text-xs uppercase tracking-wider text-system">Recommended</p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">AI app or agent</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">Use this when your AI app lets you add an MCP server, tool server, or custom connector.</p>
              <ol className="mt-5 space-y-2 text-sm leading-6 text-gray-700 dark:text-gray-300">
                <li><strong>1.</strong> In the AI app, choose its option to add an MCP/server connection.</li>
                <li><strong>2.</strong> Paste the ALVIRA address below.</li>
                <li><strong>3.</strong> The app should open ALVIRA so you can sign in and choose one Context.</li>
              </ol>
              <div className="mt-5 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
                <code className="break-all font-mono text-xs text-gray-800 dark:text-gray-200">{MCP_ENDPOINT}</code>
              </div>
              <button type="button" onClick={copyMcpAddress} className="mt-3 w-full rounded-lg bg-system-dark px-4 py-3 font-mono text-sm font-semibold text-white dark:bg-system">
                {copied ? "Copied ✓" : "Copy connection address"}
              </button>
              <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">If the AI app supports ALVIRA's connection flow, sign-in and secure credentials happen automatically.</p>
            </div>

            <div className={`rounded-2xl border p-6 ${requestedDestination === "api" ? "border-system bg-system-soft/40 dark:bg-ink/30" : "border-gray-200 dark:border-gray-700"}`}>
              <p className="font-mono text-xs uppercase tracking-wider text-gray-500">Advanced</p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Custom app or API</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">For developers building their own integration. The app uses ALVIRA's authorization flow and reads the approved Context from the Bridge profile API.</p>
              <div className="mt-5 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
                <code className="break-all font-mono text-xs text-gray-800 dark:text-gray-200">{API_ENDPOINT}</code>
              </div>
              <details className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">Developer details</summary>
                <p className="mt-2 leading-6">Use ALVIRA's authorization endpoint, token endpoint, and read-only profile endpoint. MCP clients should use the recommended connection address instead because discovery is automatic there.</p>
              </details>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-system/30 bg-system-soft/30 p-5 dark:bg-ink/20">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">How you will know it worked</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">A successful app connection appears on your Bridge page as <strong>Connected</strong> with the app name, the Context it can read, and a Revoke button. If authorization fails, the connecting app receives a failure instead of partial access.</p>
          </div>

          <a href="/bridge" className="mt-6 block text-center font-mono text-sm text-system-dark underline dark:text-system">Back to ALVIRA Bridge</a>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
