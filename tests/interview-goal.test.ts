import { describe, expect, test } from "bun:test";
import { chooseNextGap, describeInterviewGoal, domainRelevance, goalPromptSection } from "../src/lib/interview-goal";
import { detectGaps } from "../src/routes/-gapDetection";
import { getKnowledgeGraph, type InterviewState, type Message } from "../src/routes/-knowledgeGraph";

const OWNER_TOPIC =
  "My goals, priorities, and how I evaluate tradeoffs, TK — Ashwood second brain: one central, updated Context record (2026-10-15)";

function stateFor(topic: string, history: Message[] = [], domains: InterviewState["domains"] = {}, currentDomain?: string | null): InterviewState {
  return { tier: "personal", topic, domains, history, ...(currentDomain ? { currentDomain } : {}) } as InterviewState;
}

function nextDomainId(state: InterviewState): string {
  const graph = getKnowledgeGraph("personal");
  const gaps = detectGaps(graph, state);
  return chooseNextGap(gaps, { goal: describeInterviewGoal(state.topic), history: state.history, currentDomain: state.currentDomain }).domain.id;
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

describe("chooseNextGap", () => {
  test("starts with the areas the chosen starting point asks for", () => {
    expect(nextDomainId(stateFor(OWNER_TOPIC))).toBe("goals");
  });

  test("follows up on the same thread after an answer that left the area unresolved", () => {
    const state = stateFor(
      OWNER_TOPIC,
      [{ role: "assistant", content: "Question" }, { role: "user", content: "Partly: I want clearer priorities." }],
      { currentProjects: { answers: ["Partly: I want clearer priorities."], confidence: 0.3, covered: false } },
      "currentProjects",
    );
    expect(nextDomainId(state)).toBe("currentProjects");
  });

  test("stops following up after a few answers so a thin area cannot trap the interview", () => {
    const answers = ["a", "b", "c"];
    const state = stateFor(
      OWNER_TOPIC,
      [{ role: "assistant", content: "Question" }, { role: "user", content: "c" }],
      { currentProjects: { answers, confidence: 0.3, covered: false } },
      "currentProjects",
    );
    expect(nextDomainId(state)).not.toBe("currentProjects");
  });

  test("does not follow up when the last message is ALVIRA's own", () => {
    const state = stateFor(
      OWNER_TOPIC,
      [{ role: "user", content: "x" }, { role: "assistant", content: "Clarification" }],
      { currentProjects: { answers: ["x"], confidence: 0.3, covered: false } },
      "currentProjects",
    );
    expect(nextDomainId(state)).toBe("goals");
  });

  test("a typed goal pulls related areas ahead of unrelated personal-life ones", () => {
    const next = nextDomainId(stateFor("Track my current projects, deadlines and priorities"));
    expect(["dailyLife", "relationships", "background", "identity"]).not.toContain(next);
  });

  test("an answer that opens a thread raises that area's relevance", () => {
    const graph = getKnowledgeGraph("personal");
    const daily = graph.find((domain) => domain.id === "dailyLife")!;
    const goal = describeInterviewGoal("Get a new finance job");
    expect(domainRelevance(daily, goal, ["My morning routine and daily habits keep slipping."])).toBeGreaterThan(
      domainRelevance(daily, goal, []),
    );
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
  });
});
