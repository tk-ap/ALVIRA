import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getCurrentUser } from "./-auth";

export const Route = createFileRoute("/owner-service-pilot")({
  head: () => ({ meta: [{ title: "Marketing Intelligence Pilot — ALVIRA Owner" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: OwnerServicePilot,
});

function OwnerServicePilot() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  useEffect(() => {
    let active = true;
    getCurrentUser().then(user => {
      if (!active) return;
      const email = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com").trim().toLowerCase();
      if (!user) { navigate({ to: "/login" }); return; }
      if (user.email.toLowerCase() !== email) { navigate({ to: "/dashboard" }); return; }
      setAuthorized(true);
    }).catch(() => navigate({ to: "/dashboard" }));
    return () => { active = false; };
  }, [navigate]);
  if (!authorized) return <p className="p-8 text-sm text-warm-gray-dark">Checking owner access…</p>;
  const steps = [
    ["Discover", "Select one independent boutique or similarly bounded business; document the specific conversion question."],
    ["Scope and consent", "Confirm public-site analysis, approved client inputs, exclusions, fixed deliverables and human review."],
    ["Inspect", "Marketing Engineering researches positioning, mobile flow, competitor messages and customer journey; capture citations and screenshots."],
    ["Deliver", "Provide a prioritized findings report, implementation-ready experiment and evidence references."],
    ["Learn", "Record delivery time, direct cost, client feedback and whether the client would pay for a repeat engagement."],
  ];
  return <div className="min-h-dvh flex flex-col bg-mineral text-ink dark:bg-ink dark:text-mineral">
    <Header />
    <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <a href="/dashboard" className="font-mono text-xs text-system-dark dark:text-system">← Owner dashboard</a>
      <p className="mt-10 font-mono text-xs uppercase tracking-[.2em] text-system-dark dark:text-system">Commercial experiment / proposal only</p>
      <h1 className="mt-3 font-display text-4xl sm:text-6xl tracking-tight">Marketing Intelligence Sprint</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-warm-gray-dark dark:text-warm-gray">A fixed-scope, human-reviewed seven-day research and conversion-improvement service. Sell a useful outcome before productizing another feature.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[[ "Illustrative offer", "$300 pilot" ],[ "Duration", "7 days" ],[ "State", "Idea approved · not launched" ]].map(([a,b]) => <div key={a} className="border border-ink/15 dark:border-mineral/20 p-5"><p className="font-mono text-xs uppercase text-warm-gray-dark dark:text-warm-gray">{a}</p><p className="mt-2 font-display text-2xl">{b}</p></div>)}
      </div>
      <section className="mt-12">
        <h2 className="font-display text-3xl">What the client receives</h2>
        <p className="mt-3 leading-7 text-warm-gray-dark dark:text-warm-gray">A concise, evidence-linked assessment of website messaging, positioning and mobile conversion friction; three prioritized recommendations; and one measurable, implementation-ready experiment. No guaranteed revenue or conversion gains.</p>
      </section>
      <section className="mt-12">
        <h2 className="font-display text-3xl">Pilot delivery sequence</h2>
        <div className="mt-5 divide-y divide-ink/15 dark:divide-mineral/20 border-y border-ink/15 dark:border-mineral/20">
          {steps.map(([label,detail],i) => <div key={label} className="grid gap-3 py-5 sm:grid-cols-[2rem_10rem_1fr]"><span className="font-mono text-sm text-system-dark dark:text-system">{String(i+1).padStart(2,"0")}</span><h3 className="font-medium">{label}</h3><p className="text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">{detail}</p></div>)}
        </div>
      </section>
      <section className="mt-12 border-l-2 border-system p-5 bg-system-soft/15">
        <h2 className="font-display text-2xl">Operating boundaries</h2>
        <p className="mt-3 text-sm leading-7">AgentOS coordinates accountable execution. ALVIRA stores approved, client-specific context only when appropriate. LEDGATo applies to configured consequential actions. Human review precedes delivery; never connect client accounts, publish changes, spend money or send outreach without explicit authority.</p>
      </section>
      <section className="mt-12">
        <h2 className="font-display text-3xl">Go / no-go evidence</h2>
        <p className="mt-3 leading-7 text-warm-gray-dark dark:text-warm-gray">Validate willingness to pay, report accuracy, customer usefulness, turnaround time, true delivery cost including human labor and repeatability. The $300 figure is a hypothesis, not a live checkout or validated price.</p>
      </section>
      <a className="mt-10 inline-block border border-ink/30 px-5 py-3 font-mono text-xs dark:border-mineral/30" href="https://ashwood-info.vercel.app/workspace/#runway">Open ASHWOOD revenue runway ↗</a>
    </main>
    <TrustFooter />
  </div>;
}
