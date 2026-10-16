import { describe, expect, test } from "bun:test";
import { carriesCredential, contributorFor, findLinks, isNoSourcesAnswer, linksNeedingReview, privateLinkReason, sameLocator, sourcesFromAnswer, sourcesMarkdown } from "../src/lib/source-links";
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

  test("keeps the page path in a website label (E2E: /career looked like the bare site)", () => {
    const [career] = sourcesFromAnswer("https://ashwood-info.vercel.app/career", [], AGENT);
    expect(career).toMatchObject({ type: "website", label: "ashwood-info.vercel.app/career" });
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
  test("overview lists owner-confirmed sources with type and contributor", () => {
    const sources = sourcesFromAnswer("https://github.com/tk-ap/ALVIRA", [], AGENT, "2026-10-16T00:00:00Z").map((s) => ({ ...s, status: "ready" as const }));
    const state = { tier: "personal", topic: "Goal", domains: { goals: { answers: ["x"], confidence: 1, covered: true } }, history: [], contextSources: sources } as unknown as InterviewState;
    const overview = compileKnowledge(state, getKnowledgeGraph("personal")).overview;
    expect(overview).toContain("## Sources");
    expect(overview).toContain("[github.com/tk-ap/ALVIRA](https://github.com/tk-ap/ALVIRA) — Professional / code; added by agent claude-code-opus-5.5, 2026-10-16");
  });

  test("no Sources section when there are no links", () => {
    expect(sourcesMarkdown([])).toBe("");
  });

  test("links found in answers are not exported until the owner confirms them (Codex review of b128eaa)", () => {
    const sources = sourcesFromAnswer("https://alviratech.vercel.app and https://docs.google.com/document/d/abc/edit", [], AGENT);
    expect(sources.map((s) => s.status)).toEqual(["needs-review", "needs-review"]);
    expect(linksNeedingReview(sources)).toHaveLength(2);
    expect(sourcesMarkdown(sources)).toBe("");
    const state = { tier: "personal", topic: "Goal", domains: { goals: { answers: ["x"], confidence: 1, covered: true } }, history: [], contextSources: sources } as unknown as InterviewState;
    expect(compileKnowledge(state, getKnowledgeGraph("personal")).overview).not.toContain("## Sources");

    const confirmed = sources.map((s, i) => (i === 0 ? { ...s, status: "ready" as const } : s));
    const section = sourcesMarkdown(confirmed);
    expect(section).toContain("alviratech.vercel.app");
    expect(section).not.toContain("docs.google.com");
  });
});

describe("private and credential-bearing links", () => {
  test("signed or tokenised URLs are never stored", () => {
    const signed = "https://bucket.s3.amazonaws.com/report.pdf?X-Amz-Signature=abc&X-Amz-Credential=xyz";
    const tokened = "https://example.com/share?token=s3cr3t";
    expect(carriesCredential(signed)).toBe(true);
    expect(carriesCredential(tokened)).toBe(true);
    expect(carriesCredential("https://user:pass@example.com/")).toBe(true);
    expect(carriesCredential("https://github.com/tk-ap/ALVIRA?tab=readme")).toBe(false);
    expect(sourcesFromAnswer(`${signed} ${tokened} https://github.com/tk-ap/ALVIRA`, [], AGENT).map((s) => s.locator)).toEqual(["https://github.com/tk-ap/ALVIRA"]);
  });

  test("private share, staging and local links are flagged for a closer look", () => {
    expect(privateLinkReason("https://docs.google.com/document/d/abc/edit")).toContain("private share");
    expect(privateLinkReason("https://acme.notion.site/Plan-123")).toContain("private share");
    expect(privateLinkReason("https://staging.acme.com/")).toContain("staging");
    expect(privateLinkReason("http://192.168.1.10:3000/")).toContain("private network");
    expect(privateLinkReason("https://web.dev/articles")).toBeUndefined();
    expect(privateLinkReason("https://github.com/tk-ap/ALVIRA")).toBeUndefined();
    const [drive] = sourcesFromAnswer("https://drive.google.com/file/d/abc/view", [], AGENT);
    expect(drive).toMatchObject({ status: "needs-review", reviewNote: expect.stringContaining("private share") });
  });

  test("a stored link that carries a credential is never exported even if marked ready", () => {
    const leaked = { id: "1", type: "website" as const, label: "x", locator: "https://example.com/?access_token=abc", status: "ready" as const, addedAt: "2026-10-16T00:00:00Z" };
    expect(sourcesMarkdown([leaked])).toBe("");
  });
});
