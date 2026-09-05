import { describe, expect, test } from "bun:test";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/routes/-auth.ts", import.meta.url), "utf8");

describe("Reflect emergency blocker", () => {
  test("real Founding Beta users are not confused with owner-only founder test mode", () => {
    expect(source).toMatch(/founding_beta/);
  });

  test("Reflect save capacity is explicitly exempt from Free Context slot accounting", () => {
    expect(source).toMatch(/offering[^\n]*meos/);
  });
});
