import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const canonicalReflect = "/app?offering=meos&preview=false";
const header = readFileSync("src/components/Header.tsx", "utf8");
const cta = readFileSync("src/components/MeOSCTA.tsx", "utf8");
const app = readFileSync("src/routes/app.tsx", "utf8");

describe("Reflect navigation", () => {
  test("primary navigation uses the canonical Reflect entry", () => {
    expect(header).toContain(`href=\"${canonicalReflect}\"`);
  });

  test("Reflect CTAs no longer point directly at the legacy /meos page", () => {
    expect(cta).not.toContain('href="/meos"');
    expect(app).not.toContain('href="/meos"');
    expect(cta).toContain(`href=\"${canonicalReflect}\"`);
    expect(app).toContain(`href=\"${canonicalReflect}\"`);
  });

  test("legacy /meos route may remain for backward compatibility", () => {
    expect(readFileSync("src/routes/meos.tsx", "utf8")).toContain('createFileRoute("/meos")');
  });
});
