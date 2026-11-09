import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const root = 'http://127.0.0.1:4387',
  fixture = '.craft-states-034.html',
  folder = 'artifacts/craft-states-034';
let server, browser;
const checks = [],
  errors = [];
try {
  await mkdir(folder, { recursive: true });
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
    '4387',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(root)).ok) break;
    } catch {}
    if (i > 100) throw Error('No Vite');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height] of [
    [1280, 800],
    [812, 375],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      hasTouch: width === 812,
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${root}/${fixture}?layout=1`);
    await page.waitForFunction(
      () => window.stageFixture?.phaser.scene.getScene('Battle').initialized,
    );
    const card = page.locator('#dock-allies .dock-card').first();
    const before = await card.evaluate((e) => ({
      background: getComputedStyle(e).backgroundColor,
      shadow: getComputedStyle(e).boxShadow,
    }));
    await card.click();
    assert.equal(await card.getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: `${folder}/selected-ally-${width}.png` });
    await page.locator('#dock-honey button').first().click();
    await page.screenshot({ path: `${folder}/selected-honey-${width}.png` });
    await page.evaluate(() => {
      const { session, refresh } = window.stageFixture;
      session.selectUnit(null);
      session.selectFeast(null);
      session.game.gold = 0;
      session.game.feastUsed = true;
      refresh();
    });
    const disabled = await card.evaluate((e) => ({
      disabled: e.disabled,
      background: getComputedStyle(e).backgroundColor,
      shadow: getComputedStyle(e).boxShadow,
    }));
    checks.push({
      name: `${width}: disabled visibly distinct`,
      pass:
        disabled.disabled &&
        disabled.background !== before.background &&
        disabled.shadow !== before.shadow,
    });
    await page.screenshot({ path: `${folder}/disabled-${width}.png` });
    await page.goto(`${root}/${fixture}?layout=1&canvas`);
    await page.waitForFunction(
      () => window.stageFixture?.phaser.scene.getScene('Battle').initialized,
    );
    await page.waitForTimeout(120);
    const contour = await page.evaluate(() => {
      const { phaser } = window.stageFixture,
        pixels = phaser.canvas.getContext('2d').getImageData(0, 0, 1100, 620).data;
      let orange = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (
          Math.abs(pixels[i] - 210) < 4 &&
          Math.abs(pixels[i + 1] - 85) < 4 &&
          Math.abs(pixels[i + 2] - 45) < 4
        )
          orange++;
      return {
        orange,
        textures: phaser.textures.getTextureKeys().filter((k) => k.startsWith('canvas-contour:')),
      };
    });
    checks.push({
      name: `${width}: Canvas orange contours`,
      pass: contour.orange > 300,
      ...contour,
    });
    await page.screenshot({ path: `${folder}/canvas-contours-${width}.png` });
    const count = contour.textures.length;
    await page.waitForTimeout(180);
    const cells = await page.evaluate(() =>
      window.stageFixture.phaser.textures
        .getTextureKeys()
        .filter((k) => k.startsWith('canvas-contour:'))
        .map((k) => {
          const source = window.stageFixture.phaser.textures.get(k).source[0];
          return { width: source.width, height: source.height };
        }),
    );
    assert.equal(cells.length, count, 'No new surfaces on another frame');
    assert.ok(cells.every((c) => c.width === 128 && c.height === 128));
    await page.evaluate(() => window.stageFixture.phaser.scene.stop('Battle'));
    await page.waitForFunction(() =>
      window.stageFixture.phaser.textures
        .getTextureKeys()
        .every((k) => !k.startsWith('canvas-contour:')),
    );
    checks.push({
      name: `${width}: Canvas cache shared and released`,
      pass: true,
      cells: count,
      rgbaBytes: count * 128 * 128 * 4,
    });
    await page.close();
  }

  // Fail a real scenery request, then recover through the shipped retry control.
  const failed = await browser.newPage({ viewport: { width: 812, height: 375 }, hasTouch: true });
  failed.on('pageerror', (e) => errors.push(e.message));
  await failed.route('**/*scenery-marsh*.webp', (route) => route.abort());
  await failed.goto(`${root}/${fixture}?layout=1`);
  await failed.locator('#loading-retry').waitFor({ state: 'visible' });
  assert.equal(
    await failed.evaluate(() => window.stageFixture.phaser.scene.getScene('Battle').initialized),
    false,
  );
  await failed.screenshot({ path: `${folder}/loading-failed.png` });
  await failed.unroute('**/*scenery-marsh*.webp');
  await failed.locator('#loading-retry').click();
  await failed.waitForFunction(
    () => window.stageFixture.phaser.scene.getScene('Battle').initialized,
  );
  await failed.locator('#loading-overlay').waitFor({ state: 'hidden' });
  checks.push({
    name: 'Failed current scenery blocks initial drawing, Retry recovers',
    pass: true,
  });
  await failed.close();

  // Hold the new chapter texture: the old cached terrain must remain until ready.
  const transition = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  transition.on('pageerror', (e) => errors.push(e.message));
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await transition.route('**/*scenery-marsh*.webp', async (route) => {
    await gate;
    await route.continue();
  });
  await transition.goto(`${root}/${fixture}?classic&wave=5`);
  await transition.waitForFunction(
    () => window.stageFixture?.phaser.scene.getScene('Battle').initialized,
  );
  const old = await transition.evaluate(
    () => window.stageFixture.phaser.scene.getScene('Battle').terrain.levelId,
  );
  await transition.evaluate(() => {
    window.stageFixture.session.game.wave = 9;
  });
  await transition.locator('#loading-overlay').waitFor({ state: 'visible' });
  assert.equal(
    await transition.evaluate(
      () => window.stageFixture.phaser.scene.getScene('Battle').terrain.levelId,
    ),
    old,
  );
  release();
  await transition.waitForFunction(() =>
    window.stageFixture.phaser.scene.getScene('Battle').terrain.levelId.startsWith('ruins:'),
  );
  await transition.locator('#loading-overlay').waitFor({ state: 'hidden' });
  checks.push({
    name: 'Chapter change waits for delayed scenery before replacing cached terrain',
    pass: true,
  });
  await transition.close();
  await writeFile(`${folder}/result.json`, JSON.stringify({ checks, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ checks, errors }));
  assert.deepEqual(errors, []);
  assert.ok(
    checks.every((c) => c.pass),
    'Disabled surfaces and fallback contours must remain visible',
  );
} finally {
  await browser?.close();
  server?.kill();
  await unlink(fixture).catch(() => {});
}
