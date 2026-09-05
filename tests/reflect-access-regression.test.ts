import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import { getMeosGraph, getMeosPreviewGraph } from "../src/routes/-meosGraph";

const authSource = fs.readFileSync(new URL("../src/routes/-auth.ts", import.meta.url), "utf8");

describe("Reflect access policy", () => {
  test("free Reflect uses the complete Reflect graph", () => {
    expect(getMeosPreviewGraph().map((d) => d.id)).toEqual(getMeosGraph().map((d) => d.id));
    expect(getMeosPreviewGraph().map((d) => d.id)).toContain("validation");
  });

  test("Reflect does not consume a second Free Context slot", () => {
    expect(authSource).toContain('effectiveTier === "free" && data.offering !== "meos" && !existing');
    expect(authSource).toContain('effectiveTier === "free" && row.offering !== "meos" && !existing');
  });

  test("persisted Founding Beta users receive founder-level customer access", () => {
    expect(authSource).toContain('user.tier === "founding_beta"');
    expect(authSource).toContain('const unlimited = hasFounderAccess(user) || effectiveTier !== "free"');
  });
});
