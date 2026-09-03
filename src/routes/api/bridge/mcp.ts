import { createFileRoute } from "@tanstack/react-router";
import { getBridgePrincipal, getBridgeProfiles } from "~/lib/bridge";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function bearer(request: Request) {
  const value = request.headers.get("authorization") || "";
  if (!value.startsWith("Bearer ")) return null;
  return value.slice(7).trim() || null;
}

function unauthorized(request: Request) {
  const origin = new URL(request.url).origin;
  const metadata = `${origin}/.well-known/oauth-protected-resource/api/bridge/mcp`;
  return new Response(JSON.stringify({ error: "Unauthorized", message: "Connect this MCP server through your AI app; ALVIRA will open a secure sign-in and Context approval flow." }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "WWW-Authenticate": `Bearer resource_metadata="${metadata}", scope="context:read profile:read"`,
    },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

async function authorizedProfiles(request: Request) {
  const token = bearer(request);
  if (!token) return null;
  const principal = await getBridgePrincipal(token);
  if (!principal) return null;
  if (principal.destination && principal.destination !== "mcp") return null;
  return getBridgeProfiles(principal.user_id, principal.selected_profile_id);
}

async function handlePost(request: Request) {
  const profiles = await authorizedProfiles(request);
  if (!profiles) return unauthorized(request);

  let message: JsonRpcRequest;
  try {
    message = await request.json() as JsonRpcRequest;
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }

  const { id, method, params = {} } = message;
  if (!method) return json(rpcError(id, -32600, "Invalid Request"), 400);

  if (method.startsWith("notifications/")) return new Response(null, { status: 202 });

  switch (method) {
    case "initialize": {
      const requestedVersion = typeof params.protocolVersion === "string" ? params.protocolVersion : "2025-03-26";
      return json(rpcResult(id, {
        protocolVersion: requestedVersion,
        capabilities: { resources: {}, tools: {} },
        serverInfo: {
          name: "alvira-bridge",
          version: "0.4.0",
          description: "ALVIRA Bridge: portable, user-owned Context for AI tools.",
        },
      }));
    }
    case "ping":
      return json(rpcResult(id, {}));
    case "resources/list":
      return json(rpcResult(id, {
        resources: [{ uri: "alvira://profiles", name: "ALVIRA Profiles", title: "ALVIRA Profiles", mimeType: "application/json" }],
      }));
    case "resources/read": {
      const uri = typeof params.uri === "string" ? params.uri : "";
      if (uri !== "alvira://profiles") return json(rpcError(id, -32602, "Unknown resource URI"), 400);
      return json(rpcResult(id, {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(profiles) }],
      }));
    }
    case "resources/templates/list":
      return json(rpcResult(id, { resourceTemplates: [] }));
    case "prompts/list":
      return json(rpcResult(id, { prompts: [] }));
    case "tools/list":
      return json(rpcResult(id, {
        tools: [
          {
            name: "get_alvira_context",
            title: "Get ALVIRA Context",
            description: "Read the user's existing ALVIRA Context. Bridge distributes Context; it does not regenerate it.",
            inputSchema: {
              type: "object",
              properties: { profileId: { type: "string", description: "Optional ALVIRA profile ID. Defaults to the Context authorized for this connection." } },
              additionalProperties: false,
            },
          },
          {
            name: "list_alvira_profiles",
            title: "List ALVIRA Profiles",
            description: "List ALVIRA Profiles available through this Bridge connection.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
          },
        ],
      }));
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const args = (params.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<string, unknown>;
      if (name === "list_alvira_profiles") {
        const summaries = profiles.map(({ id: profileId, topic, offering, tier, updated_at }) => ({ id: profileId, topic, offering, tier, updated_at }));
        return json(rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(summaries) }],
          structuredContent: { profiles: summaries },
        }));
      }
      if (name === "get_alvira_context") {
        const profileId = typeof args.profileId === "string" ? args.profileId : null;
        const profile = profileId ? profiles.find((item) => item.id === profileId) : profiles[0];
        if (!profile) {
          return json(rpcResult(id, {
            content: [{ type: "text", text: "No ALVIRA profile is available." }],
            isError: true,
          }));
        }
        return json(rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(profile) }],
          structuredContent: { profile },
        }));
      }
      return json(rpcError(id, -32602, "Unknown tool"), 400);
    }
    default:
      return json(rpcError(id, -32601, "Method not found"), 404);
  }
}

export const Route = createFileRoute("/api/bridge/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      GET: async ({ request }) => {
        const profiles = await authorizedProfiles(request);
        if (!profiles) return unauthorized(request);
        return json({
          name: "alvira-bridge",
          version: "0.4.0",
          transport: "stateless-json",
          endpoint: "/api/bridge/mcp",
          resources: ["alvira://profiles"],
          tools: ["get_alvira_context", "list_alvira_profiles"],
        });
      },
      DELETE: async ({ request }) => {
        const profiles = await authorizedProfiles(request);
        if (!profiles) return unauthorized(request);
        return new Response(null, { status: 204 });
      },
      OPTIONS: async () => new Response(null, {
        status: 204,
        headers: {
          Allow: "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        },
      }),
    },
  },
});
