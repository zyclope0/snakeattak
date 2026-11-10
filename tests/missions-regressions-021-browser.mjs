import { showHomePage } from './browser-entry.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({
    locale: 'fr-CH',
    viewport: { width: 1100, height: 900 },
  });
  await page.goto(process.env.GAME_URL);
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  const profile = createMissionProgressController();
  const state = profile.state;
  state.bestStars.refuge = 3;
  const raw = writeFamilyBackup(null, createCareer().state, state);
  assert.ok(raw);
  await showHomePage(page, 'parents');
  await page.locator('#home-family').click();
  await page.locator('#family-file').setInputFiles({
    name: 'victoire.json',
    mimeType: 'application/json',
    buffer: Buffer.from(raw),
  });
  await page.locator('#family-apply').click();
  if (process.env.REGRESSION_CASE !== 'resume') {
    assert.equal(
      await page.locator('#mission-total').innerText(),
      '3 / 18 étoiles',
      'La carte se rafraîchit après import sans Escape',
    );
    assert.ok(await page.locator('[data-mission-card="trois-ponts"]').isEnabled());
  }
  const run = createMissionRun('refuge', 2119);
  const g = new Game(run.seed, undefined, run);
  g.wave = 2;
  g.base = 1;
  g.units = [];
  const progress = createMissionProgressController();
  progress.started(run);
  progress.sync(g);
  const camp = encodeCheckpoint(g);
  assert.ok(camp);
  const fragile = writeFamilyBackup(camp, createCareer().state, progress.state);
  assert.ok(fragile);
  await showHomePage(page, 'parents');
  await page.locator('#home-family').click();
  await page.locator('#family-file').setInputFiles({
    name: 'fragile.json',
    mimeType: 'application/json',
    buffer: Buffer.from(fragile),
  });
  await page.locator('#family-apply').click();
  if (process.env.REGRESSION_CASE === 'resume') await page.keyboard.press('Escape');
  await showHomePage(page, 'missions');
  await page.locator('#mission-continue').click();
  await page.locator('#speed').click();
  await page.locator('#start').click();
  await page.waitForFunction(() => document.getElementById('app').dataset.status === 'lost', null, {
    timeout: 60000,
  });
  await page.locator('#menu-home').click();
  await showHomePage(page, 'missions');
  await page.locator('#mission-continue').click();
  assert.equal(
    await page.locator('#app').getAttribute('data-status'),
    'preparing',
    'Reprendre après défaite retrouve le dernier camp préparé',
  );
  assert.equal(await page.locator('#wave').innerText(), '2');
  assert.ok(await page.locator('#start').isEnabled());
  console.log('Régressions: import rafraîchi et camp retrouvé après défaite OK.');
} finally {
  await browser.close();
}
