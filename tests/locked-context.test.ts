import { describe, expect, test } from "bun:test";
import { getKnowledgeGraph, type InterviewState } from "../src/routes/-knowledgeGraph";
import { compileKnowledge } from "../src/routes/-knowledgeCompiler";

function makeState(domains: InterviewState["domains"]): InterviewState {
  return { tier: "personal", topic: "Test context", domains, history: [], currentDomain: null };
}

describe("locked context class", () => {
  test("constraints, rules, exceptions, decisionFrameworks are the locked domains", () => {
    const graph = getKnowledgeGraph("personal");
    const locked = graph.filter((d) => d.kind === "locked").map((d) => d.id);
    expect(locked.sort()).toEqual(["constraints", "decisionFrameworks", "exceptions", "rules"]);
  });

  test("locked domains render with a 🔒 marker + requirement note", () => {
    const graph = getKnowledgeGraph("personal");
    const state = makeState({
      constraints: { answers: ["Never ship without owner review."], confidence: 1, covered: true },
    });
    const out = compileKnowledge(state, graph);
    expect(out).toContain("## Constraints 🔒");
    expect(out).toContain("_Requirement");
  });

  test("descriptive domains render without a 🔒 marker", () => {
    const graph = getKnowledgeGraph("personal");
    const state = makeState({
      identity: { answers: ["I run a small design studio."], confidence: 1, covered: true },
    });
    const out = compileKnowledge(state, graph);
    expect(out).toContain("## Identity");
    expect(out).not.toContain("## Identity 🔒");
  });
});
