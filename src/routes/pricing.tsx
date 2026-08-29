import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { LIFETIME_PRICE, STRIPE_LINKS } from "~/lib/pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ALVIRA" },
      { name: "description", content: "Free, Pro, Lifetime, and limited Founding Beta access for ALVIRA Context and Reflect." },
    ],
  }),
  component: Pricing,
});

const sharedPaidFeatures = [
  "Unlimited guided interviews",
  "Multiple saved Contexts",
  "Continuous Context updates",
  "Full ongoing ALVIRA Reflect",
  "Markdown, JSON, and TOON exports",
  "Reuse workspace for ChatGPT, Claude, Gemini, and Cursor",
  "Context History — currently in beta",
] as const;

function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Free",
      price: "$0",
      cadence: "forever",
      description: "Build your first maintained ALVIRA Context and experience the full Context loop before deciding whether you need more.",
      features: [
        "1 saved Context",
        "3 guided interviews",
        "Basic ALVIRA Reflect on your saved Context",
        "All current Context domains",
        "Markdown, JSON, and TOON export",
        "No credit card required",
      ],
      cta: "Start free",
      href: "/app",
      featured: false,
    },
    {
      name: "Pro",
      price: billing === "annual" ? "$192" : "$20",
      cadence: billing === "annual" ? "/year" : "/month",
      description: "For people who want ALVIRA to keep learning, reflecting, updating, and carrying Context forward as part of how they work.",
      features: [...sharedPaidFeatures],
      cta: "Get Pro",
      href: billing === "annual" ? STRIPE_LINKS.annual : STRIPE_LINKS.pro,
      featured: true,
      annual: billing === "annual",
    },
    {
      name: "Lifetime",
      price: LIFETIME_PRICE,
      cadence: "one-time",
      description: "The current core ALVIRA Context + Reflect feature set without a recurring subscription, for as long as ALVIRA continues to operate the service.",
      features: [
        ...sharedPaidFeatures,
        "One-time payment — no automatic renewal",
        "Future premium services, team plans, API access, and third-party subscriptions remain separate",
      ],
      cta: "Go Lifetime",
      href: STRIPE_LINKS.lifetime,
      featured: false,
    },
  ];

  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main id="main-content">
        <section className="px-6 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-3xl">
              <span className="inline-block rounded-md border border-system px-3 py-1.5 font-mono text-xs tracking-wide text-system-dark dark:border-system-dark dark:text-system">&lt;pricing /&gt;</span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Start by seeing whether better Context actually helps.</h1>
              <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">Free is enough to build, reflect on, and try your first maintained Context. Upgrade when you want ALVIRA to become an ongoing part of how you work with AI.</p>
              <p className="mt-3 font-mono text-sm text-gray-500 dark:text-gray-400">Context and Reflect are parts of the same ALVIRA loop: capture → understand → reflect → update → reuse.</p>
            </div>

            <div className="mt-10 flex">
              <div role="radiogroup" aria-label="Pro billing period" className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50">
                <button type="button" onClick={() => setBilling("monthly")} role="radio" aria-checked={billing === "monthly"} className={`rounded-md px-4 py-2 font-mono text-sm font-medium transition-colors ${billing === "monthly" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>Monthly</button>
                <button type="button" onClick={() => setBilling("annual")} role="radio" aria-checked={billing === "annual"} className={`rounded-md px-4 py-2 font-mono text-sm font-medium transition-colors ${billing === "annual" ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>Annual</button>
              </div>
            </div>

            <div className="mt-8 grid items-stretch gap-5 md:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.name} className={`relative flex h-full flex-col border p-6 sm:p-8 ${plan.featured ? "border-system bg-system-soft/50 shadow-lg shadow-ink/10 dark:border-system dark:bg-ink/20" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/40"}`}>
                  {plan.featured && <span className="absolute -top-3 left-6 bg-system-dark px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-system dark:text-gray-950">Most flexible</span>}
                  <h2 className="font-mono text-lg font-semibold">{plan.name}</h2>
                  <div className="mt-5 flex items-baseline gap-2"><span className="text-4xl font-bold tracking-tight">{plan.price}</span><span className="font-mono text-xs text-gray-500 dark:text-gray-400">{plan.cadence}</span></div>
                  {"annual" in plan && plan.annual && <span className="mt-2 inline-block font-mono text-[11px] text-system-dark dark:text-system">$16/month equivalent</span>}
                  <p className="mt-4 min-h-20 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{plan.description}</p>
                  <ul className="mt-7 flex-1 space-y-3 border-t border-gray-200 pt-6 text-sm dark:border-gray-800">{plan.features.map((feature) => <li key={feature} className="flex gap-3 leading-relaxed"><span className="font-mono text-system-dark dark:text-system" aria-hidden="true">✓</span><span>{feature}</span></li>)}</ul>
                  <a href={plan.href} {...(plan.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold ${plan.featured ? "bg-system text-white dark:text-gray-950" : "border border-gray-300 bg-gray-900 text-white dark:border-gray-700 dark:bg-gray-100 dark:text-gray-950"}`}>{plan.cta}<span aria-hidden="true" className="ml-2">→</span></a>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400"><strong className="text-gray-900 dark:text-gray-100">What is live vs. developing?</strong> Interviews, saved Contexts, Reflect, ongoing updates, current exports, Reuse, and the first Context History experience are in the product now. Context History is still being validated in beta. New premium services, broader integrations, team features, and API access should not be assumed to be included until they are explicitly listed here.</div>
          </div>
        </section>

        <section className="border-y border-system/20 bg-system-soft/30 px-6 py-16 dark:border-system/20 dark:bg-ink/20 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-system-dark dark:text-system">Limited Founding Beta</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Want to help shape ALVIRA instead of just buying it?</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-gray-600 dark:text-gray-400">A small number of testers receive complimentary unlimited ALVIRA access, including full Reflect, for the life of their approved account. In return, we’re looking for people who will genuinely use the product during the beta and give candid feedback on the workflow, UI, relevance, effectiveness, confusion, and failures they encounter.</p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Applications are reviewed individually. This is a separate founding entitlement, not “free Pro forever,” and access is never granted automatically from the form.</p>
            </div>
            <a href="/founding-beta" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-system px-6 py-3 font-semibold text-white dark:text-gray-950">Apply for a slot →</a>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <span className="font-mono text-xs uppercase tracking-wide text-system-dark dark:text-system">The simple distinction</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Which path fits?</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <article className="border-t border-gray-300 pt-5 dark:border-gray-700"><h3 className="font-semibold">Free</h3><p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">I want to experience Context + Reflect and find out whether maintained Context is useful to me.</p></article>
              <article className="border-t border-system pt-5"><h3 className="font-semibold">Pro / Lifetime</h3><p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">I already know I want the full ALVIRA loop as an ongoing tool; I’m choosing recurring vs. one-time payment.</p></article>
              <article className="border-t border-iridescent pt-5 dark:border-iridescent-dark"><h3 className="font-semibold">Founding Beta</h3><p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">I genuinely want to test the full product closely and help determine what makes it viable for more users.</p></article>
            </div>
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}