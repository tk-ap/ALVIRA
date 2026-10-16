import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import {
  AGENTID_AUTHORIZE,
  AGENTID_SCOPES,
  agentIdConfig,
  callbackUrl,
  pkceChallenge,
  randomBase64Url,
  safeReturnTo,
} from "~/lib/agentid.server";

const TXN_COOKIE = "alvira_agentid_txn";

function transactionCookieOptions() {
  const domain = process.env.ALVIRA_SESSION_COOKIE_DOMAIN?.trim();
  return {
    path: "/",
    maxAge: 10 * 60,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    ...(domain ? { domain } : {}),
  };
}

export const Route = createFileRoute("/api/auth/agentid/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const { clientId } = agentIdConfig();
        const state = randomBase64Url();
        const nonce = randomBase64Url();
        const verifier = randomBase64Url(48);
        const redirectUri = callbackUrl(requestUrl.origin);
        const returnTo = safeReturnTo(requestUrl.searchParams.get("returnTo"));

        setCookie(
          TXN_COOKIE,
          Buffer.from(JSON.stringify({ state, nonce, verifier, redirectUri, returnTo })).toString("base64url"),
          transactionCookieOptions(),
        );

        const authorize = new URL(AGENTID_AUTHORIZE);
        authorize.searchParams.set("client_id", clientId);
        authorize.searchParams.set("redirect_uri", redirectUri);
        authorize.searchParams.set("response_type", "code");
        authorize.searchParams.set("scope", AGENTID_SCOPES);
        authorize.searchParams.set("state", state);
        authorize.searchParams.set("nonce", nonce);
        authorize.searchParams.set("code_challenge", await pkceChallenge(verifier));
        authorize.searchParams.set("code_challenge_method", "S256");
        return Response.redirect(authorize, 302);
      },
    },
  },
});
