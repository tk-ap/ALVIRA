import { describe, expect, test } from "bun:test";
import { bridgeRedirectAllowed } from "../src/lib/bridge";

const claudeCode = {
  application_type: "native" as const,
  redirect_uris: ["http://localhost/callback", "http://127.0.0.1/callback"],
};

describe("Bridge redirect URI matching", () => {
  test("accepts any port on a registered loopback redirect for native clients", () => {
    expect(bridgeRedirectAllowed(claudeCode, "http://localhost:63624/callback")).toBe(true);
    expect(bridgeRedirectAllowed(claudeCode, "http://127.0.0.1:51000/callback")).toBe(true);
    expect(bridgeRedirectAllowed(claudeCode, "http://localhost/callback")).toBe(true);
  });

  test("still requires loopback host, path, and query to match", () => {
    expect(bridgeRedirectAllowed(claudeCode, "http://localhost:63624/other")).toBe(false);
    expect(bridgeRedirectAllowed(claudeCode, "http://localhost:63624/callback?next=x")).toBe(false);
    expect(bridgeRedirectAllowed(claudeCode, "http://[::1]:63624/callback")).toBe(false);
    expect(bridgeRedirectAllowed(claudeCode, "https://localhost:63624/callback")).toBe(false);
    expect(bridgeRedirectAllowed(claudeCode, "http://evil.example:63624/callback")).toBe(false);
    expect(bridgeRedirectAllowed(claudeCode, "http://localhost.evil.example/callback")).toBe(false);
    expect(bridgeRedirectAllowed(claudeCode, "http://user@localhost:63624/callback")).toBe(false);
  });

  test("requires exact matches for web clients", () => {
    const web = { application_type: "web" as const, redirect_uris: ["https://app.example/cb", "http://localhost/cb"] };
    expect(bridgeRedirectAllowed(web, "https://app.example/cb")).toBe(true);
    expect(bridgeRedirectAllowed(web, "https://app.example:8443/cb")).toBe(false);
    expect(bridgeRedirectAllowed(web, "http://localhost:3000/cb")).toBe(false);
  });
});
