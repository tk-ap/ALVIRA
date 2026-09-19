import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Header } from "~/components/Header";
import { getCurrentUser } from "./-auth";
import { generateInterviewLabTurn } from "./-interviewLab";
import { getKnowledgeGraph, type Message, type Tier } from "./-knowledgeGraph";

export const Route = createFileRoute("/interview-lab-immersive")({
  head: () => ({
    meta: [
      { title: "Immersive Interview Prototype — ALVIRA" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ImmersiveInterviewPrototype,
});

type Diagnostics = {
  carriedForward: string;
  targetGap: string;
  questionPurpose: string;
};

function ImmersiveInterviewPrototype() {
  const [ownerAccess, setOwnerAccess] = useState<boolean | null>(null);
  const [tier] = useState<Tier>("personal");
  const [domainId, setDomainId] = useState("background");
  const domains = useMemo(
    () => [...getKnowledgeGraph(tier)].sort((a, b) => a.priority - b.priority),
    [tier],
  );
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

  async function runTurn(nextHistory: Message[]) {
    setBusy(true);
    setError("");
    try {
      const result = await generateInterviewLabTurn({
        data: {
          tier,
          domainId,
          history: nextHistory,
          promptVersion: "lab-v2",
          userName: "",
        },
      });
      setHistory([...nextHistory, { role: "assistant", content: result.question }]);
      setDiagnostics(result.diagnostics);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Interview Lab could not continue.");
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setHistory([]);
    setDiagnostics(null);
    setAnswer("");
    setError("");
    await runTurn([]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const content = answer.trim();
    if (!content || busy || history.length === 0) return;
    const nextHistory: Message[] = [...history, { role: "user", content }];
    setHistory(nextHistory);
    setAnswer("");
    await runTurn(nextHistory);
  }

  function resetForDomain(nextDomain: string) {
    setDomainId(nextDomain);
    setHistory([]);
    setDiagnostics(null);
    setAnswer("");
    setError("");
  }

  if (ownerAccess === null) {
    return (
      <div className="min-h-dvh bg-[#0b0e0e] text-[#f4f0e9]">
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-20">Checking owner access…</main>
      </div>
    );
  }

  if (!ownerAccess) {
    return (
      <div className="min-h-dvh bg-[#0b0e0e] text-[#f4f0e9]">
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl font-semibold">Owner prototype</h1>
          <p className="mt-4 text-[#b8ada1]">Owner access is required.</p>
        </main>
      </div>
    );
  }

  const assistantTurns = history.filter((message) => message.role === "assistant").length;
  const stage = history.length === 0 ? 0 : Math.min(4, Math.max(1, assistantTurns));

  return (
    <div className="min-h-dvh bg-[#0b0e0e] text-[#f4f0e9]">
      <Header />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-8 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b8ada1]">
          <span>
            <strong className="text-[#d6c24a]">Prototype V1</strong> · owner-only · no saves ·
            latest Interview Engine Lab
          </span>
          <span>branch: prototype/immersive-interview-v1</span>
        </div>

        <section className="grid gap-10 py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,.92fr)] lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#d6c24a]">
              Context should become visible while the conversation is happening.
            </p>
            <h1 className="mt-5 max-w-4xl text-[clamp(3.2rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.055em]">
              Talk naturally.
              <span className="block text-[#8f857c]">Watch understanding take shape.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#b8ada1]">
              This is a design shell over the real isolated Interview Engine Lab. The prototype
              changes presentation only: it does not write Context, profiles, completion state,
              drafts, or Build Briefs.
            </p>
          </div>

          <aside className="border border-white/12 bg-white/[0.025] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f857c]">
              Prototype controls
            </p>
            <label className="mt-5 block text-sm text-[#d8d0c7]">
              Interview area
              <select
                value={domainId}
                onChange={(event) => resetForDomain(event.target.value)}
                className="mt-2 w-full border border-white/15 bg-[#111513] px-3 py-3 text-sm text-[#f4f0e9]"
              >
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={start}
              disabled={busy || !domainId}
              className="mt-4 w-full border border-[#d6c24a]/65 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#d6c24a] disabled:opacity-40"
            >
              {history.length ? "Restart with real lab engine" : "Begin with real lab engine"}
            </button>
          </aside>
        </section>

        <section className="border-y border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {[
              ["01", "Answer"],
              ["02", "Carry forward"],
              ["03", "Find the gap"],
              ["04", "Ask better"],
            ].map(([number, label], index) => {
              const active = stage > index;
              return (
                <div
                  key={number}
                  className="min-h-28 border-b border-r border-white/10 p-4 sm:border-b-0"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f857c]">
                    {number}
                  </span>
                  <div className="mt-8 flex items-center gap-2">
                    <span
                      className={
                        active
                          ? "h-2 w-2 rounded-full bg-[#d6c24a]"
                          : "h-2 w-2 rounded-full border border-white/30"
                      }
                    />
                    <span className={active ? "text-[#f4f0e9]" : "text-[#756d66]"}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {error ? (
          <div className="mt-8 border border-red-400/35 bg-red-950/20 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,.82fr)]">
          <div className="border border-white/10 bg-[#0d100f]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f857c]">
                Interview
              </p>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6f6861]">
                Lab v2 · no production writes
              </span>
            </div>

            <div className="min-h-[460px] space-y-8 p-5 sm:p-7">
              {history.length === 0 ? (
                <div className="grid min-h-[390px] place-items-center text-center">
                  <div>
                    <p className="text-2xl font-medium tracking-[-0.025em]">
                      The interface starts quiet.
                    </p>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8f857c]">
                      Begin when you want the actual Interview Lab to generate the first question.
                    </p>
                  </div>
                </div>
              ) : (
                history.map((message, index) => (
                  <article
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "assistant"
                        ? "mr-[8%] border-l border-[#d6c24a]/55 pl-5"
                        : "ml-[12%] border-l border-white/15 pl-5"
                    }
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f857c]">
                      {message.role === "assistant" ? "ALVIRA" : "You"}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[clamp(1rem,2vw,1.3rem)] leading-8 text-[#e8e1d9]">
                      {message.content}
                    </p>
                  </article>
                ))
              )}
              {busy ? (
                <div className="border-l border-[#d6c24a]/35 pl-5 text-sm text-[#8f857c]">
                  ALVIRA is finding the next useful gap…
                </div>
              ) : null}
            </div>

            <form onSubmit={submit} className="border-t border-white/10 p-5 sm:p-7">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={busy || history.length === 0}
                rows={4}
                placeholder="Answer naturally…"
                className="w-full resize-y border-0 border-b border-white/20 bg-transparent px-0 py-3 text-base leading-7 text-[#f4f0e9] outline-none placeholder:text-[#655e58] focus:border-[#d6c24a]/70 disabled:opacity-45"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={busy || history.length === 0 || !answer.trim()}
                  className="border border-white/20 px-5 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] disabled:opacity-35"
                >
                  Send answer →
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="border border-white/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#d6c24a]">
                What ALVIRA is carrying forward
              </p>
              <p className="mt-5 text-xl leading-8 tracking-[-0.02em] text-[#ded6cc]">
                {diagnostics?.carriedForward ||
                  "This surface remains empty until the real Lab reports what it is carrying forward."}
              </p>
            </div>

            <div className="border border-white/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f857c]">
                The gap it is trying to reduce
              </p>
              <p className="mt-4 text-base leading-7 text-[#c2b9b0]">
                {diagnostics?.targetGap || "No target gap reported yet."}
              </p>
            </div>

            <div className="border border-white/10 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f857c]">
                Why the next question exists
              </p>
              <p className="mt-4 text-sm leading-6 text-[#9d948c]">
                {diagnostics?.questionPurpose || "No question purpose reported yet."}
              </p>
            </div>

            <div className="border border-[#8b3345]/45 bg-[#8b3345]/10 p-5 text-sm leading-6 text-[#d8c8cc]">
              Design rule: these panels visualize only fields returned by the isolated Lab. They
              must not imply saved Context, confidence, memory, or completion state that the engine
              has not actually produced.
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
