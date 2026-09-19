import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const dbSource = readFileSync(new URL("../src/db.ts", import.meta.url), "utf8");
const authSource = readFileSync(new URL("../src/routes/-auth.ts", import.meta.url), "utf8");

describe("owner funnel signup source of truth", () => {
  test("signup counts come from actual user creation timestamps", () => {
    const metricsStart = dbSource.indexOf("export async function getOwnerMetrics");
    const metricsEnd = dbSource.indexOf("export async function createUser", metricsStart);
    const metrics = dbSource.slice(metricsStart, metricsEnd);

    expect(metrics).toContain("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'");
    expect(metrics).toContain("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'");
    expect(metrics).not.toContain("name = 'signup_completed'");
  });

  test("future completed signups also emit the analytics event server-side", () => {
    const signupStart = authSource.indexOf("export const signup");
    const loginStart = authSource.indexOf("export const login", signupStart);
    const signup = authSource.slice(signupStart, loginStart);

    expect(signup).toContain('await recordEvent("signup_completed", { userId: user.id');
    expect(signup).toContain('console.warn("[events] failed to persist signup_completed"');
  });
});
