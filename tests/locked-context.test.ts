import { describe, expect, test } from "bun:test";
import { getKnowledgeGraph, shouldConfirmLockedChange, checkLockedFidelity, defaultProvenance, type InterviewState } from "../src/routes/-knowledgeGraph";
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

  test("shouldConfirmLockedChange is true only for a locked domain with a prior answer", () => {
    const graph = getKnowledgeGraph("personal");
    expect(shouldConfirmLockedChange(graph, "constraints", 1)).toBe(true);
    expect(shouldConfirmLockedChange(graph, "constraints", 0)).toBe(false);
    expect(shouldConfirmLockedChange(graph, "identity", 1)).toBe(false);
  });

  test("checkLockedFidelity flags a cleared locked requirement", () => {
    const graph = getKnowledgeGraph("personal");
    const issues = checkLockedFidelity(
      graph,
      { constraints: { answers: ["Never ship without owner review."] } },
      { constraints: { answers: [] } },
    );
    expect(issues.some((i) => i.domainId === "constraints" && /cleared/i.test(i.message))).toBe(true);
  });

  test("checkLockedFidelity flags a revision that contradicts a locked requirement", () => {
    const graph = getKnowledgeGraph("personal");
    const issues = checkLockedFidelity(
      graph,
      { constraints: { answers: ["We must always encrypt user data."] } },
      { constraints: { answers: ["We must always encrypt user data.", "We don't encrypt user data."] } },
    );
    expect(issues.some((i) => i.domainId === "constraints" && /contradict/i.test(i.message))).toBe(true);
  });

  test("checkLockedFidelity ignores descriptive domains and non-contradicting additions", () => {
    const graph = getKnowledgeGraph("personal");
    const issues = checkLockedFidelity(
      graph,
      {
        identity: { answers: ["I run a studio."] },
        constraints: { answers: ["Never ship without review."] },
      },
      {
        identity: { answers: ["I run a design studio."] },
        constraints: { answers: ["Never ship without review.", "Also cap infra spend."] },
      },
    );
    expect(issues).toEqual([]);
  });

  test("defaultProvenance marks an interview answer as a verbatim statement", () => {
    expect(defaultProvenance()).toEqual({ source: "interview", kind: "statement" });
  });

  test("compiler renders a Sources section listing provenance", () => {
    const graph = getKnowledgeGraph("personal");
    const state = {
      ...makeState({ identity: { answers: ["I run a studio."], confidence: 1, covered: true } }),
      contextSources: [{ id: "s1", type: "website", label: "My portfolio", locator: "https://example.com" }],
    } as InterviewState;
    const out = compileKnowledge(state, graph);
    expect(out).toContain("## Sources");
    expect(out).toContain("My portfolio");
    expect(out).toContain("https://example.com");
  });
});
