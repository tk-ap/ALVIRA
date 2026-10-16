import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { buildProviderFiles, hasRecordedContent } from "../src/lib/provider-files";
import { compileKnowledge } from "../src/routes/-knowledgeCompiler";
import { getKnowledgeGraph, type InterviewState } from "../src/routes/-knowledgeGraph";

// E2E 2026-10-16: the output screen showed blank ai-working-profile, chatgpt, claude, gemini and
// cursor tabs because nothing generated those files.
const state = {
  tier: "personal",
  topic: "TK — Ashwood second brain",
  domains: {
    goals: { answers: ["One central Context record any AI can read."], confidence: 1, covered: true },
    constraints: { answers: ["No spending without approval."], confidence: 1, covered: true },
  },
  history: [],
} as unknown as InterviewState;

const compiled = compileKnowledge(state, getKnowledgeGraph("personal"));
const provider = buildProviderFiles(compiled, state.topic);

describe("provider files", () => {
  test("every output tab on the Context screen has content", () => {
    const app = readFileSync("src/routes/app.tsx", "utf8");
    const keys = [...app.slice(app.indexOf("const FILES = ["), app.indexOf("] as const;", app.indexOf("const FILES = ["))).matchAll(/key: "(\w+)"/g)].map((m) => m[1]);
    expect(keys).toHaveLength(10);
    const files: Record<string, string> = { ...compiled, ...provider };
    // The tabs the output screen shows (same filter as app.tsx): each one has recorded content.
    const shown = keys.filter((key) => key === "overview" || hasRecordedContent(files[key]));
    expect(shown).toEqual(["aiProfile", "overview", "constraints", "chatgpt", "claude", "gemini", "cursor"]);
    for (const key of shown) expect(files[key]).toMatch(/One central Context record|No spending without approval/);
  });

  test("tabs and downloads skip areas with nothing recorded", () => {
    const app = readFileSync("src/routes/app.tsx", "utf8");
    expect(app).toContain('FILES.filter((f) => f.key === "overview" || hasRecordedContent(generated[f.key]))');
    expect(app).toContain('if (name === "overview.md" || hasRecordedContent(content)) zip.file(name, content);');
    expect(hasRecordedContent(compiled.workflows)).toBe(false);
    expect(hasRecordedContent(compiled.constraints)).toBe(true);
  });

  test("each file carries the recorded answers, not empty areas", () => {
    for (const file of Object.values(provider)) {
      expect(file).toContain("One central Context record any AI can read.");
      expect(file).toContain("No spending without approval.");
      expect(file).not.toContain("_No information gathered for this area yet._");
    }
  });

  test("each tool file says how to load it into that tool", () => {
    expect(provider.chatgpt).toContain("# ChatGPT setup — TK — Ashwood second brain");
    expect(provider.claude).toContain("Claude Project");
    expect(provider.gemini).toContain("Gem");
    expect(provider.cursor.startsWith("---\ndescription: ALVIRA Context")).toBe(true);
    expect(provider.cursor).toContain(".cursor/rules/alvira-context.mdc");
  });

  test("an interview with nothing recorded says so instead of a blank file", () => {
    const empty = buildProviderFiles(compileKnowledge({ ...state, domains: {} } as InterviewState, getKnowledgeGraph("personal")), "");
    expect(empty.aiProfile).toContain("The interview has not recorded anything yet.");
    expect(empty.aiProfile).toContain("# AI Working Profile — My AI context");
  });

  test("the dashboard export includes the same ten files", () => {
    const dashboard = readFileSync("src/routes/dashboard.tsx", "utf8");
    for (const name of ["ai-working-profile.md", "chatgpt-instructions.md", "claude-instructions.md", "gemini-instructions.md", "cursor-rules.md"]) {
      expect(dashboard).toContain(`"${name}"`);
    }
  });
});
