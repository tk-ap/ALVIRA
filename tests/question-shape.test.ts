import { describe, expect, test } from "bun:test";
import {
  checkQuestionShape,
  fallbackQuestion,
  fallbackQuestions,
  firstQuestionOnly,
  generateAtomicQuestion,
  isCompound,
  questionSimilarity,
  splitResponse,
} from "../src/lib/question-shape";
import type { Message } from "../src/routes/-knowledgeGraph";

// Real questions from the 2026-10-15 owner E2E runs (evidence/owner-rerun-goal-driven-questions.txt).
const RERUN_Q2 =
  "Given the list of goals TK has set, how do they prioritize these goals when conflicts arise or resources are limited? Are there any specific criteria or decision-making processes they follow to determine which goal takes precedence?";
const RERUN_Q19 =
  "Considering TK's communication style with AI agents, how do they handle situations where an agent's output is unclear or doesn't meet expectations? Are there specific protocols or feedback mechanisms in place to address and resolve these issues effectively?";
const RERUN_Q20 =
  "Considering TK's preference for plain language and direct conclusions when communicating with AI agents, how do they handle situations where an agent's output is unclear or doesn't meet expectations? Are there specific protocols or feedback mechanisms in place to address these situations?";
const RECHECK_ATOMIC =
  "Given TK's focus on income, employability, and real proof, what criteria or process do they use to prioritize which job opportunities to pursue first, especially when there are multiple options available?";

const asked = (...questions: string[]): Message[] =>
  questions.flatMap((q) => [{ role: "assistant", content: q }, { role: "user", content: "An answer." }] as Message[]);

describe("splitResponse", () => {
  test("separates the reflection from the question", () => {
    const { lead, question } = splitResponse("That adds a clear priority. Which goal comes first when they conflict?");
    expect(lead).toBe("That adds a clear priority.");
    expect(question).toBe("Which goal comes first when they conflict?");
  });

  test("returns no question when there is no question mark", () => {
    expect(splitResponse("Thanks, that helps.").question).toBe("");
  });
});

describe("isCompound", () => {
  test("flags two question marks (real E2E Q2)", () => {
    expect(isCompound(splitResponse(RERUN_Q2).question)).toBe(true);
  });

  test("flags a second ask joined with 'and how'", () => {
    expect(isCompound("What tools do they use daily, and how do they keep documentation current?")).toBe(true);
  });

  test("passes a single atomic question (real E2E re-check)", () => {
    expect(isCompound(RECHECK_ATOMIC)).toBe(false);
  });

  test("passes a single either/or choice", () => {
    expect(isCompound("Is the launch date fixed, or is it flexible?")).toBe(false);
    expect(isCompound("Do they prefer speed or cost when the two conflict?")).toBe(false);
  });

  test("a trailing statement after the question is not a second ask", () => {
    expect(isCompound("What changed since the last review? This could include new projects or constraints.")).toBe(false);
  });
});

describe("duplicates", () => {
  test("the real E2E near-duplicates (Q19, Q20) score above the threshold", () => {
    expect(questionSimilarity(splitResponse(RERUN_Q20).question, splitResponse(RERUN_Q19).question)).toBeGreaterThanOrEqual(0.7);
  });

  test("checkQuestionShape flags a repeat of an earlier ALVIRA question", () => {
    const check = checkQuestionShape(
      "Thanks. How do they handle situations where an agent's output is unclear or doesn't meet expectations?",
      asked(RERUN_Q19),
    );
    expect(check.problems).toContain("duplicate");
  });

  test("a repeat behind a different lead-in clause is still a duplicate", () => {
    const check = checkQuestionShape(firstQuestionOnly(RERUN_Q20), asked(RERUN_Q19));
    expect(check.problems).toContain("duplicate");
  });

  test("a short ask does not match a longer, different one on a few shared words (real run Q7 vs Q13)", () => {
    const check = checkQuestionShape(
      "How would you describe TK's typical communication style? Are they more formal or casual?",
      asked("Can you describe TK's typical day? What does their morning routine look like?"),
    );
    expect(check.problems).not.toContain("duplicate");
  });

  test("different questions on the same theme are not duplicates", () => {
    const check = checkQuestionShape("Which single goal must be finished first this quarter?", asked(RERUN_Q2));
    expect(check.problems).not.toContain("duplicate");
  });
});

