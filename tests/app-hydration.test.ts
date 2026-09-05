import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const root = readFileSync("src/routes/__root.tsx", "utf8");
const clarity = readFileSync("src/components/AppFirstRunClarity.tsx", "utf8");

describe("/app hydration boundary", () => {
  test("does not mutate route-specific React-owned html attributes before hydration", () => {
    const scriptsBlock = root.match(/scripts:\s*\[\{ children: `([\s\S]*?)` \}\]/)?.[1] ?? "";
    expect(scriptsBlock).not.toContain("alviraRoute");
    expect(scriptsBlock).not.toContain("alviraClarityPending");
    expect(scriptsBlock).not.toContain("dataset.alvira");
  });

  test("keeps first-run content hidden using server-rendered route CSS instead", () => {
    expect(clarity).toContain("main#main-content {\n        visibility: hidden;");
    expect(clarity).toContain('main#main-content[data-alvira-clarity-ready="true"]');
    expect(clarity).toContain('main.dataset.alviraClarityReady = "true"');
  });

  test("route markers are applied after hydration through effects", () => {
    const appShell = readFileSync("src/components/AppShellInheritance.tsx", "utf8");
    expect(appShell).toContain("useEffect(() =>");
    expect(appShell).toContain("root.dataset.alviraRoute = routeKey(normalizedPath)");
  });

  test("does not hide hydration warnings as a substitute for fixing the mismatch", () => {
    expect(root).not.toContain("suppressHydrationWarning");
  });
});
