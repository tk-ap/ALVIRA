import { describe, expect, test } from "bun:test";
import { detectTopicalMismatch, validateAnswer } from "../src/routes/-validation";

describe("interview topical-fit validation", () => {
  test("catches the launch-audit decision-style answer under Current Projects", () => {
    const result = validateAnswer(
      "currentProjects",
      "I decide slowly and over-research before committing to important choices.",
      [],
    );

    expect(result.topicMismatch).toBe(true);
    expect(result.suggestedDomainId).toBe("decisionFrameworks");
    expect(result.isUserQuestion).toBe(true); // routes through the non-answer clarification path
    expect(result.confidence).toBe(0);
  });

  test("catches a constraints answer under Identity", () => {
    const result = detectTopicalMismatch(
      "identity",
      "My constraints are cash runway and I cannot take on any new debt right now.",
    );

    expect(result.mismatch).toBe(true);
    expect(result.suggestedDomainId).toBe("constraints");
  });

  test("catches a communication-preference answer under Goals", () => {
    const result = validateAnswer(
      "goals",
      "I prefer direct, concise advice and concrete explanations without a lot of filler.",
      [],
    );

    expect(result.topicMismatch).toBe(true);
    expect(["communication", "preferences"]).toContain(result.suggestedDomainId);
  });

  test("keeps an on-topic Current Projects answer usable", () => {
    const result = validateAnswer(
      "currentProjects",
      "I am building ALVIRA right now and preparing the next launch milestone for this month.",
      [],
    );

    expect(result.topicMismatch).not.toBe(true);
    expect(result.isUserQuestion).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  test("allows a cross-domain answer when it still answers the current domain", () => {
    const result = validateAnswer(
      "goals",
      "My goal is to launch the product this month, but I also need to stay inside a tight budget.",
      [],
    );

    expect(result.topicMismatch).not.toBe(true);
    expect(result.isUserQuestion).toBe(false);
  });

  test("prefers false negatives for ambiguous answers instead of over-classifying", () => {
    const result = validateAnswer(
      "goals",
      "Financial independence by 35 would change what I can choose next.",
      [],
    );

    expect(result.topicMismatch).not.toBe(true);
  });

  test("does not apply Context-domain mismatch heuristics to unsupported domains", () => {
    const result = validateAnswer(
      "currentChapter",
      "I want to grow into work that feels more aligned with the life I am building.",
      [],
    );

    expect(result.topicMismatch).not.toBe(true);
  });

  test("preserves the existing user-question clarification behavior", () => {
    const result = validateAnswer("constraints", "What do you mean by constraints?", []);

    expect(result.isUserQuestion).toBe(true);
    expect(result.topicMismatch).not.toBe(true);
    expect(result.needsClarification).toBe(false);
  });
});
