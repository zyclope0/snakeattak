import { revealControl } from '../tests/reveal-controls.mjs';
import { showHomePage } from '../tests/browser-entry.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const fixture = 'threat-preparation-036-fixture.html';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
let preview, dev, browser;
const errors = [],
  screens = [];
async function ready(url) {
  for (let n = 0; ; n++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    if (n > 100) throw Error('Server unavailable');
    await delay(100);
  }
}
async function pageAt(width, height, safe = [0, 0, 0, 0], devMode = false) {
  const page = await browser.newPage({
    locale: 'fr-CH',
    viewport: { width, height },
    hasTouch: width < 1000,
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(devMode ? 'http://127.0.0.1:4364/' + fixture : 'http://127.0.0.1:4363');
  // Language initialization precedes bootstrap; await the real menu before
  // reading or injecting its family profile. Controlled battle fixtures skip it.
  if (!devMode) await page.locator('#home-screen').waitFor({ state: 'visible' });
  await page.evaluate((safe) => {
    for (const [i, k] of ['top', 'right', 'bottom', 'left'].entries())
      document.documentElement.style.setProperty('--safe-area-inset-' + k, safe[i] + 'px');
  }, safe);
  return page;
}
async function onScreen(locator, page, label) {
  const b = await locator.boundingBox();
  assert.ok(b, label + ' visible');
  const v = page.viewportSize();
  assert.ok(
    b.x >= -1 && b.y >= -1 && b.x + b.width <= v.width + 1 && b.y + b.height <= v.height + 1,
    label + ' inside viewport',
  );
  assert.ok(b.height >= 47, label + ' >=48px');
  return b;
}
try {
  await mkdir('artifacts/threat-preparation-036', { recursive: true });
  preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4363',
    '--strictPort',
  ]);
  await ready('http://127.0.0.1:4363');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const first = await pageAt(812, 375);
  await showHomePage(first, 'missions');
  await first.locator('#home-play').click();
  await first.locator('#mission-launch').click();
  assert.equal(
    await first.locator('#wave-threats').count(),
    1,
    'Dangers accessible before the wave',
  );
  await first.locator('#wave-threats').click();
  await first.locator('#threat-dialog').waitFor({ state: 'visible' });
  assert.ok((await first.locator('#wave-threat-list [data-threat]').count()) > 0);
  assert.match(await first.locator('#threat-route-note').innerText(), /peuvent changer de voie/i);
  await onScreen(first.locator('#threat-close'), first, 'Close threats');
  await first.locator('#threat-close').click();
  await first.locator('#start').click();
  await first.locator('#wave-threats').waitFor({ state: 'hidden' });
  await first.close();
  for (const [width, height, safe] of [
    [1280, 800, [0, 0, 0, 0]],
    [812, 375, [0, 0, 0, 0]],
    [812, 375, [24, 48, 16, 0]],
    [568, 320, [24, 48, 16, 0]],
    [480, 320, [24, 48, 16, 0]],
  ]) {
    const page = await pageAt(width, height, safe);
    await showHomePage(page, 'missions');
    await page.locator('#home-play').click();
    await revealControl(page, '#mission-map');
    assert.ok(
      (await page.locator('#mission-map image').count()) >= 4,
      'Illustrated real terrain and strongholds',
    );
    assert.equal(await page.locator('#mission-map [data-preview-lane]').count(), 3);
    assert.equal(
      await page.locator('#mission-map [data-preview-lane][data-active="true"]').count(),
      1,
    );
    assert.ok((await page.locator('#mission-threats [data-threat]').count()) > 0);
    assert.match(await page.locator('#mission-advice').innerText(), /bouclier|massue|archer/i);
    assert.ok((await page.locator('#mission-advice .portrait').count()) === 1);
    await revealControl(page, '#mission-reroll');
    for (const id of ['mission-launch', 'mission-reroll', 'mission-close'])
      await onScreen(page.locator('#' + id), page, id);
    const old = await page.locator('#mission-map [data-preview-lane="0"]').getAttribute('points');
    await page.locator('#mission-reroll').click();
    assert.notEqual(
      await page.locator('#mission-map [data-preview-lane="0"]').getAttribute('points'),
      old,
    );
    await page.screenshot({
      path: `artifacts/threat-preparation-036/prepare-${width}-${safe[1]}.png`,
    });
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
    await onScreen(page.locator('#wave-threats'), page, 'Dangers');
    await onScreen(page.locator('#start'), page, 'Start');
    if (width === 812) {
      const b = await page.locator('#game canvas').boundingBox();
      assert.ok(b.height >= (height - safe[0] - safe[2]) * 0.85);
      assert.ok(b.width >= (width - safe[1] - safe[3]) * 0.65);
    }
    await page.locator('#wave-threats').click();
    await onScreen(page.locator('#threat-close'), page, 'Close');
    assert.ok((await page.locator('#wave-threat-list [data-threat] .enemy-portrait').count()) > 0);
    // The index of the snakes opens over the dangers: every snake and the egg, each with
    // its portrait, and a way back that a finger can press.
    await onScreen(page.locator('#threat-all-snakes'), page, 'All the snakes');
    await page.locator('#threat-all-snakes').click();
    await page.locator('#snake-index-dialog').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.snake-entry').count(), 18, 'seventeen snakes and the egg');
    assert.equal(await page.locator('.snake-entry .enemy-portrait').count(), 18);
    assert.equal(
      await page.locator('.snake-entry [data-threat="king"] strong').innerText(),
      'King Snake',
    );
    await onScreen(page.locator('#snake-index-close'), page, 'Close the index');
    await page.screenshot({
      path: `artifacts/threat-preparation-036/index-${width}-${safe[1]}.png`,
    });
    await page.locator('#snake-index-close').click();
    await page.locator('#snake-index-dialog').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#threat-dialog').isVisible(), true, 'the dangers stay open');
    await page.screenshot({
      path: `artifacts/threat-preparation-036/threats-${width}-${safe[1]}.png`,
    });
    await page.keyboard.press('Escape');
    await page.locator('#threat-dialog').waitFor({ state: 'hidden' });
    await page.screenshot({
      path: `artifacts/threat-preparation-036/dens-${width}-${safe[1]}.png`,
    });
    screens.push({ width, height, safe });
    await page.close();
  }
  const late = await pageAt(812, 375, [24, 48, 16, 0]);
  await late.evaluate(() => {
    const key = 'conquete-serpents:family:v1',
      profile = JSON.parse(localStorage.getItem(key));
    for (const id of Object.keys(profile.missions.bestStars))
      profile.missions.bestStars[id] = id === 'carrefour' ? 0 : 3;
    localStorage.setItem(key, JSON.stringify(profile));
  });
  await late.reload();
  await late.evaluate(() => {
    for (const [key, value] of Object.entries({ top: 24, right: 48, bottom: 16, left: 0 }))
      document.documentElement.style.setProperty('--safe-area-inset-' + key, value + 'px');
  });
  await showHomePage(late, 'missions');
  await late.locator('#home-play').click();
  await revealControl(late, '#mission-advice');
  const adviceBounds = await late.locator('#mission-advice').boundingBox(),
    bodyBounds = await late.locator('.mission-dialog-body').boundingBox();
  assert.ok(
    adviceBounds.y >= bodyBounds.y &&
      adviceBounds.y + adviceBounds.height <= bodyBounds.y + bodyBounds.height,
    'Mission advice visible without scrolling',
  );
  assert.equal(await late.locator('#mission-threats [data-threat="flying"]').count(), 1);
  assert.equal(await late.locator('#mission-advice').getAttribute('data-ally'), 'archer');
  assert.ok((await late.locator('#mission-other-threats [data-threat]').count()) > 0);
  await late.locator('#mission-more-title').click();
  await late.locator('#mission-other-threats').waitFor({ state: 'visible' });
  await revealControl(late, '#mission-reroll');
  await late.locator('#mission-reroll').click();
  assert.equal(await late.locator('#mission-more-threats').evaluate((d) => d.open), false);
  await late.screenshot({ path: 'artifacts/threat-preparation-036/prepare-carrefour-812.png' });
  await late.close();
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/mobile-031-harness.ts"',
    ),
  );
  dev = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4364',
    '--strictPort',
  ]);
  await ready('http://127.0.0.1:4364/' + fixture);
  const page = await pageAt(812, 375, [0, 0, 0, 0], true);
  await page.waitForFunction(() => window.mobileInterface?.phaser.scene.isActive('Battle'));
  await page.waitForFunction(
    () =>
      window.mobileInterface.phaser.scene
        .getScene('Battle')
        .children.list.filter((c) => c.name === 'threat-marker' && c.visible).length === 1,
  );
  const before = await page.evaluate(() => ({
    gold: window.mobileInterface.session.game.gold,
    rng: window.mobileInterface.session.game.rng,
  }));
  await page.locator('#wave-threats').click();
  assert.equal(await page.evaluate(() => window.mobileInterface.session.game.paused), true);
  await page.locator('#threat-close').click();
  assert.equal(await page.evaluate(() => window.mobileInterface.session.game.paused), false);
  assert.deepEqual(
    await page.evaluate(() => ({
      gold: window.mobileInterface.session.game.gold,
      rng: window.mobileInterface.session.game.rng,
    })),
    before,
  );
  // Simulate every current mission with the actual UI bindings, no debug API in production.
  await page.evaluate(async () => {
    const { Game } = await import('/src/game.ts');
    const { createMissionRun } = await import('/src/missions.ts');
    window.mobileInterface.session.useGame(
      new Game(36, undefined, createMissionRun('carrefour', 36)),
    );
    window.mobileInterface.session.game.wave = 1;
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#wave-threat-list [data-threat="flying"]') ||
      document.querySelector('#wave-threats')?.textContent,
  );
  await page.locator('#wave-threats').click();
  assert.equal(await page.locator('#wave-threat-list [data-threat="flying"]').count(), 1);
  assert.match(await page.locator('#wave-threat-advice').innerText(), /archer/i);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('#threat-close').click();
  assert.equal(
    await page.evaluate(() => window.mobileInterface.session.game.paused),
    true,
    'Closing does not erase background pause',
  );
  await page.locator('#resume-game').click();
  await page.evaluate(() => {
    window.mobileInterface.session.game.status = 'won';
  });
  await page.locator('#wave-threats').waitFor({ state: 'hidden' });
  await page.close();
  const portrait = await pageAt(375, 812);
  await portrait.locator('#orientation-notice').waitFor({ state: 'visible' });
  await portrait.setViewportSize({ width: 812, height: 375 });
  await portrait.locator('#orientation-notice').waitFor({ state: 'hidden' });
  await showHomePage(portrait, 'missions');
  await portrait.locator('#home-play').click();
  await onScreen(portrait.locator('#mission-launch'), portrait, 'Launch after rotation');
  await portrait.close();
  assert.deepEqual(errors, []);
  await mkdir('artifacts/reports', { recursive: true });
  await writeFile(
    `artifacts/reports/threat-preparation-${version}.json`,
    JSON.stringify(
      {
        version,
        source: 'Chromium cloud, not physical Android',
        screens,
        checks: [
          'illustrated routes',
          'honest species',
          'current-wave refresh',
          'available advice',
          'no RNG/gold change',
          'temporary dialog pause',
          'background pause retained',
          'footer visible',
          '48px',
          'board ratio',
          'portrait',
        ],
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ screens: screens.length, errors }));
} finally {
  await browser?.close();
  preview?.kill();
  dev?.kill();
  await rm(fixture, { force: true });
}
