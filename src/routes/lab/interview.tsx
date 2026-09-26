import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";

export const Route = createFileRoute("/lab/interview")({
  head: () => ({
    meta: [
      { title: "Interview Engine Lab — ALVIRA sandbox" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StaticInterviewLab,
});

const domains = ["Background", "Values", "Work", "Relationships"];

function StaticInterviewLab() {
  const [domain, setDomain] = useState(domains[0]);
  const [notice, setNotice] = useState("");

  return (
    <div
      className="min-h-dvh bg-[#0b0e0e] text-[#f4f0e9]"
      data-sandbox-marker="interview-shell"
    >
      <Header />
      <main
        id="main-content"
        className="mx-auto max-w-7xl px-6 pb-24 pt-8 sm:px-8 lg:px-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b8ada1]">
          <span>
            <strong className="text-system">Static product sandbox</strong> · no
            sign-in · no saves · no server calls
          </span>
          <span>Interview Engine Lab direction</span>
        </div>

        <section className="grid gap-10 py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,.92fr)] lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">
              Context should become visible while the conversation is happening.
            </p>
            <h1 className="mt-5 max-w-4xl text-[clamp(3.2rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.055em]">
              Talk naturally.
              <span className="block text-[#8f857c]">
                Watch understanding take shape.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#b8ada1]">
              This recovered shell shows the Interview Engine Lab direction
              without acting like the real lab. The Vercel-backed lab owns
              authentication, interview generation, Context writes, and
              persistence.
            </p>
          </div>

          <aside className="border border-white/12 bg-white/[0.025] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f857c]">
              Interview area
            </p>
            <label className="mt-5 block text-sm text-[#d8d0c7]">
              Focus
              <select
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                className="mt-2 w-full border border-white/15 bg-[#111513] px-3 py-3 text-sm text-[#f4f0e9]"
              >
                {domains.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                setNotice(
                  "Interview generation is intentionally unavailable here. This static sandbox never sends answers to the server-backed Lab or to ALVIRA Context.",
                )
              }
              className="mt-4 w-full border border-system/65 px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-system"
            >
              Explain the live Lab boundary
            </button>
          </aside>
        </section>

        <section className="border-y border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {["Answer", "Carry forward", "Find the gap", "Ask better"].map(
              (label, index) => (
                <div
                  key={label}
                  className="min-h-28 border-b border-r border-white/10 p-4 sm:border-b-0"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8f857c]">
                    0{index + 1}
                  </span>
                  <div className="mt-8 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full border border-white/30" />
                    <span className="text-[#756d66]">{label}</span>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {notice ? (
          <p
            role="status"
            className="mt-8 border border-system/35 bg-system/10 p-4 text-sm leading-6 text-[#e8e1d9]"
          >
            {notice}
          </p>
        ) : null}

        <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,.82fr)]">
          <div className="border border-white/10 bg-[#0d100f]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8f857c]">
                Interview
              </p>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6f6861]">
                {domain} · static view
              </span>
            </div>
            <div className="grid min-h-[390px] place-items-center p-5 text-center sm:p-7">
              <div>
                <p className="text-2xl font-medium tracking-[-0.025em]">
                  The interface starts quiet.
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#8f857c]">
                  The production Lab generates the first question after an
                  authenticated session. This sandbox keeps that boundary
                  explicit.
                </p>
              </div>
            </div>
            <div className="border-t border-white/10 p-5 sm:p-7">
              <textarea
                aria-label="Interview answer unavailable in static sandbox"
                disabled
                rows={4}
                placeholder="Server-backed answer capture is unavailable in this static sandbox."
                className="w-full resize-y border-0 border-b border-white/20 bg-transparent px-0 py-3 text-base leading-7 text-[#f4f0e9] opacity-55 outline-none placeholder:text-[#655e58]"
              />
              <p className="mt-4 text-right font-mono text-[10px] uppercase tracking-[0.12em] text-[#8f857c]">
                No answer is stored or transmitted
              </p>
            </div>
          </div>
          <aside className="border border-white/10 bg-white/[0.025] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8f857c]">
              Context Mirror
            </p>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
              A reviewable understanding, never an implied write.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#b8ada1]">
              The live workflow lets people review claims before any approved
              context is carried elsewhere. This static surface demonstrates
              that product direction but creates no profile, connection, or
              persistence record.
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}
