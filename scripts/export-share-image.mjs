// The picture a shared link shows (1200 × 630): a real battle of the game, taken through the
// public interface of the built site, with the icon and both names of the game laid over it
// in the letters of the game. No generator, no cost.
//
// Usage, from the root of the repository, after `npm run build`:
//     node scripts/export-share-image.mjs
import { showHomePage } from '../tests/browser-entry.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { CAMP_STORAGE_KEY } from '../src/storageKeys.ts';
import { SHARE_PICTURE } from '../deploy/discovery.ts';

const url = 'http://127.0.0.1:4356';
const { width, height } = SHARE_PICTURE;
const camp = encodeCheckpoint(new Game(20261108, undefined, createMissionRun('refuge', 20261108)));
assert.ok(camp);
const placements = [
  { kind: 'archer', x: 950, y: 150 },
  { kind: 'nurse', x: 950, y: 310 },
  { kind: 'shield', x: 950, y: 475 },
];
const dataUrl = async (path, type) =>
  `data:${type};base64,${(await readFile(path)).toString('base64')}`;
let browser;
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  'preview',
  '--host',
  '127.0.0.1',
  '--port',
  '4356',
  '--strictPort',
]);
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    if (i > 150) throw Error('Preview unavailable: run `npm run build` first');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    locale: 'fr-CH',
    viewport: { width, height },
    deviceScaleFactor: 1,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(
    ([key, raw]) => localStorage.setItem(key, raw),
    [CAMP_STORAGE_KEY, camp],
  );
  await page.goto(url);
  await showHomePage(page, 'missions');
  await page.locator('#mission-continue').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  for (const p of placements) {
    // The favourites shown beside the board.
    await page.locator(`[data-dock-kind="${p.kind}"]`).click();
    const b = await page.locator('#game canvas').boundingBox();
    const gold = Number(await page.locator('#gold').innerText());
    await page.touchscreen.tap(b.x + (b.width * p.x) / 1100, b.y + (b.height * p.y) / 620);
    await page.waitForFunction(
      (gold) => Number(document.querySelector('#gold').textContent) < gold,
      gold,
    );
  }
  await page.locator('#start').click();
  await delay(Number(process.env.SHARE_DELAY ?? 6500));
  const battle = await page.screenshot({ type: 'png' });
  assert.deepEqual(errors, []);
  await context.close();

  // The names over the battle, in a second page: nothing is drawn by hand.
  const board = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const font = await dataUrl('src/assets/fonts/fredoka-latin.woff2', 'font/woff2');
  const icon = await dataUrl('resources/site/touch-180.png', 'image/png');
  await board.setContent(`<!doctype html><style>
@font-face{font-family:Fredoka;src:url(${font}) format('woff2');font-weight:300 700}
html,body{margin:0}
body{width:${width}px;height:${height}px;position:relative;overflow:hidden;font-family:Fredoka,sans-serif}
.battle{position:absolute;inset:0;width:100%;height:100%}
.band{position:absolute;left:0;right:0;bottom:0;height:150px;display:flex;align-items:center;gap:24px;
padding:0 44px;background:linear-gradient(#173e3700,#173e37e6 38%,#173e37)}
.band img{width:104px;height:104px;border-radius:24px;box-shadow:0 4px 0 #0c2823}
h1{margin:0;color:#fff8df;font-size:58px;line-height:1;font-weight:700;text-shadow:0 3px 0 #0c2823}
p{margin:8px 0 0;color:#ffd866;font-size:30px;line-height:1;font-weight:600;text-shadow:0 2px 0 #0c2823}
</style><img class="battle" src="data:image/png;base64,${battle.toString('base64')}" alt="">
<div class="band"><img src="${icon}" alt=""><div><h1>La Conquête des Serpents</h1><p>Snake Attack TD</p></div></div>`);
  await board.evaluate(() => document.fonts.ready);
  const picture = await board.screenshot({
    type: 'jpeg',
    quality: Number(process.env.SHARE_QUALITY ?? 80),
  });
  await writeFile(SHARE_PICTURE.source, picture);
  console.log(`${SHARE_PICTURE.source} ${width}×${height} ${picture.length} bytes`);
} finally {
  await browser?.close();
  server.kill();
}
