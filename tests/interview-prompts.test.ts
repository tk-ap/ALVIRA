import { describe, expect, test } from "bun:test";
import {
  buildExperimentalQuestionPrompt,
  buildHistoryRecallResponse,
  buildProductionQuestionPrompt,
  isInterviewRecallRequest,
} from "../src/lib/interview-prompts";

const domain = {
  label: "Decision Frameworks",
  promptHint: "Ask how they make important decisions.",
};

describe("interview prompt extraction", () => {
  test("keeps the production prompt contract intact", () => {
    const prompt = buildProductionQuestionPrompt({
      domain,
      history: [],
      tier: "personal",
    });

    expect(prompt).toContain("You are ALVIRA, a Context Intelligence interviewer.");
    expect(prompt).toContain("Ask one question at a time");
    expect(prompt).toContain('"Decision Frameworks"');
    expect(prompt).toContain('Respond ONLY with a JSON object: {"question":');
  });

  test("experimental prompt optimizes for missing, reusable context", () => {
    const prompt = buildExperimentalQuestionPrompt({
      domain,
      history: [
        { role: "assistant", content: "How do you make a difficult decision?" },
        { role: "user", content: "If it is reversible I move quickly." },
      ],
      tier: "personal",
    });

    expect(prompt).toContain("smallest important piece of missing context");
    expect(prompt).toContain("do not ask for it again");
    expect(prompt).toContain('"target_gap"');
    expect(prompt).toContain("If it is reversible I move quickly.");
  });
});


describe("interview conversational intents", () => {
  test("recognizes a request to reflect captured context", () => {
    expect(isInterviewRecallRequest("What do you know about me so far?")).toBe(true);
    expect(isInterviewRecallRequest("Can you tell me what you know about me?")).toBe(true);
    expect(isInterviewRecallRequest("I make decisions quickly when they are reversible.")).toBe(false);
  });

  test("experimental prompt tells ALVIRA to honor user direction instead of forcing the next probe", () => {
    const prompt = buildExperimentalQuestionPrompt({
      domain,
      history: [
        { role: "assistant", content: "How do you make a difficult decision?" },
        { role: "user", content: "Do you know who you are?" },
      ],
      tier: "personal",
    });

    expect(prompt).toContain("When the user directs the conversation instead of answering");
    expect(prompt).toContain("Never silently convert direction into an answer");
    expect(prompt).toContain("Do not file it as interview context");
    expect(prompt).toContain("end with a short invitation instead of a new probe");
    expect(prompt).toContain("none — user directing");
  });

  test("recall response is grounded in user answers and can use the user's name", () => {
    const response = buildHistoryRecallResponse([
      { role: "assistant", content: "What are you working on?" },
      { role: "user", content: "I am building ALVIRA and want it to become a portable context layer." },
      { role: "assistant", content: "How do you make decisions?" },
      { role: "user", content: "I move quickly on reversible decisions." },
      { role: "user", content: "What do you know about me so far?" },
    ], "Tahlia");

    expect(response).toContain("Tahlia");
    expect(response).toContain("I am building ALVIRA");
    expect(response).toContain("I move quickly");
    expect(response).not.toContain("What do you know about me");
    expect(response).toContain("I haven't added assumptions");
  });

  test("experimental first turn introduces ALVIRA and explains the flow briefly", () => {
    const prompt = buildExperimentalQuestionPrompt({
      domain,
      history: [],
      tier: "personal",
      userName: "tk",
    });

    expect(prompt).toContain("introduce yourself as ALVIRA");
    expect(prompt).toContain("one question at a time");
    expect(prompt).toContain("ask what you know about them");
    expect(prompt).toContain("under 90 words");
  });

  test("experimental prompt carries the user's name without requiring it every turn", () => {
    const prompt = buildExperimentalQuestionPrompt({
      domain,
      history: [],
      tier: "personal",
      userName: "Tahlia",
    });

    expect(prompt).toContain("User name: Tahlia");
    expect(prompt).toContain("not mechanically on every turn");
  });
});
