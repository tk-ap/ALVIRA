import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { BridgeExchangeError, bridgeClientId, exchangeBridgeAuthorizationCode, logBridgeError } from "~/lib/bridge";

const BRIDGE_TOKEN_COOKIE = "alvira_bridge_token";

function tokenCookieOptions(maxAge: number) {
  const domain = process.env.ALVIRA_SESSION_COOKIE_DOMAIN?.trim();
  return {
    path: "/",
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
  };
}

export const Route = createFileRoute("/api/bridge/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        if (!code) return Response.json({ error: "missing_code" }, { status: 400 });

        const secret = process.env.BRIDGE_CLIENT_SECRET?.trim();
        if (!secret) return Response.json({ error: "bridge_not_configured" }, { status: 503 });

        try {
          const redirectUri = `${url.origin}/api/bridge/auth/callback`;
          const token = await exchangeBridgeAuthorizationCode(code, bridgeClientId(), redirectUri, secret);
          const maxAge = Math.max(0, Math.floor((new Date(token.expiresAt).getTime() - Date.now()) / 1000));
          setCookie(BRIDGE_TOKEN_COOKIE, token.accessToken, tokenCookieOptions(maxAge));
          return Response.redirect(new URL("/bridge?connected=1", url.origin), 302);
        } catch (error) {
          // Never let an internal exchange failure surface as a bare, unhandled
          // 500 ("unhandled": true). Log it so a future failure is diagnosable,
          // and classify: known client rejections are 400s; anything else (a
          // missing env var or an outbound DB/HTTP failure) is a retryable 502.
          logBridgeError("callback", error);
          if (error instanceof BridgeExchangeError) {
            return Response.json({ error: "authorization_failed" }, { status: 400 });
          }
          return Response.json({ error: "exchange_unavailable" }, { status: 502 });
        }
      },
    },
  },
});
