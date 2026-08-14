export const OWNER_EMAIL = "tahlia.ashwood@gmail.com";

export function isOwnerEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === OWNER_EMAIL;
}

export function hasPaidFeatureAccess(user: { email?: string; tier?: string } | null | undefined): boolean {
  return !!user && (isOwnerEmail(user.email) || user.tier === "pro" || user.tier === "lifetime");
}
