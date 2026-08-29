import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const USE_CASES = [
  {
    audience: "For yourself",
    question: "I want AI to help me think, plan, and make decisions.",
    benefit: "ALVIRA helps AI remember your goals, preferences, boundaries, and what has changed instead of making you explain them again every time.",
  },
  {
    audience: "For your business",
    question: "I want AI to help me build or run my business.",
    benefit: "ALVIRA gives AI the background it needs about your product, customers, priorities, constraints, and past decisions so its help fits the business you are actually building.",
  },
  {
    audience: "For your creative work",
    question: "I want AI to help me create without losing what makes the work mine.",
    benefit: "ALVIRA can carry your point of view, references, taste, active projects, and creative boundaries forward so you spend less time correcting generic ideas.",
  },
  {
    audience: "For your career",
    question: "I want AI to help me write, prepare, learn, or make career decisions.",
    benefit: "ALVIRA helps AI understand your experience, strengths, working style, priorities, and direction before it starts giving advice or drafting for you.",
  },
  {
    audience: "For a team",
    question: "I want AI to help us work without losing what the team already knows.",
    benefit: "ALVIRA can keep important workflows, decisions, rules, and exceptions available so people and AI tools do not have to rebuild the same background over and over.",
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
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">Why ALVIRA for me?</p>
            <h2 className="mt-5 max-w-xl font-display text-5xl leading-[0.93] tracking-[-0.035em] sm:text-6xl">AI can do more for you when it knows more about you.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">Most AI starts with only what you type into the box. ALVIRA helps you build the background it should know before it answers, writes, plans, or acts with you.</p>
            <div className="mt-9 border-l border-system/55 pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">Simply put</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">You teach ALVIRA what matters. ALVIRA keeps it current. Then you can bring that understanding into future AI conversations instead of starting from zero.</p>
            </div>
          </div>

          <div>
            <div className="grid gap-px border border-[#191715]/12 bg-[#191715]/12 dark:border-white/12 dark:bg-white/12 md:grid-cols-2">
              {USE_CASES.map((item) => (
                <article key={item.audience} className="bg-[#f4f0e9] p-6 dark:bg-[#0b0e0e] sm:p-7">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-system-dark dark:text-system">{item.audience}</p>
                  <p className="mt-5 font-display text-2xl leading-[1.05] tracking-[-0.02em] text-[#27231f] dark:text-[#ece4da]">{item.question}</p>
                  <p className="mt-4 text-sm leading-6 text-[#5f554c] dark:text-[#b8ada1]">{item.benefit}</p>
                </article>
              ))}

              <article className="bg-[#191715] p-6 text-[#f4f0e9] dark:bg-[#111513] sm:p-7 md:col-span-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-human">What changes?</p>
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="border-t border-white/18 pt-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-white/38">Without ALVIRA</p>
                    <p className="mt-3 font-display text-2xl leading-[1.05] tracking-[-0.02em] text-white">You ask for help, then spend part of the conversation explaining who you are, what you are doing, and what matters.</p>
                  </div>
                  <div className="border-t border-system/55 pt-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-system">With ALVIRA</p>
                    <p className="mt-3 font-display text-2xl leading-[1.05] tracking-[-0.02em] text-white">You can start closer to the real work because the important background is already available.</p>
                  </div>
                </div>
                <div className="mt-7 border-t border-white/10 pt-6">
                  <p className="max-w-3xl text-sm leading-6 text-white/58">You do not need to understand special file formats or AI systems to use it. ALVIRA's job is to help capture the important things, keep them current, and make them usable when you need them.</p>
                </div>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a href="/app" className="inline-flex min-h-11 items-center justify-center bg-[#f4f0e9] px-5 text-sm font-semibold text-[#191715] transition-opacity hover:opacity-85">Show ALVIRA what matters to me →</a>
                  <a href="/integrations" className="inline-flex min-h-11 items-center justify-center border border-white/20 px-5 text-sm font-semibold text-white/74 transition-colors hover:border-white/40 hover:text-white">See where I can use it →</a>
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
