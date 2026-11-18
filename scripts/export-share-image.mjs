// The picture a shared link shows (1200 × 630): a real battle of the game, taken through the
// public interface of the built site, with the icon and both names of the game laid over its
// top edge in the letters of the game — over the header of the page, so that the whole board
// and its snakes stay in view. No generator, no cost.
//
// Usage, from the root of the repository, after `npm run build`:
//     node scripts/export-share-image.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { CAMP_STORAGE_KEY } from '../src/storageKeys.ts';
import { SHARE_PICTURE } from '../deploy/discovery.ts';

import { CURRENT_BALANCE_REVISION } from '../src/balanceRevision.ts';
import { LANES } from '../src/ai.ts';
import { kinds } from '../src/data.ts';

const url = 'http://127.0.0.1:4356';
const { width, height } = SHARE_PICTURE;
/** The wave the picture shows: late enough for dinosaurs, dragons and the new snakes. */
const WAVE = 8;

/**
 * A camp of the classic adventure reached by the rules: allies bought with the coins won,
 * waves fought by the engine, nothing set by hand. Returns the camp before `WAVE`, or
 * nothing when this start loses on the way.
 */
function campBefore(seed) {
  const game = new Game(seed, undefined, undefined, CURRENT_BALANCE_REVISION);
  const big = Object.keys(kinds)
    .filter((kind) => !['hero', 'wall'].includes(kind))
    .sort((a, b) => kinds[b].cost - kinds[a].cost);
  let lane = 0;
  const buy = (kind) => {
    if (!game.isUnlocked(kind) || game.gold < game.recruitCost(kind)) return false;
    const rear = kinds[kind].range >= 100;
    for (let turn = 0; turn < 3; turn++, lane = (lane + 1) % 3)
      for (const x of rear ? [900, 852, 804, 756] : [660, 708, 756, 804])
        for (const offset of [0, -48, 48])
          if (game.recruit(kind, x, LANES[lane] + offset)) return ((lane = (lane + 1) % 3), true);
    return false;
  };
  for (let wave = 1; wave < WAVE; wave++) {
    for (let bought = 0; bought < 30 && big.some(buy); bought++);
    for (let i = 0; i < 90; i++) game.step(1 / 30);
    if (game.rewards?.pending != null && !game.chooseReward((game.rewardOffer ?? [])[0]))
      game.skipReward?.();
    if (!game.startWave()) return null;
    const started = game.time;
    while (game.status === 'fighting' && game.time - started < 300) game.step(1 / 30);
    if (game.status === 'fighting' || game.status === 'lost') return null;
  }
  for (let bought = 0; bought < 30 && big.some(buy); bought++);
  return game.wave === WAVE - 1 || game.wave === WAVE ? encodeCheckpoint(game) : null;
}
let camp = null;
for (let seed = 20261117; !camp && seed < 20261157; seed++) camp = campBefore(seed);
assert.ok(camp, 'No start reached the wave of the picture');
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
  await page.locator('#home-screen:not([hidden])').waitFor();
  await page.locator('#home-classic').click();
  await page.locator('#home-continue').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  // The picture outlives the version it was taken from: the number is left out.
  await page.addStyleTag({ content: '[data-app-version]{visibility:hidden}' });
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
.band{position:absolute;left:0;right:0;top:0;height:215px;display:flex;align-items:flex-start;
justify-content:center;gap:24px;padding:16px 0 0;box-sizing:border-box;
background:linear-gradient(#173e37,#173e37f5 66%,#173e3700)}
.band img{width:132px;height:132px;border-radius:28px;box-shadow:0 5px 0 #0c2823}
h1{margin:2px 0 0;color:#fff8df;font-size:54px;line-height:.98;font-weight:700;text-shadow:0 3px 0 #0c2823}
p{margin:8px 0 0;color:#ffd866;font-size:28px;line-height:1;font-weight:600;text-shadow:0 2px 0 #0c2823}
</style><img class="battle" src="data:image/png;base64,${battle.toString('base64')}" alt="">
<div class="band"><img src="${icon}" alt=""><div><h1>La Conquête<br>des Serpents</h1><p>Snake Attack TD</p></div></div>`);
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
