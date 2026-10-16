import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { MAX_PASTED_CONTEXT_CHARS, pastedContextProblem, pastedContextSource } from "../src/lib/agent-context";
import { sourcesMarkdown } from "../src/lib/source-links";

const AGENT = { actor_type: "agent" as const, actor_id: "claude-code-opus-5.5" };
const app = readFileSync("src/routes/app.tsx", "utf8");

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

  test("goes through claim review, shared with file upload", () => {
    const paste = app.slice(app.indexOf("const handlePastedContext"), app.indexOf("const handleFileChange"));
    expect(paste).toContain('reviewExtractedText(pastedContext.trim(), uploadTopic, "source")');
    expect(app.slice(app.indexOf("const handleFileChange"))).toContain('reviewExtractedText(text, uploadTopic, "document")');
  });

  test("no agent opt-in or agent ordering until the viewer is server-enforced (Codex review of #216)", () => {
    expect(app).not.toContain("agentContextOptIn");
    expect(app).not.toContain("sourceOptionsFor");
  });
});

describe("a reviewed source is recorded only when a claim is approved (Codex review of #216)", () => {
  const seed = app.slice(app.indexOf("const handleSeedContinue"), app.indexOf("const handleSend"));

  test("approved claims are counted and gate adding the pending source", () => {
    expect(seed).toContain("let approvedClaims = 0;");
    expect(seed).toContain("approvedClaims += 1;");
    expect(seed).toContain("if (approvedClaims > 0) addContextSource(approvedSource);");
  });

  test("skipping every claim clears the pending source without recording it", () => {
    const tail = seed.slice(seed.indexOf("finally"));
    expect(tail).toContain("pendingContextSourceRef.current = null;");
    expect(tail).not.toMatch(/\n\s*addContextSource\(approvedSource\);/);
  });
});
