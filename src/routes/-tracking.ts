// ── First-party funnel tracking ──
//
// One tiny endpoint (`logEvent`) that the client calls fire-and-forget for every
// funnel event, plus client helpers that hand it a stable anonymous id.
//
// Privacy: no tracking cookies, no third-party SDKs — the only client identifier
// is an anonymous id kept in localStorage, and the only stored props are small
// non-sensitive aggregates (offering/tier/seeded/kind/output). Interview answers
// are never logged here. The privacy page copy ("no tracking cookies") stays true.
//
// Integrity guards (in db.recordEvent): every event must carry at least one
// identifier (user_id or anonymous_id) or it is dropped; per-identity writes are
// rate-limited (240/hour) — a blunt cap that limits buggy or repeating clients,
// not full hostile-bot protection; and rows older than 180 days are pruned at
// startup plus opportunistically once a day on event writes so the table cannot
// grow forever, even on a long-lived server.
//
// Fail-open: any tracking failure (network, DB, validation) is swallowed and the
// user's funnel action proceeds. Server-side insert failures log a warning only.

import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { getSessionByToken, recordEvent } from "~/db";

const SESSION_COOKIE = "alvira_session";
const ANON_ID_KEY = "alvira_anon_id";
const ANON_ID_MAX = 128;
const PROP_KEY_MAX = 40;
const PROP_VALUE_MAX = 200;
const PROP_COUNT_MAX = 12;

// ── Strict allowlist ──
// Core funnel events requested by the owner plus the MeOS CTA events that used to
// console.log-only. Anything else is rejected server-side.
export const ALLOWED_EVENTS = [
  "signup_completed",
  "interview_started",
  "interview_completed",
  "export_performed",
  "meos_cta_impression",
  "meos_cta_click",
  "meos_cta_dismiss",
  "opportunity_cue_impression",
  "opportunity_cue_open",
  "opportunity_cue_not_for_me",
  "opportunity_cue_dismiss",
  "opportunity_recap_impression",
  "opportunity_recap_dismiss",
  "opportunity_use",
  "opportunity_handoff_prefill",
] as const;

export type AllowedEvent = (typeof ALLOWED_EVENTS)[number];

const PROP_KEY_RE = /^[a-zA-Z0-9_]{1,40}$/;

// ── Sanitizers (pure; safe to run in the client validator) ──

function sanitizeAnonymousId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v || v.length > ANON_ID_MAX) return null;
  // UUIDs and the `anon-<base36>-<base36>` fallback both match this.
  if (!/^[a-zA-Z0-9._:-]{1,128}$/.test(v)) return null;
  return v;
}

function sanitizeProps(value: unknown): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > PROP_COUNT_MAX) return undefined; // bound: reject oversized payloads
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of entries) {
    if (!PROP_KEY_RE.test(k) || k.length > PROP_KEY_MAX) continue;
    if (typeof v === "string") {
      if (v.length > PROP_VALUE_MAX) continue;
      out[k] = v;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    } else if (typeof v === "boolean") {
      out[k] = v;
    }
    // objects / arrays / null / undefined are dropped
  }
  return out;
}

// ── Server function ──

export const logEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = (data ?? {}) as { name?: unknown; anonymousId?: unknown; props?: unknown };
    const name = d.name;
    if (typeof name !== "string" || !(ALLOWED_EVENTS as readonly string[]).includes(name)) {
      throw new Error("Unsupported event.");
    }
    return { name, anonymousId: sanitizeAnonymousId(d.anonymousId), props: sanitizeProps(d.props) };
  })
  .handler(async ({ data }) => {
    try {
      // Associate the logged-in user from the session cookie when present.
      let userId: string | null = null;
      try {
        const token = getCookie(SESSION_COOKIE) ?? null;
        if (token) {
          const session = await getSessionByToken(token);
          if (session && new Date(session.expires_at) > new Date()) userId = session.user_id;
        }
      } catch {
        // no session context available
      }
      // recordEvent applies the identifier requirement + per-identity rate limit
      // and never throws; a dropped event still returns ok so the funnel action
      // is never blocked by metrics hygiene.
      const persisted = await recordEvent(data.name, { userId, anonymousId: data.anonymousId, props: data.props });
      return { ok: true, dropped: !persisted };
    } catch (err) {
      // Tracking must never block the funnel action — drop the event, log a warning.
      console.warn(`[events] failed to persist "${data.name}"`, String(err));
      return { ok: true, dropped: true };
    }
  });

// ── Client helpers ──

/** Stable anonymous id in localStorage: crypto.randomUUID with a safe fallback. */
export function getOrCreateAnonId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(ANON_ID_KEY);
    if (existing && existing.length <= ANON_ID_MAX) return existing;
    let id: string;
    try {
      id = crypto.randomUUID();
    } catch {
      id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    }
    window.localStorage.setItem(ANON_ID_KEY, id);
    return id;
  } catch {
    return ""; // storage unavailable — event still fires with user_id when logged in
  }
}

/**
 * Fire-and-forget funnel event. Never throws and never blocks the caller —
 * failures are swallowed client-side too.
 */
export function trackEvent(name: AllowedEvent, props?: Record<string, string | number | boolean>): void {
  try {
    const anonymousId = getOrCreateAnonId();
    void logEvent({ data: { name, anonymousId, props } }).catch(() => {});
  } catch {
    // never block the funnel on tracking failures
  }
}
