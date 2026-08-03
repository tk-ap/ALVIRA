// Shared pricing constants — single source of truth for plan prices and
// Stripe checkout links. Keep displayed prices in sync with Stripe here.
export const LIFETIME_PRICE = "$399";

export const STRIPE_LINKS = {
  pro: "https://buy.stripe.com/5kQdR97xU0dJ3b30Ref7i02",
  annual: "https://buy.stripe.com/6oUaEX9G21hNfXP43qf7i06",
  lifetime: "https://buy.stripe.com/8x24gz05s6C7bHzdE0f7i07",
} as const;
