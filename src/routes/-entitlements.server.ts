// ── Entitlement checks (server-only) ──
// This `.server.ts` module is NEVER statically imported by client code: the only
// importers are server-side dynamic `import()` calls inside `-auth.ts` handlers.
// It is therefore excluded from the client bundle entirely, so its `~/db` import
// (bun:sqlite, node:fs, node:path) can never leak into browser code.
import { hasEntitlement } from "~/db";

// User is resolved by the caller (in `-auth.ts`), so this module needs no
// cookie/session plumbing of its own.
export function requireEntitlement(user: { id: string }, product: string): void {
  if (!hasEntitlement(user.id, product)) {
    throw new Error(`An active ${product.replace(/_/g, " ")} entitlement is required.`);
  }
}

export function requireMeos(user: { id: string; tier: string }): void {
  if (user.tier !== "pro" && user.tier !== "lifetime") {
    throw new Error("MeOS requires an active Pro or Lifetime plan.");
  }
  if (!hasEntitlement(user.id, "meos_build")) {
    throw new Error("MeOS Build must be purchased before continuing.");
  }
}
