import { describe, expect, test } from "bun:test";
import { DEPTHS, FAST_TRACK_AREAS, areasForDepth, depthPromptSection, depthSettings, parseDepth } from "../src/lib/interview-depth";
import { pickNextArea, setAsideCappedAreas } from "../src/lib/interview-goal";
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

  test("a fresh fast-track interview (empty history) does not include Updates (Codex review of c7a99f5)", () => {
    const fresh = areasForDepth(GRAPH, stateFor("fast"));
    expect(fresh.map((d) => d.id)).not.toContain("updates");
    expect(fresh.length).toBe(FAST_TRACK_AREAS + 1);
    expect(pickNextArea(fresh, stateFor("fast"), { confidenceThreshold: THRESHOLD, limits: depthSettings("fast") })?.domain.id).toBe("goals");
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

describe("an area that stays below the confidence bar is not asked forever (E2E deep dive 2026-10-16)", () => {
  // Decision frameworks is a starting-point area for this topic; answers rated 0.8 never clear the 0.9 bar.
  const lowConfidence = (n: number) => ({ answers: Array.from({ length: n }, (_, i) => `answer ${i}`), confidence: 0.8, covered: false });
  const history = [{ role: "assistant" as const, content: "Q" }, { role: "user" as const, content: "answer" }];

  for (const depth of ["fast", "standard", "deep"] as const) {
    test(`${depth}: not re-picked once it holds its cap of answers`, () => {
      const max = depthSettings(depth).maxUnresolvedAnswers;
      const state = stateFor(depth, { history, domains: { goals: { answers: ["x"], confidence: 1, covered: true }, sources: { answers: ["none"], confidence: 1, covered: true }, decisionFrameworks: lowConfidence(max) } });
      const next = pickNextArea(areasForDepth(GRAPH, state), state, { answeredDomainId: "decisionFrameworks", confidenceThreshold: THRESHOLD, limits: depthSettings(depth) });
      expect(next?.domain.id).not.toBe("decisionFrameworks");
    });
  }

  test("capped open areas are set aside, so the interview can finish", () => {
    const state = stateFor("fast", { history, domains: { decisionFrameworks: lowConfidence(2) } });
    const settled = setAsideCappedAreas(GRAPH, state, { confidenceThreshold: THRESHOLD, limits: depthSettings("fast") });
    expect(settled.domains.decisionFrameworks.skipped).toBe(true);
    expect(settled.domains.decisionFrameworks.answers).toHaveLength(2);
    expect(setAsideCappedAreas(GRAPH, settled, { confidenceThreshold: THRESHOLD, limits: depthSettings("fast") })).toBe(settled);
  });

  test("returns null rather than re-asking when every open area is capped", () => {
    const capped = Object.fromEntries(GRAPH.map((d) => [d.id, lowConfidence(4)]));
    expect(pickNextArea(GRAPH, stateFor("deep", { history, domains: capped }), { confidenceThreshold: THRESHOLD, limits: depthSettings("deep") })).toBeNull();
  });
});
