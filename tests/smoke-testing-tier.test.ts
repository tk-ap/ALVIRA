import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const auth = readFileSync(new URL("../src/routes/-auth.ts", import.meta.url), "utf8");
const account = readFileSync(new URL("../src/routes/account.tsx", import.meta.url), "utf8");
const meos = readFileSync(new URL("../src/routes/meos.tsx", import.meta.url), "utf8");
const foundingBeta = readFileSync(new URL("../src/lib/founding-beta.ts", import.meta.url), "utf8");
const ownerDepth = readFileSync(new URL("../src/routes/-ownerDashboardDepth.ts", import.meta.url), "utf8");
const ownerBrief = readFileSync(new URL("../src/routes/-ownerOperatingBrief.ts", import.meta.url), "utf8");
const db = readFileSync(new URL("../src/db.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../migrations/017_smoke_testing_tier.sql", import.meta.url), "utf8");

describe("smoke testing tier", () => {
  test("dedicated E2E account is a recognized access-test account", () => {
    expect(auth).toContain('"codex-e2e-1788235310@example.com"');
    expect(auth).toContain('user.tier === "smoke_testing"');
    expect(auth).toContain("hasFullProductAccess");
  });

  test("full customer-facing entitlement paths accept smoke testing", () => {
    expect(auth).toContain("if (hasFullProductAccess(user)");
    expect(meos).toContain('"smoke_testing"');
    expect(account).toContain("Smoke testing access");
  });

  test("Founding Beta never auto-classifies the E2E account", () => {
    expect(foundingBeta).toContain('"codex-e2e-1788235310@example.com"');
  });

  test("owner metrics keep synthetic E2E traffic separate", () => {
    expect(ownerDepth).toContain('"codex-e2e-1788235310@example.com"');
    expect(ownerBrief).toContain("tier <> 'smoke_testing'");
    expect(db).toContain("tier = 'smoke_testing'");
    expect(db).toContain("tier <> 'smoke_testing'");
  });

  test("migration changes only the expected existing free E2E account", () => {
    expect(migration).toContain("Expected exactly one ALVIRA user for codex-e2e-1788235310@example.com");
    expect(migration).toContain("current_tier NOT IN ('free', 'smoke_testing')");
    expect(migration).toContain("SET tier = 'smoke_testing'");
  });
});
