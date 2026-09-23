import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { BetaExchangeGraphic } from "~/components/ImmersiveExplainers";
import { submitFoundingBetaApplication } from "~/routes/-beta";

export const Route = createFileRoute("/founding-beta")({
  head: () => ({
    meta: [
      { title: "Founding Beta — ALVIRA" },
      { name: "description", content: "Apply for one of a limited number of complimentary ALVIRA Founding Beta accounts." },
    ],
  }),
  component: FoundingBetaPage,
});

function FoundingBetaPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [aiTools, setAiTools] = useState("");
  const [frequency, setFrequency] = useState("");
  const [commitment, setCommitment] = useState("");
  const [motivation, setMotivation] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const result = await submitFoundingBetaApplication({ data: {
        name,
        email,
        useCase,
        aiTools,
        frequency,
        commitment,
        motivation,
        source: typeof window !== "undefined" && document.referrer.includes("ashwood") ? "ashwood" : "alvira",
      } });
      setMessage(result.alreadyApplied
        ? "You already have a pending application under this email. We’ll review it with the current cohort."
        : "Application received. Founding Beta slots are reviewed individually; applying does not automatically grant access.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Header />
      <main id="main-content">
        <section className="px-6 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <span className="inline-block rounded-md border border-system px-3 py-1.5 font-mono text-xs tracking-wide text-system-dark dark:border-system-dark dark:text-system">&lt;founding-beta /&gt;</span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Help make ALVIRA useful for more people.</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                Use the full product in real work. Show us what helps, what confuses you, and what breaks.
              </p>
              <BetaExchangeGraphic />
              <p className="mt-6 font-mono text-[10px] uppercase leading-5 tracking-[0.1em] text-gray-500 dark:text-gray-400">
                Limited cohort · reviewed individually · separate founding entitlement · access is never automatic
              </p>
            </div>

            <form onSubmit={submit} className="space-y-6 border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50 sm:p-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Apply for a slot</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">A little friction is intentional. We want to understand how you would actually use ALVIRA before offering one of the limited accounts.</p>
              </div>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wide text-gray-500">Name <span className="normal-case">(optional)</span></span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950" />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wide text-gray-500">Email</span>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950" />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wide text-gray-500">What would you want ALVIRA to help AI understand about you or your work?</span>
                <textarea required rows={4} value={useCase} onChange={(e) => setUseCase(e.target.value)} className="mt-2 w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950" />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wide text-gray-500">Which AI tools do you use now? <span className="normal-case">(optional)</span></span>
                <input value={aiTools} onChange={(e) => setAiTools(e.target.value)} placeholder="ChatGPT, Claude, Gemini, Cursor…" className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950" />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wide text-gray-500">How often do you use AI?</span>
                <select required value={frequency} onChange={(e) => setFrequency(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950">
                  <option value="">Choose one</option>
                  <option value="daily">Daily</option>
                  <option value="several-times-weekly">Several times a week</option>
                  <option value="weekly">About weekly</option>
                  <option value="occasionally">Occasionally</option>
                  <option value="new">I’m fairly new to using AI</option>
                </select>
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wide text-gray-500">Would you genuinely use ALVIRA during the beta and send feedback when something is useful, confusing, ineffective, or broken?</span>
                <textarea required rows={3} value={commitment} onChange={(e) => setCommitment(e.target.value)} placeholder="Tell us what kind of testing/feedback you can realistically commit to." className="mt-2 w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950" />
              </label>

              <label className="block">
                <span className="font-mono text-xs uppercase tracking-wide text-gray-500">Why are you interested in testing ALVIRA specifically?</span>
                <textarea required rows={3} value={motivation} onChange={(e) => setMotivation(e.target.value)} className="mt-2 w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-950" />
              </label>

              <button disabled={submitting} type="submit" className="w-full rounded-lg bg-system px-5 py-3.5 font-semibold text-white transition-colors hover:bg-system-dark disabled:opacity-50 dark:text-gray-950">
                {submitting ? "Submitting…" : "Apply for Founding Beta →"}
              </button>
              {message && <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300" role="status">{message}</p>}
              <p className="text-xs leading-relaxed text-gray-500">Submitting an application does not create an account or grant product access. If selected, your Founding Beta entitlement will be attached to the approved account.</p>
            </form>
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
