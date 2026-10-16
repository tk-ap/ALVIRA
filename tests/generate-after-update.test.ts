import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

// E2E 2026-10-16: after "Update / add context", confirming a link left Generate disabled until a new
// answer was sent, because the gate only looked at the (empty, reseeded) conversation.
const app = readFileSync("src/routes/app.tsx", "utf8");

describe("Generate after an update", () => {
  const gate = app.slice(app.indexOf("const canGenerate = Boolean("), app.indexOf(");", app.indexOf("const canGenerate = Boolean(")));

  test("is allowed when the Context already holds answers or a confirmed link", () => {
    expect(gate).toContain("answerCount > 0");
    expect(gate).toContain('source.status === "ready"');
    expect(gate).toContain("state.history.length >= 2");
    expect(gate).toContain("!hasGaps");
  });

  test("the Generate button uses that gate instead of the conversation length alone", () => {
    expect(app).toContain("disabled={compiling || !canGenerate}");
    expect(app).not.toContain("(state.history.length < 2 && hasGaps)");
  });
});
