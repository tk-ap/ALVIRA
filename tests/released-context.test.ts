import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { normalizeGoalSpecDraft, reviewGoalSpecField, storedAnswerCount, citableAnswers } from "../src/lib/goal-spec";
import { buildStructuredInterviewExport, serializeInterviewJson } from "../src/lib/interview-exports";
import { releasedContextState, releasedSources } from "../src/lib/released-context";
import { getKnowledgeGraph, type InterviewState } from "../src/routes/-knowledgeGraph";

const GRAPH = getKnowledgeGraph("personal");
const base = {
  tier: "personal",
  topic: "TK — Ashwood second brain",
  domains: {
    goals: { answers: ["One central Context record any AI can read."], confidence: 1, covered: true },
    constraints: { answers: ["[SENSITIVE — money] Savings run out in March."], confidence: 1, covered: true },
  },
  history: [],
  currentDomain: null,
  contextSources: [
    { id: "a", type: "website", label: "alviratech.vercel.app", locator: "https://alviratech.vercel.app", status: "ready", addedAt: "2026-10-17T00:00:00Z" },
    { id: "b", type: "website", label: "docs.google.com", locator: "https://docs.google.com/document/d/PRIVATE123/edit", status: "needs-review", addedAt: "2026-10-17T00:00:00Z" },
    { id: "c", type: "website", label: "files", locator: "https://files.example.com/x?access_token=TOK9", status: "ready", addedAt: "2026-10-17T00:00:00Z" },
  ],
} as unknown as InterviewState;
const citable = citableAnswers(base, GRAPH);
const draft = normalizeGoalSpecDraft(
  { fields: { goal: { value: "One central Context record.", citations: ["goals#0"] }, done: { value: "Read by both AIs.", citations: ["goals#0"] } } },
  citable,
  { actor_type: "human" },
  storedAnswerCount(base),
);

describe("released sources", () => {
  test("only owner-confirmed sources, never one carrying a credential", () => {
    expect(releasedSources(base.contextSources).map((s) => s.id)).toEqual(["a"]);
  });
});

describe("what the Bridge releases for a saved Context", () => {
  test("the raw goal-spec draft is never sent; pending fields give no goal_spec", () => {
    const out = releasedContextState({ ...base, goalSpec: draft });
    expect("goalSpec" in out.state).toBe(false);
    expect(out.goal_spec).toBeNull();
    expect(JSON.stringify(out)).not.toContain("Read by both AIs.");
  });

  test("approved, up-to-date fields are sent as goal_spec; rejected and pending ones are not", () => {
    const spec = reviewGoalSpecField(reviewGoalSpecField(draft, "goal", "approve"), "done", "reject");
    const out = releasedContextState({ ...base, goalSpec: spec });
    expect(out.goal_spec?.schema).toBe("alvira.goal-spec.v1");
    expect(Object.keys(out.goal_spec!.fields)).toEqual(["goal"]);
    expect(JSON.stringify(out)).not.toContain("Read by both AIs.");
  });

  test("a goal spec drafted before the latest answers is not sent", () => {
    const spec = reviewGoalSpecField(draft, "goal", "approve");
    const changed = { ...base, goalSpec: spec, domains: { ...base.domains, goals: { ...base.domains.goals, answers: [...base.domains.goals.answers, "New."] } } } as InterviewState;
    expect(releasedContextState(changed).goal_spec).toBeNull();
  });

  test("links awaiting review and credential links never reach a connected AI", () => {
    const out = releasedContextState(base);
    const text = JSON.stringify(out);
    expect(text).not.toContain("PRIVATE123");
    expect(text).not.toContain("TOK9");
    expect(text).toContain("https://alviratech.vercel.app");
  });

  test("sensitive answers are withheld by default and counted", () => {
    const out = releasedContextState(base);
    expect(JSON.stringify(out.state)).not.toContain("Savings run out");
    expect(out.withheld).toBe(1);
  });

  test("include_sensitive returns sensitive answers but still never the draft or unconfirmed links", () => {
    const out = releasedContextState({ ...base, goalSpec: draft }, { includeSensitive: true });
    const text = JSON.stringify(out);
    expect(text).toContain("Savings run out");
    expect(text).not.toContain("PRIVATE123");
    expect("goalSpec" in out.state).toBe(false);
  });

  test("getBridgeProfiles uses the shared release step", () => {
    const bridge = readFileSync("src/lib/bridge.ts", "utf8");
    expect(bridge).toContain("const released = releasedContextState(JSON.parse(row.state_json), { includeSensitive: options.includeSensitive });");
    expect(bridge).toContain("goal_spec: released.goal_spec,");
  });
});

describe("structured download (context.json / context.toon)", () => {
  const json = serializeInterviewJson(buildStructuredInterviewExport({ ...base, goalSpec: draft }, GRAPH, "context"));

  test("sensitive answers are withheld, as in the .md files", () => {
    expect(json).not.toContain("Savings run out");
    expect(json).toContain("[withheld: sensitive");
  });

  test("only owner-confirmed sources are exported", () => {
    expect(json).not.toContain("PRIVATE123");
    expect(json).not.toContain("TOK9");
    expect(json).toContain("https://alviratech.vercel.app");
  });

  test("the goal-spec draft is not part of the structured export", () => {
    expect(json).not.toContain("Read by both AIs.");
  });
});

describe("the topic as it leaves ALVIRA (Codex review of a5f9c55)", () => {
  const sensitive = { ...base, topic: "[SENSITIVE — money] private goal" } as InterviewState;
  const linked = { ...base, topic: "Plan at https://docs.google.com/document/d/PRIVTOPIC/edit and https://x.example.com/a?token=TOPTOK" } as InterviewState;

  test("a sensitive topic is withheld by default in Bridge state and the structured download", () => {
    expect(JSON.stringify(releasedContextState(sensitive).state)).not.toContain("private goal");
    expect(serializeInterviewJson(buildStructuredInterviewExport(sensitive, GRAPH, "context"))).not.toContain("private goal");
  });

  test("include_sensitive returns a sensitive topic", () => {
    expect(releasedContextState(sensitive, { includeSensitive: true }).state.topic).toContain("private goal");
  });

  test("links in the topic never ride along, even with include_sensitive", () => {
    for (const out of [
      JSON.stringify(releasedContextState(linked).state),
      JSON.stringify(releasedContextState(linked, { includeSensitive: true }).state),
      serializeInterviewJson(buildStructuredInterviewExport(linked, GRAPH, "context")),
    ]) {
      expect(out).not.toContain("PRIVTOPIC");
      expect(out).not.toContain("TOPTOK");
    }
  });

  test("the Bridge's top-level profile topic uses the same sanitizer", () => {
    const bridge = readFileSync("src/lib/bridge.ts", "utf8");
    expect(bridge).toContain("topic: releasedTopic(row.topic),");
    expect(bridge).toContain("topic: releasedTopic(row.topic, { includeSensitive: true }),");
    expect(bridge).not.toMatch(/topic: row\.topic/);
  });
});
