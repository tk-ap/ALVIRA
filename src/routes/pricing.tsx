import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";
import { DossierOwnershipPositioning } from "~/components/DossierOwnershipPositioning";
import { TrustFooter } from "~/components/TrustFooter";
import { LIFETIME_PRICE, STRIPE_LINKS } from "~/lib/pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ALVIRA" },
      {
        name: "description",
        content:
          "Free, Pro, Lifetime, and limited Founding Beta access for ALVIRA Context and Reflect.",
      },
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
      description:
        "Build your first maintained ALVIRA Context and experience the full Context loop before deciding whether you need more.",
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
      description:
        "For people who want ALVIRA to keep learning, reflecting, updating, and carrying Context forward as part of how they work.",
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
      description:
        "The current core ALVIRA Context + Reflect feature set without a recurring subscription, for as long as ALVIRA continues to operate the service.",
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
    <div className="min-h-dvh bg-[#f4f0e9] text-[#191715] dark:bg-[#0b0e0e] dark:text-[#f4f0e9]">
      <Header />
      <main id="main-content">
        <section className="border-b border-[#191715]/10 px-6 pb-20 pt-16 dark:border-white/10 sm:px-8 sm:pb-24 sm:pt-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_0.28fr] lg:items-end lg:gap-20">
              <div className="max-w-4xl">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">
                  Pricing / ALVIRA Context Intelligence
                </p>
                <h1 className="mt-7 max-w-4xl font-display text-[clamp(3.2rem,6.4vw,6.25rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-[#191715] dark:text-[#f4f0e9]">
                  Start by seeing whether better Context actually helps.
                </h1>
                <p className="mt-8 max-w-2xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94] sm:text-lg sm:leading-8">
                  Free is enough to build, reflect on, and try your first maintained Context. Upgrade when you want ALVIRA to become an ongoing part of how you work with AI.
                </p>
              </div>

              <div className="border-l border-system/45 pl-5 lg:mb-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-system-dark dark:text-system">
                  One product loop
                </p>
                <p className="mt-3 text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">
                  Capture → Understand → Reflect → Update → Reuse
                </p>
              </div>
            </div>

            <div className="mt-14 flex items-center justify-between gap-6 border-t border-[#191715]/12 pt-6 dark:border-white/12">
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[#74685e] dark:text-white/38 sm:block">
                Choose how Pro is billed
              </p>
              <div
                role="radiogroup"
                aria-label="Pro billing period"
                className="inline-flex border border-[#191715]/18 dark:border-white/18"
              >
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  role="radio"
                  aria-checked={billing === "monthly"}
                  className={`min-h-11 px-5 font-mono text-xs uppercase tracking-[0.1em] transition-colors ${
                    billing === "monthly"
                      ? "bg-[#191715] text-[#f4f0e9] dark:bg-[#f4f0e9] dark:text-[#191715]"
                      : "text-[#74685e] hover:text-[#191715] dark:text-white/45 dark:hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("annual")}
                  role="radio"
                  aria-checked={billing === "annual"}
                  className={`min-h-11 border-l border-[#191715]/18 px-5 font-mono text-xs uppercase tracking-[0.1em] transition-colors dark:border-white/18 ${
                    billing === "annual"
                      ? "bg-[#191715] text-[#f4f0e9] dark:bg-[#f4f0e9] dark:text-[#191715]"
                      : "text-[#74685e] hover:text-[#191715] dark:text-white/45 dark:hover:text-white"
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>

            <div className="mt-8 grid items-stretch gap-px border border-[#191715]/12 bg-[#191715]/12 dark:border-white/12 dark:bg-white/12 md:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative flex h-full flex-col p-6 sm:p-8 ${
                    plan.featured
                      ? "bg-[#e9f1ed] dark:bg-[#10201d]"
                      : "bg-[#f4f0e9] dark:bg-[#0b0e0e]"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute left-6 top-0 -translate-y-1/2 bg-system px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white dark:text-[#08100e]">
                      Most flexible
                    </span>
                  )}

                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-system-dark dark:text-system">
                    {plan.name}
                  </p>

                  <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                    <span className="font-display text-5xl font-semibold leading-none tracking-[-0.04em] text-[#191715] dark:text-[#f4f0e9] sm:text-6xl">
                      {plan.price}
                    </span>
                    <span className="pb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#74685e] dark:text-white/38">
                      {plan.cadence}
                    </span>
                  </div>

                  {"annual" in plan && plan.annual && (
                    <span className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.12em] text-system-dark dark:text-system">
                      $16 / month equivalent
                    </span>
                  )}

                  <p className="mt-7 min-h-24 text-sm leading-6 text-[#5f554c] dark:text-[#b8ada1]">
                    {plan.description}
                  </p>

                  <ul className="mt-7 flex-1 space-y-3 border-t border-[#191715]/12 pt-6 text-sm dark:border-white/12">
                    {plan.features.map((feature) => (
                      <li key={feature} className="grid grid-cols-[auto_1fr] gap-3 leading-6 text-[#403a35] dark:text-[#d7cec4]">
                        <span className="font-mono text-system-dark dark:text-system" aria-hidden="true">
                          +
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={plan.href}
                    {...(plan.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    className={`mt-8 inline-flex min-h-12 items-center justify-between border px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
                      plan.featured
                        ? "border-system bg-system text-white hover:bg-system-dark dark:text-[#08100e]"
                        : "border-[#191715] text-[#191715] hover:bg-[#191715] hover:text-[#f4f0e9] dark:border-[#f4f0e9] dark:text-[#f4f0e9] dark:hover:bg-[#f4f0e9] dark:hover:text-[#191715]"
                    }`}
                  >
                    {plan.cta}
                    <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>

            <div className="mt-8 grid gap-4 border-t border-[#191715]/12 pt-6 dark:border-white/12 sm:grid-cols-[auto_1fr] sm:gap-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">
                Live / developing
              </p>
              <p className="max-w-4xl text-sm leading-6 text-[#6d6258] dark:text-[#a99f94]">
                Interviews, saved Contexts, Reflect, ongoing updates, current exports, Reuse, and the first Context History experience are in the product now. Context History is still being validated in beta. New premium services, broader integrations, team features, and API access should not be assumed to be included until they are explicitly listed here.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#191715]/10 bg-[#ebe4d8] px-6 py-16 dark:border-white/10 dark:bg-[#12100e] sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_0.28fr] lg:items-end lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">
                Limited Founding Beta
              </p>
              <h2 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[0.96] tracking-[-0.035em] text-[#191715] dark:text-[#f4f0e9] sm:text-5xl">
                Want to help shape ALVIRA instead of just buying it?
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-7 text-[#6d6258] dark:text-[#a99f94]">
                A small number of testers receive complimentary unlimited ALVIRA access, including full Reflect, for the life of their approved account. In return, we’re looking for people who will genuinely use the product during the beta and give candid feedback on the workflow, UI, relevance, effectiveness, confusion, and failures they encounter.
              </p>
              <p className="mt-4 max-w-3xl font-mono text-[10px] uppercase leading-5 tracking-[0.1em] text-[#74685e] dark:text-white/38">
                Applications are reviewed individually · separate founding entitlement · access is never granted automatically
              </p>
            </div>

            <a
              href="/founding-beta"
              className="inline-flex min-h-12 items-center justify-between border border-[#191715] px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#191715] transition-colors hover:bg-[#191715] hover:text-[#f4f0e9] dark:border-[#f4f0e9] dark:text-[#f4f0e9] dark:hover:bg-[#f4f0e9] dark:hover:text-[#191715]"
            >
              Apply for a slot
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system-dark dark:text-system">
              The simple distinction
            </p>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.96] tracking-[-0.035em] text-[#191715] dark:text-[#f4f0e9] sm:text-5xl">
              Which path fits?
            </h2>

            <div className="mt-12 grid gap-px border-y border-[#191715]/12 bg-[#191715]/12 dark:border-white/12 dark:bg-white/12 md:grid-cols-3">
              {[
                [
                  "01",
                  "Free",
                  "I want to experience Context + Reflect and find out whether maintained Context is useful to me.",
                ],
                [
                  "02",
                  "Pro / Lifetime",
                  "I already know I want the full ALVIRA loop as an ongoing tool; I’m choosing recurring vs. one-time payment.",
                ],
                [
                  "03",
                  "Founding Beta",
                  "I genuinely want to test the full product closely and help determine what makes it viable for more users.",
                ],
              ].map(([index, title, copy]) => (
                <article key={title} className="bg-[#f4f0e9] px-1 py-6 dark:bg-[#0b0e0e] md:px-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">
                    {index}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-medium tracking-[-0.02em] text-[#27231f] dark:text-[#ece4da]">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[#5f554c] dark:text-[#b8ada1]">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <DossierOwnershipPositioning compact />
      <TrustFooter />
    </div>
  );
}
