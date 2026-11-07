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
  assert.deepEqual(errors, []);
  console.log(`Corrections 0.26 : étapes 1–${step} OK`);
} finally {
  await browser?.close();
  server?.kill();
  await unlink(fixture).catch(() => {});
}
