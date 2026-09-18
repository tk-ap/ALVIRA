import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser } from "./-auth";
import {
  generateInterviewLabTurn,
  type InterviewLabPromptVersion,
} from "./-interviewLab";
import {
  getKnowledgeGraph,
  type Message,
  type Tier,
} from "./-knowledgeGraph";

export const Route = createFileRoute("/interview-lab")({
  head: () => ({
    meta: [
      { title: "Interview Lab — ALVIRA" },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: InterviewLabPage,
});

type Diagnostics = {
  carriedForward: string;
  targetGap: string;
  questionPurpose: string;
};

function InterviewLabPage() {
  const [ownerAccess, setOwnerAccess] = useState<boolean | null>(null);
  const [tier, setTier] = useState<Tier>("personal");
  const [promptVersion, setPromptVersion] =
    useState<InterviewLabPromptVersion>("lab-v2");
  const domains = useMemo(
    () => [...getKnowledgeGraph(tier)].sort((a, b) => a.priority - b.priority),
    [tier],
  );
  const [domainId, setDomainId] = useState("background");
  const [history, setHistory] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) setOwnerAccess(Boolean(user?.isOwner));
      })
      .catch(() => {
        if (!cancelled) setOwnerAccess(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stillExists = domains.some((domain) => domain.id === domainId);
    if (!stillExists) setDomainId(domains[0]?.id ?? "");
    setHistory([]);
    setDiagnostics(null);
    setAnswer("");
    setError("");
  }, [tier, domains, domainId]);

  function resetSession() {
    setHistory([]);
    setDiagnostics(null);
    setAnswer("");
    setError("");
  }

  async function runTurn(nextHistory: Message[]) {
    setBusy(true);
    setError("");
    try {
      const result = await generateInterviewLabTurn({
        data: {
          tier,
          domainId,
          history: nextHistory,
          promptVersion,
        },
      });
      setHistory([
        ...nextHistory,
        { role: "assistant", content: result.question },
      ]);
      setDiagnostics(result.diagnostics);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Interview Lab could not continue.");
    } finally {
      setBusy(false);
    }
  }

  async function startSession() {
    resetSession();
    await runTurn([]);
  }

  async function submitAnswer(event: FormEvent) {
    event.preventDefault();
    const content = answer.trim();
    if (!content || busy || history.length === 0) return;

    const nextHistory: Message[] = [...history, { role: "user", content }];
    setHistory(nextHistory);
    setAnswer("");
    await runTurn(nextHistory);
  }

  if (ownerAccess === null) {
    return (
      <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-20">Checking access…</main>
      </div>
    );
  }

  if (!ownerAccess) {
    return (
      <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-20">
          <h1 className="text-3xl font-bold">Interview Lab</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Owner access is required.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main id="main-content" className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
        <div className="border-b border-gray-200 pb-8 dark:border-gray-800">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">
            Owner sandbox / Interview Engine
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Interview Lab
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 dark:text-gray-400">
            Test the live interview prompt against an experimental version without saving
            answers to ALVIRA Context. Nothing in this lab updates profiles, drafts, or
            production interview state.
          </p>
        </div>

        <section className="mt-8 grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-3">
          <label className="text-sm font-medium">
            Context type
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value as Tier)}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="personal">Personal</option>
              <option value="team">Team</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Target area
            <select
              value={domainId}
              onChange={(event) => {
                setDomainId(event.target.value);
                resetSession();
              }}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950"
            >
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Interview brain
            <select
              value={promptVersion}
              onChange={(event) => {
                setPromptVersion(event.target.value as InterviewLabPromptVersion);
                resetSession();
              }}
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950"
            >
              <option value="lab-v2">Lab v2 — experimental</option>
              <option value="production">Production — current</option>
            </select>
          </label>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startSession}
            disabled={busy || !domainId}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900"
          >
            {history.length > 0 ? "Restart interview" : "Start interview"}
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            To compare versions, use the same answers, switch the Interview brain, and restart.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                Test conversation
              </p>
            </div>

            <div className="min-h-[360px] space-y-5 p-5">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start the interview to generate the first question.
                </p>
              ) : (
                history.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "assistant"
                        ? "mr-8 rounded-lg border border-system/40 bg-system-soft/40 p-4 dark:bg-ink/20"
                        : "ml-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900"
                    }
                  >
                    <p className="font-mono text-[10px] uppercase tracking-wide text-gray-500">
                      {message.role === "assistant" ? "ALVIRA" : "You"}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  </div>
                ))
              )}
              {busy ? <p className="text-sm text-gray-500">ALVIRA is thinking…</p> : null}
            </div>

            <form onSubmit={submitAnswer} className="border-t border-gray-200 p-5 dark:border-gray-800">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={busy || history.length === 0}
                rows={4}
                placeholder="Answer naturally, as if this were the live interview…"
                className="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 text-sm leading-6 outline-none focus:border-system focus:ring-2 focus:ring-system/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
              />
              <button
                type="submit"
                disabled={busy || history.length === 0 || !answer.trim()}
                className="mt-3 rounded-lg border border-system px-5 py-2.5 text-sm font-semibold text-system-dark disabled:opacity-50 dark:text-system"
              >
                Send answer
              </button>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-5 dark:border-gray-800">
              <p className="font-mono text-xs uppercase tracking-wide text-gray-500">
                Lab diagnostics
              </p>
              {promptVersion === "production" ? (
                <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Production mode intentionally shows no diagnostic fields. It runs the same
                  prompt used by the live question generator.
                </p>
              ) : diagnostics ? (
                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="font-semibold">Carried forward</dt>
                    <dd className="mt-1 leading-6 text-gray-600 dark:text-gray-400">
                      {diagnostics.carriedForward || "None yet"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Target gap</dt>
                    <dd className="mt-1 leading-6 text-gray-600 dark:text-gray-400">
                      {diagnostics.targetGap || "Not reported"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Why ask this</dt>
                    <dd className="mt-1 leading-6 text-gray-600 dark:text-gray-400">
                      {diagnostics.questionPurpose || "Not reported"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-gray-500">Diagnostics appear after a Lab v2 turn.</p>
              )}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
              This is deliberately disconnected from profile saving, autosave, completion
              scoring, and Build Brief generation. We can change the interview brain here
              without changing what customers use.
            </div>
          </aside>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
