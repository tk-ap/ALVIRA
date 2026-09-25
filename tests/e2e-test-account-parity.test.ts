import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

describe("Agent E2E test-account parity", () => {
  test("E2E-stamped codex smoke accounts inherit the live tier-switch simulator", () => {
    const auth = readFileSync("src/routes/-auth.ts", "utf8");
    expect(auth).toContain('process.env.ALVIRA_E2E === "1"');
    expect(auth).toContain("E2E_TEST_ACCESS_EMAIL");
    expect(auth).toContain("codex-smoke-");
    expect(auth).toContain("setTestAccessTier");
  });

  test("reset clears isolated E2E usage without deleting the test user", () => {
    const script = readFileSync("scripts/e2e/e2e-env", "utf8");
    const resetStart = script.indexOf("reset)");
    expect(resetStart).toBeGreaterThan(-1);
    const resetBlock = script.slice(resetStart);
    expect(resetBlock).toContain("require_e2e_db");
    expect(resetBlock).toContain("update users set interview_count = 0 where id in $tu");
    expect(resetBlock).not.toContain("delete from users");
  });
});
