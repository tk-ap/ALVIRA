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

  test("suggested use conveys the value of the context and names the answer, not a generic plan", () => {
    const candidates = deriveOpportunityCandidates({
      topic: "Streetwear brand",
      domains: {
        goals: {
          answers: ["I want to make each clothing drop feel more cohesive and intentional."],
          confidence: 0.92,
          covered: true,
        },
      },
    });

    const goal = candidates.find((candidate) => candidate.domainId === "goals");
    expect(goal).toBeDefined();
    // Value framing, not the old generic action list.
    expect(goal!.suggestedUse).not.toMatch(/\b(plan|comparison|checklist|brief|draft|organize)\b/i);
    // Specific to the answer, not a repeated per-domain slogan.
    expect(goal!.suggestedUse).toContain("cohesive");
  });

  test("two answers in the same domain get distinct suggestions", () => {
    const candidates = deriveOpportunityCandidates({
      topic: "Personal Context",
      domains: {
        goals: {
          answers: [
            "I want to grow my newsletter audience this year.",
            "I want to hire a first engineer this quarter.",
          ],
          confidence: 0.95,
          covered: true,
        },
      },
    });

    const goals = candidates.filter((candidate) => candidate.domainId === "goals");
    expect(goals.length).toBe(2);
    expect(goals[0].suggestedUse).not.toEqual(goals[1].suggestedUse);
  });
});
