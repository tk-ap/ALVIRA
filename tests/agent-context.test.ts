import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { MAX_PASTED_CONTEXT_CHARS, pastedContextProblem, pastedContextSource, sourceOptionsFor } from "../src/lib/agent-context";
import { CONTEXT_SOURCE_OPTIONS } from "../src/lib/context-engine";
import { sourcesMarkdown } from "../src/lib/source-links";

const AGENT = { actor_type: "agent" as const, actor_id: "claude-code-opus-5.5" };
const types = (options: { type: string }[]) => options.map((option) => option.type);

describe("source options by viewer", () => {
  test("the person sees the usual order", () => {
    expect(types(sourceOptionsFor(false, false))).toEqual(types(CONTEXT_SOURCE_OPTIONS));
    expect(types(sourceOptionsFor(false, true))).toEqual(types(CONTEXT_SOURCE_OPTIONS));
  });

  test("an agent the owner opted in sees Existing AI context first", () => {
    const order = types(sourceOptionsFor(true, true));
    expect(order[0]).toBe("ai-context");
    expect(order).toHaveLength(CONTEXT_SOURCE_OPTIONS.length);
  });

  test("an agent without the opt-in is not offered Existing AI context", () => {
    expect(types(sourceOptionsFor(true, false))).not.toContain("ai-context");
  });
});

describe("pasted AI context", () => {
  test("must be non-empty and within the size limit", () => {
    expect(pastedContextProblem("  ")).toContain("Paste");
    expect(pastedContextProblem("x".repeat(MAX_PASTED_CONTEXT_CHARS + 1))).toContain("shorter");
    expect(pastedContextProblem("TK prefers plain language.")).toBeUndefined();
  });

  test("is recorded as an AI-context source with who supplied it, never as an exported link", () => {
    const source = pastedContextSource(AGENT, "2026-10-16T00:00:00Z");
    expect(source).toMatchObject({ type: "ai-context", status: "ready", addedBy: AGENT, label: "Existing AI context pasted by agent claude-code-opus-5.5" });
    expect(sourcesMarkdown([source])).toBe("");
  });
});

describe("app wiring", () => {
  const app = readFileSync("src/routes/app.tsx", "utf8");

  test("only the owner can change the opt-in, and an agent cannot paste without it", () => {
    expect(app).toContain("if (viewerIsAgent || !state) return; // only the owner decides");
    expect(app).toContain("if (viewerIsAgent && !state?.agentContextOptIn)");
  });

  test("pasted context goes through claim review and its source is added only on approval", () => {
    const paste = app.slice(app.indexOf("const handlePastedContext"), app.indexOf("const setAgentContextOptIn"));
    expect(paste).toContain('reviewExtractedText(pastedContext.trim(), uploadTopic, "source")');
    expect(paste).toContain("pendingContextSourceRef.current = pastedContextSource(");
  });
});
