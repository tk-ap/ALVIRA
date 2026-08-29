import { createFileRoute } from "@tanstack/react-router";
import JSZip from "jszip";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getMeosProfiles, getCurrentUser, getEntitlements } from "./-auth";
import { trackEvent } from "./-tracking";
import { compileMeosKnowledge, type MeosPortrait } from "./-meosCompiler";
import { getMeosGraph } from "./-meosGraph";

export const Route = createFileRoute("/meos")({
  head: () => ({
    meta: [
      { title: "ALVIRA Reflect — Living Context Intelligence" },
      {
        name: "description",
        content:
          "Revisit, validate, and evolve the Context ALVIRA maintains with you.",
      },
    ],
  }),
  component: MeosPage,
});
type Profile = {
  id: string;
  topic: string;
  state: unknown;
  portrait: MeosPortrait | null;
  updated_at: string;
};
const tabs = [
  "Portrait",
  "Purpose",
  "Compass",
  "Daily",
  "Cycles",
  "Files",
] as const;

const frameworks = [
  "Astrology",
  "Human Design",
  "Enneagram",
  "Jungian archetypes",
  "Numerology",
  "Tree of Life",
  "Four Pillars / BaZi",
  "I Ching",
  "Chakra system",
];
const outputs = [
  "Your integrated portrait",
  "Personal and professional purpose statements",
  "Decision compass",
  "Daily alignment experience",
  "Major cycles and countdowns",
  "Downloadable reference documents",
  "Private, authenticated Reflect space",
];
const steps = [
  "Tell us where you are and where you want to go",
  "Capture your values, boundaries, goals, and decision patterns",
  "Optionally add symbolic frameworks (astrology, Human Design, Enneagram, etc.)",
  "Review and validate your integrated portrait",
  "Return to Reflect as your Context changes",
];

