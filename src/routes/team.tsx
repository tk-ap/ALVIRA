// ── Team waitlist route ──
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { joinTeamWaitlist } from "./-teamWaitlist";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team Waitlist — ALVIRA" },
      {
        name: "description",
        content:
          "Join the ALVIRA Team early access waitlist. Capture your team's operational knowledge so every AI tool works with the same context.",
      },
    ],
  }),
  component: TeamPage,
});

const TEAM_SIZES = ["5–10", "11–25", "26–50", "51–100", "100+"];

const TEAM_OFFERS = [
  "Shared operational knowledge — processes, decisions, and context every AI tool can rely on",
  "Adaptive knowledge interviews for teams of 5–100 employees",
  "A living knowledge base that stays current as your team evolves",
  "Consistent context across ChatGPT, Claude, Gemini, and Cursor",
];

const inputClass =
  "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-emerald-500 dark:focus:border-emerald-400 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:focus-visible:ring-emerald-400/40";

const labelClass =
  "block font-mono text-xs text-emerald-500 dark:text-emerald-400 tracking-wide uppercase mb-1.5";

function TeamPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [useCase, setUseCase] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid work email.");
      return;
    }
    setSubmitting(true);
    try {
      await joinTeamWaitlist({ data: { name, email, company, teamSize, useCase } });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main id="main-content" className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="mx-auto w-full max-w-xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-system">&lt; team /&gt;</p>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              You're on the list.
            </h1>
            <p className="mt-5 text-base leading-8 text-gray-600 dark:text-gray-400">
              We'll reach out when the Team tier is ready.
            </p>
            <a
              href="/"
              className="mt-10 inline-flex items-center rounded-md border border-system px-5 py-3 font-mono text-sm font-semibold text-system-dark dark:text-system transition hover:bg-system-soft/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system"
            >
              Back to ALVIRA <span className="ml-3" aria-hidden="true">→</span>
            </a>
          </div>
        </main>
        <TrustFooter />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 sm:pt-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-system">&lt; team /&gt;</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
              ALVIRA for Teams
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600 dark:text-gray-400">
              Capture your team's operational knowledge so every AI tool works with the same context.
            </p>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 dark:text-gray-400">
              ALVIRA Team is an early access pilot for companies of 5–100 employees. Your team's
              processes, decisions, and domain knowledge get captured once — then every AI tool your
              team uses answers from the same, always-current source of truth.
            </p>
            <ul className="mt-8 space-y-3">
              {TEAM_OFFERS.map((offer) => (
                <li key={offer} className="flex items-start gap-3 text-sm leading-6 text-gray-700 dark:text-gray-300">
                  <span className="font-mono text-system flex-shrink-0" aria-hidden="true">+</span>
                  <span>{offer}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-mono text-xs text-gray-500 dark:text-gray-400">
              Pilot spots are limited. Early participants shape the product.
            </p>
          </div>
          <div className="lg:pt-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 sm:p-8"
              noValidate
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Join the waitlist</h2>
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                We'll reach out when the Team tier opens for early access.
              </p>
              <div className="mt-7 space-y-5">
                <div>
                  <label htmlFor="team-name" className={labelClass}>Full name</label>
                  <input
                    id="team-name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder="Alex Rivera"
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="team-email" className={labelClass}>Work email</label>
                  <input
                    id="team-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="alex@company.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="team-company" className={labelClass}>Company name</label>
                  <input
                    id="team-company"
                    type="text"
                    value={company}
                    onChange={(e) => { setCompany(e.target.value); setError(""); }}
                    placeholder="Acme Inc."
                    autoComplete="organization"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="team-size" className={labelClass}>Team size</label>
                  <select
                    id="team-size"
                    value={teamSize}
                    onChange={(e) => { setTeamSize(e.target.value); setError(""); }}
                    className={inputClass}
                  >
                    <option value="">Select team size</option>
                    {TEAM_SIZES.map((size) => (
                      <option key={size} value={size}>{size} people</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="team-use-case" className={labelClass}>What would you use ALVIRA for?</label>
                  <textarea
                    id="team-use-case"
                    value={useCase}
                    onChange={(e) => { setUseCase(e.target.value); setError(""); }}
                    placeholder="e.g. Onboarding new engineers, documenting our sales process, keeping support responses consistent..."
                    rows={4}
                    className={`${inputClass} resize-y`}
                  />
                </div>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-emerald-700 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:focus-visible:ring-emerald-400/50"
                >
                  {submitting ? "Joining..." : "Join the waitlist"}
                </button>
                <p className="text-center font-mono text-xs text-gray-500 dark:text-gray-400">
                  No spam. Only updates about the Team tier.
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
