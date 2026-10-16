import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

const REQUEST_HREF =
  "mailto:alvira@agentmail.to?subject=Website%20review%20pilot&body=Website%3A%20%0AThe%20one%20goal%20the%20site%20should%20serve%3A%20";

export const Route = createFileRoute("/website-review")({
  head: () => ({
    meta: [
      { title: "Website Marketing Engineering Review — pilot by request · ALVIRA" },
      {
        name: "description",
        content:
          "A human-reviewed review of your website's discoverability, link previews and first-screen messaging, tied to one goal. Pilot by request; the first pilots are free.",
      },
    ],
  }),
  component: WebsiteReview,
});

const receives = [
  ["Evidence-linked findings", "What search engines, link previews and a first-time visitor on a phone actually see, with the page and check behind each finding."],
  ["Three prioritized recommendations", "Ranked by what they do for the one goal you name, not by a generic checklist."],
  ["One measurable experiment", "A single change to try, the number to watch, and how long to run it."],
  ["Optional fixes", "If you grant repository access, draft fixes for the technical findings. Nothing is merged or published without you."],
];

const steps = [
  ["Goal", "A short ALVIRA interview: the one goal the site should serve, who it is for, and what is off-limits."],
  ["Review", "A read-only review of your public site: crawlability, sitemap, link previews, structured data, broken links, and the first screen on a phone."],
  ["Report", "A human-reviewed report within 7 days. You decide what to act on."],
];

function WebsiteReview() {
  return (
    <div className="min-h-screen bg-mineral text-ink dark:bg-ink dark:text-mineral">
      <Header />
      <main id="main-content">
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-24 sm:pt-32">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-system-dark dark:text-system">Pilot · by request</p>
          <h1 className="mt-7 max-w-5xl font-display text-5xl leading-[0.94] tracking-[-0.045em] sm:text-7xl">
            Website Marketing Engineering Review
          </h1>
          <p className="mt-8 max-w-3xl text-lg leading-8 text-warm-gray-dark dark:text-warm-gray">
            A human-reviewed look at whether your website is easy to find, previews well when shared, and tells a first-time visitor what to do — measured against the one goal you care about.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href={REQUEST_HREF} className="border border-ink bg-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-mineral dark:border-mineral dark:bg-mineral dark:text-ink">
              Request a pilot
            </a>
            <p className="text-sm text-warm-gray-dark dark:text-warm-gray">The first pilots are free.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="font-display text-3xl">What you get</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {receives.map(([title, detail]) => (
              <div key={title} className="border border-ink/15 p-5 dark:border-mineral/20">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="font-display text-3xl">How it works</h2>
          <ol className="mt-6 divide-y divide-ink/15 border-y border-ink/15 dark:divide-mineral/20 dark:border-mineral/20">
            {steps.map(([label, detail], i) => (
              <li key={label} className="grid gap-2 py-5 sm:grid-cols-[2.5rem_8rem_1fr]">
                <span className="font-mono text-sm text-system-dark dark:text-system">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-semibold">{label}</span>
                <span className="text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">{detail}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="border-l-2 border-system bg-system-soft/15 p-5">
            <h2 className="font-display text-2xl">Free for the first pilots</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7">
              We are taking a small number of pilots at no cost and will ask for honest feedback on what was useful. We never log in to your accounts, publish changes, spend money or contact anyone on your behalf without your explicit permission.
            </p>
            <a href={REQUEST_HREF} className="mt-5 inline-block border border-ink/30 px-5 py-3 font-mono text-xs uppercase tracking-[0.12em] dark:border-mineral/30">
              Request a pilot
            </a>
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
