import { createFileRoute } from "@tanstack/react-router";
import {
  BridgeExchangeError,
  bridgeClientId,
  bridgePublicUrl,
  getBridgeOAuthClient,
  getBridgeUserFromSession,
  isBridgeDestination,
  issueBridgeAuthorizationCode,
} from "~/lib/bridge";

function internalPath(url: URL) {
  return `${url.pathname}${url.search}`;
}

export const Route = createFileRoute("/api/bridge/authorize")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const requestedClientId = url.searchParams.get("client_id");

        // Standards-based OAuth path for external MCP clients. MCP 2026-07-28
        // clients should use a Client ID Metadata Document URL as client_id.
        // Older clients may still arrive with an ALVIRA DCR client id.
        if (requestedClientId && requestedClientId !== bridgeClientId()) {
          let client;
          try {
            client = await getBridgeOAuthClient(requestedClientId);
          } catch (error) {
            if (error instanceof BridgeExchangeError) {
              return Response.json({ error: "invalid_client", error_description: error.message }, { status: 400 });
            }
            throw error;
          }

          const redirectUri = url.searchParams.get("redirect_uri") || "";
          const responseType = url.searchParams.get("response_type");
          const codeChallenge = url.searchParams.get("code_challenge");
          const codeChallengeMethod = url.searchParams.get("code_challenge_method");
          const state = url.searchParams.get("state");
          const selectedProfileId = url.searchParams.get("profile_id");
          const resource = url.searchParams.get("resource");
          const expectedResource = `${url.origin}/api/bridge/mcp`;

          if (!client || !client.redirect_uris.includes(redirectUri)) {
            return Response.json({ error: "invalid_client" }, { status: 400 });
          }
          if (responseType !== "code") {
            return Response.json({ error: "unsupported_response_type" }, { status: 400 });
          }
          if (!codeChallenge || codeChallengeMethod !== "S256") {
            return Response.json({ error: "invalid_request", error_description: "PKCE S256 is required." }, { status: 400 });
          }
          if (resource && resource !== expectedResource) {
            return Response.json({ error: "invalid_target" }, { status: 400 });
          }

          const user = await getBridgeUserFromSession();
          if (!user) {
            const loginUrl = new URL("/login", url.origin);
            loginUrl.searchParams.set("returnTo", internalPath(url));
            return new Response(null, { status: 302, headers: { Location: loginUrl.toString() } });
          }

          if (!selectedProfileId) {
            const connect = new URL("/bridge/connect", url.origin);
            connect.searchParams.set("mode", "oauth");
            connect.searchParams.set("client_id", requestedClientId);
            connect.searchParams.set("client_name", client.client_name);
            connect.searchParams.set("redirect_uri", redirectUri);
            connect.searchParams.set("response_type", "code");
            connect.searchParams.set("code_challenge", codeChallenge);
            connect.searchParams.set("code_challenge_method", "S256");
            connect.searchParams.set("resource", expectedResource);
            if (state) connect.searchParams.set("state", state);
            return new Response(null, { status: 302, headers: { Location: connect.toString() } });
          }

          try {
            const { code } = await issueBridgeAuthorizationCode(
              user.id,
              redirectUri,
              selectedProfileId,
              "mcp",
              { clientId: requestedClientId, codeChallenge, codeChallengeMethod: "S256" },
            );
            const callback = new URL(redirectUri);
            callback.searchParams.set("code", code);
            if (state) callback.searchParams.set("state", state);
            callback.searchParams.set("iss", url.origin);
            return new Response(null, { status: 302, headers: { Location: callback.toString() } });
          } catch (error) {
            if (error instanceof BridgeExchangeError) {
              const callback = new URL(redirectUri);
              callback.searchParams.set("error", "access_denied");
              callback.searchParams.set("error_description", error.message);
              if (state) callback.searchParams.set("state", state);
              callback.searchParams.set("iss", url.origin);
              return new Response(null, { status: 302, headers: { Location: callback.toString() } });
            }
            throw error;
          }
        }

        // ALVIRA-owned/legacy Bridge path retained for compatibility.
        const internalCallback = `${url.origin}/api/bridge/auth/callback`;
        const legacyCallback = `${bridgePublicUrl()}/api/auth/callback`;
        const returnTo = url.searchParams.get("return_to") || internalCallback;
        const allowed = new Set([internalCallback, legacyCallback]);
        if (!allowed.has(returnTo)) return Response.json({ error: "Invalid redirect URI." }, { status: 400 });

        const selectedProfileId = url.searchParams.get("profile_id");
        const destinationRaw = url.searchParams.get("destination");
        const destination = isBridgeDestination(destinationRaw) ? destinationRaw : null;

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
          return new Response(null, { status: 302, headers: { Location: loginUrl.toString() } });
        }

        try {
          const { code } = await issueBridgeAuthorizationCode(user.id, returnTo, selectedProfileId, destination);
          const callback = new URL(returnTo);
          callback.searchParams.set("code", code);
          return new Response(null, { status: 302, headers: { Location: callback.toString() } });
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
