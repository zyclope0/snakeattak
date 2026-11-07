import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { writeFile, mkdir, readFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';

let browser, server;
const errors = [],
  result = {};
const lifecycleFile = '.render-lifecycle-024.html';
async function launch(preview) {
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    ...(preview ? ['preview'] : []),
    '--host',
    '127.0.0.1',
    '--port',
    '4198',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4198')).ok) return;
    } catch {}
    if (server.exitCode !== null || i > 100) throw Error('Render settings preview unavailable');
    await delay(100);
  }
}
try {
  await mkdir('artifacts/performance-024', { recursive: true });
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  await launch(false);
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    reducedMotion: 'no-preference',
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await writeFile(
    lifecycleFile,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/performance-024-harness.ts"',
    ),
  );
  await page.goto(`http://127.0.0.1:4198/${lifecycleFile}?debug-performance`);
  await page.waitForFunction(() =>
    window.renderProbe?.phaser.scene.getScene('Battle')?.sys.isActive(),
  );
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.renderProbe.game.units = [];
    window.renderProbe.game.enemies = [];
    window.renderProbe.game.effects = [];
  });
  await page.waitForTimeout(150);
  const idle = await page.evaluate(() => {
    const scene = window.renderProbe.phaser.scene.getScene('Battle');
    window.removedPools = { images: scene.actors.pieces, texts: scene.medicalSignals.labels };
    const idle = {
      images: scene.actors.pieces.stats.idle,
      texts: scene.medicalSignals.labels.stats.idle,
    };
    window.renderProbe.phaser.scene.remove('Battle');
    return idle;
  });
  assert.ok(idle.images > 0 && idle.texts > 0, 'Scenario must contain detached retained resources');
  await page.waitForTimeout(100);
  const removed = await page.evaluate(() => ({
    images: window.removedPools.images.stats,
    texts: window.removedPools.texts.stats,
  }));
  assert.equal(removed.images.idle, 0, 'Direct destroy clears image reserve');
  assert.equal(removed.texts.idle, 0, 'Direct destroy clears text reserve');
  assert.equal(
    await page.locator('[data-performance]').count(),
    0,
    'Direct destroy removes dev output',
  );
  result.directDestroy = true;
  await page.goto('http://127.0.0.1:4198/?debug-performance');
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  await page.locator('#home-help').click();
  await page.locator('#light-effects').check();
  assert.equal(await page.evaluate(() => localStorage.getItem('conquete-serpents:visual:v1')), '1');
  await page.reload();
  await page.locator('#home-help').click();
  assert.equal(await page.locator('#light-effects').isChecked(), true);
  await page.locator('#light-effects').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#light-effects').isChecked(), false);
  await page.locator('#close-help').click();
  await page.locator('#home-new').click();
  await page.locator('#home-screen').waitFor({ state: 'hidden' });
  await page.waitForFunction(
    () =>
      Number(document.querySelector('[data-performance]')?.textContent?.match(/^(\d+) FPS/)?.[1]) >
      0,
  );
  result.developmentMeter = await page.locator('[data-performance]').textContent();
  const meterBox = await page.locator('[data-performance]').boundingBox(),
    canvasBox = await page.locator('canvas').boundingBox();
  assert.ok(
    meterBox.y >= canvasBox.y &&
      meterBox.x >= canvasBox.x &&
      meterBox.x + meterBox.width <= canvasBox.x + canvasBox.width,
    'Counter is anchored inside the canvas',
  );
  await page
    .locator('canvas')
    .screenshot({ path: 'artifacts/performance-024/development-counter.png' });
  result.preferenceReload = true;
  result.keyboard = true;
  await page.close();
  server.kill();
  await new Promise((resolve) => server.once('exit', resolve));
  server = undefined;
  await launch(true);
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto('http://127.0.0.1:4198/?debug-performance');
  await mobile.locator('#home-help').click();
  await mobile.locator('#light-effects').check();
  await mobile.screenshot({
    path: 'artifacts/performance-024/mobile-settings.png',
    fullPage: true,
  });
  await mobile.locator('#close-help').click();
  await mobile.locator('#home-new').click();
  await mobile.locator('canvas').waitFor();
  await mobile.waitForTimeout(700);
  assert.equal(
    await mobile.locator('[data-performance]').count(),
    0,
    'No developer counter in production',
  );
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  result.productionMeterAbsent = true;
  result.touch = true;
  await mobile.close();
  assert.deepEqual(errors, []);
  await writeFile(
    'reports/render-settings-0.24.json',
    JSON.stringify({ result, errors, physicalDevice: false }, null, 2) + '\n',
  );
  console.log(JSON.stringify({ result, errors }));
} finally {
  await browser?.close();
  server?.kill();
  await unlink(lifecycleFile).catch(() => {});
}
