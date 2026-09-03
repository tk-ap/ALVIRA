import { createFileRoute } from "@tanstack/react-router";
import { getBridgeUserFromSession, listBridgeConnectionsForUser, revokeBridgeConnectionForUser } from "~/lib/bridge";

export const Route = createFileRoute("/api/bridge/connections")({
  server: {
    handlers: {
      GET: async () => {
        const user = await getBridgeUserFromSession();
        if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
        const connections = await listBridgeConnectionsForUser(user.id);
        return Response.json({ connections }, { headers: { "Cache-Control": "no-store" } });
      },
      DELETE: async ({ request }) => {
        const user = await getBridgeUserFromSession();
        if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
        const body = await request.json().catch(() => ({})) as { connection_id?: string };
        if (!body.connection_id) return Response.json({ error: "connection_id_required" }, { status: 400 });
        const revoked = await revokeBridgeConnectionForUser(user.id, body.connection_id);
        if (!revoked) return Response.json({ error: "connection_not_found" }, { status: 404 });
        return Response.json({ revoked: true });
      },
    },
  },
});
