import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import { getDossierGraph, getDossierPreviewGraph } from "../src/routes/-dossierGraph";

const authSource = fs.readFileSync(new URL("../src/routes/-auth.ts", import.meta.url), "utf8");

describe("Reflect access policy", () => {
  test("free Reflect uses the complete Reflect graph", () => {
    expect(getDossierPreviewGraph().map((d) => d.id)).toEqual(getDossierGraph().map((d) => d.id));
    expect(getDossierPreviewGraph().map((d) => d.id)).toContain("validation");
  });

  test("Reflect does not consume a second Free Context slot", () => {
    expect(authSource).toContain('effectiveTier === "free" && data.offering !== "dossier" && !existing');
    expect(authSource).toContain('effectiveTier === "free" && row.offering !== "dossier" && !existing');
  });

  test("persisted Founding Beta users receive founder-level customer access", () => {
    expect(authSource).toContain('user.tier === "founding_beta"');
    expect(authSource).toContain('const unlimited = hasFounderAccess(user) || effectiveTier !== "free"');
  });
});
