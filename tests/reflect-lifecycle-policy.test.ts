import { describe, expect, test } from "bun:test";
import fs from "node:fs";

const authSource = fs.readFileSync(new URL("../src/routes/-auth.ts", import.meta.url), "utf8");

describe("Reflect lifecycle and Founding Beta access policy", () => {
  test("persisted founding_beta tier is treated as full customer access", () => {
    expect(authSource).toContain('user.tier === "founding_beta"');
  });

  test("Reflect is exempt from consuming the one free Context slot", () => {
    expect(authSource).toContain('data.offering !== "meos"');
  });

  test("finalized Reflect drafts are exempt from consuming the one free Context slot", () => {
    expect(authSource).toContain('row.offering !== "meos"');
  });
});
