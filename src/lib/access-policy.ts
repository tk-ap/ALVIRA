export type AccessMode = "actual" | "founder" | "free" | "pro" | "lifetime" | null;

/**
 * Founding Beta is a permanent customer entitlement, not an owner/test mode.
 * The founder test mode is included only so production QA can exercise the
 * same unrestricted customer path without changing persisted account data.
 */
export function hasFoundingBetaCustomerAccess(tier: string, accessMode: AccessMode = null): boolean {
  return tier === "founding_beta" || accessMode === "founder";
}

/** Customer-facing limits are removed for paid, lifetime, and Founding Beta access. */
export function hasUnlimitedCustomerAccess(tier: string, accessMode: AccessMode = null): boolean {
  return hasFoundingBetaCustomerAccess(tier, accessMode) || tier !== "free";
}

/**
 * Reflect is a lifecycle surface for an ALVIRA Context. Its backing `meos`
 * record must never consume an additional saved-Context slot.
 */
export function countsTowardContextProfileLimit(offering: string | null | undefined): boolean {
  return offering == null || offering === "context";
}
