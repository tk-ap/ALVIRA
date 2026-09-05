import { describe, expect, test } from "bun:test";
import { buildCheckoutSessionParams, PLAN_CONFIG } from "../src/lib/stripe-checkout-params";
import type { User } from "../src/db";

const baseUser = { id: "user_123", email: "buyer@example.com" } as User;
const returningUser = { ...baseUser, stripe_customer_id: "cus_existing123" } as User;

describe("Stripe Checkout session parameters", () => {
  test("lifetime is the only one-time payment plan", () => {
    expect(PLAN_CONFIG.lifetime.mode).toBe("payment");
    expect(PLAN_CONFIG["pro-monthly"].mode).toBe("subscription");
    expect(PLAN_CONFIG["pro-annual"].mode).toBe("subscription");
  });

  // Regression: Stripe rejects customer_creation when an existing customer is
  // attached, which returned 400 from Stripe and surfaced as a 502 on
  // /api/stripe/checkout for every returning customer buying lifetime.
  test("a returning customer buying lifetime does not send customer_creation", () => {
    const params = buildCheckoutSessionParams(returningUser, "lifetime");
    expect(params.get("customer")).toBe("cus_existing123");
    expect(params.has("customer_creation")).toBe(false);
    expect(params.has("customer_email")).toBe(false);
  });

  test("a new customer buying lifetime still requests customer creation", () => {
    const params = buildCheckoutSessionParams(baseUser, "lifetime");
    expect(params.get("customer_email")).toBe("buyer@example.com");
    expect(params.get("customer_creation")).toBe("always");
    expect(params.has("customer")).toBe(false);
  });

  test("customer and customer_creation are never both present, for any plan", () => {
    for (const plan of ["pro-monthly", "pro-annual", "lifetime"] as const) {
      for (const user of [baseUser, returningUser]) {
        const params = buildCheckoutSessionParams(user, plan);
        expect(params.has("customer") && params.has("customer_creation")).toBe(false);
      }
    }
  });

  test("subscription plans keep promotion codes and subscription metadata", () => {
    const params = buildCheckoutSessionParams(returningUser, "pro-monthly");
    expect(params.get("allow_promotion_codes")).toBe("true");
    expect(params.get("subscription_data[metadata][alvira_user_id]")).toBe("user_123");
    expect(params.has("customer_creation")).toBe(false);
  });

  test("one-time payment plans do not send subscription-only fields", () => {
    const params = buildCheckoutSessionParams(baseUser, "lifetime");
    expect(params.has("allow_promotion_codes")).toBe(false);
    expect(params.has("subscription_data[metadata][app]")).toBe(false);
  });

  test("entitlement and plan metadata are carried for the webhook", () => {
    const params = buildCheckoutSessionParams(baseUser, "lifetime");
    expect(params.get("metadata[entitlement]")).toBe("lifetime");
    expect(params.get("metadata[plan]")).toBe("lifetime");
    expect(params.get("client_reference_id")).toBe("user_123");
  });
});
