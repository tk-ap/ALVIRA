import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { canonicalUrl, softwareApplicationJsonLd } from "../src/lib/structured-data";

describe("canonicalUrl", () => {
  test("uses the production origin and drops query, hash and trailing slash", () => {
    expect(canonicalUrl("/")).toBe("https://alviratech.vercel.app/");
    expect(canonicalUrl("/pricing/")).toBe("https://alviratech.vercel.app/pricing");
    expect(canonicalUrl("/app?actor=agent#x")).toBe("https://alviratech.vercel.app/app");
  });
});

describe("structured data and share image", () => {
  test("SoftwareApplication lists the published plans", () => {
    const data = JSON.parse(softwareApplicationJsonLd());
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.offers.map((o: { name: string; price: string }) => `${o.name}:${o.price}`)).toEqual(["Free:0", "Pro:20", "Lifetime:399"]);
  });

  test("the share image the root meta points to is shipped in public/", () => {
    const root = readFileSync("src/routes/__root.tsx", "utf8");
    const path = root.match(/og:image", content: "https:\/\/alviratech\.vercel\.app(\/[^"]+)"/)?.[1];
    expect(path).toBe("/og/alvira-share.png");
    expect(() => readFileSync(`public${path}`)).not.toThrow();
  });
});
