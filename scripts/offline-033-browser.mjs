import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';
import { Game } from '../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionRun } from '../src/missions.ts';

// Supply only on-disk packaged files with the browser's network explicitly off.
// This models Capacitor's bundled transport, not a PWA/service-worker cache.
const origin = 'http://serpents-embedded.test';
const root = resolve('dist');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
const errors = [],
  missing = [],
  external = [],
  served = new Set(),
  checks = [];
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 812, height: 375 },
    hasTouch: true,
    offline: true,
  });
  await context.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== origin) {
      external.push(u.origin);
      return route.abort();
    }
    const file = resolve(
      root,
      '.' + decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname),
    );
    if (!file.startsWith(root + sep)) return route.abort();
    try {
      const body = await readFile(file);
      served.add(u.pathname);
      await route.fulfill({
        status: 200,
        contentType: mime[extname(file)] ?? 'application/octet-stream',
        body,
      });
    } catch {
      missing.push(u.pathname);
      await route.abort();
    }
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin);
  assert.equal(await page.evaluate(() => navigator.onLine), false);
  assert.ok((await page.locator('body').innerText()).includes(pkg.version));
  await page.locator('#home-play').click();
  await page.locator('#mission-launch').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#wave').textContent === '1');
  await page.locator('#pause').click();
  await page.locator('#pause-overlay').waitFor({ state: 'visible' });
  const familyBefore = await page.evaluate(() =>
    localStorage.getItem('conquete-serpents:family:v1'),
  );
  assert.ok(familyBefore);
  await page.reload();
  await page.locator('#mission-continue').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  assert.equal(
    await page.locator('#wave').innerText(),
    '0',
    'Reload restores the last camp, not an invented combat save',
  );
  assert.equal(await page.locator('#base').innerText(), '100 %');
  checks.push('offline cold start, tutorial wave, pause and last-camp reload');

  // Synthetic valid snapshots: exercise all supported schemas through real production startup.
  const classic = JSON.parse(encodeCheckpoint(new Game(33)));
  const legacyMission = { ...createMissionRun('refuge', 33) };
  delete legacyMission.rules;
  const version5 = encodeCheckpoint(new Game(33, { tacticalRulesEnabled: false }, legacyMission));
  const version7 = encodeCheckpoint(new Game(33, undefined, createMissionRun('refuge', 33)));
  for (const version of [1, 2, 3, 4, 5, 6, 7]) {
    const raw =
      version === 5 ? version5 : version === 7 ? version7 : JSON.stringify({ ...classic, version });
    assert.ok(decodeCheckpoint(raw), `Valid schema ${version} fixture`);
    await page.evaluate((raw) => {
      localStorage.clear();
      localStorage.setItem('conquete-serpents:camp:v1', raw);
    }, raw);
    await page.reload();
    await page
      .locator(version === 5 || version === 7 ? '#mission-continue' : '#home-continue')
      .click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
    assert.equal(await page.locator('#wave').innerText(), '0');
    assert.equal(await page.locator('#army-count').innerText(), '3');
    checks.push(`schema ${version} restores three allies offline`);
  }
  // Later classic camps require fresh backgrounds and more unit sheets on demand.
  for (const wave of [4, 8]) {
    const game = new Game(33);
    game.wave = wave;
    game.rewards.pending = wave;
    game.normalizeCamp();
    const raw = encodeCheckpoint(game);
    assert.ok(decodeCheckpoint(raw));
    await page.evaluate((raw) => {
      localStorage.clear();
      localStorage.setItem('conquete-serpents:camp:v1', raw);
    }, raw);
    await page.reload();
    await page.locator('#home-continue').click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
    assert.equal(await page.locator('#wave').innerText(), String(wave));
    checks.push(`chapter ${wave / 4 + 1} loads bundled assets offline`);
  }
  assert.ok([...served].some((p) => p.includes('ground-grove')));
  assert.ok([...served].some((p) => p.includes('ground-ruins')));
  assert.deepEqual(external, []);
  assert.deepEqual(missing, []);
  assert.deepEqual(errors, []);
  await mkdir('reports', { recursive: true });
  await writeFile(
    `reports/offline-${pkg.version}.json`,
    JSON.stringify(
      {
        version: pkg.version,
        source:
          'Chromium offline, disk-only route transport simulating bundled Capacitor files; not a physical device or web offline cache',
        checks,
        served: [...served].sort(),
        external,
        missing,
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ checks, files: served.size, errors }));
} finally {
  await browser?.close();
}
