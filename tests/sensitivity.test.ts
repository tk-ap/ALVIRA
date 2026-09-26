import { describe, expect, test } from "bun:test";
import { isSensitive, redactSensitiveDeep, redactSensitiveState, WITHHELD } from "../src/lib/sensitivity";
import { compileKnowledge } from "../src/routes/-knowledgeCompiler";
import type { Domain, InterviewState } from "../src/routes/-knowledgeGraph";

const SENSITIVE = "[SENSITIVE — release only for money, housing or scheduling decisions] Agent report: housing costs about $4,200/month.";

describe("sensitive context", () => {
  test("detects the leading label only", () => {
    expect(isSensitive(SENSITIVE)).toBe(true);
    expect(isSensitive("Budget is $0; see [SENSITIVE] notes elsewhere")).toBe(false);
  });

  test("Bridge redaction removes sensitive answers and keeps knowledge marks aligned", () => {
    const state = { domains: { constraints: { answers: ["Budget is $0.", SENSITIVE, "No car."], knowledge: ["KNOWN", "KNOWN", "INFERRED"] } }, history: [{ role: "user", content: SENSITIVE }] };
    const { state: out, withheld } = redactSensitiveState(state);
    expect(withheld).toBe(1);
    expect(out.domains.constraints.answers).toEqual(["Budget is $0.", "No car."]);
    expect(out.domains.constraints.knowledge).toEqual(["KNOWN", "INFERRED"]);
    expect(out.history?.[0].content).toBe(WITHHELD);
  });

  test("portrait text masks sensitive paragraphs", () => {
    const portrait = { markdownFiles: { "constraints.md": `# Constraints\n\nBudget is $0.\n\n${SENSITIVE}` } };
    const out = redactSensitiveDeep(portrait);
    expect(out.markdownFiles["constraints.md"]).toContain("Budget is $0.");
    expect(out.markdownFiles["constraints.md"]).not.toContain("4,200");
  });

  test("compiled files withhold sensitive answers and say so", () => {
    const graph = [{ id: "constraints", label: "Constraints", description: "", promptHint: "", required: true, minAnswers: 1, priority: 1, outputFile: "constraints" }] as Domain[];
    const state = { tier: "personal", topic: "TK", domains: { constraints: { answers: ["Budget is $0.", SENSITIVE], confidence: 1, covered: true } }, history: [], currentDomain: null } as InterviewState;
    const files = compileKnowledge(state, graph);
    expect(files.constraints).toContain("Budget is $0.");
    expect(files.constraints).not.toContain("4,200");
    expect(files.overview).toContain("1 sensitive item is kept in the saved Context");
  });
});

import { displayableLatest } from "../src/lib/sensitivity";
describe("previews", () => {
  test("never show a sensitive item's text", () => {
    expect(displayableLatest(["No car.", SENSITIVE])).toBe("No car.");
    expect(displayableLatest([SENSITIVE])).toBe("Sensitive item saved — hidden from previews.");
  });
});
