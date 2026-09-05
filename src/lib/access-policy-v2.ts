export type AccessUser = { tier: string };

/** Persisted customer entitlement, separate from owner/admin test mode. */
export function hasFoundingBetaCustomerAccess(user: AccessUser): boolean {
  return user.tier === "founding_beta";
}

/** Reflect is part of an existing Context lifecycle, not an additional Context slot. */
export function consumesSavedContextSlot(offering: string): boolean {
  return offering !== "meos";
}
