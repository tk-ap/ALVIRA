import { createFileRoute } from "@tanstack/react-router";
import { BridgeExchangeError, bridgePublicUrl, getBridgeUserFromSession, isBridgeDestination, issueBridgeAuthorizationCode } from "~/lib/bridge";

export const Route = createFileRoute("/api/bridge/authorize")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const internalCallback = `${url.origin}/api/bridge/auth/callback`;
        const legacyCallback = `${bridgePublicUrl()}/api/auth/callback`;
        const returnTo = url.searchParams.get("return_to") || internalCallback;
        const allowed = new Set([internalCallback, legacyCallback]);
        if (!allowed.has(returnTo)) return Response.json({ error: "Invalid redirect URI." }, { status: 400 });

        const selectedProfileId = url.searchParams.get("profile_id");
        const destinationRaw = url.searchParams.get("destination");
        const destination = isBridgeDestination(destinationRaw) ? destinationRaw : null;

        // Canonical ALVIRA connections are deliberately narrow. Legacy Bridge
        // clients may omit these fields while they are being migrated.
        if (returnTo === internalCallback && (!selectedProfileId || !destination)) {
          return Response.json({ error: "Select a Context and destination before authorizing Bridge." }, { status: 400 });
        }
        if (destinationRaw && !destination) {
          return Response.json({ error: "Unsupported Bridge destination." }, { status: 400 });
        }

        const user = await getBridgeUserFromSession();
        if (!user) {
          const loginUrl = new URL("/login", url.origin);
          const connect = new URL("/bridge/connect", url.origin);
          connect.searchParams.set("return_to", returnTo);
          if (selectedProfileId) connect.searchParams.set("profile_id", selectedProfileId);
          if (destination) connect.searchParams.set("destination", destination);
          loginUrl.searchParams.set("returnTo", `${connect.pathname}${connect.search}`);
          return Response.redirect(loginUrl, 302);
        }

        try {
          const { code } = await issueBridgeAuthorizationCode(user.id, returnTo, selectedProfileId, destination);
          const callback = new URL(returnTo);
          callback.searchParams.set("code", code);
          return Response.redirect(callback, 302);
        } catch (error) {
          if (error instanceof BridgeExchangeError) {
            return Response.json({ error: error.code }, { status: 400 });
          }
          throw error;
        }
      },
    },
  },
});
