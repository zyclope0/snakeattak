import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { encodeDeparture } from '../src/departures.ts';

const point = Number(process.argv[2] ?? 0);
const url = process.env.GAME_URL ?? 'http://127.0.0.1:4327';
const results = [];
let server, browser;
const errors = [];
async function ready(page) {
  await page.waitForFunction(
    () => document.getElementById('game')?.getAttribute('aria-busy') === 'false',
  );
  await page.waitForFunction(
    () => document.querySelector('#game canvas')?.getBoundingClientRect().height > 0,
  );
  await page.waitForTimeout(150);
}
async function home(page) {
  await page.goto(url);
  await page.locator('#home-screen').waitFor({ state: 'visible' });
}
async function mission(page) {
  await home(page);
  await page.locator('#home-expeditions').click();
  await page.locator('[data-mission-card="refuge"]').click();
  await page.locator('#mission-launch').click();
  await ready(page);
}
async function newPage(width, height, touch = false) {
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return page;
}
const checks = {
  async 6() {
    const page = await newPage(812, 375, true);
    await mission(page);
    await page.locator('#reinforcements-toggle').click();
    await page.screenshot({ path: 'artifacts/display-027/drawer-before.png' });
    const controls = [];
    for (const id of ['reinforcements-close', 'unit-guide']) {
      const box = await page.locator('#' + id).boundingBox();
      const visible = await page
        .locator('#' + id)
        .evaluate((e) => ({
          text: e.innerText,
          font: getComputedStyle(e).fontSize,
          html: e.innerHTML,
        }));
      controls.push({ id, box, visible });
    }
    await writeFile(
      'artifacts/display-027/drawer-controls.json',
      JSON.stringify(controls, null, 2),
    );
    for (const c of controls)
      assert.ok(
        c.box.width >= 48 && c.box.height >= 48,
        `Contrôle du tiroir utilisable : ${JSON.stringify(c)}`,
      );
    await page.locator('#unit-guide').click();
    assert.ok(await page.locator('#unit-dialog').isVisible());
    await page.locator('#close-unit-guide').click();
    await page.locator('#reinforcements-close').click();
    assert.equal(
      await page.locator('#reinforcements-toggle').getAttribute('aria-expanded'),
      'false',
    );
    results.push({ point: 6, controls });
    await page.close();
  },

  async 4() {
    for (const [width, height] of [
      [812, 375],
      [1024, 500],
    ]) {
      const page = await newPage(width, height, true);
      await mission(page);
      const boxes = [];
      for (const id of ['pause', 'speed', 'mobile-home', 'reinforcements-toggle', 'start']) {
        const box = await page.locator('#' + id).boundingBox();
        assert.ok(
          box.width >= 48 && box.height >= 48,
          `Cible ${id} à ${width}: ${JSON.stringify(box)}`,
        );
        boxes.push(box);
      }
      for (let i = 1; i < boxes.length; i++)
        assert.ok(boxes[i].x >= boxes[i - 1].x + boxes[i - 1].width, 'Pas de chevauchement');
      const board = await page.locator('#game canvas').boundingBox();
      assert.ok(
        board.height >= height * 0.85 && board.width >= width * 0.65,
        `Surface tactile conservée : ${JSON.stringify(board)}`,
      );
      await page.locator('#reinforcements-toggle').click();
      await page.locator('.unit-card[data-kind="archer"]').click();
      assert.equal(
        await page.locator('#reinforcements-toggle').getAttribute('aria-expanded'),
        'false',
      );
      await page.locator('#pause').click();
      assert.ok(await page.locator('#pause-overlay').isVisible());
      await page.locator('#resume-game').click();
      await page.screenshot({ path: `artifacts/display-027/phone-${width}.png` });
      results.push({ point: 4, width, height, board, buttons: boxes });
      await page.close();
    }
  },

  async 3() {
    for (const [width, height, touch] of [
      [1280, 800, false],
      [812, 375, true],
    ]) {
      const page = await newPage(width, height, touch);
      await home(page);
      await page.locator('#home-expeditions').click();
      await page.locator('[data-mission-card="refuge"]').click();
      const bounds = await page.locator('#mission-launch').boundingBox();
      const dialog = await page.locator('#mission-dialog').boundingBox();
      assert.ok(
        bounds.y >= dialog.y &&
          bounds.y + bounds.height <= Math.min(height, dialog.y + dialog.height),
        `Lancement visible sans scroll ${width}: ${JSON.stringify(bounds)}`,
      );
      const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      assert.ok(
        await page.evaluate(
          ({ x, y }) => document.elementFromPoint(x, y)?.closest('#mission-launch') !== null,
          center,
        ),
        'Lancement non recouvert',
      );
      await page.locator('#mission-reroll').click();
      const next = await page.locator('#mission-launch').boundingBox();
      assert.ok(next.y + next.height <= height);
      await page.evaluate(() => {
        const e = document.getElementById('mission-objective');
        e.textContent = 'Un long objectif de préparation. '.repeat(30);
      });
      const long = await page.locator('#mission-launch').boundingBox();
      assert.ok(long.y >= 0 && long.y + long.height <= height, 'Pied stable avec contenu long');
      await page.locator('#mission-launch').click();
      await ready(page);
      results.push({ point: 3, width, height, bounds });
      await page.close();
    }
  },

  async 2() {
    for (const [width, height] of [
      [1280, 800],
      [1366, 768],
      [1920, 1080],
    ]) {
      const page = await newPage(width, height);
      await mission(page);
      for (const expanded of [false, true]) {
        if (expanded) {
          await page.locator('#display-toggle').click();
          await page.waitForTimeout(180);
        }
        const board = await page.locator('#game canvas').boundingBox();
        const hud = await page.locator('.dashboard').boundingBox();
        assert.ok(
          board.y >= 0 && board.y <= 120,
          `Plateau près du haut ${width}: ${JSON.stringify(board)}`,
        );
        assert.ok(
          board.y + board.height <= height + 1 && hud.y >= 0 && hud.y + hud.height <= height,
          'Plateau et HUD entiers',
        );
        assert.ok(Math.abs(board.width / board.height - 1100 / 620) < 0.01, 'Ratio du plateau');
        assert.equal(await page.evaluate(() => scrollY), 0);
        assert.ok(await page.locator('#reinforcements #lane-status').count());
        assert.ok(await page.locator('#reinforcements #hero-training').count());
        assert.ok(await page.locator('#reinforcements #brief-title').count());
        results.push({ point: 2, width, height, expanded, board, hud });
      }
      await page.screenshot({ path: `artifacts/display-027/desktop-${width}.png` });
      await page.close();
    }
    const gift = await newPage(1280, 800);
    const game = new Game(2026);
    game.wave = 4;
    await gift.addInitScript(
      (raw) => localStorage.setItem('conquete-serpents:camp:v1', raw),
      encodeCheckpoint(game),
    );
    await home(gift);
    await gift.locator('#home-continue').click();
    await ready(gift);
    const reward = await gift.locator('#reward-panel').boundingBox();
    const board = await gift.locator('#game canvas').boundingBox();
    assert.ok(reward && reward.y >= 0 && reward.y + reward.height <= 800);
    assert.ok(board.y <= 120 && board.y + board.height <= 800);
    await gift.locator('#skip-reward').click();
    assert.equal(await gift.locator('#reward-panel').isVisible(), false);
    await gift.close();
  },

  async 1() {
    for (const [width, height] of [
      [1280, 800],
      [1366, 768],
      [1920, 1080],
    ]) {
      const page = await newPage(width, height);
      await mission(page);
      assert.equal(
        await page.evaluate(() => scrollY),
        0,
        `Entrée mission ${width}×${height} en haut`,
      );
      if (width === 1280) {
        await page.locator('#menu-home').click();
        await page.locator('#mission-continue').click();
        await ready(page);
        assert.equal(await page.evaluate(() => scrollY), 0, 'Reprise mission');
        await page.locator('#menu-home').click();
        await page.locator('#home-new').click();
        if (await page.locator('#journey-confirm').isVisible())
          await page.locator('#journey-replace').click();
        await ready(page);
        assert.equal(await page.evaluate(() => scrollY), 0, 'Entrée classique');
        await page.locator('#menu-home').click();
        await page.locator('#home-continue').click();
        await ready(page);
        assert.equal(await page.evaluate(() => scrollY), 0, 'Reprise classique');
        await page.locator('#menu-home').click();
        await page
          .locator('#departure-input')
          .fill(encodeDeparture({ kind: 'classic', seed: 2026 }));
        await page.locator('#departure-form button').click();
        await page.locator('#departure-start').click();
        if (await page.locator('#journey-confirm').isVisible())
          await page.locator('#journey-replace').click();
        await ready(page);
        assert.equal(await page.evaluate(() => scrollY), 0, 'Départ partagé');
      }
      results.push({ point: 1, width, height, scrollY: await page.evaluate(() => scrollY) });
      await page.close();
    }
  },
};
try {
  await mkdir('artifacts/display-027', { recursive: true });
  if (!process.env.GAME_URL) {
    server = spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      '4327',
      '--strictPort',
    ]);
    for (let i = 0; ; i++) {
      try {
        if ((await fetch(url)).ok) break;
      } catch {}
      if (server.exitCode !== null || i > 100) throw Error('Preview indisponible');
      await delay(100);
    }
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [id, check] of Object.entries(checks))
    if (!point || point === Number(id)) await check();
  assert.deepEqual(errors, []);
  await writeFile(
    `artifacts/display-027/point-${point}.json`,
    JSON.stringify({ results, errors }, null, 2) + '\n',
  );
  console.log(JSON.stringify({ points: point || 'all', checks: results.length, errors }));
} finally {
  await browser?.close();
  server?.kill();
}
