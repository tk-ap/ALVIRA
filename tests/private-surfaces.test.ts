import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const previewRoute = "src/routes/brand-preview.tsx";
const pagesWorkflow = ".github/workflows/pages-brand-preview.yml";

describe("private and preview-only surfaces", () => {
  test("does not ship the exploratory brand preview as a production route", () => {
    expect(existsSync(previewRoute)).toBe(false);
  });

  test("keeps brand review isolated to the dedicated GitHub Pages workflow", () => {
    expect(existsSync(pagesWorkflow)).toBe(true);
    const workflow = readFileSync(pagesWorkflow, "utf8");
    expect(workflow).toContain("brand/alvira-system-refresh");
    expect(workflow).toContain("ALVIRA Brand Preview — GitHub Pages");
  });
});
