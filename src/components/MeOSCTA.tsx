import { useEffect, useState } from "react";

// ── Tracking helper ──
// TODO: Replace console.log with real analytics (e.g., PostHog, Plausible, or custom endpoint)
function track(event: string, payload: Record<string, string>) {
  console.log(`[MeOSCTA] ${event}`, payload);
}

// ── Props ──
export interface MeOSCTAProps {
  /** Where the CTA is shown — used for tracking (e.g., "post-interview", "dashboard", "post-insight", "profile-milestone") */
  placement: string;
  /** Visual density. "default" = full card, "compact" = headline + one-liner, "inline" = single text link */
  variant?: "default" | "compact" | "inline";
  /** Show dismiss button. Default true; set false for permanent sections (e.g. homepage). */
  dismissible?: boolean;
}

// ── Component ──
export function MeOSCTA({
  placement,
  variant = "default",
  dismissible = true,
}: MeOSCTAProps) {
  const [dismissed, setDismissed] = useState(false);

  // ── Impression tracking on mount ──
  useEffect(() => {
    track("meos_cta_impression", { placement });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──
  const handlePrimaryClick = () => {
    track("meos_cta_click", { placement, action: "primary" });
  };

  const handleDismiss = () => {
    track("meos_cta_dismiss", { placement });
    setDismissed(true);
  };

  if (dismissed) return null;

  // ── Inline variant ──
  if (variant === "inline") {
    return (
      <a
        href="/meos"
        onClick={handlePrimaryClick}
        className="inline-flex items-center gap-1.5 font-mono text-sm text-system-dark hover:text-system-dark dark:text-system dark:hover:text-system transition-colors"
      >
        Go deeper with MeOS <span aria-hidden="true">→</span>
      </a>
    );
  }

  // ── Compact variant ──
  if (variant === "compact") {
    return (
      <div className="relative flex items-start gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-5 py-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Turn your AI profile into a personal operating system.
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            ALVIRA helps AI understand you. MeOS helps you apply what ALVIRA
            discovers.
          </p>
        </div>
        <a
          href="/meos"
          onClick={handlePrimaryClick}
          className="shrink-0 inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-system-dark hover:text-system-dark dark:text-system dark:hover:text-system transition-colors"
        >
          Explore MeOS <span aria-hidden="true">→</span>
        </a>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 font-mono text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  // ── Default (full card) ──
  return (
    <div className="relative rounded-xl border border-emerald-500/50 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-gray-950 px-6 py-6 sm:px-8 sm:py-7">
      {/* Eyebrow */}
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-system-dark dark:text-system">
        GO DEEPER WITH MEOS
      </p>

      {/* Headline */}
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
        Turn your AI profile into a personal operating system.
      </h3>

      {/* Body */}
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400">
        ALVIRA helps AI understand you. MeOS helps you understand and apply what
        ALVIRA discovers — across your decisions, direction, work, and daily
        life.
      </p>

      {/* CTA */}
      <a
        href="/meos"
        onClick={handlePrimaryClick}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-system-dark px-5 py-3 font-mono text-sm font-semibold text-white hover:bg-system-dark dark:hover:bg-system focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-system transition-colors duration-200"
      >
        Explore MeOS
        <span aria-hidden="true">→</span>
      </a>

      {/* Dismiss */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 font-mono text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          Not now
        </button>
      )}
    </div>
  );
}