describe("firstQuestionOnly", () => {
  test("keeps the reflection and only the first ask", () => {
    expect(firstQuestionOnly(`That helps. ${RERUN_Q2}`)).toBe(
      "That helps. Given the list of goals TK has set, how do they prioritize these goals when conflicts arise or resources are limited?",
    );
  });

  test("cuts a joined second ask inside one sentence", () => {
    expect(firstQuestionOnly("What tools do they use daily, and how do they keep documentation current?")).toBe(
      "What tools do they use daily?",
    );
  });
});

describe("generateAtomicQuestion", () => {
  test("accepts an atomic first draft without a rewrite", async () => {
    const calls: Array<string | undefined> = [];
    const result = await generateAtomicQuestion({
      generate: async (feedback) => (calls.push(feedback), RECHECK_ATOMIC),
      history: [],
      areaLabel: "Goals",
      hasGoal: true,
    });
    expect(result).toMatchObject({ question: RECHECK_ATOMIC, attempts: 1, rejected: [] });
    expect(calls).toEqual([undefined]);
  });

  test("asks for one rewrite with feedback naming the problem, and keeps a good rewrite", async () => {
    const calls: Array<string | undefined> = [];
    const drafts = [RERUN_Q2, "Which goal takes precedence when two of them conflict?"];
    const result = await generateAtomicQuestion({
      generate: async (feedback) => (calls.push(feedback), drafts.shift()!),
      history: [],
      areaLabel: "Goals",
      hasGoal: true,
    });
    expect(result).toMatchObject({ question: "Which goal takes precedence when two of them conflict?", attempts: 2, rejected: [["compound"]] });
    expect(calls[1]).toContain("asked more than one thing");
  });

  test("trims to the first ask when the rewrite is still compound", async () => {
    const result = await generateAtomicQuestion({
      generate: async () => RERUN_Q2,
      history: [],
      areaLabel: "Goals",
      hasGoal: true,
    });
    expect(result.fallback).toBe("trimmed");
    expect(result.question).toBe(
      "Given the list of goals TK has set, how do they prioritize these goals when conflicts arise or resources are limited?",
    );
  });

  test("uses the safe generic question when the rewrite still repeats an earlier question", async () => {
    const result = await generateAtomicQuestion({
      generate: async () => RERUN_Q20,
      history: asked(RERUN_Q19),
      areaLabel: "Communication",
      hasGoal: true,
    });
    expect(result.fallback).toBe("generic");
    expect(result.question).toBe(fallbackQuestion("Communication", true));
    expect(result.rejected).toEqual([["compound", "duplicate"], ["compound", "duplicate"]]);
  });

  test("does not re-ask a generic fallback that was already used (Codex review of d085a38)", async () => {
    const used = fallbackQuestion("Goals", true)!;
    const result = await generateAtomicQuestion({
      generate: async () => used,
      history: asked(used),
      areaLabel: "Goals",
      hasGoal: true,
    });
    expect(result.fallback).toBe("generic");
    expect(result.question).not.toBe(used);
    expect(checkQuestionShape(result.question!, asked(used)).ok).toBe(true);
  });

  test("reports 'exhausted' instead of repeating when every fallback was already asked", async () => {
    const all = fallbackQuestions("Goals", true);
    const result = await generateAtomicQuestion({
      generate: async () => all[0],
      history: asked(...all),
      areaLabel: "Goals",
      hasGoal: true,
    });
    expect(result).toMatchObject({ question: null, fallback: "exhausted", attempts: 2 });
  });

  test("the fallback wordings are distinct from each other", () => {
    const [a, b, c] = fallbackQuestions("Decision frameworks", true);
    expect(checkQuestionShape(b, asked(a)).ok).toBe(true);
    expect(checkQuestionShape(c, asked(a, b)).ok).toBe(true);
  });

  test("never calls the model more than twice", async () => {
    let calls = 0;
    await generateAtomicQuestion({ generate: async () => (calls++, ""), history: [], areaLabel: "Goals", hasGoal: false });
    expect(calls).toBe(2);
  });
});
