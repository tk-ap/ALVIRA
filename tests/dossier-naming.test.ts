import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const retired = ["m", "e", "o", "s"].join("");
const retiredHyphenated = ["m", "e", "-", "o", "s"].join("");
const textExtensions = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|ya?ml|sql|xml|css|html|txt)$/i;

describe("Dossier canonical naming", () => {
  test("retired product name is absent from current tracked text source", () => {
    const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
      .split("\0")
      .filter(Boolean)
      .filter((file) => textExtensions.test(file));

    const offenders = files.filter((file) => {
      const body = readFileSync(file, "utf8").toLowerCase();
      return body.includes(retired) || body.includes(retiredHyphenated);
    });

    expect(offenders).toEqual([]);
  });
});
