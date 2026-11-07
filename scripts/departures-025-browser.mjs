import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { encodeDeparture } from '../src/departures.ts';
import { createMissionRun } from '../src/missions.ts';

let server, browser;
const key = 'conquete-serpents:family:v1';
const version = JSON.parse(
  await (await import('node:fs/promises')).readFile('package.json', 'utf8'),
).version;
try {
  await mkdir('artifacts/departures-025', { recursive: true });
  if (!process.env.GAME_URL) {
    server = spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '4199',
      '--strictPort',
    ]);
    for (let i = 0; ; i++) {
      try {
        if ((await fetch('http://127.0.0.1:4199')).ok) break;
      } catch {}
      if (server.exitCode !== null || i > 100) throw Error('Departure preview unavailable');
      await delay(100);
    }
  }
  const url = process.env.GAME_URL ?? 'http://127.0.0.1:4199';
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#home-screen [data-app-version]').textContent(), `v${version}`);
  const family = () => page.evaluate((key) => localStorage.getItem(key), key);
  const submit = async (code) => {
    await page.locator('#departure-input').fill(code);
    await page.locator('#departure-form button').click();
  };
  const before = await family();
  await submit('FOUGERE-42');
  assert.match(await page.locator('#departure-message').textContent(), /incorrect/);
  assert.equal(await family(), before);
  await submit(encodeDeparture({ kind: 'mission', run: createMissionRun('carrefour', 2026) }));
  assert.match(await page.locator('#departure-message').textContent(), /verrouillée/);
  assert.equal(await family(), before);
  const classic = encodeDeparture({ kind: 'classic', seed: 2026 });
  await submit(classic);
  await page.locator('#departure-cancel').click();
  assert.equal(await family(), before);
  await submit(classic);
  await page.locator('#departure-start').click();
  await page.locator('#app').waitFor({ state: 'visible' });
  await page.waitForTimeout(600);
  assert.equal(await page.locator('#current-departure-code').inputValue(), classic);
  assert.equal(await page.locator('#app [data-app-version]').textContent(), `v${version}`);
  await page.locator('canvas').screenshot({ path: 'artifacts/departures-025/classic-start.png' });
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(Error('blocked')) },
    }),
  );
  await page.locator('#current-departure-copy').click();
  assert.match(await page.locator('#current-departure-message').textContent(), /sélectionné/);
  await page.waitForTimeout(250);
  assert.deepEqual(
    await page
      .locator('#current-departure-code')
      .evaluate((n) => [n.selectionStart, n.selectionEnd]),
    [0, classic.length],
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text) => {
          window.copiedDeparture = text;
          return Promise.resolve();
        },
      },
    }),
  );
  await page.locator('#current-departure-copy').click();
  assert.equal(await page.evaluate(() => window.copiedDeparture), classic);
  await page.locator('#start').click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#current-departure-code').inputValue(), classic);
  await page.locator('#menu-home').click();
  const campBefore = await family();
  const another = encodeDeparture({ kind: 'classic', seed: 42 });
  await submit(another);
  await page.locator('#departure-start').click();
  await page.locator('#journey-confirm').waitFor({ state: 'visible' });
  await page.locator('#journey-cancel').click();
  assert.equal(await family(), campBefore);
  await submit(another);
  await page.locator('#departure-start').click();
  await page.locator('#journey-replace').click();
  assert.equal(await page.locator('#current-departure-code').inputValue(), another);
  await page.reload();
  await page.locator('#home-continue').click();
  assert.equal(await page.locator('#current-departure-code').inputValue(), another);
  await page.locator('#menu-home').click();
  // Simulate an already earned first-mission victory, without granting others.
  await page.evaluate((key) => {
    const family = JSON.parse(localStorage.getItem(key));
    family.missions.bestStars.refuge = 3;
    localStorage.setItem(key, JSON.stringify(family));
  }, key);
  await page.reload();
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  const initial = createMissionRun('trois-ponts', 2026);
  const run = createMissionRun('trois-ponts', 2026, initial);
  const code = encodeDeparture({ kind: 'mission', run });
  await submit(code);
  assert.deepEqual(JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run')), run);
  assert.equal(await page.locator('#mission-departure-code').inputValue(), code);
  await page.locator('#mission-launch').click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#current-departure-code').inputValue(), code);
  const saved = JSON.parse(await family());
  const active = JSON.parse(saved.camp);
  assert.equal(active.gold, 550);
  assert.equal(active.units.length, 3);
  assert.deepEqual(active.mission, run);
  assert.equal(JSON.parse(saved.missions.classicCamp).initialSeed, 42);
  await page.screenshot({ path: 'artifacts/departures-025/shared-mission.png', fullPage: true });
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto(url);
  assert.equal(await mobile.locator('#orientation-notice').isVisible(), true);
  await mobile.setViewportSize({ width: 812, height: 375 });
  await mobile.locator('#departure-input').fill(encodeDeparture({ kind: 'classic', seed: 0 }));
  await mobile.locator('#departure-form button').tap();
  await mobile.locator('#departure-start').tap();
  await mobile.waitForTimeout(350);
  assert.equal(
    await mobile.locator('#current-departure-code').inputValue(),
    encodeDeparture({ kind: 'classic', seed: 0 }),
  );
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: 'artifacts/departures-025/mobile-812.png', fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    `reports/departures-${version.split('.').slice(0, 2).join('.')}.json`,
    JSON.stringify(
      {
        version,
        classicCode: classic,
        missionCode: code,
        checks: [
          'invalid-safe',
          'locked-safe',
          'cancel-safe',
          'classic-confirm',
          'seed-persistence',
          'clipboard-fallback',
          'clipboard-copy',
          'full-mission-config',
          'fresh-budget',
          'classic-camp-preserved',
          'version-visible',
          'mobile',
        ],
        errors,
        physicalDevice: false,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Departures: classic, 108-configuration codec, guarded mission import, confirmation, reload, copy/fallback and touch passed.',
  );
} finally {
  await browser?.close();
  server?.kill();
}
