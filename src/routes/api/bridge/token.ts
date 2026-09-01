import { createFileRoute } from "@tanstack/react-router";
import { BridgeExchangeError, bridgeClientId, exchangeBridgeAuthorizationCode, logBridgeError } from "~/lib/bridge";

export const Route = createFileRoute("/api/bridge/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as {
            grant_type?: string;
            code?: string;
            client_id?: string;
            client_secret?: string;
            redirect_uri?: string;
          };
          if (body.grant_type !== "authorization_code" || !body.code || !body.client_id || !body.client_secret || !body.redirect_uri) {
            return Response.json({ error: "invalid_request" }, { status: 400 });
          }
          if (body.client_id !== bridgeClientId()) return Response.json({ error: "invalid_client" }, { status: 401 });
          const result = await exchangeBridgeAuthorizationCode(body.code, body.client_id, body.redirect_uri, body.client_secret);
          return Response.json({
            access_token: result.accessToken,
            token_type: "Bearer",
            expires_at: result.expiresAt,
            scope: result.scope,
          });
        } catch (error) {
          // Log and classify: known client rejections remain the OAuth
          // invalid_grant; unexpected failures (missing env var, outbound
          // DB/HTTP failure) are logged and returned as a server_error rather
          // than surfacing as a bare unhandled error.
          logBridgeError("token", error);
          if (error instanceof BridgeExchangeError) {
            return Response.json({ error: "invalid_grant" }, { status: 400 });
          }
          return Response.json({ error: "server_error" }, { status: 502 });
        }
      },
    },
  },
});
