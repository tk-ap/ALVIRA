import { describe, expect, test } from "bun:test";
import { DEPTHS, FAST_TRACK_AREAS, areasForDepth, depthPromptSection, depthSettings, parseDepth } from "../src/lib/interview-depth";
import { pickNextArea } from "../src/lib/interview-goal";
import { getKnowledgeGraph, getPlaybook, type InterviewState } from "../src/routes/-knowledgeGraph";

const GRAPH = getKnowledgeGraph("personal");
const THRESHOLD = getPlaybook("personal").completion.minimumConfidence;
const TOPIC = "My goals, priorities, and how I evaluate tradeoffs, TK — sources check (2026-10-16)";

function stateFor(depth: InterviewState["depth"], extra: Partial<InterviewState> = {}): InterviewState {
  return { tier: "personal", topic: TOPIC, domains: {}, history: [], currentDomain: null, depth, ...extra };
}

describe("parseDepth", () => {
  test("accepts the three depths and nothing else", () => {
    expect(["fast", "standard", "deep", "Fast", "", null, 3].map(parseDepth)).toEqual(["fast", "standard", "deep", undefined, undefined, undefined, undefined]);
  });

  test("a missing depth behaves as standard", () => {
    expect(depthSettings(undefined)).toBe(DEPTHS.standard);
  });
});

describe("areasForDepth", () => {
  test("standard and deep keep every area", () => {
    expect(areasForDepth(GRAPH, stateFor("standard"))).toBe(GRAPH);
    expect(areasForDepth(GRAPH, stateFor("deep"))).toBe(GRAPH);
    expect(areasForDepth(GRAPH, stateFor(undefined))).toBe(GRAPH);
  });

  test("fast track keeps the starting point's areas, the goal's closest areas and sources", () => {
    const ids = areasForDepth(GRAPH, stateFor("fast", { history: [{ role: "assistant", content: "Q" }] })).map((d) => d.id);
    expect(ids).toContain("goals");
    expect(ids).toContain("decisionFrameworks");
    expect(ids).toContain("sources");
    expect(ids).not.toContain("updates");
    // Handoff core (E2E 2026-10-16 run dropped constraints and current projects).
    for (const id of ["constraints", "currentProjects", "unknowns"]) expect(ids).toContain(id);
    expect(ids.length).toBe(FAST_TRACK_AREAS + 1);
  });

  test("fast track does not shift as answers come in, and keeps answered areas", () => {
    const history = [{ role: "assistant" as const, content: "Q" }, { role: "user" as const, content: "My daily routine and family come first." }];
    const before = areasForDepth(GRAPH, stateFor("fast", { history })).map((d) => d.id);
    const after = areasForDepth(GRAPH, stateFor("fast", { history, domains: { dailyLife: { answers: ["mornings"], confidence: 1, covered: true } } })).map((d) => d.id);
    expect(after).toEqual(GRAPH.map((d) => d.id).filter((id) => before.includes(id) || id === "dailyLife"));
  });

  test("a continued fast profile keeps the open update question", () => {
    expect(areasForDepth(GRAPH, stateFor("fast")).map((d) => d.id)).toContain("updates");
  });
});

describe("follow-up limits by depth", () => {
  const answeredGoals = (depth: InterviewState["depth"], answers: string[]) =>
    pickNextArea(
      areasForDepth(GRAPH, stateFor(depth, { history: [{ role: "assistant", content: "Q" }, { role: "user", content: answers.at(-1)! }] })),
      stateFor(depth, {
        domains: { goals: { answers, confidence: 0.95, covered: true } },
        history: [{ role: "assistant", content: "Q" }, { role: "user", content: answers.at(-1)! }],
      }),
      { answeredDomainId: "goals", confidenceThreshold: THRESHOLD, limits: depthSettings(depth) },
    );

  test("deep dive follows up twice on an area that touches the goal; standard once", () => {
    const touch = ["My priority is the Ashwood goal.", "Priorities change weekly with my goals."];
    expect(answeredGoals("standard", touch)?.domain.id).not.toBe("goals");
    expect(answeredGoals("deep", touch)).toMatchObject({ domain: { id: "goals" }, reason: "goal-follow-up" });
  });

  test("fast track stops chasing an unresolved area after two answers", () => {
    const state = stateFor("fast", {
      domains: { goals: { answers: ["not sure", "still unsure"], confidence: 0.3, covered: false } },
      history: [{ role: "assistant", content: "Q" }, { role: "user", content: "still unsure" }],
    });
    const fast = pickNextArea(areasForDepth(GRAPH, state), state, { answeredDomainId: "goals", confidenceThreshold: THRESHOLD, limits: depthSettings("fast") });
    const standard = pickNextArea(GRAPH, { ...state, depth: "standard" }, { answeredDomainId: "goals", confidenceThreshold: THRESHOLD, limits: depthSettings("standard") });
    expect(fast?.reason).not.toBe("unresolved-follow-up");
    expect(standard).toMatchObject({ domain: { id: "goals" }, reason: "unresolved-follow-up" });
  });
});

describe("depthPromptSection", () => {
  test("tells the generator how deep to go, and says nothing for standard", () => {
    expect(depthPromptSection("fast")).toContain("single most useful fact");
    expect(depthPromptSection("deep")).toContain("examples, numbers, names, dates");
    expect(depthPromptSection("standard")).toBe("");
    expect(depthPromptSection(undefined)).toBe("");
  });
});
