import { createHash } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { getDb } from "~/db";

export const Route = createFileRoute("/api/handoff/ailhat")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token")?.trim();
        if (!token) return Response.json({ error: "missing_token" }, { status: 400 });
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const row = (await getDb().query(
          `UPDATE ailhat_handoffs
              SET consumed_at = NOW()
            WHERE token_hash = $1
              AND consumed_at IS NULL
              AND expires_at > NOW()
          RETURNING snapshot_json, expires_at`,
          [tokenHash],
        ))[0] as { snapshot_json: unknown; expires_at: string } | undefined;
        if (!row) return Response.json({ error: "invalid_or_expired_token" }, { status: 404 });
        return Response.json(
          { handoff: row.snapshot_json, expires_at: row.expires_at },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
