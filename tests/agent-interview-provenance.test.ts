import { describe, expect, test } from "bun:test";
import { buildExperimentalQuestionPrompt } from "../src/lib/interview-prompts";
import { compileKnowledge } from "../src/routes/-knowledgeCompiler";
import type { Domain, InterviewState } from "../src/routes/-knowledgeGraph";

const graph = [
  { id: "goals", label: "Goals", description: "", promptHint: "", required: true, minAnswers: 1, priority: 1, outputFile: "overview" },
  { id: "money", label: "Finances", description: "", promptHint: "", required: false, minAnswers: 1, priority: 2, outputFile: "constraints" },
] as Domain[];

function state(provenance?: InterviewState["provenance"]): InterviewState {
  return {
    tier: "personal",
    topic: "TK",
    domains: {
      goals: { answers: ["Ship ALVIRA beta.", "Probably wants revenue by Q4."], confidence: 0.9, covered: true, knowledge: ["KNOWN", "INFERRED"] },
      money: { answers: [], confidence: 0, covered: true, unknown: true },
    },
    history: [],
    currentDomain: null,
    provenance,
  };
}

const agent = { actor_type: "agent", actor_id: "claude-code", subject_id: "u1", delegated: true, source_type: "interview", started_at: "2026-09-25T00:00:00Z" } as const;

describe("agent interview provenance", () => {
  test("marks agent-supplied context and never promotes inference to fact", () => {
    const files = compileKnowledge(state(agent), graph);
    expect(files.overview).toContain("Supplied by an agent (claude-code) on behalf of the subject, under delegation");
    expect(files.overview).toContain("\n\nShip ALVIRA beta.\n");
    expect(files.overview).toContain("[inferred — not confirmed by the subject] Probably wants revenue by Q4.");
    expect(files.overview).toContain("did not have enough evidence to answer: Finances");
  });

  test("leaves human-supplied context unchanged", () => {
    const human = state();
    human.domains.goals.knowledge = undefined;
    human.domains.money.unknown = undefined;
    const files = compileKnowledge(human, graph);
    expect(files.overview).not.toContain("Supplied by an agent");
    expect(files.overview).not.toContain("[inferred");
    expect(files.overview).not.toContain("## Unknown");
  });

  test("asks a delegated agent about the subject in the third person", () => {
    const base = { domain: { label: "Goals", promptHint: "Ask about goals." }, history: [], tier: "personal" as const };
    expect(buildExperimentalQuestionPrompt({ ...base, delegatedAgent: true })).toContain("Respondent: delegated agent");
    expect(buildExperimentalQuestionPrompt(base)).not.toContain("Respondent: delegated agent");
  });
});
