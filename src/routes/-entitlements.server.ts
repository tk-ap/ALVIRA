// ── Entitlement checks (server-only) ──
// This `.server.ts` module is NEVER statically imported by client code: the only
// importers are server-side dynamic `import()` calls inside `-auth.ts` handlers.
// It is therefore excluded from the client bundle entirely, so its `~/db` import
// Database credentials and server-only dependencies can never leak into browser code.
import { hasEntitlement } from "~/db";

// User is resolved by the caller (in `-auth.ts`), so this module needs no
// cookie/session plumbing of its own.
export async function requireEntitlement(user: { id: string }, product: string): Promise<void> {
  if (!(await hasEntitlement(user.id, product))) {
    throw new Error(`An active ${product.replace(/_/g, " ")} entitlement is required.`);
  }
}

export function requireMeosPreview(user: { id: string }): void {
  if (!user?.id) throw new Error("Authentication required.");
}

export async function requireMeos(user: { id: string; email: string; tier: string }): Promise<void> {
  if (!user?.id) throw new Error("Authentication required.");
  // Core ALVIRA Reflect is part of ALVIRA rather than a separately purchased
  // product. Existing meos_build / comp records remain valid in the database for
  // backward compatibility, while normal Free/Pro/Lifetime/Founding Beta limits
  // continue to govern Context count and interview usage elsewhere.
}