function MeosLanding({ canAccess = false }: { canAccess?: boolean }) {
  return (
    <div className="min-h-dvh">
      <Header />
      <main id="main-content">
        <section
          id="meos-access"
          className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28"
        >
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-system">
            &lt; alvira-reflect /&gt;
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
            Living context intelligence—for you.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">
            ALVIRA Reflect is where you revisit what ALVIRA understands, notice
            what has changed, challenge an assumption, and deepen the Context
            you carry forward into future AI interactions.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="/app?offering=meos"
              className="inline-flex items-center rounded-md bg-system-dark px-5 py-3 font-mono text-sm font-semibold text-white transition hover:bg-system focus:outline-none focus:ring-2 focus:ring-system focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950"
            >
              Start ALVIRA Reflect{" "}
              <span className="ml-3" aria-hidden="true">
                →
              </span>
            </a>
            <a
              href="/app?offering=meos&preview=true"
              className="inline-flex items-center border border-system text-system-dark dark:text-system rounded-md px-5 py-3 font-mono text-sm"
            >
              Try Reflect Preview — free{" "}
              <span className="ml-3" aria-hidden="true">
                →
              </span>
            </a>
            {canAccess && (
              <a
                href="#meos-access"
                className="inline-flex items-center rounded-md border border-system px-5 py-3 font-mono text-sm font-semibold text-system-dark dark:text-system"
              >
                Open ALVIRA Reflect{" "}
                <span className="ml-3" aria-hidden="true">
                  ↓
                </span>
              </a>
            )}
          </div>
        </section>

        <section
          className="border-y border-gray-200 dark:border-gray-800"
          aria-labelledby="process-heading"
        >
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <SectionLabel>01 / The process</SectionLabel>
            <h2
              id="process-heading"
              className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100"
            >
              A clearer picture, built with you.
            </h2>
            <div className="mt-10 grid gap-0 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, i) => (
                <div
                  key={step}
                  className="border-l border-gray-200 py-4 pl-5 dark:border-gray-800 sm:min-h-36"
                >
                  <span className="font-mono text-xs text-system">
                    0{i + 1}
                  </span>
                  <p className="mt-3 pr-5 text-sm leading-6 text-gray-700 dark:text-gray-300">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-4xl gap-14 px-6 py-16 text-center md:grid-cols-2">
          <div>
            <SectionLabel>02 / Optional lenses</SectionLabel>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Use the frameworks that help you see.
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-400">
              Bring the symbolic systems that resonate with you. They are
              optional lenses that enrich — never replace — your stated values,
              lived experience, professional evidence, and self-validation.
            </p>
          </div>
          <div className="flex flex-wrap content-start gap-2">
            {frameworks.map((framework) => (
              <span
                key={framework}
                className="border border-gray-300 px-3 py-2 font-mono text-xs text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                {framework}
              </span>
            ))}
          </div>
        </section>

        <section
          className="border-y border-gray-200 bg-system-soft/50 dark:border-gray-800 dark:bg-ink/30"
          aria-labelledby="outputs-heading"
        >
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <SectionLabel>03 / What you receive</SectionLabel>
            <h2
              id="outputs-heading"
              className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100"
            >
              A reference point for the decisions ahead.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {outputs.map((output) => (
                <div
                  key={output}
                  className="flex items-start gap-3 border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
                >
                  <span className="font-mono text-system" aria-hidden="true">
                    +
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {output}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="border-y border-gray-200 bg-system-soft/50 dark:border-gray-800 dark:bg-ink/30"
          aria-labelledby="pricing-heading"
        >
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <SectionLabel>04 / Keep it living</SectionLabel>
            <h2
              id="pricing-heading"
              className="mt-3 text-2xl font-semibold text-gray-900 dark:text-gray-100"
            >
              Reflect is part of ALVIRA.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400">
              ALVIRA Context captures and maintains what matters. Reflect is
              where you revisit that same understanding, notice what changed,
              challenge an assumption, and update the Context before putting it
              back to work.
            </p>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              <div className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
                <p className="font-mono text-xs uppercase tracking-wider text-system-dark dark:text-system">Free</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Reflect is included within the Free plan's single saved Context and guided-interview limits, so you can experience the complete Context loop before upgrading.</p>
              </div>
              <div className="border border-system/40 bg-white p-5 dark:bg-gray-950">
                <p className="font-mono text-xs uppercase tracking-wider text-system-dark dark:text-system">Pro</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Full ongoing Reflect across multiple saved Contexts, with unlimited interviewing and continuous Context updates.</p>
              </div>
              <div className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
                <p className="font-mono text-xs uppercase tracking-wider text-system-dark dark:text-system">Lifetime</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Core Reflect is included with the ALVIRA Context capabilities covered by your Lifetime plan.</p>
              </div>
              <div className="border border-iridescent/40 bg-white p-5 dark:bg-gray-950">
                <p className="font-mono text-xs uppercase tracking-wider text-iridescent-dark">Founding Beta</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">Full customer-facing Reflect access is included as part of the Founding Beta entitlement.</p>
              </div>
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Optional symbolic frameworks remain optional lenses for self-reflection. They are not required to use Reflect and do not define your plan or access.
            </p>
            <a
              href="/pricing"
              className="mt-8 inline-flex items-center rounded-md bg-system-dark px-5 py-3 font-mono text-sm font-semibold text-white transition hover:bg-system"
            >
              See ALVIRA plans <span className="ml-3" aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>
      <TrustFooter />
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">
      {children}
    </p>
  );
}
function MeosPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Portrait");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [canAccess, setCanAccess] = useState(false);
  const [isPreviewUser, setIsPreviewUser] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setAuthenticated(true);
        const entitlements: string[] = await getEntitlements().catch(() => [] as string[]);
        const reflectAuthorized = Boolean(
          user.isOwner ||
          ["free", "pro", "lifetime", "founding_beta"].includes(user.tier) ||
          entitlements.includes("meos_build"),
        );
        if (reflectAuthorized) {
          setCanAccess(true);
        }
        if (authenticated || user.id) {
          const result = await getMeosProfiles();
          setProfiles(result as Profile[]);
          setSelected((result[0] as Profile | undefined)?.id ?? "");
          setIsPreviewUser(!reflectAuthorized);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const profile = useMemo(
    () => profiles.find((p) => p.id === selected),
    [profiles, selected],
  );
  const portrait = profile?.portrait;
  const markdownFiles = useMemo(() => {
    if (!profile?.state) return {};
    const savedFiles = (
      profile.portrait as { markdownFiles?: Record<string, string> } | null
    )?.markdownFiles;
    if (savedFiles && Object.keys(savedFiles).length > 0) return savedFiles;
    return compileMeosKnowledge(
      profile.state as Parameters<typeof compileMeosKnowledge>[0],
      isPreviewUser ? getMeosGraph() : getMeosGraph(),
    ).allFiles;
  }, [profile, isPreviewUser]);
  const download = (name: string, content: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    trackEvent("export_performed", { kind: "meos-file", output: name });
  };
  const downloadAllMarkdown = async () => {
    if (!profile?.state) return;
    const files =
      markdownFiles && Object.keys(markdownFiles).length > 0
        ? markdownFiles
        : compileMeosKnowledge(
            profile.state as Parameters<typeof compileMeosKnowledge>[0],
            isPreviewUser ? getMeosGraph() : getMeosGraph(),
          ).allFiles;
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
      zip.file(name, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(profile.topic || "meos").replace(/\s+/g, "-").toLowerCase()}-knowledge-files.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    trackEvent("export_performed", { kind: "meos-bundle", output: "zip" });
  };
  if (loading)
    return (
      <>
        <Header />
        <main
          id="main-content"
          className="mx-auto max-w-4xl px-6 py-20 text-gray-500"
        >
          Loading ALVIRA Reflect...
        </main>
      </>
    );
  if (!authenticated || (!canAccess && profiles.length === 0))
    return <MeosLanding canAccess={canAccess} />;
  return (
    <div className="min-h-dvh">
      <Header />
      <main id="main-content" className="mx-auto max-w-4xl px-6 py-14">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-system">
              &lt; alvira-reflect /&gt;
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              ALVIRA Reflect
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Revisit, validate, and evolve the Context ALVIRA maintains with you.
            </p>
          </div>
          {profiles.length > 1 && (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="border border-gray-300 bg-transparent px-3 py-2 font-mono text-sm text-gray-800 dark:border-gray-700 dark:text-gray-200"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.topic}
                </option>
              ))}
            </select>
          )}
        </div>
        {isPreviewUser && (
          <div className="mb-8 rounded-lg border border-system/40 bg-system-soft p-5 text-sm leading-6 text-gray-800 dark:bg-ink/30 dark:text-gray-200">
            <strong>This is your ALVIRA Reflect Preview.</strong>{" "}
            Sign in to use Reflect as part of your ALVIRA plan and keep the understanding connected to your saved Context.
            <br />
            <a
              href="/pricing"
              className="mt-3 inline-block font-mono text-sm font-semibold text-system-dark underline dark:text-system"
            >
              See ALVIRA plans →
            </a>
          </div>
        )}
        {!profile ? (
          <div className="border border-gray-200 p-8 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              ALVIRA Reflect is ready to begin.
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Complete a Reflect interview and your integrated portrait will
              appear here.
            </p>
            <a
              href="/app?offering=meos"
              className="mt-6 inline-block font-mono text-sm text-system"
            >
              Start your interview →
            </a>
          </div>
        ) : (
          <>
            <nav className="mb-8 flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-800">
              {tabs
                .filter(
                  (t) => !isPreviewUser || t === "Portrait" || t === "Files",
                )
                .map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-3 font-mono text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-system ${tab === t ? "border-b-2 border-system text-system" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"}`}
                  >
                    {t}
                  </button>
                ))}
            </nav>
            {!portrait ? (
              <div className="border border-amber-300/50 p-6 text-gray-600 dark:text-gray-400">
                Your interview is saved. Your portrait is being prepared; return
                here after compilation.
              </div>
            ) : (
              <section className="max-w-[65ch] leading-8 text-gray-700 dark:text-gray-300">
                {tab === "Portrait" && (
                  <div className="space-y-5">
                    {portrait.portrait.split(/\n\n+/).map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                )}
                {tab === "Purpose" && (
                  <div className="space-y-6">
                    <Purpose
                      label="Personal purpose"
                      text={portrait.purposeStatements.personal}
                    />
                    <Purpose
                      label="Professional purpose"
                      text={portrait.purposeStatements.professional}
                    />
                  </div>
                )}
                {tab === "Compass" && (
                  <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Decision compass
                    </h2>
                    <p className="whitespace-pre-line">
                      {portrait.decisionCompass}
                    </p>
                  </div>
                )}
                {tab === "Daily" && (
                  <p className="italic">{portrait.dailyAlignment}</p>
                )}
                {tab === "Cycles" && (
                  <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Cycles & progression
                    </h2>
                    <p>{portrait.cycles}</p>
                  </div>
                )}
                {tab === "Files" && (
                  <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Your ALVIRA Reflect files
                    </h2>
                    <p className="mb-5 text-sm">
                      Download the source portrait and your interview state.
                    </p>
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={downloadAllMarkdown}
                        className="inline-flex items-center rounded-md bg-system-dark px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-white hover:bg-system focus:outline-none focus:ring-2 focus:ring-system focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                      >
                        Generate knowledge files
                      </button>
                    </div>
                    <div className="flex flex-col items-start gap-3">
                      {[
                        ["portrait.json", JSON.stringify(portrait, null, 2)],
                        [
                          "interview-state.json",
                          JSON.stringify(profile.state, null, 2),
                        ],
                        ...Object.entries(markdownFiles),
                      ].map(([name, body]) => (
                        <button
                          key={name}
                          onClick={() => download(name, body)}
                          className="font-mono text-sm text-system hover:text-system"
                        >
                          ↓ {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
function Purpose({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-l-2 border-system pl-5">
      <p className="mb-2 font-mono text-xs uppercase tracking-wider text-system">
        {label}
      </p>
      <p className="text-lg leading-8">{text || "Not yet defined."}</p>
    </div>
  );
}