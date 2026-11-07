import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { encodeDeparture } from '../src/departures.ts';

const point = Number(process.argv[2] ?? 0);
const url = process.env.GAME_URL ?? 'http://127.0.0.1:4327';
const results = [];
let server, browser;
const errors = [];
async function ready(page) {
  await page.waitForFunction(
    () => document.getElementById('game')?.getAttribute('aria-busy') === 'false',
  );
  await page.waitForFunction(
    () => document.querySelector('#game canvas')?.getBoundingClientRect().height > 0,
  );
  await page.waitForTimeout(150);
}
async function home(page) {
  await page.goto(url);
  await page.locator('#home-screen').waitFor({ state: 'visible' });
}
async function mission(page) {
  await home(page);
  await page.locator('#home-expeditions').click();
  await page.locator('[data-mission-card="refuge"]').click();
  await page.locator('#mission-launch').click();
  await ready(page);
}
async function newPage(width, height, touch = false) {
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return page;
}
const checks = {
  async 1() {
    for (const [width, height] of [
      [1280, 800],
      [1366, 768],
      [1920, 1080],
    ]) {
      const page = await newPage(width, height);
      await mission(page);
      assert.equal(
        await page.evaluate(() => scrollY),
        0,
        `Entrée mission ${width}×${height} en haut`,
      );
      if (width === 1280) {
        await page.locator('#menu-home').click();
        await page.locator('#mission-continue').click();
        await ready(page);
        assert.equal(await page.evaluate(() => scrollY), 0, 'Reprise mission');
        await page.locator('#menu-home').click();
        await page.locator('#home-new').click();
        if (await page.locator('#journey-confirm').isVisible())
          await page.locator('#journey-replace').click();
        await ready(page);
        assert.equal(await page.evaluate(() => scrollY), 0, 'Entrée classique');
        await page.locator('#menu-home').click();
        await page.locator('#home-continue').click();
        await ready(page);
        assert.equal(await page.evaluate(() => scrollY), 0, 'Reprise classique');
        await page.locator('#menu-home').click();
        await page
          .locator('#departure-input')
          .fill(encodeDeparture({ kind: 'classic', seed: 2026 }));
        await page.locator('#departure-form button').click();
        await page.locator('#departure-start').click();
        if (await page.locator('#journey-confirm').isVisible())
          await page.locator('#journey-replace').click();
        await ready(page);
        assert.equal(await page.evaluate(() => scrollY), 0, 'Départ partagé');
      }
      results.push({ point: 1, width, height, scrollY: await page.evaluate(() => scrollY) });
      await page.close();
    }
  },
};
try {
  await mkdir('artifacts/display-027', { recursive: true });
  if (!process.env.GAME_URL) {
    server = spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '4327',
      '--strictPort',
    ]);
    for (let i = 0; ; i++) {
      try {
        if ((await fetch(url)).ok) break;
      } catch {}
      if (server.exitCode !== null || i > 100) throw Error('Preview indisponible');
      await delay(100);
    }
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [id, check] of Object.entries(checks))
    if (!point || point === Number(id)) await check();
  assert.deepEqual(errors, []);
  await writeFile(
    `artifacts/display-027/point-${point}.json`,
    JSON.stringify({ results, errors }, null, 2) + '\n',
  );
  console.log(JSON.stringify({ points: point || 'all', checks: results.length, errors }));
} finally {
  await browser?.close();
  server?.kill();
}
