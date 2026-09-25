import { describe, expect, test } from "bun:test";
import { resolveDatabaseUrl } from "../src/lib/database-url";

describe("database URL resolution", () => {
  test("normal builds use DATABASE_URL", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "prod", ALVIRA_E2E_DATABASE_URL: "e2e" }, false)).toBe("prod");
  });
  test("E2E builds use their own database", () => {
    expect(resolveDatabaseUrl({ DATABASE_URL: "prod", ALVIRA_E2E_DATABASE_URL: "e2e" }, true)).toBe("e2e");
  });
  test("E2E builds fail closed instead of falling back to DATABASE_URL", () => {
    expect(() => resolveDatabaseUrl({ DATABASE_URL: "prod" }, true)).toThrow();
  });
});
