import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.E2E_BASE_URL || 'https://alviratech.vercel.app';
const failures = [];
const observations = [];

function record(name, ok, detail = '') {
  const line = `${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`;
  console.log(line);
  observations.push(line);
  if (!ok) failures.push(line);
}

async function safe(name, fn) {
  try {
    await fn();
    record(name, true);
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error));
  }
}

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktop.newPage();
  const consoleProblems = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleProblems.push(msg.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const routeMatrix = [
    '/',
    '/app',
    '/app?offering=meos&preview=false',
    '/context',
    '/pricing',
    '/integrations',
    '/bridge',
    '/login',
    '/signup',
    '/dashboard',
    '/history',
    '/account',
    '/build-brief',
    '/meos',
  ];

  for (const route of routeMatrix) {
    await safe(`route ${route} renders without 5xx`, async () => {
      const response = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      assert(response, 'no navigation response');
      assert(response.status() < 500, `HTTP ${response.status()}`);
      await page.waitForTimeout(300);
      const body = await page.locator('body').innerText();
      assert(body.trim().length > 0, 'empty body');
    });
  }

  await safe('private brand preview remains unavailable', async () => {
    const response = await page.goto(`${BASE}/brand-preview`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert(response, 'no response');
    assert.equal(response.status(), 404, `expected 404, got ${response.status()}`);
  });

  await safe('Context interview starts and accepts a typed answer', async () => {
    await desktop.clearCookies();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload({ waitUntil: 'networkidle', timeout: 45000 });

    const main = page.locator('#main-content');
    await main.waitFor({ state: 'visible', timeout: 15000 });

    const goalLabel = page.getByText('My goals, priorities, and how I evaluate tradeoffs', { exact: true });
    if (await goalLabel.count()) {
      await goalLabel.click();
    } else {
      const custom = page.getByPlaceholder('Add your own topic...');
      await custom.fill('My goals, priorities, and current projects');
    }

    const start = page.getByRole('button', { name: 'Start interview' });
    await start.click();

    const textarea = page.locator('textarea[aria-label="Your answer"]');
    await textarea.waitFor({ state: 'visible', timeout: 45000 });
    const answer = 'My main goal right now is to launch a useful product for real customers while protecting creative control, staying within a small budget, and learning which work is actually worth automating.';
    await textarea.fill(answer);
    await textarea.press('Enter');

    await page.getByText(answer, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => {
      const el = document.querySelector('textarea[aria-label="Your answer"]');
      return el && !el.disabled;
    }, undefined, { timeout: 45000 });

    const body = await page.locator('body').innerText();
    assert(!/API Key Not Configured/i.test(body), 'runtime API key missing');
    assert(!/Something went wrong|Internal Server Error/i.test(body), 'fatal interview error shown');
  });

  await safe('anonymous interview survives refresh/resume boundary', async () => {
    await page.reload({ waitUntil: 'networkidle', timeout: 45000 });
    const resume = page.getByRole('button', { name: /Continue previous interview/i });
    if (await resume.count()) {
      await resume.click();
      await page.locator('textarea[aria-label="Your answer"]').waitFor({ state: 'visible', timeout: 30000 });
    } else {
      const textarea = page.locator('textarea[aria-label="Your answer"]');
      assert(await textarea.count(), 'neither resume control nor active composer present after refresh');
    }
  });

  await safe('Reflect canonical entry opens Reflect mode directly', async () => {
    await page.goto(`${BASE}/app?offering=meos&preview=false`, { waitUntil: 'networkidle', timeout: 45000 });
    const reflectToggle = page.getByRole('button', { name: 'ALVIRA Reflect' });
    await reflectToggle.waitFor({ state: 'visible', timeout: 15000 });
    assert.equal(await reflectToggle.getAttribute('aria-pressed'), 'true');
    const text = await page.locator('body').innerText();
    assert(/Build your living reflection/i.test(text), 'Reflect start copy missing');
  });

  await safe('unauthenticated Build Brief remains gated', async () => {
    await desktop.clearCookies();
    await page.goto(`${BASE}/build-brief`, { waitUntil: 'networkidle', timeout: 45000 });
    const text = await page.locator('body').innerText();
    assert(/sign in/i.test(text), 'no sign-in gate visible');
  });

  await safe('Bridge disconnected status is non-error while protected APIs stay protected', async () => {
    const request = desktop.request;
    const status = await request.get(`${BASE}/api/bridge/context`);
    assert.equal(status.status(), 200);
    const statusBody = await status.json();
    assert.equal(statusBody.connected, false);

    const profiles = await request.get(`${BASE}/api/bridge/profiles`);
    assert.equal(profiles.status(), 401);

    const mcp = await request.post(`${BASE}/api/bridge/mcp`, { data: {} });
    assert.equal(mcp.status(), 401);
  });

  await safe('no React hydration error surfaced during tested desktop flows', async () => {
    const combined = [...consoleProblems, ...pageErrors].join('\n');
    assert(!/hydration|Minified React error #418|React error #418/i.test(combined), combined || 'no hydration errors');
  });

  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  const mobileRoutes = ['/app', '/app?offering=meos&preview=false', '/integrations', '/pricing', '/bridge'];

  for (const route of mobileRoutes) {
    await safe(`mobile ${route} has no horizontal overflow`, async () => {
      const response = await mobilePage.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 45000 });
      assert(response && response.status() < 500, `HTTP ${response?.status()}`);
      const dims = await mobilePage.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      assert(dims.scrollWidth <= dims.clientWidth + 2, `overflow ${dims.scrollWidth}px > ${dims.clientWidth}px`);
    });
  }

  await safe('mobile app exposes usable first-run action', async () => {
    await mobilePage.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 45000 });
    const start = mobilePage.getByRole('button', { name: 'Start interview' });
    await start.waitFor({ state: 'visible', timeout: 15000 });
    const box = await start.boundingBox();
    assert(box && box.width > 40 && box.height > 40, 'start action is not a usable touch target');
  });

  await mobile.close();
} finally {
  await browser.close();
}

console.log('\n=== E2E QA SUMMARY ===');
for (const line of observations) console.log(line);
if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log('\nAll production E2E QA checks passed.');
