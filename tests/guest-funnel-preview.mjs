import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.E2E_BASE_URL || "https://alvira-git-prototype-immersive-interview-v1-alvira2.vercel.app";
const browser = await chromium.launch({ headless: true });

async function waitForPreview(page) {
  const deadline = Date.now() + 5 * 60_000;
  let last = "";
  while (Date.now() < deadline) {
    try {
      const response = await page.goto(`${base}/app`, { waitUntil: "networkidle", timeout: 45_000 });
      last = `HTTP ${response?.status()}`;
      if (response && response.status() < 500) {
        const journey = page.locator(".ivx-journey");
        if (await journey.count()) return;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await page.waitForTimeout(10_000);
  }
  throw new Error(`Prototype preview did not become ready: ${last}`);
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await waitForPreview(page);

  // Signed-out entry: the product journey begins before account creation.
  await page.getByText("Talk", { exact: true }).first().waitFor({ state: "visible", timeout: 15_000 });
  assert.equal(await page.getByText("Sign In", { exact: true }).count() > 0, true, "expected signed-out navigation");

  // Give the real Context interview a concrete starting area.
  const topic = page
    .locator("label")
    .filter({ hasText: "Write or communicate in a way that sounds like me" })
    .locator('input[type="checkbox"]');
  await topic.check();
  await page.getByRole("button", { name: "Start the conversation" }).click();

  // The preview deployment has the real OpenAI-backed interview engine configured.
  const answer = page.getByLabel("Your answer");
  await answer.waitFor({ state: "visible", timeout: 60_000 });
  await page.getByText("Live Context Mirror", { exact: true }).waitFor({ state: "visible", timeout: 15_000 });

  await answer.fill(
    "I prefer written context before meetings. When a decision is cheap and reversible I move quickly, but for hard-to-reverse decisions I want the tradeoffs stated clearly before I commit."
  );
  await page.getByRole("button", { name: "Send answer" }).click();

  // A real answer must become visible Context; no mock confidence/completion is required.
  await page.locator(".ivx-live-mirror__item").first().waitFor({ state: "visible", timeout: 60_000 });
  const mirrorText = await page.locator(".ivx-live-mirror").innerText();
  assert.match(mirrorText, /written context|decision|tradeoff/i, "Context Mirror did not reflect the submitted answer");

  // Generate real Context from the signed-out interview.
  const generate = page.getByRole("button", { name: /Generate knowledge files/ });
  await generate.waitFor({ state: "visible", timeout: 15_000 });
  await generate.click();

  await page.getByRole("heading", { name: "Compiled ALVIRA Context" }).waitFor({ state: "visible", timeout: 90_000 });
  await page.getByText("Inspect", { exact: true }).first().waitFor({ state: "visible", timeout: 15_000 });

  // The value boundary is reached before signup. Saving remains an explicit handoff.
  assert.equal(await page.getByText(/Sign in to save your interview progress/i).count() > 0, true, "save/sign-in handoff is missing");
  assert.equal(await page.getByRole("link", { name: /Create one/i }).count() > 0, true, "signup handoff is missing");

  assert.equal(pageErrors.length, 0, pageErrors.join(" | "));
  console.log("PASS signed-out ALVIRA funnel: start → real interview → live Context Mirror → compiled Context → signup/save handoff");
  await context.close();
} finally {
  await browser.close();
}
