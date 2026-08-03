import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
});

const STRIPE_MONTHLY = "https://buy.stripe.com/5kQdR97xU0dJ3b30Ref7i02";
const STRIPE_ANNUAL = "https://buy.stripe.com/6oUaEX9G21hNfXP43qf7i06";

const freePlan = {
  name: "Free",
  price: "$0",
  cadence: "forever",
  description: "Everything you need to build your first AI profile.",
  features: [
    "1 AI profile",
    "3 guided interviews",
    "All 19 personal knowledge domains",
    "No credit card required",
  ],
  cta: "Start free",
  href: "/app",
} as const;

const lifetimePlan = {
  name: "Lifetime",
  price: "$399",
  cadence: "one-time",
  description: "Pay once — about two years of Pro. Keep your profile forever.",
  features: [
    "One permanent personal AI profile",
    "All 19 personal knowledge domains",
    "Up to 12 guided interviews in the first year",
    "Four AI-assisted refresh interviews per year after year one",
    "Unlimited manual edits",
    "Markdown and JSON exports",
    "Up to 50 saved versions",
    "Standard support",
  ],
  cta: "Go Lifetime",
  href: "https://buy.stripe.com/cNi6oH7xUbWr5jb2Zmf7i03",
} as const;

const faqs = [
  ["Can I switch plans?", "Yes. Upgrade or downgrade anytime."],
  [
    "What happens to my profiles if I cancel?",
    "You keep everything. Your Markdown files are yours forever.",
  ],
  [
    "Is there a team plan?",
    "ALVIRA Team is coming soon. Join the waitlist for early access.",
  ],
  [
    "What's the difference between Pro and Lifetime?",
    "Pro is for ongoing use with multiple profiles and unlimited interviews. Lifetime is a one-time $399 payment for a single permanent profile — it pays for itself in about two years vs. annual Pro. Best if you want one profile that lasts.",
  ],
] as const;

function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const proPlan = {
    name: "Pro",
    price: billing === "annual" ? "$192" : "$20",
    cadence: billing === "annual" ? "/year" : "/month",
    description: "For people who want their profile to keep growing with them.",
    features: [
      "Unlimited interviews",
      "Multiple profiles",
      "Markdown and JSON exports",
      "Version history",
      "Continuous profile updates",
    ],
    cta: "Get Pro",
    href: billing === "annual" ? STRIPE_ANNUAL : STRIPE_MONTHLY,
    featured: true,
    annual: billing === "annual",
  };

  const plans = [freePlan, proPlan, lifetimePlan];

  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main id="main-content">
        <section className="px-6 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <span className="inline-block rounded-md border border-emerald-200 px-3 py-1.5 font-mono text-xs tracking-wide text-emerald-700 dark:border-emerald-800 dark:text-emerald-400">
                &lt;pricing /&gt;
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                AI Profile Pricing
              </h1>
              <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
                Start free. Upgrade when ALVIRA becomes part of how you work.
              </p>
              <p className="mt-3 font-mono text-sm text-gray-500 dark:text-gray-400">
                For MeOS pricing, see the{" "}
                <a href="/meos" className="text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400">
                  MeOS page
                </a>
                .
              </p>
            </div>

            {/* Billing toggle */}
            <div className="mt-10 flex justify-center">
              <div role="radiogroup" aria-label="Billing period" className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  role="radio"
                  aria-checked={billing === "monthly"}
                  className={`rounded-md px-4 py-2 font-mono text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400 ${
                    billing === "monthly"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("annual")}
                  role="radio"
                  aria-checked={billing === "annual"}
                  className={`rounded-md px-4 py-2 font-mono text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400 ${
                    billing === "annual"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>

            <div className="mt-8 grid items-stretch gap-5 md:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative flex h-full flex-col border p-6 sm:p-8 ${
                    plan.featured
                      ? "border-emerald-600 bg-emerald-50/50 shadow-lg shadow-emerald-950/10 dark:border-emerald-500 dark:bg-emerald-950/20 dark:shadow-black/20"
                      : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/40"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-6 bg-emerald-700 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white dark:bg-emerald-600 dark:text-gray-950">
                      Most popular
                    </span>
                  )}
                  <div>
                    <h2 className="font-mono text-lg font-semibold">{plan.name}</h2>
                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{plan.cadence}</span>
                    </div>
                    {"annual" in plan && plan.annual && (
                      <span className="mt-2 inline-block font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                        Save 20% — $16/mo equivalent
                      </span>
                    )}
                    <p className="mt-4 min-h-12 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{plan.description}</p>
                    {plan.name === "Lifetime" && (
                      <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        Lifetime access applies to the profile features included with this plan for as long as ALVIRA continues to offer the AI Context Profile service. Your exported profile remains yours permanently.
                      </p>
                    )}
                  </div>
                  <ul className="mt-8 flex-1 space-y-3 border-t border-gray-200 pt-6 text-sm dark:border-gray-800">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 leading-relaxed">
                        <span className="font-mono text-emerald-700 dark:text-emerald-400" aria-hidden="true">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.name === "Lifetime" && (
                    <>
                      <p className="mt-6 border-t border-amber-200 pt-5 text-xs leading-relaxed text-gray-600 dark:border-amber-900/60 dark:text-gray-400">
                        MeOS, team workspaces, API access, additional profiles, third-party subscriptions, and future premium products are sold separately.
                      </p>
                      <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                        One-time payment. No automatic renewal. Lifetime access applies while ALVIRA operates the AI Context Profile service. Your exported files remain yours permanently. MeOS, additional profiles, future premium modules, API access, and third-party subscriptions are sold separately.
                      </p>
                    </>
                  )}
                  <a
                    href={plan.href}
                    {...(plan.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400 ${
                      plan.featured
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-gray-950 dark:hover:bg-emerald-400"
                        : "border border-gray-300 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-700 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gray-200"
                    }`}
                  >
                    {plan.cta}<span aria-hidden="true" className="ml-2">→</span>
                  </a>
                </article>
              ))}
            </div>

            <p className="mt-8 text-center font-mono text-xs text-gray-500 dark:text-gray-400">
              <strong>Pro</strong> is best for ongoing use, multiple profiles, and unlimited interviews.{' '}
              <strong>Lifetime</strong> is best for one permanent profile — it pays for itself in about two years of annual Pro.
            </p>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-gray-50 px-6 py-20 dark:border-gray-800 dark:bg-gray-900 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-4xl">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered.</h2>
            <div className="mt-10 divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 dark:focus-visible:outline-emerald-400 [&::-webkit-details-marker]:hidden">
                    {question}
                    <span className="font-mono text-xl font-normal text-emerald-700 transition-transform group-open:rotate-45 dark:text-emerald-400" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl pr-8 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 text-center sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to stop repeating yourself?</h2>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-400">Build once. Bring your context everywhere.</p>
            <a
              href="/app"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-gray-900 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gray-200 dark:focus-visible:outline-emerald-400"
            >
              Build my AI profile <span aria-hidden="true" className="ml-2">→</span>
            </a>
            <p className="mt-5 font-mono text-xs text-gray-500 dark:text-gray-400">Free to start · No credit card · Portable Markdown</p>
          </div>
        </section>
      </main>
    </div>
  );
}
