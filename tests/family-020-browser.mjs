import { showHomePage } from './browser-entry.mjs';
import { revealControl } from './reveal-controls.mjs';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { Game } from '../src/game.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { createMissionRun } from '../src/missions.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { createCareer } from '../src/progression.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
const WEB = process.env.FAMILY_WEB_URL,
  FILE = pathToFileURL(resolve('dist-portable/index.html')).href;
assert.ok(WEB);
assert.equal(
  new URL(WEB).protocol,
  'https:',
  'Le transfert doit être exercé entre file et une origine HTTPS locale',
);
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [];
const KEY = 'conquete-serpents:family:v1';
function fixture() {
  const g = new Game(23020);
  g.wave = 3;
  g.base = 89.9;
  g.campaign.chapterMin[0] = 89.9;
  g.units[0].hp = 51;
  g.startWave();
  g.remaining = 0;
  g.eggs = [];
  g.enemies = [];
  g.step(1 / 30);
  const career = createCareer();
  career.sync(g);
  career.activateRoster(2);
  const kindId = g.rewardOffer.find((id) => id.startsWith('renfort-'));
  assert.ok(g.chooseReward(kindId));
  const kind = kindId.slice('renfort-'.length);
  assert.ok(g.recruit(kind, 900, 420));
  return { camp: encodeCheckpoint(g), career: career.state };
}
async function page(
  url,
  { viewport = { width: 1440, height: 1000 }, legacy, blocked = false } = {},
) {
  const c = await browser.newContext({
    locale: 'fr-CH',
    viewport,
    reducedMotion: 'reduce',
    acceptDownloads: true,
    ignoreHTTPSErrors: true,
  });
  if (legacy)
    await c.addInitScript(({ camp, career }) => {
      if (!localStorage.getItem('conquete-serpents:camp:v1')) {
        localStorage.setItem('conquete-serpents:camp:v1', camp);
        localStorage.setItem('conquete-serpents:progress:v1', JSON.stringify(career));
      }
    }, legacy);
  if (blocked)
    await c.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new DOMException('blocked', 'QuotaExceededError');
      };
    });
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(url);
  await p.locator('#home-screen').waitFor({ state: 'visible' });
  return { p, c };
}
const stored = (p) => p.evaluate((key) => localStorage.getItem(key), KEY);
async function open(p) {
  assert.equal(await p.locator('#home-family').count(), 1, 'Entrée Sauvegarde familiale manquante');
  await showHomePage(p, 'parents');
  await p.locator('#home-family').click();
  await p.locator('#family-dialog').waitFor({ state: 'visible' });
  await p.mouse.move(0, 0);
  const contrast = await p.locator('#family-close').evaluate((button) => {
    const rgb = (value) =>
      value
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number);
    const luminance = (color) =>
      rgb(color)
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    let el = button,
      bg = getComputedStyle(el).backgroundColor;
    while (bg === 'rgba(0, 0, 0, 0)' && el.parentElement) {
      el = el.parentElement;
      bg = getComputedStyle(el).backgroundColor;
    }
    const a = luminance(getComputedStyle(button).color),
      b = luminance(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  assert.ok(
    contrast >= 4.5,
    `Le bouton de retour doit rester lisible sans survol : contraste ${contrast}`,
  );
}
async function choose(p, raw) {
  await p.locator('#family-file').setInputFiles({
    name: 'notre-aventure.json',
    mimeType: 'application/json',
    buffer: Buffer.from(raw),
  });
  await p.locator('#family-apply').waitFor({ state: 'visible' });
  await p.waitForFunction(() => !document.getElementById('family-apply').disabled);
}
async function exportRaw(p) {
  const promise = p.waitForEvent('download');
  await p.locator('#family-export').click();
  const download = await promise;
  assert.match(download.suggestedFilename(), /\.json$/);
  return readFile(await download.path(), 'utf8');
}
try {
  const source = fixture();
  const sourceProgress = createMissionProgressController();
  sourceProgress.sync(decodeCheckpoint(source.camp));
  const expected = writeFamilyBackup(source.camp, source.career, sourceProgress.state);
  assert.ok(expected);
  assert.equal(readFamilyBackup(expected).version, 2, 'Le témoin classique historique reste v2');
  // Current exports add exactly the default album; every historical field stays exact.
  const defaultAlbums = {
    version: 1,
    activeId: 'child-1',
    nextId: 2,
    campProfileId: null,
    children: [{ id: 'child-1', name: 'Mon carnet', completed: [] }],
  };
  const expectedCurrent = { ...readFamilyBackup(expected), version: 4, albums: defaultAlbums };
  const a = await page(FILE, { legacy: source });
  await open(a.p);
  const raw = await exportRaw(a.p);
  assert.deepEqual(readFamilyBackup(raw), expectedCurrent);
  await a.c.close();
  const b = await page(WEB);
  await showHomePage(b.p, 'classic');
  await b.p.locator('#home-new').click();
  await revealControl(b.p, '#start');
  await b.p.locator('#start').click();
  await b.p.locator('#menu-home').click();
  const initial = await stored(b.p);
  await open(b.p);
  await choose(b.p, raw);
  assert.match(await b.p.locator('#family-preview-summary').innerText(), /5/);
  await b.p.locator('#family-close').click();
  assert.equal(await stored(b.p), initial, 'Annuler ne remplace rien');
  await open(b.p);
  await choose(b.p, raw);
  await b.p.locator('#family-apply').click();
  await b.p.locator('#family-dialog').waitFor({ state: 'hidden' });
  assert.deepEqual(readFamilyBackup(await stored(b.p)), readFamilyBackup(raw));
  await b.p.reload();
  await b.p.locator('#home-screen').waitFor({ state: 'visible' });
  await open(b.p);
  const roundTrip = await exportRaw(b.p);
  assert.deepEqual(readFamilyBackup(roundTrip), readFamilyBackup(raw));
  await b.p.locator('#family-file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":999}'),
  });
  await b.p.waitForFunction(() =>
    document.getElementById('family-status').textContent.includes('invalide'),
  );
  assert.ok(await b.p.locator('#family-apply').isDisabled());
  assert.deepEqual(readFamilyBackup(await stored(b.p)), readFamilyBackup(raw));
  await b.p.locator('#family-close').click();
  await showHomePage(b.p, 'classic');
  await b.p.locator('#home-continue').click();
  await revealControl(b.p, '#chapter-report');
  await b.p.locator('#chapter-report').waitFor({ state: 'visible' });
  assert.equal(await b.p.locator('#chapter-report').getAttribute('data-fresh'), 'false');
  await b.p.locator('#chapter-report summary').click();
  assert.match(await b.p.locator('#chapter-report-summary').innerText(), /depuis le début/);
  assert.match(
    await b.p.locator('#chapter-report-summary').innerText(),
    /minimum du chapitre 89\/100 PV/,
    'Un minimum inférieur à 90 ne doit pas afficher le seuil des trois étoiles',
  );
  await b.p.screenshot({ path: 'artifacts/chapitre-020-desktop.png', fullPage: true });
  assert.equal(await b.p.locator('[data-reward]').count(), 0, 'Le cadeau consommé ne revient pas');
  await revealControl(b.p, '#start');
  await b.p.locator('#start').click();
  await b.p.locator('#menu-home').click();
  await open(b.p);
  const duringBattle = readFamilyBackup(await exportRaw(b.p));
  assert.equal(
    JSON.parse(duringBattle.camp).wave,
    4,
    'En combat on exporte le camp avant la vague',
  );
  assert.deepEqual(duringBattle.career, readFamilyBackup(raw).career);
  await b.c.close();
  const dest = await page(FILE);
  await open(dest.p);
  await choose(dest.p, roundTrip);
  await dest.p.locator('#family-apply').click();
  await dest.p.reload();
  await dest.p.locator('#home-screen').waitFor({ state: 'visible' });
  assert.deepEqual(readFamilyBackup(await stored(dest.p)), readFamilyBackup(raw));
  await dest.c.close();
  const profile = JSON.stringify({ ...readFamilyBackup(raw), camp: null });
  const pOnly = await page(WEB, { legacy: source });
  await open(pOnly.p);
  await choose(pOnly.p, profile);
  await pOnly.p.locator('#family-apply').click();
  await pOnly.p.reload();
  await pOnly.p.locator('#home-screen').waitFor({ state: 'visible' });
  await showHomePage(pOnly.p, 'classic');
  assert.ok(
    await pOnly.p.locator('#home-continue').isHidden(),
    'Un profil seul ne ramène pas l’ancienne armée',
  );
  assert.equal(readFamilyBackup(await stored(pOnly.p)).camp, null);
  await pOnly.c.close();
  // Historical v1/v2 imports acquire the default album without losing a classic field.
  const legacyFile = writeFamilyBackup(source.camp, source.career);
  assert.equal(readFamilyBackup(legacyFile).version, 1);
  for (const legacyRaw of [legacyFile, expected]) {
    const legacyDest = await page(WEB);
    await open(legacyDest.p);
    await choose(legacyDest.p, legacyRaw);
    await legacyDest.p.locator('#family-apply').click();
    assert.deepEqual(readFamilyBackup(await stored(legacyDest.p)), expectedCurrent);
    await legacyDest.c.close();
  }
  // A historical v3 tutorial mission keeps a separate classic camp and the exact run.
  const run = createMissionRun('refuge', 4021);
  const mission = new Game(run.seed, undefined, run);
  mission.units[0].hp = 51;
  const missionProgress = createMissionProgressController(sourceProgress.state);
  missionProgress.started(run);
  missionProgress.sync(mission);
  const missionRaw = writeFamilyBackup(
    encodeCheckpoint(mission),
    source.career,
    missionProgress.state,
  );
  assert.ok(missionRaw);
  assert.equal(readFamilyBackup(missionRaw).version, 3, 'Le refuge progressif historique reste v3');
  const expectedMission = { ...readFamilyBackup(missionRaw), version: 4, albums: defaultAlbums };
  const missionFile = await page(FILE);
  await open(missionFile.p);
  await choose(missionFile.p, missionRaw);
  await missionFile.p.locator('#family-apply').click();
  await open(missionFile.p);
  const transported = await exportRaw(missionFile.p);
  assert.deepEqual(readFamilyBackup(transported), expectedMission);
  await missionFile.c.close();
  const missionWeb = await page(WEB);
  await open(missionWeb.p);
  await choose(missionWeb.p, transported);
  await missionWeb.p.locator('#family-apply').click();
  await missionWeb.p.reload();
  await missionWeb.p.locator('#home-screen').waitFor({ state: 'visible' });
  assert.deepEqual(readFamilyBackup(await stored(missionWeb.p)), expectedMission);
  await open(missionWeb.p);
  const missionBack = await exportRaw(missionWeb.p);
  const missionReturn = await page(FILE);
  await open(missionReturn.p);
  await choose(missionReturn.p, missionBack);
  await missionReturn.p.locator('#family-apply').click();
  await missionReturn.p.reload();
  await missionReturn.p.locator('#home-screen').waitFor({ state: 'visible' });
  assert.deepEqual(readFamilyBackup(await stored(missionReturn.p)), expectedMission);
  await missionWeb.c.close();
  await missionReturn.c.close();
  const blocked = await page(WEB, { blocked: true });
  await open(blocked.p);
  await choose(blocked.p, raw);
  await blocked.p.locator('#family-apply').click();
  assert.ok(await blocked.p.locator('#family-dialog').isVisible());
  assert.match(
    await blocked.p.locator('#family-status').innerText(),
    /Impossible|refus|indisponible/i,
  );
  assert.equal(await stored(blocked.p), null);
  await blocked.c.close();
  for (const width of [390, 320, 844]) {
    const x = await page(WEB, { viewport: { width, height: width === 844 ? 390 : 844 } });
    await open(x.p);
    assert.ok(await x.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const bounds = await x.p.locator('#family-dialog').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
    await x.p.screenshot({ path: `artifacts/famille-020-${width}.png`, fullPage: true });
    await x.p.keyboard.press('Escape');
    assert.ok(await x.p.locator('#family-dialog').isHidden());
    await x.c.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      family: true,
      fileToWeb: true,
      webToFile: true,
      reload: true,
      cancel: true,
      invalid: true,
      profileOnly: true,
      blocked: true,
      viewports: [1440, 390, 320, 844],
      pageErrors: errors,
    }),
  );
} finally {
  await browser.close();
}
