import { createFileRoute } from "@tanstack/react-router";
import { BridgeExchangeError, registerBridgeOAuthClient } from "~/lib/bridge";

export const Route = createFileRoute("/api/bridge/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as {
            client_name?: string;
            redirect_uris?: string[];
            application_type?: string;
            token_endpoint_auth_method?: string;
            grant_types?: string[];
            response_types?: string[];
          };
          if (!Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
            return Response.json({ error: "invalid_client_metadata", error_description: "At least one redirect URI is required." }, { status: 400 });
          }
          if (body.token_endpoint_auth_method && body.token_endpoint_auth_method !== "none") {
            return Response.json({ error: "invalid_client_metadata", error_description: "Bridge public clients use PKCE and token_endpoint_auth_method=none." }, { status: 400 });
          }
          if (body.grant_types && !body.grant_types.includes("authorization_code")) {
            return Response.json({ error: "invalid_client_metadata", error_description: "authorization_code is required." }, { status: 400 });
          }
          if (body.response_types && !body.response_types.includes("code")) {
            return Response.json({ error: "invalid_client_metadata", error_description: "response_type code is required." }, { status: 400 });
          }

          const client = await registerBridgeOAuthClient({
            clientName: body.client_name || "AI app",
            redirectUris: body.redirect_uris,
            applicationType: body.application_type,
          });
          return Response.json({
            ...client,
            grant_types: ["authorization_code"],
            response_types: ["code"],
          }, { status: 201, headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          if (error instanceof BridgeExchangeError) {
            return Response.json({ error: "invalid_client_metadata", error_description: error.message }, { status: 400 });
          }
          return Response.json({ error: "server_error" }, { status: 502 });
        }
      },
    },
  },
});
