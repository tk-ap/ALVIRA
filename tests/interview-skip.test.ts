import { describe, expect, test } from "bun:test";
import { detectMoveOnRequest } from "../src/routes/-validation";
import { detectGaps, countCovered, allRequiredCovered } from "../src/routes/-gapDetection";
import { getKnowledgeGraph, type InterviewState } from "../src/routes/-knowledgeGraph";

function state(overrides: Partial<InterviewState> = {}): InterviewState {
  return {
    tier: "personal",
    topic: "test",
    domains: {},
    history: [],
    currentDomain: null,
    ...overrides,
  };
}

describe("move-on / frustration detection", () => {
  test("explicit move-on phrases are honored", () => {
    for (const phrase of [
      "skip this", "move on", "next question", "not relevant",
      "doesn't apply", "don't care", "tired of this", "this is frustrating",
    ]) {
      expect(detectMoveOnRequest(phrase)).toBe(true);
    }
  });

  test("short dismissals are honored", () => {
    for (const phrase of ["skip", "next", "pass", "nah", "n/a", "boring"]) {
      expect(detectMoveOnRequest(phrase)).toBe(true);
    }
  });

  test("a longer answer that merely mentions 'skip' is not move-on", () => {
    expect(
      detectMoveOnRequest("In emergencies we skip the review step and escalate to the director"),
    ).toBe(false);
  });

  test("a normal substantive answer is not move-on", () => {
    expect(
      detectMoveOnRequest("I weigh tradeoffs first and move fast on reversible decisions"),
    ).toBe(false);
  });
});

describe("skipped domains are excluded from gap detection", () => {
  const graph = getKnowledgeGraph("personal");

  test("a skipped domain produces no gap", () => {
    const ids = detectGaps(graph, state({ skippedDomains: ["identity"] }), 0.9).map((g) => g.domain.id);
    expect(ids).not.toContain("identity");
  });

  test("skipping every required domain still satisfies allRequiredCovered", () => {
    const requiredIds = graph.filter((d) => d.required).map((d) => d.id);
    expect(allRequiredCovered(graph, state({ skippedDomains: requiredIds }), 0.9)).toBe(true);
  });

  test("countCovered counts skipped domains as resolved", () => {
    expect(countCovered(graph, state({ skippedDomains: ["identity"] }), 0.9)).toBeGreaterThanOrEqual(1);
  });
});
