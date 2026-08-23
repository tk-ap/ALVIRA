import { createFileRoute } from "@tanstack/react-router";
import { bridgeClientId, exchangeBridgeAuthorizationCode } from "~/lib/bridge";

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
        } catch {
          return Response.json({ error: "invalid_grant" }, { status: 400 });
        }
      },
    },
  },
});
