import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";

const STRIPE_LINKS = {
  pro: "https://buy.stripe.com/5kQdR97xU0dJ3b30Ref7i02",
  lifetime: "https://buy.stripe.com/8x24gz05s6C7bHzdE0f7i07",
};

const arguments_ = [
  {
    number: "01",
    title: "Stop repeating yourself.",
    body: "Every time you switch AI tools or start a new conversation, you're starting from zero. ALVIRA captures how you think, work, communicate, and decide — once — then gives every AI you use the context it needs from the first message. No more explaining your background, your preferences, or your constraints over and over.",
  },
  {
    number: "02",
    title: "Get help that fits you.",
    body: "Generic AI gives generic answers. ALVIRA profiles your communication style, values, boundaries, decision frameworks, and workflows — so every AI you use responds as if it already knows you. Your AI stops guessing and starts working with you, not at you.",
  },
  {
    number: "03",
    title: "Use and own it anywhere.",
    body: "Platform-native memory features lock your context inside one tool. ALVIRA generates portable Markdown files that work across ChatGPT, Claude, Gemini, Cursor, and future AI tools. Your knowledge is yours — not trapped inside someone else's ecosystem.",
  },
];

const useCases = [
  ["Developers use ALVIRA to...", "keep coding standards, architecture decisions, and working preferences available in every coding session."],
  ["Consultants use ALVIRA to...", "move between clients and AI tools without rebuilding their voice, process, or expertise from scratch."],
  ["Teams use ALVIRA to...", "turn scattered operational knowledge into durable context every teammate and AI agent can use."],
  ["Creators use ALVIRA to...", "make every draft sound like them, with their audience, values, and boundaries in view."],
];

export const Route = createFileRoute("/why-alvira")({ component: WhyAlviraPage });

function Arrow() {
  return <span aria-hidden="true"> →</span>;
}

function WhyAlviraPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-white dark:bg-gray-950">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="px-6 py-24 sm:px-8 sm:py-32 border-b border-gray-100 dark:border-gray-800">
          <div className="mx-auto max-w-4xl text-center">
            <span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">The case for context</span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">Why pay for ALVIRA?</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">The free tier shows you how it works. Pro makes it part of how you work.</p>
            <a href="#arguments" className="mt-10 inline-flex rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 font-mono text-sm text-gray-800 dark:text-gray-200 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors">See why <Arrow /></a>
          </div>
        </section>

        <section id="arguments" className="scroll-mt-20 bg-gray-50 dark:bg-gray-900 px-6 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-5xl space-y-20 sm:space-y-28">
            {arguments_.map((item, index) => (
              <article key={item.number} className={`grid gap-8 md:grid-cols-[120px_1fr] ${index > 0 ? "border-t border-gray-200 dark:border-gray-800 pt-20 sm:pt-28" : ""}`}>
                <div className="flex items-start gap-4 md:block">
                  <span className="font-mono text-3xl tabular-nums text-emerald-600 dark:text-emerald-400">{item.number}</span>
                  <span className="mt-4 hidden h-px w-12 bg-emerald-500 md:block" aria-hidden="true" />
                </div>
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">{item.title}</h2>
                  <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-400">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-20 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="mb-10 font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Already useful in the real world</p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map(([label, body]) => <div key={label}><h3 className="font-mono text-sm text-gray-900 dark:text-gray-100">{label}</h3><p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 dark:bg-gray-900 px-6 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14"><span className="font-mono text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Choose your plan</span><h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">Ready to stop repeating yourself?</h2><p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400">Keep your context working for you across every conversation, platform, and project.</p></div>
            <div className="grid gap-6 md:grid-cols-2">
              <PricingCard name="Pro" price="$20" suffix="/mo" description="For an AI profile that grows with how you work." features={["Unlimited interviews", "Multiple AI profiles", "Markdown & JSON exports", "Version history", "Continuous updates"]} href={STRIPE_LINKS.pro} />
              <PricingCard name="Lifetime" price="$399" suffix="" description="One payment. One permanent profile. No subscription." features={["Permanent personal profile", "All 19 knowledge domains", "Markdown & JSON exports", "Version history", "Standard support"]} href={STRIPE_LINKS.lifetime} featured />
            </div>
          </div>
        </section>

        <section className="bg-gray-950 px-6 py-20 text-center sm:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Start building your AI profile</h2>
          <a href="/app" className="mt-8 inline-flex rounded-lg bg-emerald-600 px-7 py-3.5 font-semibold text-white hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 transition-colors">Get started <Arrow /></a>
        </section>
      </main>
    </div>
  );
}

function PricingCard({ name, price, suffix, description, features, href, featured = false }: { name: string; price: string; suffix: string; description: string; features: string[]; href: string; featured?: boolean }) {
  return <div className={`flex flex-col rounded-lg border p-8 ${featured ? "border-emerald-500 dark:border-emerald-400" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-800`}>
    <div className="flex-1"><p className="font-mono text-sm text-emerald-700 dark:text-emerald-400">{name}</p><p className="mt-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{price}<span className="text-lg font-medium text-gray-600 dark:text-gray-400">{suffix}</span></p><p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p><ul className="mt-8 space-y-3 text-sm text-gray-600 dark:text-gray-400">{features.map((feature) => <li key={feature} className="flex gap-3"><span className="font-mono text-emerald-600 dark:text-emerald-400" aria-hidden="true">+</span><span>{feature}</span></li>)}</ul></div>
    <a href={href} target="_blank" rel="noopener noreferrer" className="mt-10 inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 px-6 py-3.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors">Get {name} <Arrow /></a>
  </div>;
}
