import { describe, expect, test } from "bun:test";
import { MAX_GOAL_FOLLOW_UPS, describeInterviewGoal, domainRelevance, followUpPromptSection, goalPromptSection, pickNextArea } from "../src/lib/interview-goal";
import { getKnowledgeGraph, getPlaybook, type InterviewState, type Message } from "../src/routes/-knowledgeGraph";

const OWNER_TOPIC =
  "My goals, priorities, and how I evaluate tradeoffs, TK — Ashwood second brain: one central, updated Context record (2026-10-15)";

function stateFor(topic: string, history: Message[] = [], domains: InterviewState["domains"] = {}, currentDomain?: string | null): InterviewState {
  return { tier: "personal", topic, domains, history, ...(currentDomain ? { currentDomain } : {}) } as InterviewState;
}

const GRAPH = getKnowledgeGraph("personal");
const THRESHOLD = getPlaybook("personal").completion.minimumConfidence;

function nextDomainId(state: InterviewState): string {
  return pickNextArea(GRAPH, state, { answeredDomainId: state.currentDomain, confidenceThreshold: THRESHOLD })!.domain.id;
}

/**
 * Mirrors app.tsx handleSend for a recorded (non-clarification) answer: append the answer to the
 * area, push the user message, clear currentDomain, then ask for the next area with the answered
 * area passed explicitly — exactly what handleSend hands to askNextQuestion.
 */
function answerAndPickNext(state: InterviewState, answer: string, confidence: number) {
  const area = state.currentDomain!;
  const existing = state.domains[area]?.answers ?? [];
  const updatedState: InterviewState = {
    ...state,
    domains: {
      ...state.domains,
      [area]: {
        answers: [...existing, answer],
        confidence,
        covered: confidence >= THRESHOLD && existing.length + 1 >= (GRAPH.find((d) => d.id === area)?.minAnswers ?? 1),
      },
    },
    history: [...state.history, { role: "user", content: answer }],
    currentDomain: null,
  };
  const next = pickNextArea(GRAPH, updatedState, { answeredDomainId: area, confidenceThreshold: THRESHOLD })!;
  return { updatedState: { ...updatedState, currentDomain: next.domain.id }, next };
}

function askedAbout(state: InterviewState, area: string): InterviewState {
  return { ...state, currentDomain: area, history: [...state.history, { role: "assistant", content: `Question about ${area}` }] };
}

describe("describeInterviewGoal", () => {
  test("splits the owner-run topic into the chosen starting point and the typed goal", () => {
    const goal = describeInterviewGoal(OWNER_TOPIC);
    expect(goal.startingPoints).toEqual(["Make decisions about goals, priorities, or next steps"]);
    expect(goal.customGoal).toBe("TK — Ashwood second brain: one central, updated Context record (2026-10-15)");
    expect(goal.focusDomainIds).toEqual(["goals", "decisionFrameworks"]);
    expect(goal.summary).toContain('They chose: "Make decisions about goals, priorities, or next steps".');
    expect(goal.summary).toContain('In their own words: "TK — Ashwood second brain');
  });

  test("recognises the start-screen wording as well as the stored label", () => {
    const goal = describeInterviewGoal("Plan and organize everyday life");
    expect(goal.startingPoints).toEqual(["Plan and organize everyday life"]);
    expect(goal.customGoal).toBe("");
    expect(goal.focusDomainIds).toEqual(["dailyLife", "processes"]);
  });

  test("keeps a typed-only goal and gives an empty summary when nothing was chosen", () => {
    expect(describeInterviewGoal("Get a new finance job").customGoal).toBe("Get a new finance job");
    expect(describeInterviewGoal("").summary).toBe("");
    expect(describeInterviewGoal(undefined).summary).toBe("");
  });
});

