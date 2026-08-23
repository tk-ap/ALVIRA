import { createFileRoute } from "@tanstack/react-router";
import { getBridgePrincipal, getBridgeProfiles } from "~/lib/bridge";

function bearer(request: Request) {
  const value = request.headers.get("authorization") || "";
  if (!value.startsWith("Bearer ")) return null;
  return value.slice(7).trim() || null;
}

export const Route = createFileRoute("/api/bridge/profiles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = bearer(request);
        if (!token) return Response.json({ error: "missing_token" }, { status: 401 });
        const principal = await getBridgePrincipal(token);
        if (!principal || !principal.scope.split(" ").includes("profile:read")) {
          return Response.json({ error: "invalid_token" }, { status: 401 });
        }
        const profiles = await getBridgeProfiles(principal.user_id);
        return Response.json({ profiles });
      },
    },
  },
});
