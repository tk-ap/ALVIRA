import { describe, expect, test } from "bun:test";
import {
  buildExperimentalQuestionPrompt,
  buildProductionQuestionPrompt,
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
