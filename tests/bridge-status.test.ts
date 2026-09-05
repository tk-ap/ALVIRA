import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { disconnectedLegacyBridgeContextResponse } from "../src/lib/bridge-context-status";

describe("Bridge compatibility status", () => {
  test("treats absence of a legacy browser connection as a normal 200 state", async () => {
    const response = disconnectedLegacyBridgeContextResponse();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ connected: false, error: "not_connected" });
  });

  test("does not weaken bearer-protected Bridge APIs", () => {
    const profilesRoute = readFileSync("src/routes/api/bridge/profiles.ts", "utf8");
    const mcpRoute = readFileSync("src/routes/api/bridge/mcp.ts", "utf8");
    expect(profilesRoute).toContain('{ status: 401 }');
    expect(profilesRoute).toContain('getBridgePrincipal(token)');
    expect(mcpRoute).toContain('status: 401');
    expect(mcpRoute).toContain('getBridgePrincipal');
  });

  test("clears a stale compatibility cookie instead of returning unauthorized", () => {
    const statusRoute = readFileSync("src/routes/api/bridge/context.ts", "utf8");
    expect(statusRoute).toContain("deleteCookie(BRIDGE_TOKEN_COOKIE, bridgeCookieDeleteOptions())");
    expect(statusRoute).toContain("return disconnectedLegacyBridgeContextResponse()");
    expect(statusRoute).not.toContain('{ connected: false, error: "not_connected" }, { status: 401 }');
  });
});
