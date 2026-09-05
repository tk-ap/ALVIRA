import { describe, expect, test } from "bun:test";
import { deriveOpportunityCandidates } from "../src/lib/opportunity-candidates";

describe("natural AI opportunity candidates", () => {
  test("keeps the validated mobile QA fixture to Goals and Current Projects", () => {
    const candidates = deriveOpportunityCandidates({
      topic: "Streetwear brand",
      domains: {
        goals: {
          answers: ["I want to make each clothing drop feel more cohesive and intentional."],
          confidence: 0.92,
          covered: true,
        },
        currentProjects: {
          answers: ["I am building the next collection and preparing the launch campaign this month."],
          confidence: 0.9,
          covered: true,
        },
        constraints: {
          answers: ["I want to keep creative control over the brand."],
          confidence: 0.95,
          covered: true,
        },
      },
    });

    expect(candidates.map((candidate) => candidate.domainId)).toEqual([
      "goals",
      "currentProjects",
    ]);
    expect(candidates.some((candidate) => candidate.sourceAnswer.includes("creative control"))).toBe(false);
  });

  test("does not turn a generic preference into an AI opportunity", () => {
    const candidates = deriveOpportunityCandidates({
      topic: "Personal Context",
      domains: {
        preferences: {
          answers: ["I prefer direct answers and visual examples."],
          confidence: 0.98,
          covered: true,
        },
      },
    });

    expect(candidates).toEqual([]);
  });
});
