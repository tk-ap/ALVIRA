import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getSessionByToken } from "~/db";
import { ensureFoundingBetaSchema } from "~/lib/founding-beta";

const SESSION_COOKIE = "alvira_session";
const PROBE_COOKIE = "alvira_auth_probe";
const PROBE_MAX_AGE = 10 * 60;

function probeCookieOptions() {
  const domain = process.env.ALVIRA_SESSION_COOKIE_DOMAIN?.trim();
  return {
    path: "/",
    maxAge: PROBE_MAX_AGE,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
  };
}

export const beginAuthDiagnostic = createServerFn({ method: "POST" }).handler(async () => {
  await ensureFoundingBetaSchema();
  const probeId = crypto.randomUUID();
  setCookie(PROBE_COOKIE, probeId, probeCookieOptions());
  return { probeId };
});

export const checkAuthDiagnostic = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const probeId = String((input as { probeId?: string })?.probeId ?? "").trim();
    if (!probeId) throw new Error("Auth diagnostic probe ID is required.");
    return { probeId };
  })
  .handler(async ({ data }) => {
    let probeCookie: string | null = null;
    let sessionToken: string | null = null;
    try { probeCookie = getCookie(PROBE_COOKIE) ?? null; } catch {}
    try { sessionToken = getCookie(SESSION_COOKIE) ?? null; } catch {}

    let sessionValid = false;
    if (sessionToken) {
      const session = await getSessionByToken(sessionToken);
      sessionValid = !!session && new Date(session.expires_at).getTime() > Date.now();
    }

    const result = {
      probeCookiePresent: !!probeCookie,
      probeMatches: probeCookie === data.probeId,
      sessionCookiePresent: !!sessionToken,
      sessionValid,
      checkedAt: new Date().toISOString(),
    };

    console.info(
      `[auth-diagnostic] probe=${data.probeId.slice(0, 8)} probeCookie=${result.probeCookiePresent} probeMatches=${result.probeMatches} sessionCookie=${result.sessionCookiePresent} sessionValid=${result.sessionValid}`,
    );

    return result;
  });
