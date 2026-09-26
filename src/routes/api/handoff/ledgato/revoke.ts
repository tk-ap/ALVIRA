import { createFileRoute } from "@tanstack/react-router";
import { revokeOwnerSession } from "~/lib/ledgato-owner-handoff";

function bearer(request: Request): string {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export const Route = createFileRoute("/api/handoff/ledgato/revoke")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = bearer(request);
        if (token) await revokeOwnerSession(token);
        return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
