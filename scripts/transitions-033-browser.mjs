import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const origin = 'http://127.0.0.1:4379';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const checks = [],
  errors = [];
let server, browser;
try {
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4379',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (server.exitCode !== null || i > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const blocked of [false, true]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width: 1280, height: 800 },
    });
    page.on('pageerror', (e) => errors.push(e.message));
    if (blocked)
      await page.addInitScript(() => {
        Storage.prototype.getItem = () => {
          throw Error('blocked');
        };
        Storage.prototype.setItem = () => {
          throw Error('blocked');
        };
      });
    await page.goto(origin);
    await page.locator('#home-play').click();
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.getElementById('game').getAttribute('aria-busy') === 'false',
    );
    await page.locator('#start').click();
    await page.locator('#pause').click();
    await page.locator('#pause-overlay').waitFor({ state: 'visible' });
    const state = () =>
      page.evaluate(() =>
        Object.fromEntries(
          ['wave', 'gold', 'army-count', 'base'].map((id) => [
            id,
            document.getElementById(id).textContent,
          ]),
        ),
      );
    const before = await state();
    await page.locator('#menu-home').click();
    assert.equal(await page.locator('#app').evaluate((el) => el.hidden), true);
    assert.equal(await page.locator('#home-screen').isVisible(), true);
    await page.locator('#mission-continue').click();
    assert.equal(await page.locator('#app').evaluate((el) => el.hidden), false);
    assert.equal(await page.locator('#home-screen').isVisible(), false);
    assert.deepEqual(await state(), before, 'Returning to a mission retains the live camp');
    await page.locator('#pause-overlay').waitFor({ state: 'visible' });
    await page.locator('#resume-game').click();
    await page.locator('#pause-overlay').waitFor({ state: 'hidden' });
    if (blocked) assert.match(await page.locator('#save-status').textContent(), /indisponible/);
    checks.push({
      blockedStorage: blocked,
      state: before,
      result: 'mission → home → resume retains counters and player pause; explicit Resume works',
    });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await mkdir('reports', { recursive: true });
  await writeFile(
    `reports/transitions-${version}.json`,
    JSON.stringify(
      {
        version,
        source: 'Chromium cloud; production build, synthetic blocked Storage, not physical Android',
        checks,
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await browser?.close();
  server?.kill();
}
