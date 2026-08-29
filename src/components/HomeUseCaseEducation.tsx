import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const USE_CASES = [
  {
    audience: "Personal",
    preserves: "Goals, preferences, boundaries, history, recurring decisions.",
    unlocks: "Planning, reflection, and AI help that starts with what already matters to you.",
  },
  {
    audience: "Founder / Business owner",
    preserves: "Product direction, customer truths, constraints, decisions, operating principles.",
    unlocks: "More consistent strategy, briefs, delegation, planning, and agent handoffs.",
  },
  {
    audience: "Creative",
    preserves: "Point of view, references, taste, active projects, creative constraints.",
    unlocks: "AI and collaborators that can build from your body of work without flattening your voice.",
  },
  {
    audience: "Professional",
    preserves: "Working style, expertise, accomplishments, priorities, career direction.",
    unlocks: "Better preparation, writing, career materials, and decision support with less reconstruction.",
  },
  {
    audience: "Team / Operator",
    preserves: "Workflows, policies, institutional knowledge, decisions, exceptions.",
    unlocks: "More reliable AI assistance and less context loss between people, tools, and agents.",
  },
] as const;

export function HomeUseCaseEducation() {
  const location = useLocation();
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (location.pathname !== "/") {
      setTarget(null);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setTarget(document.querySelector<HTMLElement>("main#main-content"));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  if (!target || location.pathname !== "/") return null;

  return createPortal(
    <section id="use-cases" className="border-t border-[#191715]/10 bg-[#ebe4d8] text-[#191715] dark:border-white/10 dark:bg-[#12100e] dark:text-[#f4f0e9]">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">What Context can do for you</p>
            <h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">Build understanding once. Put it to work many ways.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">ALVIRA is useful when the quality of an AI response depends on knowing more than the prompt in front of it.</p>
            <div className="mt-9 border-l border-system/55 pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">The output is not the point</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">Markdown, JSON, TOON, Reuse, and Bridge are ways to carry the maintained understanding into the next interaction instead of starting over.</p>
            </div>
          </div>

          <div>
            <div className="grid gap-px border border-[#191715]/12 bg-[#191715]/12 dark:border-white/12 dark:bg-white/12 md:grid-cols-2">
              {USE_CASES.map((item) => (
                <article key={item.audience} className="bg-[#f4f0e9] p-6 dark:bg-[#0b0e0e] sm:p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-system-dark dark:text-system">{item.audience}</p>
                  <div className="mt-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#74685e] dark:text-white/38">Context worth preserving</p>
                    <p className="mt-2 text-sm leading-6 text-[#4f4740] dark:text-[#c9bdb0]">{item.preserves}</p>
                  </div>
                  <div className="mt-5 border-t border-[#191715]/10 pt-4 dark:border-white/10">
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#74685e] dark:text-white/38">What it unlocks</p>
                    <p className="mt-2 text-sm leading-6 text-[#4f4740] dark:text-[#c9bdb0]">{item.unlocks}</p>
                  </div>
                </article>
              ))}
              <article className="bg-[#191715] p-6 text-[#f4f0e9] dark:bg-[#111513] sm:p-7 md:col-span-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-human">The difference in practice</p>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="border-t border-white/18 pt-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-white/38">Without maintained Context</p>
                    <p className="mt-3 font-display text-2xl leading-[1.05] tracking-[-0.02em] text-white">“Help me plan the next phase of my business.”</p>
                    <p className="mt-3 text-sm leading-6 text-white/52">The model reconstructs your situation from whatever fits in this conversation.</p>
                  </div>
                  <div className="border-t border-system/55 pt-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-system">With maintained Context</p>
                    <p className="mt-3 font-display text-2xl leading-[1.05] tracking-[-0.02em] text-white">The same request starts with your stage, constraints, prior decisions, launch criteria, and what changed recently.</p>
                    <p className="mt-3 text-sm leading-6 text-white/52">Less re-explaining. More situated judgment.</p>
                  </div>
                </div>
                <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
                  <a href="/app" className="inline-flex min-h-11 items-center justify-center bg-[#f4f0e9] px-5 text-sm font-semibold text-[#191715] transition-opacity hover:opacity-85">Build your Context →</a>
                  <a href="/integrations" className="inline-flex min-h-11 items-center justify-center border border-white/20 px-5 text-sm font-semibold text-white/74 transition-colors hover:border-white/40 hover:text-white">See how Reuse works →</a>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>,
    target,
  );
}
