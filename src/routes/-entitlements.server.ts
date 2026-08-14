// ── Entitlement checks (server-only) ──
// This `.server.ts` module is NEVER statically imported by client code: the only
// importers are server-side dynamic `import()` calls inside `-auth.ts` handlers.
// It is therefore excluded from the client bundle entirely, so its `~/db` import
// Database credentials and server-only dependencies can never leak into browser code.
import { getMeosComp, hasEntitlement } from "~/db";
import { isOwnerEmail } from "~/lib/access";

// User is resolved by the caller (in `-auth.ts`), so this module needs no
// cookie/session plumbing of its own.
export async function requireEntitlement(
  user: { id: string; email?: string },
  product: string,
): Promise<void> {
  if (isOwnerEmail(user.email)) return;
  if (!(await hasEntitlement(user.id, product))) {
    throw new Error(
      `An active ${product.replace(/_/g, " ")} entitlement is required.`,
    );
  }
}

export function requireMeosPreview(user: { id: string }): void {
  if (!user?.id) throw new Error("Authentication required.");
}

export async function requireMeos(user: {
  id: string;
  email: string;
  tier: string;
}): Promise<void> {
  if (isOwnerEmail(user.email)) return;
  const hasComp = !!(await getMeosComp(user.email));
  if (!hasComp && user.tier !== "pro" && user.tier !== "lifetime") {
    throw new Error("MeOS requires an active Pro or Lifetime plan.");
  }
  if (!hasComp && !(await hasEntitlement(user.id, "meos_build"))) {
    throw new Error("MeOS Build must be purchased before continuing.");
  }
}
