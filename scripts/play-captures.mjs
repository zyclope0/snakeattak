import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { imageMetadata } from '../deploy/imageMetadata.ts';

const folder = 'docs/publication',
  url = 'http://127.0.0.1:4354';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const initial = new Game(20261108, undefined, createMissionRun('refuge', 20261108));
const camp = encodeCheckpoint(initial);
assert.ok(camp);
const placements = [
  { kind: 'archer', x: 950, y: 150 },
  { kind: 'medic', x: 950, y: 310 },
  { kind: 'ninja', x: 950, y: 475 },
];
for (const p of placements) assert.ok(initial.recruit(p.kind, p.x, p.y));
let browser, server;
const assets = [],
  errors = [];
const sha = (b) => createHash('sha256').update(b).digest('hex');
async function ready() {
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await delay(100);
  }
  throw Error('Store capture preview unavailable');
}
async function start(options) {
  const context = await browser.newContext({ ...options, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((raw) => localStorage.setItem('conquete-serpents:camp:v1', raw), camp);
  await page.goto(url);
  await page.locator('#mission-continue').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  for (const p of placements) {
    const toggle = page.locator('#reinforcements-toggle');
    if (await toggle.isVisible()) await toggle.click();
    await page.locator(`[data-kind="${p.kind}"]`).click();
    await page.waitForFunction(() => {
      const p = document.querySelector('#game').getBoundingClientRect(),
        c = document.querySelector('#game canvas').getBoundingClientRect();
      return Math.abs(c.x + c.width / 2 - p.x - p.width / 2) < 1;
    });
    const b = await page.locator('#game canvas').boundingBox();
    const gold = Number(await page.locator('#gold').innerText());
    await page.touchscreen.tap(b.x + (b.width * p.x) / 1100, b.y + (b.height * p.y) / 620);
    await page.waitForFunction(
      (gold) => Number(document.querySelector('#gold').textContent) < gold,
      gold,
    );
  }
  await page.locator('#game').evaluate((e) => e.blur());
  return { page, context };
}
async function shot(page, file, kind, context, expected) {
  if (context === 'combat')
    assert.match(await page.locator('#phase').innerText(), /BATAILLE EN COURS/);
  const buffer = await page.screenshot({ type: 'jpeg', quality: 95 });
  const info = imageMetadata(buffer);
  assert.ok(info);
  assert.equal(info.width, expected[0]);
  assert.equal(info.height, expected[1]);
  assert.equal(info.channels, 3);
  await writeFile(`${folder}/${file}`, buffer);
  assets.push({ file, kind, context, ...info, bytes: buffer.length, sha256: sha(buffer) });
  console.log(`${file} ${info.width}×${info.height}`);
}
try {
  await mkdir(`${folder}/assets/phone`, { recursive: true });
  await mkdir(`${folder}/assets/tablet`, { recursive: true });
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4354',
    '--strictPort',
  ]);
  await ready();
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  // A real compact16:9 viewport; fractional DPR exports exactly1920×1080.
  const phone = await start({
    viewport: { width: 896, height: 504 },
    deviceScaleFactor: 15 / 7,
    hasTouch: true,
  });
  await shot(phone.page, 'assets/phone/01-preparation.jpg', 'phone', 'preparation', [1920, 1080]);
  await phone.page.locator('#speed').click();
  for (let wave = 1; wave <= 3; wave++) {
    await phone.page.locator('#start:not(:disabled)').waitFor({ timeout: 120000 });
    await phone.page.locator('#start').click();
    assert.equal(Number(await phone.page.locator('#wave').innerText()), wave);
    await delay(wave === 1 ? 3500 : 4500);
    await shot(
      phone.page,
      `assets/phone/0${wave + 1}-combat-${wave}.jpg`,
      'phone',
      'combat',
      [1920, 1080],
    );
  }
  await phone.context.close();
  const tablet = await start({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    hasTouch: true,
  });
  await shot(
    tablet.page,
    'assets/tablet/01-preparation.jpg',
    'tablet',
    'preparation',
    [2560, 1600],
  );
  await tablet.page.locator('#start').click();
  await delay(6500);
  await shot(tablet.page, 'assets/tablet/02-combat.jpg', 'tablet', 'combat', [2560, 1600]);
  await tablet.context.close();
  const feature = await start({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
    hasTouch: true,
  });
  await feature.page.locator('#start').click();
  await delay(6500);
  await shot(feature.page, 'assets/feature-1024x500.jpg', 'feature', 'combat', [1024, 500]);
  await feature.context.close();
  assert.deepEqual(errors, []);
  const manifest = {
    schemaVersion: 1,
    appVersion: pkg.version,
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    buildHtmlSha256: sha(await readFile('dist/index.html')),
    captureScriptSha256: sha(await readFile('scripts/play-captures.mjs')),
    sourceTreeDirtyAtCapture:
      execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
    createdAt: new Date().toISOString(),
    method: 'production-browser-public-UI',
    physicalAndroid: false,
    notes:
      'Legal initial checkpoint and normal recruitment/start controls; no private combat/result mutations. Timing depends on rendering: hashes attest this capture set, not deterministic pixels. Phone viewport896×504, DPR15/7; tablet1280×800,DPR2. Actual APK review still required.',
    run: initial.mission,
    placements,
    assets,
    errors,
  };
  await writeFile(`${folder}/captures.json`, JSON.stringify(manifest, null, 2) + '\n');
} finally {
  await browser?.close();
  server?.kill();
}
