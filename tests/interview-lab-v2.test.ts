import { describe, expect, test } from "bun:test";
import {
  BASELINE_QUESTIONS,
  buildBaselineFindings,
  buildInterviewBaselineFocus,
  classifyBaselineArea,
  contextHash,
  emptyBaselineResponses,
  type BaselineTool,
} from "../src/lib/interview-lab-v2";

function tool(
  id: string,
  name: string,
  values: Partial<Record<(typeof BASELINE_QUESTIONS)[number]["id"], string>>,
): BaselineTool {
  return { id, name, responses: { ...emptyBaselineResponses(), ...values } };
}

describe("Interview Engine Lab v2 baseline", () => {
  test("classifies an empty area as missing", () => {
    const result = classifyBaselineArea(
      [tool("chatgpt", "ChatGPT", {}), tool("claude", "Claude", {})],
      "goals",
    );

    expect(result.classification).toBe("missing");
    expect(result.filledTools).toBe(0);
  });

  test("classifies partial coverage as known unevenly", () => {
    const result = classifyBaselineArea(
      [
        tool("chatgpt", "ChatGPT", { goals: "Launch the beta." }),
        tool("claude", "Claude", {}),
      ],
      "goals",
    );

    expect(result.classification).toBe("known_unevenly");
  });

  test("surfaces stale and conflicting evidence without treating it as truth", () => {
    expect(
      classifyBaselineArea(
        [
          tool("chatgpt", "ChatGPT", {
            constraints: "My old constraint from last year was cash.",
          }),
          tool("claude", "Claude", {
            constraints: "The tools disagree about my current constraint.",
          }),
        ],
        "constraints",
      ).classification,
    ).toBe("potentially_stale");
  });

  test("allows the user to override the heuristic classification", () => {
    const result = classifyBaselineArea(
      [tool("chatgpt", "ChatGPT", { goals: "Launch the beta." })],
      "goals",
      "known_consistently",
    );

    expect(result.classification).toBe("known_consistently");
    expect(result.rationale).toContain("User-set classification");
  });

  test("prioritizes unresolved baseline areas for the adaptive interview", () => {
    const findings = buildBaselineFindings([
      tool("chatgpt", "ChatGPT", { goals: "Launch the beta." }),
      tool("claude", "Claude", {}),
    ]);
    const focus = buildInterviewBaselineFocus(findings);

    expect(focus[0]?.label).toBe("Identity & background");
    expect(focus.some((item) => item.label === "Goals & priorities")).toBe(
      true,
    );
    expect(
      focus.some(
        (item) =>
          item.label === "Goals & priorities" &&
          item.classification === "known_unevenly",
      ),
    ).toBe(true);
  });

  test("produces a stable context hash for a portable receipt", () => {
    expect(contextHash(["One", "Two"])).toBe(contextHash(["One", "Two"]));
    expect(contextHash(["One", "Two"])).not.toBe(contextHash(["Two", "One"]));
  });
});
