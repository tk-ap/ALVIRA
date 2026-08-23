import { createFileRoute } from "@tanstack/react-router";
import { bridgePublicUrl, getBridgeUserFromSession, issueBridgeAuthorizationCode } from "~/lib/bridge";

export const Route = createFileRoute("/api/bridge/authorize")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const returnTo = url.searchParams.get("return_to") || `${bridgePublicUrl()}/api/auth/callback`;
        const allowed = `${bridgePublicUrl()}/api/auth/callback`;
        if (returnTo !== allowed) return Response.json({ error: "Invalid redirect URI." }, { status: 400 });

        const user = await getBridgeUserFromSession();
        if (!user) {
          const loginUrl = new URL("/login", url.origin);
          loginUrl.searchParams.set("next", `/bridge/connect?return_to=${encodeURIComponent(returnTo)}`);
          return Response.redirect(loginUrl, 302);
        }

        const { code } = await issueBridgeAuthorizationCode(user.id, returnTo);
        const callback = new URL(returnTo);
        callback.searchParams.set("code", code);
        return Response.redirect(callback, 302);
      },
    },
  },
});
