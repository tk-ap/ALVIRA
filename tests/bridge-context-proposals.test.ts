import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { applyApprovedProposalToState } from "../src/lib/bridge-proposals";

describe("Bridge governed Context proposals", () => {
  test("adds an approved job-offer update without erasing existing Context", () => {
    const before = {
      domains: {
        goals: { answers: ["Find a full-time role."], confidence: 1, covered: true },
        updates: { answers: ["Previously looking for work."], confidence: 1, covered: true },
      },
    };

    const after = applyApprovedProposalToState(before, {
      id: "bcp_test",
      clientId: "chatgpt-test-client",
      statement: "I accepted a full-time position at X Company and am no longer on the job market.",
      supersedes: ["Actively seeking full-time employment"],
      createdAt: "2026-09-19T22:00:00.000Z",
    }) as any;

    expect(after.domains.goals).toEqual(before.domains.goals);
    expect(after.domains.updates.answers).toHaveLength(2);
    expect(after.domains.updates.answers[1]).toContain("accepted a full-time position at X Company");
    expect(after.domains.updates.answers[1]).toContain("Supersedes or materially changes: Actively seeking full-time employment");
    expect(after.domains.updates.answers[1]).toContain("Source: Bridge proposal bcp_test from chatgpt-test-client");
  });

  test("does not mutate the input state while preparing the approved state", () => {
    const before = { domains: { updates: { answers: [] } } };
    const snapshot = JSON.stringify(before);
    applyApprovedProposalToState(before, {
      id: "bcp_test",
      clientId: "client",
      statement: "Something changed.",
      createdAt: "2026-09-19T22:00:00.000Z",
    });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  test("MCP write-back is proposal-only and scope-gated", () => {
    const mcp = readFileSync("src/routes/api/bridge/mcp.ts", "utf8");
    expect(mcp).toContain('name: "propose_alvira_context_update"');
    expect(mcp).toContain('includes("context:propose")');
    expect(mcp).toContain("The user must review and approve it in ALVIRA before it changes their Context.");
    expect(mcp).not.toContain('name: "update_alvira_context"');
  });

  test("the review route initializes Context History before applying an approval", () => {
    const review = readFileSync("src/routes/bridge/updates.tsx", "utf8");
    expect(review).toContain("ensureContextVersioningSchema()");
    expect(review).toContain('action: "approve" | "reject"');
  });

  test("preview OAuth metadata stays on the preview host and advertises proposal scope", () => {
    const build = readFileSync("build-vercel.sh", "utf8");
    expect(build).toContain('VERCEL_ENV:-');
    expect(build).toContain('VERCEL_URL:-');
    expect(build).toContain('"context:propose"');
  });
});
