import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.E2E_BASE_URL || "https://alvira-git-prototype-immersive-interview-v1-alvira2.vercel.app";
const email = process.env.ALVIRA_TEST_EMAIL || "codex-smoke-1786676512909@example.com";
const password = process.env.ALVIRA_TEST_PASSWORD || "";

if (!password) throw new Error("ALVIRA_TEST_PASSWORD is not configured.");

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const topic = "Authenticated continuity smoke " + Date.now();
  const answerText = "I prefer written context before meetings and explicit tradeoffs before hard-to-reverse decisions.";

  const draftSnapshot = async () => page.evaluate(() =>
    Object.entries(window.localStorage)
      .filter(([key]) => key.startsWith("alvira:interview-draft:"))
      .map(([key, value]) => {
        try {
          const parsed = JSON.parse(value);
          return { key, topic: parsed?.topic ?? parsed?.state?.topic ?? null, savedAt: parsed?.savedAt ?? null, generatedAt: parsed?.state?.generatedAt ?? null };
        } catch {
          return { key, topic: null, savedAt: null, generatedAt: null };
        }
      }),
  );

  await page.goto(base + "/app", { waitUntil: "networkidle", timeout: 45000 });

  const custom = page.getByPlaceholder("Something else I could use help with...");
  await custom.fill(topic);
  await page.getByRole("button", { name: "Start the conversation" }).click();

  const answer = page.getByLabel("Your answer");
  await answer.waitFor({ state: "visible", timeout: 60000 });
  await answer.fill(answerText);
  await page.getByRole("button", { name: "Send answer" }).click();
  const mirror = page.locator(".ivx-live-mirror__item").first();
  await mirror.waitFor({ state: "visible", timeout: 60000 });
  const mirrorText = await page.locator(".ivx-live-mirror").innerText();
  assert.match(mirrorText, /written context|decision|tradeoff/i, "Context Mirror did not reflect the submitted answer");

  await page.getByRole("button", { name: /Generate knowledge files/ }).click();
  await page.getByRole("heading", { name: "Compiled ALVIRA Context" }).waitFor({ state: "visible", timeout: 90000 });

  assert.equal((await page.locator("body").innerText()).includes(topic), true, "compiled Context did not show the run topic");

  const beforeAuthDrafts = await draftSnapshot();
  const anonymousDraft = beforeAuthDrafts.find((draft) => draft.key.includes(":anonymous:"));
  assert.ok(anonymousDraft, "guest draft was not stored in anonymous browser scope");
  assert.equal(anonymousDraft.topic, topic, "anonymous draft topic was not the current run");
  assert.ok(anonymousDraft.generatedAt, "guest draft was not marked generated before authentication");
  console.log("CHECK guest draft", JSON.stringify({ topic: anonymousDraft.topic, scope: "anonymous", generated: true }));

  await page.goto(base + "/login?returnTo=/app", { waitUntil: "networkidle", timeout: 45000 });
  await page.getByLabel("Email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/app", { timeout: 45000 });

  await page.getByRole("heading", { name: "Update your existing Context?" }).waitFor({ state: "visible", timeout: 30000 });
  assert.equal(await page.getByText(topic, { exact: true }).count() > 0, true, "exact guest Context was not restored after login");

  const afterAuthDrafts = await draftSnapshot();
  const authenticatedDraft = afterAuthDrafts.find((draft) => draft.key.includes(":user:") && draft.key.endsWith(":context"));
  assert.ok(authenticatedDraft, "authenticated browser draft was not created");
  assert.equal(authenticatedDraft.topic, topic, "authenticated draft is not the exact guest Context");
  assert.equal(afterAuthDrafts.some((draft) => draft.key.includes(":anonymous:") && draft.topic === topic), false, "anonymous draft remained after successful account persistence");
  console.log("PASS login restoration", JSON.stringify({ topic: authenticatedDraft.topic, scope: "authenticated" }));

  await page.goto(base + "/dashboard", { waitUntil: "networkidle", timeout: 45000 });
  await page.getByText(topic, { exact: true }).waitFor({ state: "visible", timeout: 30000 });
  const saveDraft = page.getByRole("button", { name: "Save to Context", exact: true });
  await saveDraft.waitFor({ state: "visible", timeout: 30000 });
  await saveDraft.click();
  await page.getByText("Your interview has been saved to your Context.", { exact: true }).waitFor({ state: "visible", timeout: 30000 });
  assert.equal(await page.getByText(topic, { exact: true }).count() > 0, true, "saved profile topic is missing from Dashboard");
  console.log("PASS Dashboard profile", JSON.stringify({ topic, saved: true }));

  await page.goto(base + "/history", { waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("heading", { name: topic, exact: true }).waitFor({ state: "visible", timeout: 30000 });
  const history = page.getByLabel("Context history timeline");
  await history.waitFor({ state: "visible", timeout: 30000 });
  const historyText = await history.innerText();
  assert.match(historyText, /V ?1/,
    "saved profile is not represented by a current Context history version");
  assert.match(historyText, /CURRENT/,
    "Context history does not identify the saved profile as current");
  console.log("PASS History", JSON.stringify({ topic, currentVersion: true }));

  await page.goto(base + "/bridge", { waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("heading", { name: "Connect ALVIRA to another AI tool." }).waitFor({ state: "visible", timeout: 30000 });
  await page.getByText(/saved Context/i).first().waitFor({ state: "visible", timeout: 30000 });

  await page.goto(base + "/bridge/connect?mode=oauth&client_name=Authenticated%20continuity%20smoke", { waitUntil: "networkidle", timeout: 45000 });
  await page.getByRole("heading", { name: "Approve exactly what this AI app may use." }).waitFor({ state: "visible", timeout: 30000 });
  const contextSelect = page.locator("#bridge-context");
  await contextSelect.waitFor({ state: "visible", timeout: 30000 });
  const optionTexts = await contextSelect.locator("option").allTextContents();
  assert.ok(optionTexts.includes(topic), "saved profile is not available in the Connect ALVIRA Context selector");
  assert.equal(await page.getByText(`It can read: ${topic}`, { exact: true }).count() > 0, true, "Connect ALVIRA did not expose the exact saved Context");
  console.log("PASS Connect ALVIRA", JSON.stringify({ topic, available: true }));

  assert.equal(pageErrors.length, 0, pageErrors.join(" | "));
  assert.equal(consoleErrors.length, 0, consoleErrors.join(" | "));
  console.log("PASS authenticated continuity: guest → interview → Context Mirror → compiled Context → login → restored Context → persisted profile → Dashboard → History → Connect ALVIRA");

  await context.close();
} finally {
  await browser.close();
}
