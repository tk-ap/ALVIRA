import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  buildCapturedContextResponse,
  buildFirstRunIntro,
  buildWelcomeBackMessage,
  extractPreferredName,
  isInterviewRecallRequest,
  isMoveOnRequest,
} from "../src/routes/-interviewConversation";
import { getKnowledgeGraph, type InterviewState } from "../src/routes/-knowledgeGraph";

function state(overrides: Partial<InterviewState> = {}): InterviewState {
  return {
    tier: "personal",
    topic: "My Context",
    userName: "TK",
    introStage: "complete",
    domains: {},
    history: [],
    currentDomain: "decisionFrameworks",
    ...overrides,
  };
}

describe("interview conversational behavior", () => {
  test("detects recall prompts without treating ordinary answers as recall", () => {
    expect(isInterviewRecallRequest("What do you know about me so far?")).toBe(true);
    expect(isInterviewRecallRequest("Tell me what you know about me.")).toBe(true);
    expect(isInterviewRecallRequest("I move quickly on reversible decisions.")).toBe(false);
  });

  test("detects explicit human move-on language only", () => {
    expect(isMoveOnRequest("move on")).toBe(true);
    expect(isMoveOnRequest("Let's move on.")).toBe(true);
    expect(isMoveOnRequest("not relevant")).toBe(true);
    expect(isMoveOnRequest("Moving on this project is important")).toBe(false);
  });

  test("extracts a preferred name from natural intro answers", () => {
    expect(extractPreferredName("Call me TK.")).toBe("TK");
    expect(extractPreferredName("My name is Tahlia")).toBe("Tahlia");
    expect(extractPreferredName("TK")).toBe("TK");
  });

  test("recall is built only from structured captured Context", () => {
    const s = state({
      domains: {
        background: {
          answers: ["I build ALVIRA."],
          confidence: 1,
          covered: true,
        },
        decisionFrameworks: {
          answers: ["I move quickly on reversible decisions."],
          confidence: 1,
          covered: true,
        },
      },
      history: [
        { role: "user", content: "This sentence is chat-only and was never captured." },
      ],
    });
    const response = buildCapturedContextResponse(s, getKnowledgeGraph("personal"));
    expect(response).toContain("TK");
    expect(response).toContain("I build ALVIRA");
    expect(response).toContain("I move quickly");
    expect(response).not.toContain("chat-only");
    expect(response).toContain("haven't added assumptions");
  });

  test("intro and welcome-back copy use the persisted preferred name", () => {
    expect(buildFirstRunIntro("TK")).toContain("Thanks, TK.");
    expect(buildWelcomeBackMessage(state(), "resume")).toContain("Welcome back, TK.");
    expect(buildWelcomeBackMessage(state(), "update")).toContain("Tell me what's changed");
  });

  test("app keeps delegated-agent UNKNOWN semantics separate from human move-on", () => {
    const app = readFileSync("src/routes/app.tsx", "utf8");
    expect(app).toContain('state.provenance?.actor_type !== "agent" && currentDomain && isMoveOnRequest(trimmed)');
    expect(app).toContain('if (state.provenance?.actor_type === "agent") return handleUnknown()');
    expect(app).toContain('content: "Unknown — I don\'t have enough evidence to answer this on the subject\'s behalf."');
    expect(app).toContain('introStage: "name"');
    expect(app).toContain("buildCapturedContextResponse(state, graph)");
  });

  test("human skip does not manufacture confidence", () => {
    const app = readFileSync("src/routes/app.tsx", "utf8");
    expect(app).toContain("skipped: true");
    expect(app).toContain("confidence: state.domains[currentDomain].confidence ?? 0");
    expect(app).not.toContain("confidence: state.domains[currentDomain].confidence || confThreshold");
  });
});
