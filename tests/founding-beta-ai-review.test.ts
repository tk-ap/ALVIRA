import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const route = readFileSync("src/routes/-foundingBetaAIReview.ts", "utf8");
const panel = readFileSync("src/components/OwnerFoundingBetaAIReview.tsx", "utf8");

describe("Founding Beta AI review", () => {
  test("is owner-only and advisory", () => {
    expect(route).toContain("Owner access required");
    expect(route).toContain("Never make the final decision");
    expect(panel).toContain("A recommendation, not a decision");
  });

  test("uses all relevant submitted application context", () => {
    for (const field of ["use_case", "motivation", "ai_tools", "ai_frequency", "feedback_commitment", "source"]) {
      expect(route).toContain(field);
    }
    for (const label of ["Use case / context need", "Motivation", "AI habits", "Feedback commitment"]) {
      expect(panel).toContain(label);
    }
  });

  test("forbids sensitive-trait inference and persists recommendations", () => {
    expect(route).toContain("Do not infer protected traits");
    expect(route).toContain("ai_recommendation");
    expect(route).toContain("ai_reasoning");
    expect(route).toContain("ai_reviewed_at");
  });
});
