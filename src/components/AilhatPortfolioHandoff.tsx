import { useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  createAilhatHandoff,
  getAilhatHandoffOpportunity,
  type AilhatHandoffOpportunity,
} from "~/routes/-ailhatHandoff";

export function AilhatPortfolioHandoff() {
  const location = useLocation();
  const relevant = location.pathname === "/context" || location.pathname === "/meos" || location.pathname === "/integrations";
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [opportunity, setOpportunity] = useState<AilhatHandoffOpportunity | null>(null);
  const [profileId, setProfileId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!relevant) {
      setTarget(null);
      setOpportunity(null);
      return;
    }
    const frame = requestAnimationFrame(() => setTarget(document.querySelector<HTMLElement>("main#main-content")));
    getAilhatHandoffOpportunity()
      .then((result) => {
        setOpportunity(result);
        setProfileId(result.suggestedProfileId ?? "");
      })
      .catch(() => setOpportunity(null));
    return () => cancelAnimationFrame(frame);
  }, [relevant, location.pathname]);

  const selected = useMemo(
    () => opportunity?.profiles.find((profile) => profile.id === profileId) ?? null,
    [opportunity, profileId],
  );

  if (!relevant || !target || !opportunity?.eligible || opportunity.profiles.length === 0) return null;

  const handoff = async () => {
    if (!profileId) return;
    setBusy(true);
    setError("");
    try {
      const result = await createAilhatHandoff({ data: { profileId } });
      window.location.assign(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to prepare the ailhat handoff.");
      setBusy(false);
    }
  };

  return createPortal(
    <section className="mx-auto my-12 max-w-5xl border border-system/30 bg-system-soft/20 p-6 dark:bg-ink/35 sm:p-8" aria-labelledby="ailhat-handoff-title">
      <div className="grid gap-7 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-system-dark dark:text-system">A natural next question · ailhat</p>
          <h2 id="ailhat-handoff-title" className="mt-3 font-display text-3xl tracking-[-0.025em] text-ink dark:text-mineral">You may be managing a portfolio, not one project.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-warm-gray-dark dark:text-warm-gray">{opportunity.reason} ALVIRA can keep the underlying Context current. ailhat is designed to help decide which part of that portfolio deserves attention next.</p>
          <p className="mt-4 text-sm leading-6 text-warm-gray-dark dark:text-warm-gray"><strong className="text-ink dark:text-mineral">No re-onboarding:</strong> choose the ALVIRA Context you want to carry over. Nothing is transferred until you explicitly continue.</p>
        </div>
        <div className="border-l border-system/25 pl-5">
          <label className="font-mono text-[10px] uppercase tracking-[0.12em] text-warm-gray-dark dark:text-warm-gray">
            Context to carry
            <select value={profileId} onChange={(event) => setProfileId(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 font-sans text-sm normal-case tracking-normal text-ink dark:border-mineral/20 dark:text-mineral">
              {opportunity.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.topic || "Saved Context"}</option>)}
            </select>
          </label>
          {selected && <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-warm-gray-dark dark:text-warm-gray">Updated {new Date(selected.updated_at).toLocaleDateString()}</p>}
          <button type="button" onClick={() => void handoff()} disabled={busy} className="mt-5 w-full bg-ink px-4 py-3 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-mineral transition hover:opacity-90 disabled:opacity-50 dark:bg-mineral dark:text-ink">
            {busy ? "Preparing handoff…" : "Carry this Context into ailhat →"}
          </button>
          <p className="mt-3 text-xs leading-5 text-warm-gray-dark dark:text-warm-gray">The handoff link expires after 10 minutes and can be used once.</p>
          {error && <p className="mt-3 text-xs text-red-700 dark:text-red-300">{error}</p>}
        </div>
      </div>
    </section>,
    target,
  );
}
