import { describe, expect, test } from "bun:test";
import { contributorFor, findLinks, isNoSourcesAnswer, sameLocator, sourcesFromAnswer, sourcesMarkdown } from "../src/lib/source-links";
import { validateAnswer } from "../src/routes/-validation";
import { pickNextArea } from "../src/lib/interview-goal";
import { compileKnowledge } from "../src/routes/-knowledgeCompiler";
import { getKnowledgeGraph, getPlaybook, type InterviewState } from "../src/routes/-knowledgeGraph";

const AGENT = { actor_type: "agent" as const, actor_id: "claude-code-opus-5.5" };

describe("findLinks", () => {
  test("finds full URLs and bare domains, in order, without trailing punctuation", () => {
    expect(
      findLinks("Site: https://ashwood-info.vercel.app/career. Code at github.com/tk-ap/ALVIRA, and linkedin.com/in/tk-ashwood/."),
    ).toEqual(["https://ashwood-info.vercel.app/career", "https://github.com/tk-ap/ALVIRA", "https://linkedin.com/in/tk-ashwood/"]);
  });

  test("ignores email addresses and merges duplicates", () => {
    expect(findLinks("Email hire.tkashwood@gmail.com or see https://example.com and https://www.example.com/")).toEqual(["https://example.com"]);
  });

  test("returns nothing for plain prose", () => {
    expect(findLinks("No links here, just a sentence.")).toEqual([]);
  });
});

describe("sourcesFromAnswer", () => {
  test("classifies links and records the contributor", () => {
    const sources = sourcesFromAnswer("https://alviratech.vercel.app github.com/tk-ap/agent-os x.com/tkashwood", [], AGENT, "2026-10-16T00:00:00Z");
    expect(sources.map((s) => [s.type, s.label, s.addedBy?.actor_id])).toEqual([
      ["website", "alviratech.vercel.app", "claude-code-opus-5.5"],
      ["professional", "github.com/tk-ap/agent-os", "claude-code-opus-5.5"],
      ["social", "x.com/tkashwood", "claude-code-opus-5.5"],
    ]);
  });

  test("skips links already recorded, even spelled differently", () => {
    const first = sourcesFromAnswer("https://github.com/tk-ap/ALVIRA", [], AGENT);
    expect(sourcesFromAnswer("GitHub.com/tk-ap/ALVIRA/", first, AGENT)).toEqual([]);
    expect(sameLocator("https://www.example.com/a/", "example.com/a")).toBe(true);
  });

  test("contributor is the delegated agent when there is one, else the person", () => {
    expect(contributorFor({ provenance: { actor_type: "agent", actor_id: "codex" } } as never)).toEqual({ actor_type: "agent", actor_id: "codex" });
    expect(contributorFor({} as never)).toEqual({ actor_type: "human" });
  });
});

describe("Links & sources area", () => {
  test("a list of links, or an explicit none, fully answers it", () => {
    expect(validateAnswer("sources", "github.com/tk-ap/ALVIRA", []).confidence).toBe(1);
    expect(validateAnswer("sources", "None yet.", []).needsClarification).toBe(false);
    expect(isNoSourcesAnswer("n/a")).toBe(true);
    expect(isNoSourcesAnswer("I have a website")).toBe(false);
  });

  test("is asked right after the first answer", () => {
    const graph = getKnowledgeGraph("personal");
    const state = {
      tier: "personal",
      topic: "My goals, priorities, and how I evaluate tradeoffs",
      domains: { goals: { answers: ["Ship the second brain."], confidence: 0.95, covered: true } },
      history: [{ role: "assistant", content: "What is the goal?" }, { role: "user", content: "Ship the second brain." }],
    } as InterviewState;
    const next = pickNextArea(graph, state, { answeredDomainId: null, confidenceThreshold: getPlaybook("personal").completion.minimumConfidence });
    expect(next).toMatchObject({ domain: { id: "sources" }, reason: "sources" });
  });

  test("is not asked before any answer", () => {
    const graph = getKnowledgeGraph("personal");
    const state = { tier: "personal", topic: "My goals, priorities, and how I evaluate tradeoffs", domains: {}, history: [] } as unknown as InterviewState;
    expect(pickNextArea(graph, state, {})?.domain.id).not.toBe("sources");
  });
});

describe("compiled Context", () => {
  test("overview lists the sources with type and contributor", () => {
    const sources = sourcesFromAnswer("https://github.com/tk-ap/ALVIRA", [], AGENT, "2026-10-16T00:00:00Z");
    const state = { tier: "personal", topic: "Goal", domains: { goals: { answers: ["x"], confidence: 1, covered: true } }, history: [], contextSources: sources } as unknown as InterviewState;
    const overview = compileKnowledge(state, getKnowledgeGraph("personal")).overview;
    expect(overview).toContain("## Sources");
    expect(overview).toContain("[github.com/tk-ap/ALVIRA](https://github.com/tk-ap/ALVIRA) — Professional / code; added by agent claude-code-opus-5.5, 2026-10-16");
  });

  test("no Sources section when there are no links", () => {
    expect(sourcesMarkdown([])).toBe("");
  });
});
