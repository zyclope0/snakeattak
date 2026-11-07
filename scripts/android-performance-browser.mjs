import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
let server, browser;
const url = 'http://127.0.0.1:4340';
try {
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--port',
    '4340',
    '--strictPort',
    '--host',
    '127.0.0.1',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (i > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 812, height: 375 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const start = async (query) => {
    await page.goto(url + query);
    await page.locator('#home-new').click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
  };
  await start('');
  assert.equal(await page.locator('[data-performance]').count(), 0);
  await start('?perf=1');
  await page.locator('[data-performance]').waitFor();
  await page.locator('#start').click();
  await page.waitForTimeout(2600);
  const read = async () => {
    await page.locator('.performance-panel button').click();
    assert.equal(
      await page.locator('#pause').getAttribute('aria-label'),
      'Reprendre',
      'Reading the report owns a pause',
    );
    const r = JSON.parse(await page.locator('.performance-dialog textarea').inputValue());
    await page
      .getByRole('button', { name: 'Fermer', exact: true })
      .filter({ visible: true })
      .click();
    return r;
  };
  const a = await read();
  assert.ok(a.windows >= 1);
  assert.ok(a.fpsMedian > 0);
  assert.equal(a.physicalDeviceVerified, false);
  assert.ok(a.lastAssetLoadMs >= 0);
  assert.match(a.version, /v0\./);
  await page.locator('#pause').click();
  await page.locator('#pause-overlay').waitFor({ state: 'visible' });
  await page.waitForTimeout(650);
  const frozen = await page.locator('[data-performance]').getAttribute('data-active-ms');
  await page.waitForTimeout(1800);
  assert.equal(
    await page.locator('[data-performance]').getAttribute('data-active-ms'),
    frozen,
    'Pause excluded from active time',
  );
  await read();
  assert.equal(
    await page.locator('#pause').getAttribute('aria-label'),
    'Reprendre',
    'Existing pause preserved after reading',
  );
  await page.locator('#resume-game').click();
  const b = await read();
  assert.ok(b.activeMs >= a.activeMs);
  await page.locator('.performance-panel button').click();
  await page.getByRole('button', { name: 'Recommencer la mesure' }).click();
  assert.equal(
    JSON.parse(await page.locator('.performance-dialog textarea').inputValue()).activeMs,
    0,
    'Reset refreshes the displayed report',
  );
  await page.keyboard.press('Escape');
  assert.equal(
    await page.locator('#pause').getAttribute('aria-label'),
    'Mettre en pause',
    'Escape releases only its owned pause',
  );
  await page.locator('#mobile-home').click();
  await page.locator('#home-expeditions').click();
  await page.locator('[data-mission-card="refuge"]').click();
  await page.locator('#mission-launch').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  const fresh = await read();
  assert.equal(fresh.activeMs, 0, 'New game starts a separate recording');
  assert.equal(fresh.context.mission, 'refuge');
  assert.deepEqual(errors, []);
  await mkdir('artifacts/android', { recursive: true });
  await writeFile(
    'artifacts/android/browser-instrumentation.json',
    JSON.stringify({ source: 'headless cloud; not physical Android', report: a, errors }, null, 2),
  );
  console.log(
    'Production opt-in, local report, active-only measurement and default absence verified. No phone performance claim.',
  );
} finally {
  await browser?.close();
  server?.kill();
}
