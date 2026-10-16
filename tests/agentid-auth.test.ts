import { describe, expect, test } from "bun:test";
import { AGENTID_SCOPES, pkceChallenge, safeReturnTo } from "../src/lib/agentid.server";

describe("AgentID authentication boundary", () => {
  test("keeps default scopes identity-only", () => {
    expect(AGENTID_SCOPES).toBe("openid email profile");
    expect(AGENTID_SCOPES).not.toContain("owner_name");
    expect(AGENTID_SCOPES).not.toContain("owner_email");
  });

  test("rejects external and protocol-relative return targets", () => {
    expect(safeReturnTo("https://example.com")).toBe("/app");
    expect(safeReturnTo("//example.com/path")).toBe("/app");
    expect(safeReturnTo("/context")).toBe("/context");
  });

  test("generates the RFC 7636 S256 challenge", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(await pkceChallenge(verifier)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});
