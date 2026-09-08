import { describe, expect, test } from "bun:test";
import { resolveContextScope } from "../src/routes/-extractor";

describe("Add Context schema scope", () => {
  test("defaults account/billing tier values to personal context", () => {
    expect(resolveContextScope({ tier: "free" })).toBe("personal");
    expect(resolveContextScope({ tier: "pro" })).toBe("personal");
    expect(resolveContextScope({ tier: "founder" })).toBe("personal");
  });

  test("honors an explicit context schema scope independently of billing", () => {
    expect(resolveContextScope({ contextScope: "personal", tier: "pro" })).toBe("personal");
    expect(resolveContextScope({ contextScope: "team", tier: "free" })).toBe("team");
    expect(resolveContextScope({ contextScope: "enterprise", tier: "founder" })).toBe("enterprise");
  });

  test("keeps legacy schema-tier callers working", () => {
    expect(resolveContextScope({ tier: "personal" })).toBe("personal");
    expect(resolveContextScope({ tier: "team" })).toBe("team");
    expect(resolveContextScope({ tier: "enterprise" })).toBe("enterprise");
  });
});