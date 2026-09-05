import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.E2E_BASE_URL || 'https://alviratech.vercel.app';
const failures = [];
const observations = [];
const hydrationByRoute = [];

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
  const routeMatrix = [
    '/',
    '/app',
    '/app?offering=meos&preview=false',
    '/context',
    '/pricing',
    '/integrations',
    '/bridge',
    '/signup',
    '/dashboard',
    '/history',
    '/account',
    '/build-brief',
    '/meos',
  ];

  for (const route of routeMatrix) {
    await safe(`route ${route} renders without 5xx`, async () => {
      const page = await desktop.newPage();
      const problems = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(msg.text());
      });
      page.on('pageerror', (error) => problems.push(error.message));
      const response = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      assert(response, 'no navigation response');
      assert(response.status() < 500, `HTTP ${response.status()}`);
      await page.waitForTimeout(700);
      const body = await page.locator('body').innerText();
      assert(body.trim().length > 0, 'empty body');
      const hydration = problems.filter((text) => /hydration|Minified React error #418|React error #418/i.test(text));
      if (hydration.length) hydrationByRoute.push({ route, errors: hydration });
      await page.close();
    });
  }

  await safe('login endpoint is reachable or redirects intentionally', async () => {
    const response = await desktop.request.get(`${BASE}/login`, { maxRedirects: 5 });
    assert(response.status() < 500, `HTTP ${response.status()}`);
  });

  await safe('private brand preview remains unavailable', async () => {
    const response = await desktop.request.get(`${BASE}/brand-preview`, { maxRedirects: 0 });
    assert.equal(response.status(), 404, `expected 404, got ${response.status()}`);
  });

  const interviewPage = await desktop.newPage();
  await safe('Context interview starts and accepts a typed answer', async () => {
    await desktop.clearCookies();
    await interviewPage.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 45000 });
    await interviewPage.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await interviewPage.reload({ waitUntil: 'networkidle', timeout: 45000 });

    const main = interviewPage.locator('#main-content');
    await main.waitFor({ state: 'visible', timeout: 15000 });

    const goalChoice = interviewPage.getByText('Make decisions about goals, priorities, or next steps', { exact: true });
    await goalChoice.waitFor({ state: 'visible', timeout: 15000 });
    await goalChoice.click();

    const start = interviewPage.getByRole('button', { name: 'Start the conversation' });
    await start.waitFor({ state: 'visible', timeout: 15000 });
    await start.click();

    const textarea = interviewPage.locator('textarea[aria-label="Your answer"]');
    await textarea.waitFor({ state: 'visible', timeout: 45000 });
    const answer = 'My main goal right now is to launch a useful product for real customers while protecting creative control, staying within a small budget, and learning which work is actually worth automating.';
    await textarea.fill(answer);
    await textarea.press('Enter');

    await interviewPage.getByText(answer, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    await interviewPage.waitForFunction(() => {
      const el = document.querySelector('textarea[aria-label="Your answer"]');
      return el && !el.disabled;
    }, undefined, { timeout: 45000 });

    const body = await interviewPage.locator('body').innerText();
    assert(!/API Key Not Configured/i.test(body), 'runtime API key missing');
    assert(!/Something went wrong|Internal Server Error/i.test(body), 'fatal interview error shown');
  });

  await safe('anonymous interview survives refresh/resume boundary', async () => {
    await interviewPage.reload({ waitUntil: 'networkidle', timeout: 45000 });
    const resume = interviewPage.getByRole('button', { name: /Continue previous interview/i });
    if (await resume.count()) {
      await resume.click();
      await interviewPage.locator('textarea[aria-label="Your answer"]').waitFor({ state: 'visible', timeout: 30000 });
    } else {
      const textarea = interviewPage.locator('textarea[aria-label="Your answer"]');
      assert(await textarea.count(), 'neither resume control nor active composer present after refresh');
    }
  });
  await interviewPage.close();

  await safe('Reflect canonical entry opens Reflect mode directly', async () => {
    const page = await desktop.newPage();
    await page.goto(`${BASE}/app?offering=meos&preview=false`, { waitUntil: 'networkidle', timeout: 45000 });
    const reflectToggle = page.getByRole('button', { name: 'ALVIRA Reflect' });
    await reflectToggle.waitFor({ state: 'visible', timeout: 15000 });
    assert.equal(await reflectToggle.getAttribute('aria-pressed'), 'true');
    const text = await page.locator('body').innerText();
    assert(/Build your living reflection/i.test(text), 'Reflect start copy missing');
    await page.close();
  });

  await safe('unauthenticated Build Brief remains gated', async () => {
    await desktop.clearCookies();
    const page = await desktop.newPage();
    await page.goto(`${BASE}/build-brief`, { waitUntil: 'networkidle', timeout: 45000 });
    const text = await page.locator('body').innerText();
    assert(/sign in/i.test(text), 'no sign-in gate visible');
    await page.close();
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

  await safe('tested routes emit no React hydration #418 errors', async () => {
    assert.equal(hydrationByRoute.length, 0, hydrationByRoute.map((item) => `${item.route}: ${item.errors.join(' | ')}`).join('\n'));
  });

  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobileRoutes = ['/app', '/app?offering=meos&preview=false', '/integrations', '/pricing', '/bridge'];

  for (const route of mobileRoutes) {
    await safe(`mobile ${route} has no horizontal overflow`, async () => {
      const page = await mobile.newPage();
      const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 45000 });
      assert(response && response.status() < 500, `HTTP ${response?.status()}`);
      const dims = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      assert(dims.scrollWidth <= dims.clientWidth + 2, `overflow ${dims.scrollWidth}px > ${dims.clientWidth}px`);
      await page.close();
    });
  }

  await safe('mobile app exposes usable first-run action', async () => {
    const page = await mobile.newPage();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 45000 });
    const start = page.getByRole('button', { name: 'Start the conversation' });
    await start.waitFor({ state: 'visible', timeout: 15000 });
    const box = await start.boundingBox();
    assert(box && box.width > 40 && box.height > 40, 'start action is not a usable touch target');
    await page.close();
  });

  await mobile.close();
} finally {
  await browser.close();
}

console.log('\n=== E2E QA SUMMARY ===');
for (const line of observations) console.log(line);
if (hydrationByRoute.length) {
  console.log('\n=== HYDRATION ROUTES ===');
  for (const item of hydrationByRoute) console.log(`${item.route}: ${item.errors.join(' | ')}`);
}
if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log('\nAll production E2E QA checks passed.');
