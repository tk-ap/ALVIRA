// Emergency patch specification retained for auditability.
// Applied to src/routes/-auth.ts in the same release branch.
export const requiredChanges = [
  'Treat user.tier === "founding_beta" as full customer access',
  'Do not enforce free saved-profile capacity when offering === "meos"',
  'Do not enforce free saved-profile capacity when finalized draft offering === "meos"',
  'Do not enforce free interview limits for founding_beta users',
  'Return unlimited limits for founding_beta users',
];
