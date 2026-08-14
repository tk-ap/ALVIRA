import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
import { getHostedMeosProfile } from "./-auth";

export const Route = createFileRoute("/meos/site/$profileId")({
  component: HostedMeos,
});
type Hosted = {
  id: string;
  topic: string;
  portrait: Record<string, any> | null;
  updatedAt: string;
};
const sections = ["Today", "Portrait", "Purpose", "Compass", "Cycles"] as const;

function HostedMeos() {
  const { profileId } = Route.useParams();
  const [profile, setProfile] = useState<Hosted | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof sections)[number]>("Today");
  useEffect(() => {
    getHostedMeosProfile({ data: { profileId } })
      .then((p) => setProfile(p as Hosted))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Unable to open this MeOS."),
      );
  }, [profileId]);
  if (error)
    return (
      <>
        <Header />
        <main id="main-content" className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="text-2xl font-semibold">Private MeOS</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{error}</p>
          <a href="/login" className="mt-6 inline-block font-mono text-system">
            Sign in →
          </a>
        </main>
      </>
    );
  if (!profile)
    return (
      <>
        <Header />
        <main
          id="main-content"
          className="mx-auto max-w-3xl px-6 py-20 text-gray-500"
        >
          Opening your private MeOS…
        </main>
      </>
    );
  const p = profile.portrait ?? {};
  const purpose = p.purposeStatements ?? {};
  const content: Record<string, string> = {
    Portrait: p.portrait,
    Purpose: `${purpose.personal ?? ""}\n\n${purpose.professional ?? ""}`,
    Compass: p.decisionCompass,
    Cycles: p.cycles,
  };
  return (
    <div className="min-h-dvh">
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-6 py-14">
        <p className="font-mono text-xs uppercase tracking-[.22em] text-system">
          Private hosted MeOS
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {profile.topic}
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          A private companion generated from your owner-reviewed profile.
        </p>
        <nav className="my-10 flex flex-wrap gap-2 border-y border-gray-200 py-4 dark:border-gray-800">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-md px-3 py-2 font-mono text-xs ${tab === s ? "bg-system-dark text-white" : "text-gray-600 dark:text-gray-300"}`}
            >
              {s}
            </button>
          ))}
        </nav>
        {tab === "Today" ? (
          <Daily profileId={profile.id} prompt={p.dailyAlignment} />
        ) : (
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {tab}
            </h2>
            <div className="mt-6 whitespace-pre-line leading-8 text-gray-700 dark:text-gray-300">
              {content[tab] || "Not yet defined."}
            </div>
          </section>
        )}
        <p className="mt-16 border-t border-gray-200 pt-5 font-mono text-xs text-gray-500 dark:border-gray-800">
          Updated {new Date(profile.updatedAt).toLocaleDateString()}. Private by
          default; accessible only while signed in to the owning ALVIRA account.
        </p>
      </main>
      <TrustFooter />
    </div>
  );
}

function Daily({ profileId, prompt }: { profileId: string; prompt?: string }) {
  const key = `meos.daily.${profileId}`;
  const [action, setAction] = useState("");
  const [saved, setSaved] = useState(false);
  const save = () => {
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift({ date: new Date().toISOString(), action });
    localStorage.setItem(key, JSON.stringify(existing));
    setSaved(true);
    setAction("");
  };
  return (
    <section>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Today
      </h2>
      <p className="mt-4 italic leading-8 text-gray-600 dark:text-gray-400">
        {prompt ||
          "What is one durable action that would align today with what matters?"}
      </p>
      <label className="mt-8 block font-mono text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">
        One durable action
        <textarea
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setSaved(false);
          }}
          className="mt-2 min-h-32 w-full rounded-md border border-gray-300 bg-transparent p-4 font-sans text-base normal-case tracking-normal dark:border-gray-700"
        />
      </label>
      <button
        disabled={!action.trim()}
        onClick={save}
        className="mt-4 rounded-md bg-system-dark px-5 py-3 font-mono text-sm font-semibold text-white disabled:opacity-40"
      >
        Save privately on this device
      </button>
      {saved && <p className="mt-3 text-sm text-system">Saved.</p>}
    </section>
  );
}
