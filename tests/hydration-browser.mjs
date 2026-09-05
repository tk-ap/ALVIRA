import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  for (const route of ['/', '/app', '/pricing']) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /hydration|Minified React error #418|React error #418/i.test(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (error) => {
      if (/hydration|Minified React error #418|React error #418/i.test(error.message)) errors.push(error.message);
    });
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 45000 });
    assert(response && response.status() < 500, `${route}: HTTP ${response?.status()}`);
    await page.waitForTimeout(700);
    assert.equal(errors.length, 0, `${route}: ${errors.join(' | ')}`);

    const bodyText = (await page.locator('body').innerText()).trim();
    assert(bodyText.length > 0, `${route}: hydrated body is empty`);

    if (route === '/app') {
      const main = page.locator('main#main-content');
      await main.waitFor({ state: 'visible', timeout: 10000 });
      const visibility = await main.evaluate((element) => getComputedStyle(element).visibility);
      assert.equal(visibility, 'visible', '/app: first-run clarity never revealed main content');
      await page.getByRole('button', { name: 'Start the conversation' }).waitFor({ state: 'visible', timeout: 10000 });
    }

    console.log(`PASS ${route} hydrates without React #418`);
    await page.close();
  }
  await context.close();
} finally {
  await browser.close();
}
