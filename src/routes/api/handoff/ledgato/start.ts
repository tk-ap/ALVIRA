import { createFileRoute } from "@tanstack/react-router";
import { getCookie } from "@tanstack/react-start/server";
import { createOwnerHandoff, ownerFromAlviraSession, safeLedgatoReturnPath, validPkceChallenge, validState } from "~/lib/ledgato-owner-handoff";

const SESSION_COOKIE = "alvira_session";

export const Route = createFileRoute("/api/handoff/ledgato/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const challenge = url.searchParams.get("challenge")?.trim() || "";
        const state = url.searchParams.get("state")?.trim() || "";
        const next = safeLedgatoReturnPath(url.searchParams.get("next"));

        if (!validPkceChallenge(challenge) || !validState(state)) {
          return Response.json({ error: "invalid_handoff_request" }, { status: 400 });
        }

        const sessionToken = getCookie(SESSION_COOKIE) ?? null;
        const owner = await ownerFromAlviraSession(sessionToken);
        if (!owner) {
          const login = new URL("/login", request.url);
          const returnTo = `/api/handoff/ledgato/start?challenge=${encodeURIComponent(challenge)}&state=${encodeURIComponent(state)}&next=${encodeURIComponent(next)}`;
          login.searchParams.set("returnTo", returnTo);
          return Response.redirect(login, 302);
        }

        const handoff = await createOwnerHandoff({
          userId: owner.id,
          sourceSessionId: owner.sessionId,
          sourceSessionExpiresAt: owner.sessionExpiresAt,
          codeChallenge: challenge,
          state,
          returnPath: next,
        });
        return Response.redirect(handoff.url, 302);
      },
    },
  },
});
