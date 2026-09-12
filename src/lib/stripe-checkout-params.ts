// Pure Checkout Session parameter construction, split out of stripe-billing.server.ts
// so it can be unit tested without server-only imports, Stripe credentials, or network.

import type { User } from "~/db";

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://alviratech.vercel.app";

export type BillingPlan = "pro-monthly" | "pro-annual" | "lifetime";

// `priceId` here is the *default* live catalog price. Each plan's price can be
// overridden per-environment; see resolvePriceId below.
export const PLAN_CONFIG: Record<BillingPlan, { priceId: string; entitlement: "pro" | "lifetime"; mode: "subscription" | "payment" }> = {
  "pro-monthly": { priceId: "price_1UAx9zFVePBsKetGtqocur09", entitlement: "pro", mode: "subscription" },
  "pro-annual": { priceId: "price_1UAxAeFVePBsKetGKHON6EsG", entitlement: "pro", mode: "subscription" },
  lifetime: { priceId: "price_1UAxB6FVePBsKetGLLCEt5Z9", entitlement: "lifetime", mode: "payment" },
};

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "pro-monthly" || value === "pro-annual" || value === "lifetime";
}

const PRICE_ENV_VAR: Record<BillingPlan, string> = {
  "pro-monthly": "ALVIRA_STRIPE_PRICE_PRO_MONTHLY",
  "pro-annual": "ALVIRA_STRIPE_PRICE_PRO_ANNUAL",
  lifetime: "ALVIRA_STRIPE_PRICE_LIFETIME",
};

// Live price IDs do not resolve under a test-mode secret key, so with the
// catalog hardcoded the checkout path could only ever be exercised against live
// Stripe -- every verification run risked opening a real cs_live_ session.
// Pairing ALVIRA_STRIPE_SECRET_KEY with these makes a test-mode run possible.
//
// Unset falls back to the live default, so production is unchanged by this.
// A *malformed* override fails closed instead: silently falling back to the
// live price would hand a real charge surface to someone who believed they had
// configured test mode, which is the one outcome worse than a broken checkout.
export function resolvePriceId(plan: BillingPlan): string {
  const varName = PRICE_ENV_VAR[plan];
  const override = process.env[varName]?.trim();
  if (!override) return PLAN_CONFIG[plan].priceId;
  if (!override.startsWith("price_")) {
    console.error("[stripe-checkout] invalid Stripe price override", { source: varName, plan });
    throw new Error("Stripe checkout is not configured.");
  }
  return override;
}

export function buildCheckoutSessionParams(user: User, plan: BillingPlan): URLSearchParams {
  const config = PLAN_CONFIG[plan];
  const body = new URLSearchParams();
  body.set("mode", config.mode);
  body.set("line_items[0][price]", resolvePriceId(plan));
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", `${SITE_URL}/account?checkout=success&plan=${encodeURIComponent(plan)}`);
  body.set("cancel_url", `${SITE_URL}/pricing?checkout=cancelled`);
  body.set("client_reference_id", user.id);
  body.set("metadata[app]", "alvira");
  body.set("metadata[alvira_user_id]", user.id);
  body.set("metadata[entitlement]", config.entitlement);
  body.set("metadata[plan]", plan);
  body.set("metadata[catalog_version]", "2026-09-01");

  const existingCustomerId = user.stripe_customer_id;
  if (existingCustomerId) body.set("customer", existingCustomerId);
  else body.set("customer_email", user.email);

  if (config.mode === "subscription") {
    body.set("allow_promotion_codes", "true");
    body.set("payment_method_collection", "if_required");
    body.set("subscription_data[metadata][app]", "alvira");
    body.set("subscription_data[metadata][alvira_user_id]", user.id);
    body.set("subscription_data[metadata][entitlement]", "pro");
    body.set("subscription_data[metadata][plan]", plan);
  } else if (!existingCustomerId) {
    // Stripe rejects `customer_creation` when an existing `customer` is attached
    // to the session. Only request creation on the branch that sends
    // customer_email instead, otherwise every returning customer's one-time
    // purchase is rejected before it reaches Checkout.
    body.set("customer_creation", "always");
  }

  return body;
}
