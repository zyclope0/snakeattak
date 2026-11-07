import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const step = Number(process.argv[2] ?? 1);
const fixture = '.corrections-026-test.html';
let server, browser;
try {
  await mkdir('artifacts/corrections-026', { recursive: true });
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/stage-023-harness.ts"',
    ),
  );
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4206',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4206')).ok) break;
    } catch {}
    if (server.exitCode !== null || i > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:4206/${fixture}`);
  await page.waitForFunction(() => window.stageFixture?.phaser.scene.isActive('Battle'));
  await page.locator('#pause').click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#pause-overlay').isVisible(), true);
  assert.equal(
    await page.evaluate(() => window.stageFixture.phaser.scene.getScene('Battle').overlay.visible),
    false,
    'Une seule pause, en HTML',
  );
  await page.locator('#resume-game').click();
  if (step >= 2) {
    const outlines = await page.evaluate(() => {
      const images = window.stageFixture.phaser.scene
        .getScene('Battle')
        .children.list.filter((o) => o.type === 'Image');
      const red = images.filter((o) => o.tintFill && o.tintTopLeft === 0xd2552d);
      return {
        red: red.length,
        green: images.some((o) => o.tintFill && o.tintTopLeft === 0x233d36),
        thicker: red.every((o) =>
          images.some(
            (main) =>
              !main.tintFill &&
              main.texture.key === o.texture.key &&
              main.x === o.x &&
              main.y === o.y &&
              o.displayWidth >= main.displayWidth + 6,
          ),
        ),
      };
    });
    assert.ok(outlines.red >= 6, 'Les six serpents portent un contour rouge-orangé');
    assert.ok(outlines.green && outlines.thicker);
  }
  if (step >= 3) {
    const water = await page.evaluate(async () => {
      const renderer = window.stageFixture.phaser.renderer;
      const colors = [];
      for (const y of [4, 100, 250, 390, 616]) {
        colors.push(
          await new Promise((resolve) =>
            renderer.snapshotPixel(528, y, (c) => resolve({ r: c.red, g: c.green, b: c.blue })),
          ),
        );
      }
      return colors;
    });
    assert.ok(
      water.every((c) => c.b > c.r && c.g > c.r),
      `Ruisseau continu : ${JSON.stringify(water)}`,
    );
    await page.locator('canvas').screenshot({ path: 'artifacts/corrections-026/terrain.png' });
  }
  if (step >= 4) {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.waitForTimeout(250);
    const board = await page.locator('canvas').boundingBox();
    assert.ok(board.height >= 375 * 0.85, `Plateau assez haut : ${JSON.stringify(board)}`);
    assert.ok(board.width >= 812 * 0.65);
    assert.equal(await page.locator('#encounter').isVisible(), false);
    assert.equal(await page.locator('.reinforcements').isVisible(), false);
    await page.locator('#reinforcements-toggle').click();
    assert.equal(await page.locator('.reinforcements').isVisible(), true);
    await page.locator('.unit-card[data-kind="archer"]').click();
    assert.equal(await page.locator('.reinforcements').isVisible(), false);
    assert.equal(
      await page.locator('#reinforcements-toggle').getAttribute('aria-expanded'),
      'false',
    );
    await page.locator('#reinforcements-toggle').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.reinforcements').isVisible(), false);
    await page.screenshot({ path: 'artifacts/corrections-026/landscape.png' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(200);
  }
  for (const status of ['won', 'lost']) {
    await page.evaluate((status) => {
      window.stageFixture.session.game.status = status;
      window.stageFixture.refresh();
    }, status);
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(
        () => window.stageFixture.phaser.scene.getScene('Battle').overlay.visible,
      ),
      true,
    );
    assert.equal(await page.locator('#pause-overlay').isVisible(), false);
  }
  if (step >= 7) {
    const loaded = await page.evaluate(() => Object.keys(window.stageFixture.phaser.textures.list));
    assert.ok(
      !loaded.includes('ground-grove') && !loaded.includes('ground-ruins'),
      'Seulement le fond courant',
    );
    assert.ok(
      !loaded.includes('terrain-props') && !loaded.includes('interface-craft'),
      'Pas de planches inutilisées dans Phaser',
    );
    const lean = await browser.newPage();
    let failedOnce = false;
    await lean.route('**/ground-three-bridges*.webp', (route) => {
      if (!failedOnce) {
        failedOnce = true;
        return route.abort();
      }
      return route.continue();
    });
    await lean.goto(`http://127.0.0.1:4206/${fixture}?classic=1`);
    await lean.waitForFunction(
      () => window.stageFixture?.phaser.scene.getScene('Battle').initialized,
    );
    const leanTextures = await lean.evaluate(() =>
      Object.keys(window.stageFixture.phaser.textures.list),
    );
    assert.ok(
      !leanTextures.includes('allies-mutants') &&
        !leanTextures.includes('allies-dinosaurs') &&
        !leanTextures.includes('allies-elite'),
      'Les renforts des missions ultérieures ne sont pas chargés',
    );
    await lean.close();
    await page.evaluate(() => window.stageFixture.setMode('classic'));
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      window.stageFixture.session.game.wave = 8;
      window.stageFixture.refresh();
    });
    await page.waitForFunction(() => window.stageFixture.phaser.textures.exists('ground-ruins'));
    await page.waitForFunction(() => document.getElementById('loading-overlay').hidden);
    assert.ok(
      await page.evaluate(() => window.stageFixture.phaser.textures.exists('allies-mutants')),
    );
  }
  if (step >= 6) {
    await page.evaluate(() => {
      const scale = window.stageFixture.phaser.scale;
      scale.resizeInterval = 100000;
      const board = document.getElementById('game');
      board.style.width = '700px';
      board.style.height = '400px';
    });
    await page.waitForTimeout(120);
    let canvas = await page.locator('canvas').boundingBox();
    assert.ok(
      Math.abs(canvas.width - 700) < 2,
      `Resize du parent sans événement window : ${JSON.stringify(canvas)}`,
    );
    await page.evaluate(() => {
      document.getElementById('game').style.width = '950px';
      document.getElementById('game').style.height = '540px';
    });
    await page.waitForTimeout(120);
    canvas = await page.locator('canvas').boundingBox();
    assert.ok(Math.abs(canvas.width - 950) < 2, 'Le canvas remplit le nouveau grand conteneur');
    await page.evaluate(() => document.getElementById('game').removeAttribute('style'));
    await page.waitForTimeout(150);
  }
  if (step >= 5) {
    const touch = await browser.newPage({
      viewport: { width: 375, height: 812 },
      hasTouch: true,
      isMobile: true,
    });
    await touch.goto(`http://127.0.0.1:4206/${fixture}`);
    await touch.waitForFunction(() => window.stageFixture?.phaser.scene.isActive('Battle'));
    assert.equal(await touch.locator('#orientation-notice').isVisible(), true);
    assert.equal(await touch.evaluate(() => window.stageFixture.session.game.paused), true);
    await touch.screenshot({ path: 'artifacts/corrections-026/portrait.png' });
    await touch.setViewportSize({ width: 812, height: 375 });
    await touch.waitForTimeout(200);
    assert.equal(await touch.locator('#orientation-notice').isVisible(), false);
    assert.equal(await touch.evaluate(() => window.stageFixture.session.game.paused), false);
    await touch.close();
    assert.match(
      await readFile('android/app/src/main/AndroidManifest.xml', 'utf8'),
      /android:screenOrientation="sensorLandscape"/,
    );
  }
  assert.deepEqual(errors, []);
  console.log(`Corrections 0.26 : étapes 1–${step} OK`);
} finally {
  await browser?.close();
  server?.kill();
  await unlink(fixture).catch(() => {});
}
