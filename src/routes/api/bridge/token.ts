import { createFileRoute } from "@tanstack/react-router";
import { BridgeExchangeError, exchangeBridgeAuthorizationCode, logBridgeError } from "~/lib/bridge";

type TokenRequest = {
  grant_type?: string;
  code?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  code_verifier?: string;
};

async function readTokenRequest(request: Request): Promise<TokenRequest> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = new URLSearchParams(await request.text());
    return Object.fromEntries(form.entries()) as TokenRequest;
  }
  return await request.json() as TokenRequest;
}

export const Route = createFileRoute("/api/bridge/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await readTokenRequest(request);
          if (body.grant_type !== "authorization_code" || !body.code || !body.client_id || !body.redirect_uri) {
            return Response.json({ error: "invalid_request" }, { status: 400 });
          }

          const result = await exchangeBridgeAuthorizationCode(
            body.code,
            body.client_id,
            body.redirect_uri,
            { clientSecret: body.client_secret || null, codeVerifier: body.code_verifier || null },
          );
          const expiresIn = Math.max(0, Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000));
          return Response.json({
            access_token: result.accessToken,
            token_type: "Bearer",
            expires_in: expiresIn,
            expires_at: result.expiresAt,
            scope: result.scope,
          }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          logBridgeError("token", error);
          if (error instanceof BridgeExchangeError) {
            const status = error.code === "invalid_client" ? 401 : 400;
            return Response.json({ error: error.code === "invalid_client" ? "invalid_client" : "invalid_grant" }, { status });
          }
          return Response.json({ error: "server_error" }, { status: 502 });
        }
      },
    },
  },
});
