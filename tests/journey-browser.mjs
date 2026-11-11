import { showHomePage } from './browser-entry.mjs';
import { revealControl } from './reveal-controls.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
const url = process.env.GAME_URL;
assert.ok(url);
const folder = process.env.JOURNEY_REPORT_DIR ?? 'artifacts';
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [],
  external = [];
async function pageFor(raw, viewport = { width: 1440, height: 1000 }) {
  const c = await browser.newContext({
    locale: 'fr-CH',
    viewport,
    reducedMotion: 'reduce',
  });
  if (raw)
    await c.addInitScript((raw) => {
      if (!localStorage.getItem('conquete-serpents:camp:v1')) {
        localStorage.setItem('conquete-serpents:camp:v1', raw);
        sessionStorage.setItem('journey-fixture', '1');
      }
    }, raw);
  const p = await c.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('request', (r) => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(url).origin)
      external.push(r.url());
  });
  await p.goto(url);
  await p.locator('#home-screen:not([hidden])').waitFor({ state: 'visible' });
  return { p, c };
}
const camp = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('conquete-serpents:camp:v1')));
try {
  const { p, c } = await pageFor();
  assert.ok(await p.locator('#home-screen').isVisible(), 'Home menu missing');
  assert.ok(await p.locator('#app').isHidden());
  assert.equal(await p.locator('[data-chapter]').count(), 3);
  await p.screenshot({ path: `${folder}/menu-018-desktop.png`, fullPage: true });
  await showHomePage(p, 'classic');
  await p.locator('#home-new').click();
  await p.locator('canvas').waitFor();
  assert.ok(await p.locator('#app').isVisible());
  await p.locator('#menu-home').click();
  await showHomePage(p, 'home');
  await p.locator('#home-army').click();
  await p.locator('#roster-slot').selectOption('1');
  const chosen = await p
    .locator('[data-roster-kind][aria-pressed="true"]:visible')
    .first()
    .getAttribute('data-roster-kind');
  await p.locator(`[data-roster-kind="${chosen}"]`).click();
  assert.ok(await p.locator('#roster-save').isDisabled());
  await p.locator('#roster-page-next').click();
  const other = await p
    .locator('[data-roster-kind][aria-pressed="false"]:visible')
    .first()
    .getAttribute('data-roster-kind');
  await p.locator(`[data-roster-kind="${other}"]`).click();
  await p.locator('#roster-save').click();
  const career = await p.evaluate(() =>
    JSON.parse(localStorage.getItem('conquete-serpents:progress:v1')),
  );
  assert.equal(career.activeRoster, 1);
  assert.equal(new Set(career.rosters[1]).size, 8);
  assert.ok(!career.rosters[1].includes(chosen));
  assert.ok(career.rosters[1].includes(other));
  await p.reload();
  await p.locator('#home-classic').waitFor();
  assert.deepEqual(
    await p.evaluate(
      () => JSON.parse(localStorage.getItem('conquete-serpents:progress:v1')).rosters[1],
    ),
    career.rosters[1],
  );
  await showHomePage(p, 'classic');
  await p.locator('#home-continue').click();
  assert.equal(await p.locator('#dock-allies [data-dock-kind]:visible').count(), 4);
  assert.equal(await p.locator('#quick-slot').inputValue(), '1');
  await revealControl(p, '[data-kind="ninja"]');
  assert.ok((await p.locator('#shop .unit-card:visible').count()) <= 6);
  const catalogueKinds = await p
    .locator('#shop .unit-card')
    .evaluateAll((cards) => cards.map((c) => c.dataset.kind));
  assert.equal(catalogueKinds.length, 20);
  assert.ok(career.rosters[1].every((kind) => catalogueKinds.includes(kind)));
  assert.equal((await camp(p)).gold, 300);
  assert.equal((await camp(p)).units.length, 3);
  await p.locator('[data-kind="ninja"]').click();
  const box = await p.locator('canvas').boundingBox();
  await p.mouse.click(box.x + (box.width * 900) / 1100, box.y + (box.height * 350) / 620);
  await p.waitForFunction(() => document.getElementById('gold').textContent === '150');
  assert.equal((await camp(p)).units.length, 4);
  await p.locator('#start').click();
  await revealControl(p, '#encourage');
  await p.locator('#encourage').click();
  assert.ok(await p.locator('#encourage').isDisabled());
  await p.locator('#menu-home').click();
  assert.ok(await p.locator('#app').isHidden());
  assert.ok(await p.locator('#home-army').isDisabled());
  await showHomePage(p, 'classic');
  await p.locator('#home-continue').click();
  assert.equal(await p.locator('#wave').innerText(), '1');
  await c.close();
  const g = new Game(17);
  g.wave = 3;
  g.startWave();
  g.remaining = 0;
  g.eggs = [];
  g.enemies = [];
  g.step(1 / 30);
  const raw = encodeCheckpoint(g);
  const seeded = await pageFor(raw);
  assert.ok((await seeded.p.locator('#home-stars').innerText()).includes('3'));
  assert.ok(await seeded.p.locator('[data-chapter="1"]').isEnabled());
  await showHomePage(seeded.p, 'classic');
  await seeded.p.locator('#home-continue').click();
  await seeded.p.locator('[data-reward]').first().click();
  await revealControl(seeded.p, '[data-training="force"]');
  await seeded.p.locator('[data-training="force"]').click();
  assert.equal((await camp(seeded.p)).campaign.training, 'force');
  assert.ok(await seeded.p.locator('[data-training="guard"]').isDisabled());
  await seeded.p.locator('#menu-home').click();
  await showHomePage(seeded.p, 'classic');
  await seeded.p.locator('[data-chapter="1"]').click();
  assert.ok(await seeded.p.locator('#journey-confirm').isVisible());
  await seeded.p.locator('#journey-cancel').click();
  assert.ok(await seeded.p.locator('#home-screen').isVisible());
  await seeded.p.locator('[data-chapter="1"]').click();
  await seeded.p.locator('#journey-replace').click();
  assert.equal((await camp(seeded.p)).gold, JSON.parse(raw).gold);
  assert.equal((await camp(seeded.p)).campaign.training, 'none');
  assert.equal(await seeded.p.locator('[data-reward]').count(), 3);
  await seeded.p.locator('#menu-home').click();
  assert.ok((await seeded.p.locator('#home-stars').innerText()).includes('3'));
  await seeded.p.reload();
  assert.ok(await seeded.p.locator('#home-screen').isVisible());
  assert.ok((await seeded.p.locator('#home-stars').innerText()).includes('3'));
  await seeded.c.close();
  for (const width of [390, 320, 844]) {
    const { p, c } = await pageFor(undefined, { width, height: width === 844 ? 390 : 844 });
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await p.evaluate(() => document.fonts.ready);
    const titleClipped = await p.locator('.home-intro h1').evaluate((title) => {
      const bounds = title.closest('.home-hero').getBoundingClientRect();
      const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        for (let i = 0; i < node.textContent.length; i++) {
          if (!node.textContent[i].trim()) continue;
          const range = document.createRange();
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const r = range.getBoundingClientRect();
          if (r.left < bounds.left - 1 || r.right > bounds.right + 1) return true;
        }
      }
      return false;
    });
    assert.equal(titleClipped, false, `Titre de l’accueil tronqué à ${width}px`);
    await showHomePage(p, 'classic');
    const rect = await p.locator('#home-new').boundingBox();
    assert.ok(rect.height >= 44);
    await p.screenshot({ path: `${folder}/menu-018-mobile-${width}.png`, fullPage: true });
    await showHomePage(p, 'classic');
    await p.locator('#home-new').click();
    await p.locator('canvas').waitFor();
    assert.ok(await p.locator('#app').isVisible());
    await c.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    JSON.stringify({
      menu: true,
      teams: true,
      stars: true,
      replay: true,
      confirmation: true,
      encouragement: true,
      training: true,
      viewports: [1440, 390, 320, 844],
      pageErrors: errors,
      externalRequests: external.length,
      portable: url.startsWith('file:'),
    }),
  );
} catch (e) {
  console.error('PageErrors:', errors);
  throw e;
} finally {
  await browser.close();
}
