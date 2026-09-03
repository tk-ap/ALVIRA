import { createFileRoute } from "@tanstack/react-router";
import { getBridgePrincipal, getBridgeProfiles } from "~/lib/bridge";

const MODERN_PROTOCOL_VERSION = "2026-07-28";
const LEGACY_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = {
  name: "alvira-bridge",
  title: "ALVIRA Bridge",
  version: "0.5.0",
  description: "Portable, user-approved ALVIRA Context for AI tools.",
  websiteUrl: "https://alviratech.vercel.app/bridge",
};

const PRIVATE_CACHE_MS = 5 * 60 * 1000;
const DISCOVERY_CACHE_MS = 60 * 60 * 1000;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

type RequestValidation = {
  modern: boolean;
  error?: Response;
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

function serverMeta() {
  return { "io.modelcontextprotocol/serverInfo": SERVER_INFO };
}

function completeResult<T extends Record<string, unknown>>(result: T, modern: boolean) {
  if (!modern) return result;
  return {
    resultType: "complete",
    ...result,
    _meta: {
      ...((result._meta && typeof result._meta === "object" && !Array.isArray(result._meta)) ? result._meta as Record<string, unknown> : {}),
      ...serverMeta(),
    },
  };
}

function cacheableResult<T extends Record<string, unknown>>(result: T, modern: boolean, ttlMs = PRIVATE_CACHE_MS, cacheScope: "private" | "public" = "private") {
  return completeResult(modern ? { ...result, ttlMs, cacheScope } : result, modern);
}

function rpcResult(id: JsonRpcRequest["id"], result: Record<string, unknown>, modern = false) {
  return { jsonrpc: "2.0", id: id ?? null, result: completeResult(result, modern) };
}

function rpcCacheResult(id: JsonRpcRequest["id"], result: Record<string, unknown>, modern: boolean, ttlMs = PRIVATE_CACHE_MS, cacheScope: "private" | "public" = "private") {
  return { jsonrpc: "2.0", id: id ?? null, result: cacheableResult(result, modern, ttlMs, cacheScope) };
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

function requestMeta(message: JsonRpcRequest) {
  const params = message.params;
  if (!params || typeof params !== "object") return null;
  const meta = params._meta;
  return meta && typeof meta === "object" && !Array.isArray(meta) ? meta as Record<string, unknown> : null;
}

function decodeMirroredHeader(value: string | null) {
  if (!value) return null;
  if (value.startsWith("=?base64?") && value.endsWith("?=")) {
    try {
      return Buffer.from(value.slice(9, -2), "base64").toString("utf8");
    } catch {
      return null;
    }
  }
  return value;
}

function mirroredName(message: JsonRpcRequest) {
  const params = message.params || {};
  if (message.method === "tools/call" || message.method === "prompts/get") {
    return typeof params.name === "string" ? params.name : null;
  }
  if (message.method === "resources/read") {
    return typeof params.uri === "string" ? params.uri : null;
  }
  return undefined;
}

function validateProtocolRequest(request: Request, message: JsonRpcRequest): RequestValidation {
  const protocolHeader = request.headers.get("mcp-protocol-version");
  const methodHeader = request.headers.get("mcp-method");
  const meta = requestMeta(message);
  const metaVersion = typeof meta?.["io.modelcontextprotocol/protocolVersion"] === "string"
    ? meta["io.modelcontextprotocol/protocolVersion"] as string
    : null;

  const modernSignal = message.method === "server/discover"
    || protocolHeader?.startsWith("2026-")
    || metaVersion?.startsWith("2026-");
  if (!modernSignal) return { modern: false };

  if (protocolHeader !== MODERN_PROTOCOL_VERSION || metaVersion !== MODERN_PROTOCOL_VERSION) {
    const unsupported = (protocolHeader?.startsWith("2026-") && protocolHeader !== MODERN_PROTOCOL_VERSION)
      || (metaVersion?.startsWith("2026-") && metaVersion !== MODERN_PROTOCOL_VERSION);
    return {
      modern: true,
      error: json(rpcError(message.id, unsupported ? -32022 : -32020, unsupported ? "Unsupported protocol version" : "Header mismatch: MCP-Protocol-Version must match request _meta"), 400),
    };
  }

  if (!message.method || methodHeader !== message.method) {
    return {
      modern: true,
      error: json(rpcError(message.id, -32020, "Header mismatch: Mcp-Method must match the JSON-RPC method"), 400),
    };
  }

  const expectedName = mirroredName(message);
  if (expectedName !== undefined) {
    const suppliedName = decodeMirroredHeader(request.headers.get("mcp-name"));
    if (!expectedName || suppliedName !== expectedName) {
      return {
        modern: true,
        error: json(rpcError(message.id, -32020, "Header mismatch: Mcp-Name must match the request target"), 400),
      };
    }
  }

  return { modern: true };
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

  if (message.jsonrpc !== "2.0" || !message.method) return json(rpcError(message.id, -32600, "Invalid Request"), 400);
  const validation = validateProtocolRequest(request, message);
  if (validation.error) return validation.error;
  const modern = validation.modern;
  const { id, method, params = {} } = message;

  if (method.startsWith("notifications/")) return new Response(null, { status: 202 });

  if (method === "server/discover") {
    if (!modern) return json(rpcError(id, -32601, "Method not found"), 404);
    return json(rpcCacheResult(id, {
      supportedVersions: [MODERN_PROTOCOL_VERSION],
      capabilities: { resources: {}, tools: {} },
      instructions: "Use ALVIRA Bridge to read only the Context this person explicitly approved for this connection.",
    }, true, DISCOVERY_CACHE_MS, "private"));
  }

  if (method === "initialize") {
    if (modern) return json(rpcError(id, -32601, "Method not found"), 404);
    const requestedVersion = typeof params.protocolVersion === "string" ? params.protocolVersion : LEGACY_PROTOCOL_VERSIONS[0];
    const protocolVersion = LEGACY_PROTOCOL_VERSIONS.includes(requestedVersion) ? requestedVersion : LEGACY_PROTOCOL_VERSIONS[0];
    return json(rpcResult(id, {
      protocolVersion,
      capabilities: { resources: {}, tools: {} },
      serverInfo: SERVER_INFO,
    }));
  }

  if (method === "ping") {
    if (modern) return json(rpcError(id, -32601, "Method not found"), 404);
    return json(rpcResult(id, {}));
  }

  switch (method) {
    case "resources/list":
      return json(rpcCacheResult(id, {
        resources: [{ uri: "alvira://profiles", name: "ALVIRA Profiles", title: "ALVIRA Context", mimeType: "application/json" }],
      }, modern));
    case "resources/read": {
      const uri = typeof params.uri === "string" ? params.uri : "";
      if (uri !== "alvira://profiles") return json(rpcError(id, -32602, "Unknown resource URI"), 400);
      return json(rpcCacheResult(id, {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify(profiles) }],
      }, modern));
    }
    case "resources/templates/list":
      return json(rpcCacheResult(id, { resourceTemplates: [] }, modern));
    case "prompts/list":
      return json(rpcCacheResult(id, { prompts: [] }, modern));
    case "tools/list":
      return json(rpcCacheResult(id, {
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
            description: "List the ALVIRA Context available through this Bridge connection.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
          },
        ],
      }, modern));
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      const args = (params.arguments && typeof params.arguments === "object" ? params.arguments : {}) as Record<string, unknown>;
      if (name === "list_alvira_profiles") {
        const summaries = profiles.map(({ id: profileId, topic, offering, tier, updated_at }) => ({ id: profileId, topic, offering, tier, updated_at }));
        return json(rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(summaries) }],
          structuredContent: { profiles: summaries },
        }, modern));
      }
      if (name === "get_alvira_context") {
        const profileId = typeof args.profileId === "string" ? args.profileId : null;
        const profile = profileId ? profiles.find((item) => item.id === profileId) : profiles[0];
        if (!profile) {
          return json(rpcResult(id, {
            content: [{ type: "text", text: "No ALVIRA Context is available." }],
            isError: true,
          }, modern));
        }
        return json(rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(profile) }],
          structuredContent: { profile },
        }, modern));
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
      // Retained as a human/debug compatibility surface. Modern MCP clients use
      // POST only; they never depend on GET or DELETE protocol sessions.
      GET: async ({ request }) => {
        const profiles = await authorizedProfiles(request);
        if (!profiles) return unauthorized(request);
        return json({
          name: "alvira-bridge",
          version: SERVER_INFO.version,
          protocol: MODERN_PROTOCOL_VERSION,
          transport: "stateless-streamable-http",
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
          "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        },
      }),
    },
  },
});
