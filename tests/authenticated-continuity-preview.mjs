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
  const topic = "Authenticated continuity smoke " + Date.now();

  await page.goto(base + "/app", { waitUntil: "networkidle", timeout: 45000 });

  const custom = page.getByPlaceholder("Something else I could use help with...");
  await custom.fill(topic);
  await page.getByRole("button", { name: "Start the conversation" }).click();

  const answer = page.getByLabel("Your answer");
  await answer.waitFor({ state: "visible", timeout: 60000 });
  await answer.fill("I prefer written context before meetings and explicit tradeoffs before hard-to-reverse decisions.");
  await page.getByRole("button", { name: "Send answer" }).click();
  await page.locator(".ivx-live-mirror__item").first().waitFor({ state: "visible", timeout: 60000 });

  await page.getByRole("button", { name: /Generate knowledge files/ }).click();
  await page.getByRole("heading", { name: "Compiled ALVIRA Context" }).waitFor({ state: "visible", timeout: 90000 });

  await page.goto(base + "/login?returnTo=/app", { waitUntil: "networkidle", timeout: 45000 });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/app(?:\?|$)/, { timeout: 45000 });

  const body = await page.locator("body").innerText();
  assert(body.includes(topic), "anonymous Context was not restored after login");

  console.log("PASS authenticated continuity checkpoint: anonymous Context survived login in the same browser session");

  await context.close();
} finally {
  await browser.close();
}
