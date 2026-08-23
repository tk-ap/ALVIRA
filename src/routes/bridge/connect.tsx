import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

const BRIDGE_URL = "https://alviratech-bridge.vercel.app";

export const Route = createFileRoute("/bridge/connect")({
  head: () => ({ meta: [{ title: "Connect Bridge — ALVIRA" }, { name: "description", content: "Authorize ALVIRA Bridge to carry your profile across AI tools." }] }),
  component: BridgeConnectPage,
});

function BridgeConnectPage() {
  const returnTo = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("return_to") || `${BRIDGE_URL}/api/auth/callback`
    : `${BRIDGE_URL}/api/auth/callback`;
  const authorizeUrl = `/api/bridge/authorize?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-6 py-16">
        <section className="mx-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="font-mono text-xs uppercase tracking-widest text-system">&lt; bridge / authorize &gt;</p>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">Connect ALVIRA Bridge</h1>
          <p className="mt-4 leading-7 text-gray-600 dark:text-gray-400">Bridge can read your existing ALVIRA Profile so it can distribute your context to connected AI tools. It does not rebuild or replace your Context Engine.</p>
          <div className="mt-6 space-y-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-700">
            <p><strong>Shared:</strong> your selected ALVIRA Profile context.</p>
            <p><strong>Control:</strong> revoke Bridge access from your account or rotate the connection later.</p>
            <p><strong>Scope:</strong> profile and context read access only in this first release.</p>
          </div>
          <a href={authorizeUrl} className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-system-dark px-5 py-3.5 font-semibold text-white transition hover:opacity-90 dark:bg-system">Authorize Bridge →</a>
          <a href={BRIDGE_URL} className="mt-4 block text-center font-mono text-sm text-system-dark underline dark:text-system">Back to Bridge</a>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
