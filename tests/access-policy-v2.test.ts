import { describe, expect, test } from "bun:test";
import { consumesSavedContextSlot, hasFoundingBetaCustomerAccess } from "../src/lib/access-policy-v2";

describe("customer access policy", () => {
  test("founding beta is unrestricted customer access", () => {
    expect(hasFoundingBetaCustomerAccess({ tier: "founding_beta" })).toBe(true);
    expect(hasFoundingBetaCustomerAccess({ tier: "free" })).toBe(false);
  });

  test("Reflect does not consume a second saved Context slot", () => {
    expect(consumesSavedContextSlot("meos")).toBe(false);
    expect(consumesSavedContextSlot("context")).toBe(true);
  });
});
