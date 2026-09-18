import { describe, expect, test } from "bun:test";
import {
  buildCapturedContextResponse,
  buildWelcomeBackMessage,
  isInterviewRecallRequest,
} from "../src/routes/-interviewConversation";
import { getKnowledgeGraph, type InterviewState } from "../src/routes/-knowledgeGraph";

function state(overrides: Partial<InterviewState> = {}): InterviewState {
  return {
    tier: "personal",
    topic: "My Context",
    userName: "Tahlia",
    domains: {},
    history: [],
    currentDomain: "decisionFrameworks",
    ...overrides,
  };
}

describe("interview conversational behavior", () => {
  test("detects basic recall prompts without treating normal answers as recall", () => {
    expect(isInterviewRecallRequest("What do you know about me so far?")).toBe(true);
    expect(isInterviewRecallRequest("Tell me what you know about me.")).toBe(true);
    expect(isInterviewRecallRequest("I move quickly on reversible decisions.")).toBe(false);
  });

  test("recall is built only from structured captured Context", () => {
    const s = state({
      domains: {
        background: {
          answers: ["I run ALVIRA and spend most of my time shaping product direction."],
          confidence: 1,
          covered: true,
        },
        decisionFrameworks: {
          answers: ["I move quickly on reversible decisions and slow down when the downside is hard to undo."],
          confidence: 1,
          covered: true,
        },
      },
      history: [
        { role: "user", content: "This sentence is in chat history but was never captured into a domain." },
      ],
    });

    const response = buildCapturedContextResponse(s, getKnowledgeGraph("personal"));
    expect(response).toContain("Tahlia");
    expect(response).toContain("I run ALVIRA");
    expect(response).toContain("I move quickly");
    expect(response).not.toContain("never captured into a domain");
    expect(response).toContain("I haven't added assumptions");
  });

  test("welcome-back copy uses the persisted name", () => {
    expect(buildWelcomeBackMessage(state(), "resume")).toContain("Welcome back, Tahlia.");
    expect(buildWelcomeBackMessage(state(), "update")).toContain("Tell me what's changed");
  });
});
