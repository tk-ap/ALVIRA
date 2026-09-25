/**
 * E2E preview builds are compiled with ALVIRA_E2E="1" and must use their own
 * database. They fail closed rather than fall back to the shared DATABASE_URL,
 * which Vercel also exposes to previews and which points at production.
 */
export function resolveDatabaseUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  if (env.ALVIRA_E2E === "1") {
    if (!env.ALVIRA_E2E_DATABASE_URL) throw new Error("ALVIRA_E2E_DATABASE_URL is required for E2E builds; refusing the shared DATABASE_URL.");
    return env.ALVIRA_E2E_DATABASE_URL;
  }
  return env.DATABASE_URL;
}
