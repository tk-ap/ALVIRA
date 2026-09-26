import { createFileRoute } from "@tanstack/react-router";
import { validateOwnerSession } from "~/lib/ledgato-owner-handoff";

function bearer(request: Request): string {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export const Route = createFileRoute("/api/handoff/ledgato/session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const owner = await validateOwnerSession(bearer(request));
        if (!owner) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
        return Response.json({ authenticated: true, owner }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
