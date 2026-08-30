import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";
import { getBridgePrincipal, getBridgeProfiles } from "~/lib/bridge";

const BRIDGE_TOKEN_COOKIE = "alvira_bridge_token";

export const Route = createFileRoute("/api/bridge/context")({
  server: {
    handlers: {
      GET: async () => {
        const token = getCookie(BRIDGE_TOKEN_COOKIE);
        if (!token) return Response.json({ connected: false, error: "not_connected" }, { status: 401 });

        const principal = await getBridgePrincipal(token);
        if (!principal) return Response.json({ connected: false, error: "not_connected" }, { status: 401 });

        try {
          const profiles = await getBridgeProfiles(principal.user_id);
          return Response.json({ connected: true, profiles });
        } catch {
          return Response.json({ connected: false, error: "context_unavailable" }, { status: 502 });
        }
      },
    },
  },
});
