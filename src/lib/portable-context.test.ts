import { describe, expect, test } from "bun:test";
import { buildPortableContextView, portableContextSections, type PortableContextProfile } from "./portable-context";

const profile: PortableContextProfile = {
  id: "ctx_1",
  topic: "How I collaborate",
  offering: "context",
  tier: "personal",
  state: {
    tier: "personal",
    topic: "How I collaborate",
    currentDomain: null,
    history: [],
    domains: {
      relationships: { answers: ["I prefer clear ownership and direct feedback."], confidence: 1, covered: true },
      communication: { answers: ["Concise written updates work best."], confidence: 0.8, covered: true },
      knowledgeGaps: { answers: ["Preferred cadence for new collaborators is not yet confirmed."], confidence: 0.4, covered: true },
      goals: { answers: [], confidence: 0, covered: false },
    },
  },
};

describe("portable ALVIRA Context", () => {
  test("only exposes non-empty Context sections", () => {
    expect(portableContextSections(profile).map((section) => section.id)).toEqual([
      "relationships",
      "communication",
      "knowledgeGaps",
    ]);
  });

  test("respects an explicit sharing boundary", () => {
    const view = buildPortableContextView(profile, {
      task: "Prepare for a collaboration kickoff",
      includedDomainIds: ["relationships"],
      generatedAt: new Date("2026-09-03T22:00:00.000Z"),
    });

    expect(view.markdown).toContain("Intended task: Prepare for a collaboration kickoff");
    expect(view.markdown).toContain("I prefer clear ownership and direct feedback.");
    expect(view.markdown).not.toContain("Concise written updates work best.");
    expect(view.included).toHaveLength(1);
    expect(view.excluded).toHaveLength(2);
  });

  test("preserves explicit uncertainty", () => {
    const view = buildPortableContextView(profile, { includedDomainIds: ["knowledgeGaps"] });
    expect(view.markdown).toContain("Needs verification · confidence 40%");
    expect(view.markdown).toContain("Do not invent facts that are not stated.");
  });
});
