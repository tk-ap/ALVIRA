import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getProfiles } from "../../../lib/alvira";

export const dynamic = "force-dynamic";

function bearer(request: Request) {
  const value = request.headers.get("authorization") || "";
  if (!value.startsWith("Bearer ")) return null;
  return value.slice(7).trim() || null;
}

async function authorizedProfiles(request: Request) {
  const token = bearer(request);
  if (!token) return null;
  try {
    return await getProfiles(token);
  } catch {
    return null;
  }
}

function makeHandler(profiles: Array<Record<string, unknown>>) {
  return createMcpHandler(() => {
    const server = new McpServer({
      name: "alvira-bridge",
      version: "0.2.0",
      description: "ALVIRA Bridge: portable user-owned context for AI tools.",
    });

    server.registerResource(
      "alvira-profiles",
      "alvira://profiles",
      { title: "ALVIRA Profiles", mimeType: "application/json" },
      async (uri) => ({ contents: [{ uri: uri.href, text: JSON.stringify(profiles) }] }),
    );

    server.registerTool(
      "get_alvira_context",
      {
        title: "Get ALVIRA Context",
        description: "Read the user's existing ALVIRA Profile context. Bridge distributes context; it does not regenerate it.",
        inputSchema: z.object({ profileId: z.string().optional() }),
      },
      async ({ profileId }) => {
        const profile = profileId ? profiles.find((item) => item.id === profileId) : profiles[0];
        if (!profile) return { content: [{ type: "text", text: "No ALVIRA profile is available." }] };
        return {
          content: [{ type: "text", text: JSON.stringify(profile) }],
          structuredContent: { profile },
        };
      },
    );

    server.registerTool(
      "list_alvira_profiles",
      {
        title: "List ALVIRA Profiles",
        description: "List the ALVIRA Profiles available through this Bridge connection.",
      },
      async () => ({
        content: [{ type: "text", text: JSON.stringify(profiles.map(({ id, topic, offering, tier, updated_at }) => ({ id, topic, offering, tier, updated_at }))) }],
      }),
    );

    return server;
  }, { legacy: "stateless", responseMode: "json" });
}

async function handle(request: Request) {
  const profiles = await authorizedProfiles(request);
  if (!profiles) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" },
    });
  }
  return makeHandler(profiles.profiles).fetch(request);
}

export async function POST(request: Request) { return handle(request); }
export async function GET(request: Request) { return handle(request); }
export async function DELETE(request: Request) { return handle(request); }
