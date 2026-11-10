import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from '@playwright/test';
import { Game } from '../../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../../src/checkpoints.ts';
import { createMissionRun, MISSIONS } from '../../src/missions.ts';
import { createMissionProgress } from '../../src/missionProgress.ts';
import { createCareer } from '../../src/progression.ts';
import { createCapriceAlbumsController } from '../../src/capriceAlbums.ts';
import { writeFamilyBackup } from '../../src/familyBackup.ts';
import { encodeDeparture } from '../../src/departures.ts';
const origin = 'http://serpents-caprices-embedded.test', root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
const errors = [], missing = [], external = [], served = new Set(), checks = [];
const key = 'conquete-serpents:family:v1';
const run = { ...createMissionRun('sonnette', 42), caprice: 'sonnette-petit' };
const game = new Game(run.seed, undefined, run);
assert.ok(game.chooseCapriceKinds(['ninja', 'medic']));
const camp = encodeCheckpoint(game), progress = createMissionProgress();
for (const mission of MISSIONS) progress.bestStars[mission.id] = 3;
progress.activeMode = 'missions'; progress.lastRuns.sonnette = run; progress.retryCamp = camp;
const albums = createCapriceAlbumsController();
albums.rename('child-1', 'A'); albums.add('B'); albums.select('child-2'); albums.beginRun('child-1');
const raw = writeFamilyBackup(camp, createCareer().state, progress, albums.state);
assert.ok(raw); assert.equal(JSON.parse(camp).version, 8);
let browser;
try {
 browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
 const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, offline: true, locale: 'en-GB' });
 await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) { external.push(url.origin); return route.abort(); }
  const file = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + sep)) return route.abort();
  try { const body = await readFile(file); served.add(url.pathname); await route.fulfill({ status: 200, contentType: mime[extname(file)] ?? 'application/octet-stream', body }); }
  catch { missing.push(url.pathname); await route.abort(); }
 });
 const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
 await page.addInitScript(({ key, raw }) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(key, raw); localStorage.setItem('conquete-serpents:language:v1', 'en'); sessionStorage.setItem('seeded', '1'); } }, { key, raw });
 await page.goto(origin); await page.locator('#home-caprice-album').waitFor();
 assert.equal(await page.evaluate(() => navigator.onLine), false);
 assert.equal(await page.locator('html').getAttribute('lang'), 'en'); checks.push('offline English bootstrap and local dictionary');
 await page.locator('#home-caprice-album').click(); assert.equal(await page.locator('#caprice-album-profile').inputValue(), 'child-2');
 assert.equal(await page.locator('[data-sticker]').count(), 36); await page.locator('#caprice-album-close').click(); checks.push('envelope4 restores active B and 36 notebook slots offline');
 await page.locator('#mission-continue').click(); await page.waitForFunction(() => document.querySelector('#game')?.getAttribute('aria-busy') === 'false');
 assert.equal(await page.locator('#army-count').innerText(), '3');
 const backup = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
 const restored = decodeCheckpoint(backup.camp); assert.ok(restored);
 assert.equal(restored.mission.caprice, 'sonnette-petit'); assert.deepEqual([...restored.capriceKindsChosen], ['ninja', 'medic']); assert.equal(backup.albums.campProfileId, 'child-1'); checks.push('checkpoint8 restores exact caprice, Ninja+Medic and retained A while B active');
 await page.reload(); await page.locator('#home-caprice-album').waitFor(); await page.locator('#home-parent-options > summary').click();
 const code = encodeDeparture({ kind: 'mission', run: { ...createMissionRun('refuge', 42), caprice: 'refuge-petit' } });
 await page.locator('#departure-input').fill(code); await page.locator('#departure-form button[type=submit]').click(); await page.locator('#mission-launch').click();
 assert.equal(await page.locator('#current-departure-code').inputValue(), code); checks.push('code3 caprice launches through native controls offline');
 await page.screenshot({ path: 'docs/captures-0.36.0/offline-caprice-en.png' });
 assert.deepEqual(errors, []); assert.deepEqual(missing, []); assert.deepEqual(external, []);
 await writeFile('reports/suivi-0.36.0/offline-caprices.json', JSON.stringify({ version: '0.36.0', source: 'Controlled valid envelope/checkpoint via production bootstrap; Chromium network disabled and disk-only routes, not physical Android', checks, files: served.size, served: [...served].sort(), errors, missing, external }, null, 2) + '\n');
 console.log(JSON.stringify({ checks, files: served.size, errors }));
} finally { await browser?.close(); }
