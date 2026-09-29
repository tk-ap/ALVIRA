import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getBridgeUserFromSession } from "~/lib/bridge";
import { listBridgeContextProposalsForUser, reviewBridgeContextProposal } from "~/lib/bridge-proposals";
import { ensureContextVersioningSchema } from "~/routes/-contextVersions";

const listProposals = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getBridgeUserFromSession();
  if (!user) throw new Error("Authentication required.");
  return listBridgeContextProposalsForUser(user.id);
});

const reviewProposal = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = input as { proposalId?: string; action?: string };
    if (!data.proposalId || (data.action !== "approve" && data.action !== "reject")) throw new Error("Invalid proposal review.");
    return { proposalId: data.proposalId, action: data.action as "approve" | "reject" };
  })
  .handler(async ({ data }) => {
    const user = await getBridgeUserFromSession();
    if (!user) throw new Error("Authentication required.");
    await ensureContextVersioningSchema();
    return reviewBridgeContextProposal({ userId: user.id, ...data });
  });

export const Route = createFileRoute("/bridge/updates")({
  head: () => ({ meta: [{ title: "Bridge updates — ALVIRA" }] }),
  component: BridgeUpdatesPage,
});

type Proposal = Awaited<ReturnType<typeof listProposals>>[number];

function BridgeUpdatesPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const refresh = () => listProposals().then(setProposals).catch(() => window.location.replace("/login?returnTo=/bridge/updates"));

  useEffect(() => { refresh(); }, []);

  const act = async (proposalId: string, action: "approve" | "reject") => {
    setBusyId(proposalId);
    setMessage("");
    try {
      await reviewProposal({ data: { proposalId, action } });
      setMessage(action === "approve" ? "Context updated." : "Proposal rejected.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not review proposal.");
    } finally {
      setBusyId(null);
    }
  };

  const pending = proposals.filter((proposal) => proposal.status === "pending");
  const reviewed = proposals.filter((proposal) => proposal.status !== "pending");

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-6 py-14">
        <section className="mx-auto w-full max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-widest text-system">&lt; bridge / proposed updates &gt;</p>
          <h1 className="mt-4 text-4xl font-semibold text-gray-900 dark:text-gray-100">Review what connected AI tools want ALVIRA to learn.</h1>
          <p className="mt-4 max-w-2xl leading-7 text-gray-600 dark:text-gray-400">Connected tools can propose changes. They cannot silently rewrite your source Context. Approving a proposal records it as a Living Update with provenance and preserves the prior Context in History.</p>

          {message && <p className="mt-6 font-mono text-sm text-system-dark dark:text-system">{message}</p>}

          <div className="mt-10 space-y-4">
            {pending.length === 0 && <div className="border border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">No pending updates.</div>}
            {pending.map((proposal) => (
              <article key={proposal.id} className="border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system">{proposal.profile_topic}</p>
                  <p className="font-mono text-[10px] text-gray-400">{new Date(proposal.created_at).toLocaleString()}</p>
                </div>
                <p className="mt-4 text-xl font-semibold leading-8 text-gray-900 dark:text-gray-100">{proposal.statement}</p>
                {proposal.rationale && <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{proposal.rationale}</p>}
                {proposal.supersedes.length > 0 && <div className="mt-4 border-l border-system/40 pl-4 text-sm leading-6 text-gray-600 dark:text-gray-400"><strong>May supersede:</strong> {proposal.supersedes.join("; ")}</div>}
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-400">Proposed by {proposal.client_id}</p>
                <div className="mt-6 flex gap-3">
                  <button disabled={busyId === proposal.id} onClick={() => act(proposal.id, "approve")} className="bg-system-dark px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-system">Approve update</button>
                  <button disabled={busyId === proposal.id} onClick={() => act(proposal.id, "reject")} className="border border-gray-300 px-5 py-3 text-sm font-semibold dark:border-gray-700">Reject</button>
                </div>
              </article>
            ))}
          </div>

          {reviewed.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold">Recently reviewed</h2>
              <div className="mt-4 space-y-3">
                {reviewed.slice(0, 10).map((proposal) => (
                  <div key={proposal.id} className="flex items-start justify-between gap-4 border-t border-gray-200 py-4 text-sm dark:border-gray-700">
                    <div><p className="text-gray-900 dark:text-gray-100">{proposal.statement}</p><p className="mt-1 text-gray-500">{proposal.profile_topic}</p></div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">{proposal.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a href="/bridge" className="mt-10 inline-block font-mono text-sm text-system-dark underline dark:text-system">Back to Bridge</a>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
