import { describe, expect, test } from "bun:test";
import { buildFoundingBetaDecisionEmail } from "../src/routes/-ownerCohort";

describe("Founding Beta application decision email", () => {
  test("approval for an existing account points back into ALVIRA", () => {
    const email = buildFoundingBetaDecisionEmail({
      decision: "approve",
      name: "Kai",
      hasAccount: true,
      siteUrl: "https://alviratech.vercel.app",
    });
    expect(email.subject).toContain("approved");
    expect(email.text).toContain("Hi Kai,");
    expect(email.text).toContain("Founding Beta access is now active");
    expect(email.text).toContain("https://alviratech.vercel.app/app");
    expect(email.text).not.toContain("/signup");
  });

  test("approval for a pre-account applicant creates a signup-oriented message", () => {
    const email = buildFoundingBetaDecisionEmail({
      decision: "approve",
      hasAccount: false,
      siteUrl: "https://alviratech.vercel.app/",
    });
    expect(email.text).toContain("place is now reserved");
    expect(email.text).toContain("https://alviratech.vercel.app/signup");
    expect(email.text).toContain("applied automatically");
  });

  test("denial does not imply entitlement", () => {
    const email = buildFoundingBetaDecisionEmail({ decision: "deny", hasAccount: false });
    expect(email.subject).toContain("Update");
    expect(email.text).toContain("aren’t able to offer a Founding Beta place");
    expect(email.text).not.toContain("access is now active");
    expect(email.text).not.toContain("place is now reserved");
  });
});
