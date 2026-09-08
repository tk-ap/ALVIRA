import { describe, expect, test } from "bun:test";
import { validateAnswer } from "../src/routes/-validation";

describe("answer quality signals", () => {
  test("gibberish is unusable (must re-ask)", () => {
    expect(validateAnswer("identity", "asdf asdf asdf asdf", []).isUnusable).toBe(true);
  });

  test("a vague-but-real answer is weak, not unusable", () => {
    const r = validateAnswer("identity", "it depends", []);
    expect(r.isUnusable).toBe(false);
    expect(r.needsClarification).toBe(true); // weak → accept-with-honest-note path
  });

  test("'I don't know' is weak, not unusable", () => {
    const r = validateAnswer("goals", "I don't know yet", []);
    expect(r.isUnusable).toBe(false);
    expect(r.insufficientKnowledge).toBe(true);
  });

  test("a contradiction with a prior answer is unusable", () => {
    const r = validateAnswer(
      "toolsAndSystems",
      "we don't use slack for project tracking",
      ["We use Slack for project tracking"],
    );
    expect(r.isUnusable).toBe(true);
  });

  test("a detailed answer is neither weak nor unusable", () => {
    const r = validateAnswer(
      "identity",
      "I run a small design studio in Portland and have been doing brand work for twelve years",
      [],
    );
    expect(r.isUnusable).toBe(false);
    expect(r.needsClarification).toBe(false);
  });
});
