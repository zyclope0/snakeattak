import { PRIVACY_POLICY } from '../src/i18n/privacyPolicy.ts';
import { showHomePage } from '../tests/browser-entry.mjs';
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
const android = process.argv.includes('--android');
const root = resolve(android ? 'dist-android' : 'dist');
const build = JSON.parse(await readFile(resolve(root, 'build-info.json'), 'utf8'));
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
    locale: 'fr-CH',
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
  // Locale initialization loads bootstrap asynchronously, including offline.
  // Wait for the real menu before inspecting its version.
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  assert.ok(
    !(await page.locator('body').innerText()).includes(pkg.version),
    'The first screen does not show the version number',
  );
  // The version left the first screen (the parent's decision, 24 November 2026): a parent
  // reads it in « Pour les parents », whole and inside the screen, offline too.
  await showHomePage(page, 'parents');
  const shown = page.locator('#home-screen [data-app-version]:visible');
  assert.equal(await shown.count(), 1, 'the version is written once for a parent');
  assert.equal((await shown.innerText()).trim(), `v${pkg.version}`);
  const at = await shown.boundingBox();
  const view = page.viewportSize();
  assert.ok(
    at.x >= 0 && at.y >= 0 && at.x + at.width <= view.width && at.y + at.height <= view.height,
    `the version is inside the screen: ${JSON.stringify(at)}`,
  );
  checks.push('the version number is read on « Pour les parents », not on the first screen');
  await showHomePage(page, 'home');
  await showHomePage(page, 'missions');
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
  await showHomePage(page, 'missions');
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
    await showHomePage(page, version === 5 || version === 7 ? 'missions' : 'classic');
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
    await showHomePage(page, 'classic');
    await page.locator('#home-continue').click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
    assert.equal(await page.locator('#wave').innerText(), String(wave));
    checks.push(`chapter ${wave / 4 + 1} loads bundled assets offline`);
  }
  assert.ok([...served].some((p) => p.includes('ground-grove')));
  assert.ok([...served].some((p) => p.includes('ground-ruins')));
  // The screens of « La Grande Expédition » (with those of the voyage they replaced) are a
  // package of their own, asked for when its door is first touched: script, style sheet and
  // pictures must all be on disk.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#home-voyage').waitFor({ state: 'visible' });
  assert.ok(
    ![...served].some((p) => p.includes('voyageScreens')),
    'The voyage package is not loaded before its door is touched',
  );
  await page.locator('#home-voyage').click();
  await page.locator('#home-screen[data-page="expedition"]').waitFor();
  assert.equal(await page.locator('.exp-stop').count(), 12);
  await page.locator('.exp-go').first().click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  assert.equal(await page.locator('#voyage-mark-step').innerText(), 'Expédition · étape 1 sur 5');
  for (const file of [/voyageScreens-[\w-]+\.js$/, /voyageScreens-[\w-]+\.css$/, /voyage-antre-/])
    assert.ok(
      [...served].some((p) => file.test(p)),
      `Voyage file served from disk: ${file}`,
    );
  checks.push('the expedition opens offline from its own package and starts its first mission');
  // The privacy policy ships inside the application: after a cold start without network,
  // the parents' page opens it from its own package, in the language of the game.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await showHomePage(page, 'parents');
  await page.locator('#home-privacy').waitFor({ state: 'visible' });
  assert.ok(
    ![...served].some((p) => p.includes('privacyWindow')),
    'The privacy package is not loaded before its button is touched',
  );
  await page.locator('#home-privacy').click();
  await page.locator('#privacy-dialog[open]').waitFor();
  assert.deepEqual(
    await page
      .locator('#privacy-body article')
      .evaluate((article) => [
        article.lang,
        article.querySelector('h3').textContent,
        article.querySelectorAll('h4').length,
        article.querySelector('.privacy-public a').getAttribute('href'),
      ]),
    [
      'fr',
      'Politique de confidentialité de La Conquête des Serpents / Snake Attack TD',
      PRIVACY_POLICY.fr.sections.length,
      'https://snakeattacktd.com/confidentialite',
    ],
  );
  assert.equal(
    await page
      .locator('#privacy-body h4')
      .nth(PRIVACY_POLICY.fr.sections.findIndex((s) => s.heading.startsWith('Soutien')))
      .textContent(),
    'Soutien facultatif sur le site Web',
    'The newly approved Web support section is bundled and readable offline',
  );
  assert.equal(
    await page.locator('#privacy-body a[href*="/ncp/payment/"]').count(),
    0,
    'The policy explains Web support without adding a payment link inside the app',
  );
  for (const file of [/privacyWindow-[\w-]+\.js$/, /privacyWindow-[\w-]+\.css$/])
    assert.ok(
      [...served].some((p) => file.test(p)),
      `Privacy file served from disk: ${file}`,
    );
  await page.locator('#privacy-close').click();
  checks.push('the privacy policy is read offline, from a package of its own, after a cold start');
  // The family backup window is a package of its own too (26 November 2026), asked for on the
  // first touch of its button.
  assert.ok(
    ![...served].some((p) => p.includes('familyControls')),
    'The family backup package is not loaded before its button is touched',
  );
  await page.locator('#home-family').click();
  await page.locator('#family-dialog[open]').waitFor();
  assert.ok(
    [...served].some((p) => /familyControls-[\w-]+\.js$/.test(p)),
    'Family backup file served from disk',
  );
  await page.locator('#family-close').click();
  checks.push('the family backup window opens offline, from a package of its own');
  // The battle of Classic Snake (hidden boss, lot 3): its rules, its words and its three
  // pictures are a package of their own, asked for at the first touch of its button in the den.
  // The apples are seeded: no player has twelve in a recipe.
  await page.evaluate(
    ({ key, found }) => localStorage.setItem(key, JSON.stringify({ version: 1, found })),
    {
      key: 'conquete-serpents:apples:v1',
      found: Array.from({ length: 12 }, (_, i) => `${i + 1}:3`),
    },
  );
  await page.reload();
  await page.locator('#home-classic-snake').waitFor({ state: 'visible' });
  const CLASSIC_SNAKE = [
    /classicSnakeBattle-[\w-]+\.js$/,
    /classic-snake-tete-[\w-]+\.webp$/,
    /classic-snake-anneau-[\w-]+\.webp$/,
    /classic-snake-queue-[\w-]+\.webp$/,
  ];
  for (const file of CLASSIC_SNAKE)
    assert.ok(
      ![...served].some((p) => file.test(p)),
      `Classic Snake is not loaded before its button is touched: ${file}`,
    );
  await page.locator('#home-classic-snake').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  await page.locator('#start').click();
  await page.waitForFunction(() => document.getElementById('game').dataset.bossRings === '18');
  for (const file of CLASSIC_SNAKE)
    assert.ok(
      [...served].some((p) => file.test(p)),
      `Classic Snake file served from disk: ${file}`,
    );
  checks.push('Classic Snake opens offline from its own package, with its three pictures');
  assert.deepEqual(external, []);
  assert.deepEqual(missing, []);
  assert.deepEqual(errors, []);
  await mkdir('artifacts/reports', { recursive: true });
  await writeFile(
    `artifacts/reports/offline-${pkg.version}${android ? '-android' : ''}.json`,
    JSON.stringify(
      {
        version: pkg.version,
        target: build.target,
        sourceCommit: build.source.commit,
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
