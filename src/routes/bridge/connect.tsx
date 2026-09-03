import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser, listProfiles } from "../-auth";

const ALVIRA_PUBLIC_URL = "https://alviratech.vercel.app";

type ProfileSummary = {
  id: string;
  topic: string;
  offering: "context" | "meos";
  updated_at: string;
};

type Destination = "mcp" | "api";

const DESTINATIONS: Array<{ id: Destination; title: string; body: string }> = [
  {
    id: "mcp",
    title: "MCP-compatible tool / agent",
    body: "Use ALVIRA Context through the Bridge MCP surface. After authorization, Bridge shows the endpoint and OAuth setup path for your client.",
  },
  {
    id: "api",
    title: "Custom API client",
    body: "Use the Bridge profile API from an approved client. After authorization, Bridge shows the API endpoint and token-exchange path.",
  },
];

export const Route = createFileRoute("/bridge/connect")({
  head: () => ({ meta: [{ title: "Authorize Bridge — ALVIRA" }, { name: "description", content: "Choose the ALVIRA Context and access method for a narrow Bridge connection." }] }),
  component: BridgeConnectPage,
});

function BridgeConnectPage() {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [destination, setDestination] = useState<Destination>("mcp");

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

        const params = new URLSearchParams(window.location.search);
        const requestedProfileId = params.get("profile_id");
        const requestedDestination = params.get("destination");
        const initialProfileId = savedProfiles.some((profile) => profile.id === requestedProfileId)
          ? requestedProfileId!
          : savedProfiles[0].id;

        setProfiles(savedProfiles);
        setSelectedProfileId(initialProfileId);
        if (requestedDestination === "api" || requestedDestination === "mcp") setDestination(requestedDestination);
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
  const authorizeUrl = `/api/bridge/authorize?return_to=${encodeURIComponent(returnTo)}&profile_id=${encodeURIComponent(selectedProfileId)}&destination=${encodeURIComponent(destination)}`;
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId);

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

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-14">
        <section className="mx-auto w-full max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-system">&lt; bridge / connect &gt;</p>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">Choose what Bridge can carry.</h1>
          <p className="mt-4 max-w-xl leading-7 text-gray-600 dark:text-gray-400">A Bridge connection is read-only and scoped to one saved ALVIRA Context. Choose the Context and the protocol surface you intend to use before authorizing access.</p>

          <div className="mt-8 space-y-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-8">
            <div>
              <label htmlFor="bridge-context" className="font-mono text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">01 · Context to share</label>
              <select
                id="bridge-context"
                value={selectedProfileId}
                onChange={(event) => setSelectedProfileId(event.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-system focus:outline-none focus:ring-2 focus:ring-system/20 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.topic}</option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Only this Context will be returned through the new connection. Changing the choice requires replacing the connection.</p>
            </div>

            <fieldset>
              <legend className="font-mono text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">02 · How you plan to use it</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {DESTINATIONS.map((item) => {
                  const active = destination === item.id;
                  return (
                    <label key={item.id} className={`cursor-pointer rounded-xl border p-4 transition ${active ? "border-system bg-system-soft/60 dark:bg-ink/40" : "border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"}`}>
                      <input
                        type="radio"
                        name="bridge-destination"
                        value={item.id}
                        checked={active}
                        onChange={() => setDestination(item.id)}
                        className="sr-only"
                      />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-gray-600 dark:text-gray-400">{item.body}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="rounded-xl border border-gray-200 p-4 text-sm leading-6 dark:border-gray-700">
              <p><strong>Shared:</strong> {selectedProfile?.topic || "Selected Context"}</p>
              <p><strong>Access:</strong> read-only Context and profile access</p>
              <p><strong>Control:</strong> you can revoke this connection from Bridge at any time</p>
              <p><strong>Lifetime:</strong> access token expires after 30 days unless revoked sooner</p>
            </div>

            <a href={authorizeUrl} className="inline-flex w-full items-center justify-center rounded-lg bg-system-dark px-5 py-3.5 font-semibold text-white transition hover:opacity-90 dark:bg-system">
              Authorize this connection →
            </a>
          </div>

          <a href="/bridge" className="mt-5 block text-center font-mono text-sm text-system-dark underline dark:text-system">Back to ALVIRA Bridge</a>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
