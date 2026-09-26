import { createFileRoute } from "@tanstack/react-router";
import { consumeOwnerHandoff } from "~/lib/ledgato-owner-handoff";

export const Route = createFileRoute("/api/handoff/ledgato/consume")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let input: { token?: string; verifier?: string; state?: string };
        try { input = await request.json() as typeof input; }
        catch { return Response.json({ error: "invalid_request" }, { status: 400 }); }

        const session = await consumeOwnerHandoff({
          token: String(input.token ?? "").trim(),
          verifier: String(input.verifier ?? "").trim(),
          state: String(input.state ?? "").trim(),
        });
        if (!session) return Response.json({ error: "invalid_or_expired_handoff" }, { status: 404 });

        return Response.json({
          sessionToken: session.token,
          expiresAt: session.expiresAt,
          returnPath: session.returnPath,
          owner: { id: session.id, email: session.email },
        }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
