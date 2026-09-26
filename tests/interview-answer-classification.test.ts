import { describe, expect, test } from "bun:test";
import { detectTopicalMismatch, detectUserQuestion, validateAnswer } from "../src/routes/-validation";

describe("answers are not discarded by question detection", () => {
  const substantive =
    "What matters most right now is income, so I'm focused on job applications and interview prep. I care about what is proven versus prototype, and how do I keep the product work moving without it taking over the week.";

  test("short clarifying questions are still detected", () => {
    expect(detectUserQuestion("what do you mean by that")).toBe(true);
    expect(detectUserQuestion("Can you give an example")).toBe(true);
    expect(detectUserQuestion("Should I include side projects?")).toBe(true);
  });

  test("a long answer that starts with or contains question words is an answer", () => {
    expect(detectUserQuestion(substantive)).toBe(false);
    expect(validateAnswer("goals", substantive, []).isUserQuestion).toBe(false);
  });

  test("a long message ending in a question mark is still a question", () => {
    expect(detectUserQuestion(`${substantive} Does that answer it, or do you need the dates too?`)).toBe(true);
  });
});

describe("current projects topicality", () => {
  test("plural project and deadline words count as on-topic", () => {
    const answer = "I have three projects in flight and two deadlines next month; the budget is tight and cost is a hard constraint.";
    expect(detectTopicalMismatch("currentProjects", answer).mismatch).toBe(false);
  });
});

import { detectGaps } from "../src/routes/-gapDetection";
import { getKnowledgeGraph } from "../src/routes/-knowledgeGraph";

describe("skipped areas", () => {
  test("an area the person skipped is not asked again immediately", () => {
    const graph = getKnowledgeGraph("personal");
    const domains = Object.fromEntries(graph.map((d) => [d.id, { answers: [] as string[], confidence: 0, covered: false }]));
    const first = detectGaps(graph, { tier: "personal", topic: "t", domains, history: [], currentDomain: null } as never)[0].domain.id;
    domains[first] = { answers: [], confidence: 0.9, covered: true, skipped: true } as never;
    const next = detectGaps(graph, { tier: "personal", topic: "t", domains, history: [], currentDomain: null } as never)[0].domain.id;
    expect(next).not.toBe(first);
  });
});
