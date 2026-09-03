import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bridge/oauth/resource-metadata")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return Response.json({
          resource: `${origin}/api/bridge/mcp`,
          resource_name: "ALVIRA Bridge",
          authorization_servers: [origin],
          scopes_supported: ["context:read", "profile:read"],
          bearer_methods_supported: ["header"],
        }, { headers: { "Cache-Control": "public, max-age=300" } });
      },
    },
  },
});
