import { createFileRoute } from "@tanstack/react-router";
import { authorizeInterviewLabMachineRequest } from "~/lib/interview-lab-machine.server";
import {
  normalizeInterviewLabInput,
  runInterviewLabTurn,
} from "~/lib/interview-lab.server";
import { getKnowledgeGraph } from "~/routes/-knowledgeGraph";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 256 * 1024;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

function authorized(request: Request) {
  const auth = authorizeInterviewLabMachineRequest(request);
  if (!auth.ok) return { response: json({ error: auth.error }, auth.status) };
  return { client: auth.client };
}

export const Route = createFileRoute("/api/interview-lab/machine")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = authorized(request);
        if ("response" in auth) return auth.response;

        return json({
          protocol: "alvira-interview-lab/1",
          client: auth.client,
          promptVersions: ["lab-v2", "production"],
          tiers: ["personal", "team", "enterprise"],
          domains: {
            personal: getKnowledgeGraph("personal").map(({ id, label }) => ({ id, label })),
            team: getKnowledgeGraph("team").map(({ id, label }) => ({ id, label })),
            enterprise: getKnowledgeGraph("enterprise").map(({ id, label }) => ({ id, label })),
          },
          behavior: {
            stateless: true,
            historyOwnedByClient: true,
            writesProductionContext: false,
            browserOwnerRouteUnchanged: true,
          },
        });
      },
      POST: async ({ request }) => {
        const auth = authorized(request);
        if ("response" in auth) return auth.response;

        const length = Number(request.headers.get("content-length") ?? "0");
        if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
          return json({ error: "request_too_large" }, 413);
        }

        let raw = "";
        try {
          raw = await request.text();
        } catch {
          return json({ error: "invalid_request" }, 400);
        }
        if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
          return json({ error: "request_too_large" }, 413);
        }

        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return json({ error: "invalid_json" }, 400);
        }

        try {
          const input = normalizeInterviewLabInput(body);
          const result = await runInterviewLabTurn(input);
          return json({
            protocol: "alvira-interview-lab/1",
            client: auth.client,
            ...result,
          });
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Interview Lab failed.";
          const status =
            message === "Choose an interview area." || message === "Interview area not found."
              ? 400
              : 500;
          return json({ error: status === 400 ? "invalid_input" : "lab_turn_failed", message }, status);
        }
      },
    },
  },
});