describe("pickNextArea (the handleSend → askNextQuestion step)", () => {
  test("starts with the areas the chosen starting point asks for", () => {
    expect(nextDomainId(stateFor(OWNER_TOPIC))).toBe("goals");
  });

  test("follows up on the area just answered when the answer left it unresolved", () => {
    const { updatedState, next } = answerAndPickNext(askedAbout(stateFor(OWNER_TOPIC), "currentProjects"), "Not sure yet.", 0.3);
    expect(updatedState.domains.currentProjects.covered).toBe(false);
    expect(next).toMatchObject({ domain: { id: "currentProjects" }, reason: "unresolved-follow-up" });
  });

  test("stops following up an unresolved area after three answers", () => {
    let state = askedAbout(stateFor(OWNER_TOPIC), "currentProjects");
    const reasons: string[] = [];
    for (const answer of ["a", "b", "c"]) {
      const { updatedState, next } = answerAndPickNext(state, answer, 0.3);
      reasons.push(`${next.domain.id}:${next.reason}`);
      state = askedAbout(updatedState, next.domain.id);
    }
    expect(reasons.slice(0, 2)).toEqual(["currentProjects:unresolved-follow-up", "currentProjects:unresolved-follow-up"]);
    expect(reasons[2]).not.toContain("currentProjects");
  });

  test("follows up once on a resolved area when the answer touches the goal", () => {
    const first = answerAndPickNext(
      askedAbout(stateFor(OWNER_TOPIC), "goals"),
      "My priority is building the Ashwood second brain so decisions stop depending on memory.",
      0.95,
    );
    expect(first.updatedState.domains.goals.covered).toBe(true);
    expect(first.next).toMatchObject({ domain: { id: "goals" }, reason: "goal-follow-up" });

    const second = answerAndPickNext(askedAbout(first.updatedState, "goals"), "It should hold my priorities and tradeoffs.", 0.95);
    expect(second.next.domain.id).not.toBe("goals");
  });

  test("moves on from a resolved area when the answer does not touch the goal", () => {
    const { next } = answerAndPickNext(askedAbout(stateFor(OWNER_TOPIC), "goals"), "I live in Los Angeles.", 0.95);
    expect(next.domain.id).not.toBe("goals");
  });

  test(`allows at most ${MAX_GOAL_FOLLOW_UPS} goal follow-ups per interview`, () => {
    const followedUp = Object.fromEntries(
      ["identity", "goals", "decisionFrameworks", "constraints"].map((id) => [id, { answers: ["x", "y"], confidence: 0.95, covered: true }]),
    );
    const { next } = answerAndPickNext(
      askedAbout(stateFor(OWNER_TOPIC, [], followedUp), "processes"),
      "My priorities and decisions run through one weekly review.",
      0.95,
    );
    expect(next.domain.id).not.toBe("processes");
  });

  test("a clarification stays on the area being clarified", () => {
    const state: InterviewState = {
      ...askedAbout(stateFor(OWNER_TOPIC), "currentProjects"),
      domains: { currentProjects: { answers: ["what do you mean?"], confidence: 0, covered: false } },
      history: [{ role: "assistant", content: "Q" }, { role: "user", content: "what do you mean?" }, { role: "assistant", content: "Clarifying..." }],
    };
    const next = pickNextArea(GRAPH, state, { answeredDomainId: "currentProjects", confidenceThreshold: THRESHOLD, clarifying: true });
    expect(next?.domain.id).toBe("currentProjects");
  });

  test("a typed goal pulls related areas ahead of unrelated personal-life ones", () => {
    const next = nextDomainId(stateFor("Track my current projects, deadlines and priorities"));
    expect(["dailyLife", "relationships", "background", "identity"]).not.toContain(next);
  });

  test("an answer that opens a thread raises that area's relevance", () => {
    const daily = GRAPH.find((domain) => domain.id === "dailyLife")!;
    const goal = describeInterviewGoal("Get a new finance job");
    expect(domainRelevance(daily, goal, ["My morning routine and daily habits keep slipping."])).toBeGreaterThan(
      domainRelevance(daily, goal, []),
    );
  });

  test("returns null when every area is covered mid-interview", () => {
    const all = Object.fromEntries(GRAPH.map((d) => [d.id, { answers: ["x"], confidence: 1, covered: true }]));
    const history: Message[] = [{ role: "assistant", content: "Q" }, { role: "user", content: "x" }];
    expect(pickNextArea(GRAPH, stateFor(OWNER_TOPIC, history, all), { confidenceThreshold: THRESHOLD })).toBeNull();
  });
});

describe("goalPromptSection", () => {
  test("is empty without a goal", () => {
    expect(goalPromptSection("")).toBe("");
    expect(goalPromptSection(undefined)).toBe("");
  });

  test("makes the goal the purpose and rules out unprompted personal-life questions", () => {
    const section = goalPromptSection(describeInterviewGoal(OWNER_TOPIC).summary);
    expect(section).toContain("Ashwood second brain");
    expect(section).toContain("Make decisions about goals, priorities, or next steps");
    expect(section).toContain("Do not ask about family, health, home life, or daily routines unless the goal or an earlier answer brought them up.");
    expect(section).toContain("follow that thread");
    expect(section).toContain("handed off");
    expect(section).toContain("concrete, recordable facts");
  });

  test("follow-up questions are flagged to the generator", () => {
    expect(followUpPromptSection("goal-follow-up")).toContain("goes deeper on what they just said");
    expect(followUpPromptSection("unresolved-follow-up")).toContain("same thread");
    expect(followUpPromptSection("relevance")).toBe("");
    expect(followUpPromptSection(undefined)).toBe("");
  });
});
