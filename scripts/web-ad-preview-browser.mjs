import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { enterBattle, leaveBattle, chooseLanguage } from '../tests/browser-entry.mjs';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
const root = process.env.AD_PREVIEW_ROOT ?? 'dist-ads-preview';
const origin = 'http://127.0.0.1:4194';
const folder = 'artifacts/web-ad-preparation';
await mkdir(folder, { recursive: true });
const fixture = new Game(73);
fixture.gold = 5000;
const checkpoint = encodeCheckpoint(fixture);
assert.ok(checkpoint);
const points = [];
for (let y = 100; y <= 540; y += 80)
  for (let x = 700; x <= 1050; x += 70) {
    if (fixture.canRecruit('ninja', x, y)) {
      points.push({ x, y });
      fixture.recruit('ninja', x, y);
    }
  }
assert.ok(points.length >= 12);
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4194',
    '--strictPort',
    '--outDir',
    root,
  ],
  { stdio: 'pipe' },
);
let browser;
const checks = [],
  errors = [],
  outside = [];
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'fr-CH',
  });
  await context.addInitScript(
    (raw) => localStorage.setItem('conquete-serpents:camp:v1', raw),
    checkpoint,
  );
  await context.route('**/*', (r) => {
    if (new URL(r.request().url()).origin !== origin) {
      outside.push(r.request().url());
      return r.abort();
    }
    return r.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await enterBattle(page);
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  const settle = async (shown) => {
    await page.waitForFunction(
      (shown) => {
        const n = document.getElementById('web-ad-preview');
        return !!n && n.hidden !== shown;
      },
      shown,
      { timeout: 5000 },
    );
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
  };
  const state = () =>
    page.evaluate(() => {
      const rect = (s) => {
        const r = document.querySelector(s).getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };
      return {
        app: rect('#app'),
        board: rect('#game'),
        creative: rect('#web-ad-preview-creative'),
        offset:
          parseFloat(
            document.getElementById('app').style.getPropertyValue('--web-ad-preview-shift'),
          ) || 0,
        shown: !document.getElementById('web-ad-preview').hidden,
        scrollX: document.documentElement.scrollWidth - innerWidth,
        scrollY: document.documentElement.scrollHeight - innerHeight,
      };
    });
  let purchase = 0;
  const recruit = async (touch = false) => {
    const point = points[purchase++];
    assert.ok(point);
    const gold = Number(await page.locator('#gold').innerText());
    await page.locator('[data-dock-kind="ninja"]').click();
    const b = await page.locator('#game canvas').boundingBox();
    assert.ok(b);
    const x = b.x + (b.width * point.x) / 1100,
      y = b.y + (b.height * point.y) / 620;
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await page.waitForFunction(
      (g) => Number(document.getElementById('gold').textContent) === g - 150,
      gold,
    );
    const unit = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('conquete-serpents:camp:v1'))
        .units.filter((u) => u.kind === 'ninja')
        .at(-1),
    );
    assert.ok(Math.abs(unit.x - point.x) <= 3, `recruit x ${unit.x}, expected ${point.x}`);
    assert.ok(Math.abs(unit.y - point.y) <= 3, `recruit y ${unit.y}, expected ${point.y}`);
    checks.push(`recruit ${purchase}: exact pointer coordinates after transition`);
  };
  await settle(true);
  const baseline = await state();
  assert.ok(baseline.offset < 0);
  await recruit();
  for (let pass = 0; pass < 2; pass++) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await settle(false);
    const narrow = await state();
    assert.equal(narrow.offset, 0);
    assert.ok(narrow.scrollX <= 1 && narrow.scrollY <= 1);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await settle(true);
    const restored = await state();
    assert.ok(Math.abs(restored.offset - baseline.offset) < 0.1);
    assert.ok(Math.abs(restored.board.w - baseline.board.w) < 1);
    assert.ok(Math.abs(restored.board.h - baseline.board.h) < 1);
  }
  checks.push('repeated large-small-large restores centering and size without drift');
  await recruit();
  await page.locator('#display-toggle').click();
  await settle(false);
  assert.equal((await state()).offset, 0);
  await page.locator('#display-toggle').click();
  await settle(true);
  await recruit();
  checks.push('expanded view disables placement and restores it');
  await page.evaluate(() => {
    const d = document.createElement('dialog');
    d.id = 'dynamic-ad-test-dialog';
    d.textContent = 'Local test';
    document.body.append(d);
    d.showModal();
  });
  await settle(false);
  const unshifted = await state();
  assert.equal(unshifted.offset, 0);
  assert.ok(Math.abs(unshifted.board.w - baseline.board.w) < 1);
  assert.ok(Math.abs(unshifted.board.h - baseline.board.h) < 1);
  await page.evaluate(() => document.getElementById('dynamic-ad-test-dialog').remove());
  await settle(true);
  await recruit();
  checks.push('dynamically created dialog revokes and restores eligibility');
  await page.locator('#pause').click();
  await settle(false);
  await chooseLanguage(page, 'en');
  await page.locator('#resume-game').click();
  await settle(true);
  assert.equal(
    await page.locator('.web-ad-preview-label').innerText(),
    'ADVERTISEMENT · LOCAL PREVIEW',
  );
  await page.screenshot({ path: `${folder}/en-1920x1080.png` });
  await page.locator('#pause').click();
  await chooseLanguage(page, 'fr');
  await page.locator('#resume-game').click();
  await settle(true);
  assert.equal(await page.locator('.web-ad-preview-label').innerText(), 'PUBLICITÉ · APERÇU LOCAL');
  checks.push('both languages render local-only copy without a second catalogue binding');
  await leaveBattle(page);
  await settle(false);
  assert.equal((await state()).offset, 0);
  await enterBattle(page);
  await settle(true);
  await recruit();
  checks.push('home-battle restoration preserves real board bounds');
  await page.evaluate(() => document.documentElement.requestFullscreen());
  await settle(false);
  await page.evaluate(() => document.exitFullscreen());
  await settle(true);
  await recruit();
  checks.push('fullscreen blocks placement and restores bounds');
  await page.screenshot({ path: `${folder}/fr-1920x1080.png` });
  for (const [width, height, shown] of [
    [1920, 800, true],
    [1920, 900, true],
    [2560, 1440, true],
    [1600, 900, false],
    [812, 375, false],
    [375, 812, false],
    [812, 375, false],
    [1920, 1080, true],
  ]) {
    await page.setViewportSize({ width, height });
    await settle(shown);
    const s = await state();
    assert.ok(s.scrollX <= 1 && s.scrollY <= 1, `scroll ${width}x${height}`);
    if (!shown) assert.equal(s.offset, 0);
    checks.push(`${width}x${height}: ${shown ? 'mock fits' : 'fully absent'}`);
  }
  await recruit();
  assert.equal(
    await page
      .locator(
        '#web-ad-preview a, #web-ad-preview button, #web-ad-preview [tabindex], #web-ad-preview [aria-live]',
      )
      .count(),
    0,
  );
  assert.equal(await page.locator('#web-ad-preview').getAttribute('tabindex'), null);
  assert.equal(await page.locator('script[src*="googlesyndication"], ins.adsbygoogle').count(), 0);
  await context.close();
  // A separate coarse-pointer context proves touch input and rotation without ad placement.
  const mobile = await browser.newContext({
    viewport: { width: 812, height: 375 },
    hasTouch: true,
    locale: 'fr-CH',
  });
  await mobile.addInitScript(
    (raw) => localStorage.setItem('conquete-serpents:camp:v1', raw),
    checkpoint,
  );
  await mobile.route('**/*', (r) => {
    if (new URL(r.request().url()).origin !== origin) {
      outside.push(r.request().url());
      return r.abort();
    }
    return r.continue();
  });
  const phone = await mobile.newPage();
  phone.on('pageerror', (e) => errors.push(e.message));
  await phone.goto(origin);
  await enterBattle(phone);
  await phone.waitForFunction(
    () => document.getElementById('game')?.getAttribute('aria-busy') === 'false',
  );
  assert.ok(await phone.locator('#web-ad-preview').isHidden());
  await phone.setViewportSize({ width: 375, height: 812 });
  await phone.locator('#orientation-notice').waitFor({ state: 'visible' });
  await phone.setViewportSize({ width: 812, height: 375 });
  await phone.waitForFunction(
    () => getComputedStyle(document.getElementById('orientation-notice')).display === 'none',
  );
  // Turning the phone pauses the game. The pause may also end by itself just after the phone
  // is turned back: on the CI the overlay was seen, then gone before the tap could land, and
  // the tap waited thirty seconds for a button that would never come back (24 November 2026).
  // The tap is tried; what is required is a game that plays again.
  if (await phone.locator('#pause-overlay').isVisible())
    await phone
      .locator('#resume-game')
      .click({ timeout: 3000 })
      .catch(() => {});
  await phone.locator('#pause-overlay').waitFor({ state: 'hidden' });
  await phone.locator('[data-dock-kind="ninja"]').tap();
  const b = await phone.locator('#game canvas').boundingBox();
  const point = points[0];
  await phone.touchscreen.tap(b.x + (b.width * point.x) / 1100, b.y + (b.height * point.y) / 620);
  await phone.waitForFunction(() => document.getElementById('gold').textContent === '4850');
  const u = await phone.evaluate(() =>
    JSON.parse(localStorage.getItem('conquete-serpents:camp:v1')).units.find(
      (u) => u.kind === 'ninja',
    ),
  );
  assert.ok(Math.abs(u.x - point.x) <= 3 && Math.abs(u.y - point.y) <= 3);
  await phone.screenshot({ path: `${folder}/phone-812x375.png` });
  checks.push('coarse pointer landscape-portrait-landscape: no mock, exact touch recruitment');
  await mobile.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(outside, []);
  const report = { checks, errors, outside, adRequests: 0, root };
  await writeFile(`${folder}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  server.kill();
}
