import { describe, expect, test } from "bun:test";
import { nextAction } from "../src/routes/-answerRouting";
import { getKnowledgeGraph, getPlaybook, type InterviewState } from "../src/routes/-knowledgeGraph";

function makeState(
  domains: InterviewState["domains"] = {},
  currentDomain: string | null = "identity",
): InterviewState {
  return { tier: "personal", topic: "Test", domains, history: [], currentDomain };
}

const graph = getKnowledgeGraph("personal");
const threshold = getPlaybook("personal").completion.minimumConfidence;

describe("answer routing (nextAction)", () => {
  test("empty answer or no current domain routes to null", () => {
    expect(nextAction(makeState({}, "identity"), graph, threshold, "   ")).toBeNull();
    expect(nextAction(makeState({}, null), graph, threshold, "hello")).toBeNull();
  });

  test("a change to a locked domain with a prior answer soft-confirms", () => {
    const state = makeState(
      { constraints: { answers: ["Never ship without review."], confidence: 1, covered: true } },
      "constraints",
    );
    expect(nextAction(state, graph, threshold, "Actually ship whenever.")?.type).toBe("soft-confirm");
  });

  test("bypassConfirm skips the soft-confirm gate", () => {
    const state = makeState(
      { constraints: { answers: ["Never ship without review."], confidence: 1, covered: true } },
      "constraints",
    );
    expect(nextAction(state, graph, threshold, "Also cap infra spend.", { bypassConfirm: true })?.type).toBe("accept");
  });

  test("an explicit move-on request routes to move-on", () => {
    expect(nextAction(makeState({}, "identity"), graph, threshold, "skip this")?.type).toBe("move-on");
  });

  test("a clarifying question routes to clarify", () => {
    expect(nextAction(makeState({}, "identity"), graph, threshold, "what do you mean by that?")?.type).toBe("clarify");
  });

  test("gibberish routes to re-ask", () => {
    expect(nextAction(makeState({}, "identity"), graph, threshold, "asdf asdf asdf asdf")?.type).toBe("re-ask");
  });

  test("a vague answer is accepted but deferred", () => {
    const action = nextAction(makeState({}, "identity"), graph, threshold, "I don't know yet");
    expect(action?.type).toBe("accept");
    if (action?.type === "accept") expect(action.deferred).toBe(true);
  });

  test("a detailed answer is accepted as meaningful", () => {
    const action = nextAction(
      makeState({}, "identity"),
      graph,
      threshold,
      "I run a small design studio in Portland focused on brand identity work.",
    );
    expect(action?.type).toBe("accept");
    if (action?.type === "accept") expect(action.deferred).toBe(false);
  });
});
