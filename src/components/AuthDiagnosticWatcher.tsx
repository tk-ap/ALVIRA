import { useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { checkAuthDiagnostic } from "~/routes/-auth-diagnostic";

export const AUTH_DIAGNOSTIC_STORAGE_KEY = "alvira_auth_diagnostic_v1";
export const AUTH_PROBE_COOKIE = "alvira_auth_probe";

export type AuthDiagnosticServerSnapshot = {
  probeCookiePresent: boolean;
  probeMatches: boolean;
  sessionCookiePresent: boolean;
  sessionValid: boolean;
  checkedAt: string;
};

export type AuthDiagnosticRecord = {
  probeId: string;
  afterLogin: AuthDiagnosticServerSnapshot;
  clientProbeAfterLogin: boolean;
  last?: AuthDiagnosticServerSnapshot;
  clientProbeLast?: boolean;
  result?: "retained" | "session_dropped" | "cookie_context_cleared" | "session_blocked_immediately";
  updatedAt: string;
};

function clientHasProbe(probeId: string): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === `${AUTH_PROBE_COOKIE}=${probeId}`);
}

function readRecord(): AuthDiagnosticRecord | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_DIAGNOSTIC_STORAGE_KEY);
    return raw ? JSON.parse(raw) as AuthDiagnosticRecord : null;
  } catch {
    return null;
  }
}

function describe(record: AuthDiagnosticRecord): string {
  if (record.result === "session_dropped") {
    return "Session cookie was accepted after login, then stopped being sent while the companion cookie remained.";
  }
  if (record.result === "cookie_context_cleared") {
    return "Login succeeded, then both ALVIRA cookies disappeared after navigation. This browser session is clearing or isolating site cookies.";
  }
  if (record.result === "session_blocked_immediately") {
    return "The companion cookie arrived, but the secure HttpOnly session cookie was unavailable immediately after login.";
  }
  if (record.result === "retained") {
    return "Session cookie retained normally.";
  }
  return "Checking ALVIRA session persistence…";
}

export function AuthDiagnosticWatcher() {
  const location = useLocation();
  const [record, setRecord] = useState<AuthDiagnosticRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    const existing = readRecord();
    if (!existing) return;

    const run = async () => {
      try {
        const last = await checkAuthDiagnostic({ data: { probeId: existing.probeId } }) as AuthDiagnosticServerSnapshot;
        const clientProbeLast = clientHasProbe(existing.probeId);
        let result: AuthDiagnosticRecord["result"];

        if (!existing.afterLogin.sessionValid) {
          result = (existing.afterLogin.probeCookiePresent || existing.clientProbeAfterLogin)
            ? "session_blocked_immediately"
            : "cookie_context_cleared";
        } else if (last.sessionValid) {
          result = "retained";
        } else if (last.probeCookiePresent || clientProbeLast) {
          result = "session_dropped";
        } else {
          result = "cookie_context_cleared";
        }

        const next: AuthDiagnosticRecord = {
          ...existing,
          last,
          clientProbeLast,
          result,
          updatedAt: new Date().toISOString(),
        };
        sessionStorage.setItem(AUTH_DIAGNOSTIC_STORAGE_KEY, JSON.stringify(next));
        if (!cancelled) setRecord(next);

        if (result === "retained") {
          window.setTimeout(() => {
            try { sessionStorage.removeItem(AUTH_DIAGNOSTIC_STORAGE_KEY); } catch {}
            if (!cancelled) setRecord(null);
          }, 5000);
        }
      } catch {
        if (!cancelled) setRecord(existing);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (!record || record.result === "retained") return null;

  return (
    <aside className="fixed bottom-4 left-4 z-[96] max-w-[min(420px,calc(100vw-2rem))] rounded-xl border border-human/45 bg-ink/95 px-4 py-3 text-mineral shadow-2xl backdrop-blur-xl" aria-live="polite">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-human-dark">Auth diagnostic</div>
      <p className="mt-1 text-xs leading-5 text-gray-200">{describe(record)}</p>
      <div className="mt-2 font-mono text-[10px] text-gray-400">
        after login: session {record.afterLogin.sessionValid ? "yes" : "no"} · probe {record.clientProbeAfterLogin ? "yes" : "no"}
        {record.last ? ` · now: session ${record.last.sessionValid ? "yes" : "no"} · probe ${record.clientProbeLast ? "yes" : "no"}` : ""}
      </div>
      <button type="button" onClick={() => { try { sessionStorage.removeItem(AUTH_DIAGNOSTIC_STORAGE_KEY); } catch {} setRecord(null); }} className="mt-2 font-mono text-[10px] uppercase tracking-wide text-gray-400 underline underline-offset-4 hover:text-white">
        Dismiss
      </button>
    </aside>
  );
}
