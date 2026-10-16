import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

// E2E 2026-10-16: "Update / add context" on a generated Context dropped every source, including
// links waiting for the owner's review, because the reseeded state did not carry them.
const app = readFileSync("src/routes/app.tsx", "utf8");

describe("context sources survive continue and update", () => {
  test("seedStateFromExisting carries the existing sources into the reseeded state", () => {
    const seed = app.slice(app.indexOf("function seedStateFromExisting"), app.indexOf("// ── Document parsing helpers"));
    expect(seed).toContain("contextSources: [...existing.contextSources]");
  });

  test("the local source list only adds missing sources to the interview, never replaces its list", () => {
    expect(app).toContain("const missing = contextSources.filter((source) => !existing.some((item) => item.id === source.id));");
    expect(app).not.toContain("if (existing.length !== contextSources.length) setState({ ...state, contextSources });");
  });

  test("the attached count reads the interview's sources", () => {
    expect(app).toContain("const attachedCount = (state?.contextSources ?? contextSources).length;");
    expect(app).not.toMatch(/\{contextSources\.length\} (source|attached)/);
  });
});
