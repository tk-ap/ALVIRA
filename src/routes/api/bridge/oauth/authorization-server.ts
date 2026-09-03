import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bridge/oauth/authorization-server")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return Response.json({
          issuer: origin,
          authorization_endpoint: `${origin}/api/bridge/authorize`,
          token_endpoint: `${origin}/api/bridge/token`,
          registration_endpoint: `${origin}/api/bridge/register`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
          scopes_supported: ["context:read", "profile:read"],
        }, { headers: { "Cache-Control": "public, max-age=300" } });
      },
    },
  },
});
