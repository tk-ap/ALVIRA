import { describe, expect, test } from "bun:test";
import { getMeosGraph, getMeosPreviewGraph } from "../src/routes/-meosGraph";

describe("Reflect access policy smoke", () => {
  test("preview compatibility path exposes full Reflect", () => {
    expect(getMeosPreviewGraph()).toEqual(getMeosGraph());
  });
});
