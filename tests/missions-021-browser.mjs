import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionRun } from '../src/missions.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [];
const familyKey = 'conquete-serpents:family:v1';
await mkdir('artifacts', { recursive: true });
const config = (run) => [run.layout, run.assault, run.nest];
const saved = (p) => p.evaluate((key) => JSON.parse(localStorage.getItem(key)), familyKey);
async function inject(p, raw) {
  await p.evaluate(
    ({ key, raw }) => {
      localStorage.setItem(key, raw);
      location.reload();
    },
    { key: familyKey, raw },
  );
  await p.waitForLoadState('load');
  await p.locator('#home-screen').waitFor({ state: 'visible' });
}
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(process.env.GAME_URL);
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  assert.equal(
    await page.locator('[data-mission-card]').count(),
    6,
    'Six vraies missions doivent être proposées',
  );
  assert.equal(await page.locator('[data-mission-card]:disabled').count(), 5);
  await page.screenshot({ path: 'artifacts/missions-021-desktop.png', fullPage: true });
  await page.locator('[data-mission-card="refuge"]').click();
  const first = JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run'));
  const map = await page.locator('#mission-map').innerHTML();
  await page.locator('#mission-reroll').click();
  const second = JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run'));
  assert.notDeepEqual(config(first), config(second), 'Reroll doit changer la configuration');
  assert.ok(await page.locator('#mission-budget').innerText());
  await page.screenshot({ path: 'artifacts/mission-preview-021-desktop.png' });
  await page.locator('#mission-launch').click();
  assert.equal(await page.locator('#gold').innerText(), '450');
  assert.equal(await page.locator('#army-count').innerText(), '3');
  assert.equal(await page.locator('#wave-total').innerText(), '3');
  let backup = await saved(page);
  assert.equal(backup.version, 2);
  assert.equal(JSON.parse(backup.camp).version, 6);
  assert.deepEqual(JSON.parse(backup.camp).mission, second);
  await page.locator('[data-kind="ninja"]').click();
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.click(box.x + (box.width * 900) / 1100, box.y + (box.height * 350) / 620);
  assert.equal(await page.locator('#gold').innerText(), '300');
  await page.locator('#mission-back-map').click();
  await page.locator('[data-mission-card="refuge"]').click();
  await page.locator('#mission-retry').click();
  assert.deepEqual(
    JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run')),
    second,
  );
  await page.locator('#mission-launch').click();
  assert.equal(await page.locator('#gold').innerText(), '450', 'Retry revient au budget initial');
  assert.equal(
    await page.locator('#army-count').innerText(),
    '3',
    'Un nouveau détachement, pas les achats précédents',
  );
  await page.locator('#menu-home').click();
  await page.locator('#home-new').click();
  if (await page.locator('#journey-confirm').isVisible())
    await page.locator('#journey-replace').click();
  assert.equal(await page.locator('#gold').innerText(), '300');
  await page.locator('[data-kind="ninja"]').click();
  const classicBox = await page.locator('canvas').boundingBox();
  await page.mouse.click(
    classicBox.x + (classicBox.width * 900) / 1100,
    classicBox.y + (classicBox.height * 350) / 620,
  );
  assert.equal(await page.locator('#gold').innerText(), '150');
  await page.locator('#menu-home').click();
  await page.locator('#mission-continue').click();
  assert.equal(await page.locator('#gold').innerText(), '450');
  await page.locator('#menu-home').click();
  await page.locator('#home-continue').click();
  assert.equal(await page.locator('#gold').innerText(), '150', 'Camp classique préservé');
  await page.locator('#menu-home').click();
  await page.locator('#mission-continue').click();
  await page.reload();
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  await page.locator('#mission-continue').click();
  assert.equal(await page.locator('#gold').innerText(), '450');
  await page.locator('#menu-home').click();
  await page.locator('#home-family').click();
  const downloadEvent = page.waitForEvent('download');
  await page.locator('#family-export').click();
  const download = await downloadEvent;
  assert.ok(await download.path());
  await page.locator('#family-close').click();
  // Native checkpoint fixture isolates real browser victory/next-mission wiring.
  const run = createMissionRun('refuge', 19001);
  const game = new Game(run.seed, undefined, run);
  game.wave = 2;
  game.gold = 5000;
  for (const y of [156, 300, 444]) for (const x of [780, 840, 900]) game.recruit('archer', x, y);
  for (const y of [180, 324, 468]) game.recruit('nurse', 960, y);
  const progress = createMissionProgressController();
  progress.started(run);
  progress.sync(game);
  const raw = writeFamilyBackup(encodeCheckpoint(game), createCareer().state, progress.state);
  assert.ok(raw);
  await inject(page, raw);
  await page.locator('#mission-continue').click();
  await page.locator('#speed').click();
  await page.locator('#start').click();
  await page.waitForFunction(() => document.getElementById('app').dataset.status === 'won', {
    timeout: 90000,
  });
  assert.ok(await page.locator('#mission-result').isVisible());
  assert.ok(await page.locator('#end-restart').isHidden(), 'Pas de restart classique en mission');
  backup = await saved(page);
  assert.ok(backup.missions.bestStars.refuge > 0);
  assert.deepEqual(
    backup.career.bestStars,
    [0, 0, 0],
    'Les étoiles mission ne polluent pas le classique',
  );
  await page.locator('#mission-next').click();
  assert.equal(await page.locator('#mission-title').innerText(), 'Les trois ponts');
  await page.locator('#mission-launch').click();
  assert.equal(await page.locator('#gold').innerText(), '550');
  assert.equal(await page.locator('#army-count').innerText(), '3');
  await page.screenshot({ path: 'artifacts/mission-battle-021-desktop.png' });
  await page.locator('#menu-home').click();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 740 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      'Pas de débordement horizontal',
    );
    await page.locator('[data-mission-card="refuge"]').click();
    assert.equal(
      await page.locator('#mission-dialog').evaluate((d) => d.scrollTop),
      0,
      'L’aperçu commence par son titre',
    );
    await page.screenshot({ path: `artifacts/mission-preview-021-${viewport.width}.png` });
    for (const id of ['mission-launch', 'mission-reroll', 'mission-close']) {
      const b = await page.locator('#' + id).boundingBox();
      assert.ok(b.height >= 44);
    }
    await page.locator('#mission-close').click();
  }
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    'Missions: carte, variantes, retry, modes, recharge, export, victoire, suite, petits écrans OK.',
  );
} finally {
  await browser.close();
}
