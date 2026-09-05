import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie, getCookie } from "@tanstack/react-start/server";
import { getBridgePrincipal, getBridgeProfiles, revokeBridgeAccessToken } from "~/lib/bridge";
import { BRIDGE_STATUS_HEADERS, disconnectedLegacyBridgeContextResponse } from "~/lib/bridge-context-status";

const BRIDGE_TOKEN_COOKIE = "alvira_bridge_token";

function bridgeCookieDeleteOptions() {
  const domain = process.env.ALVIRA_SESSION_COOKIE_DOMAIN?.trim();
  return { path: "/", ...(domain ? { domain } : {}) };
}

export const Route = createFileRoute("/api/bridge/context")({
  server: {
    handlers: {
      GET: async () => {
        const token = getCookie(BRIDGE_TOKEN_COOKIE);
        if (!token) return disconnectedLegacyBridgeContextResponse();

        const principal = await getBridgePrincipal(token);
        if (!principal) {
          // A stale/expired compatibility cookie should not make the signed-in
          // Bridge UI look unauthorized forever. Clear it and report the normal
          // disconnected state; no Context data is returned.
          deleteCookie(BRIDGE_TOKEN_COOKIE, bridgeCookieDeleteOptions());
          return disconnectedLegacyBridgeContextResponse();
        }

        try {
          const profiles = await getBridgeProfiles(principal.user_id, principal.selected_profile_id);
          return Response.json({
            connected: true,
            profiles,
            connection: {
              selectedProfileId: principal.selected_profile_id,
              destination: principal.destination,
              scope: principal.scope,
              expiresAt: principal.expires_at,
              legacyWideAccess: !principal.selected_profile_id,
            },
          }, { headers: BRIDGE_STATUS_HEADERS });
        } catch {
          return Response.json(
            { connected: false, error: "context_unavailable" },
            { status: 502, headers: BRIDGE_STATUS_HEADERS },
          );
        }
      },
      DELETE: async () => {
        const token = getCookie(BRIDGE_TOKEN_COOKIE);
        if (!token) return Response.json({ connected: false, revoked: false }, { headers: BRIDGE_STATUS_HEADERS });
        const revoked = await revokeBridgeAccessToken(token);
        deleteCookie(BRIDGE_TOKEN_COOKIE, bridgeCookieDeleteOptions());
        return Response.json({ connected: false, revoked }, { headers: BRIDGE_STATUS_HEADERS });
      },
    },
  },
});
