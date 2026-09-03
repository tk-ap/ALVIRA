// Shared pricing constants — single source of truth for plan prices and
// ALVIRA-owned checkout entry points. Stripe Checkout Sessions are created
// server-side after the signed-in ALVIRA user is resolved.
export const LIFETIME_PRICE = "$399";

export const STRIPE_LINKS = {
  pro: "/checkout/pro-monthly",
  annual: "/checkout/pro-annual",
  lifetime: "/checkout/lifetime",
} as const;
