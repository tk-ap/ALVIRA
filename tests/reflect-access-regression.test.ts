import { describe, expect, test } from "bun:test";
import { getMeosGraph, getMeosPreviewGraph } from "../src/routes/-meosGraph";

describe("Reflect access regression", () => {
  test("free Reflect uses the full Reflect domain model", () => {
    expect(getMeosPreviewGraph().map((d) => d.id)).toEqual(getMeosGraph().map((d) => d.id));
  });

  test("Reflect includes review and validation in free access", () => {
    const ids = getMeosPreviewGraph().map((d) => d.id);
    expect(ids).toContain("review");
    expect(ids).toContain("validation");
  });
});
