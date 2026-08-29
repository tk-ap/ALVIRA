// ── Entitlement checks (server-only) ──
// This `.server.ts` module is NEVER statically imported by client code: the only
// importers are server-side dynamic `import()` calls inside `-auth.ts` handlers.
// It is therefore excluded from the client bundle entirely, so its `~/db` import
// Database credentials and server-only dependencies can never leak into browser code.
import { getMeosComp, hasEntitlement } from "~/db";
import { hasActiveFoundingBeta } from "~/lib/founding-beta";

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
  const hasComp = !!(await getMeosComp(user.email));
  const hasFoundingBeta = await hasActiveFoundingBeta(user.id);
  const ownerEmail = (process.env.ALVIRA_OWNER_EMAIL ?? "tahlia.ashwood@gmail.com").trim().toLowerCase();
  const isOwner = user.email.trim().toLowerCase() === ownerEmail;
  if (!hasComp && !hasFoundingBeta && !isOwner && !(await hasEntitlement(user.id, "meos_build"))) {
    throw new Error("Reflect Build must be purchased before continuing.");
  }
}
