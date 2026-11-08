import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { visibleWords } from './visible-words.mjs';
import { revealControl } from '../tests/reveal-controls.mjs';
let preview, dev, browser;
const fixture = '.tutorial-030.html';
async function wait(url) {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    if (i > 100) throw Error('Server unavailable');
    await delay(100);
  }
}
try {
  await mkdir('artifacts/tutorial-030', { recursive: true });
  preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4350',
    '--strictPort',
  ]);
  await wait('http://127.0.0.1:4350');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [],
    results = [];
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
    await page.goto('http://127.0.0.1:4350');
    await page.locator('#home-play').click();
    assert.equal(
      await page.locator('#mission-map [data-preview-lane]').count(),
      3,
      'Three preview lanes remain visible',
    );
    assert.equal(await page.locator('#mission-map [data-active="true"]').count(), 1);
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
    await page.locator('#tutorial-lanes').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#tutorial-lanes [data-active="true"]').count(), 1);
    assert.match(await page.locator('#tutorial-lanes').getAttribute('aria-label'), /Centre/);
    const words = await page.evaluate(visibleWords, '#app');
    if (width === 1280) assert.ok(words <= 60, 'Initial visible words:' + words);
    const board = await page.locator('#game canvas').boundingBox();
    if (width === 812) assert.ok(board.height >= 375 * 0.85 && board.width >= 812 * 0.65);
    await page.screenshot({ path: `artifacts/tutorial-030/real-${width}.png` });
    results.push({ width, height, words, board });
    await page.close();
  }
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/tutorial-030-harness.ts"',
    ),
  );
  dev = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4351',
    '--strictPort',
  ]);
  await wait('http://127.0.0.1:4351');
  const page = await browser.newPage({
    viewport: { width: 812, height: 375 },
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4351/' + fixture);
  await page.waitForFunction(
    () => window.tutorialFixture?.phaser.scene.getScene('Battle').initialized,
  );
  for (const wave of [1, 2, 3]) {
    await page.evaluate((n) => window.tutorialFixture.wave(n), wave);
    assert.equal(await page.locator('#tutorial-lanes [data-active="true"]').count(), wave);
    await page.screenshot({ path: `artifacts/tutorial-030/wave-${wave}.png` });
  }
  await page.evaluate(() => window.tutorialFixture.wave(1));
  await page.locator('#start').click();
  await page.locator('#reinforcements-toggle').click();
  await revealControl(page, '#feast-controls');
  await page.locator('#feast-hint').scrollIntoViewIfNeeded();
  const hintBox = await page.locator('#feast-hint').boundingBox();
  assert.ok(
    hintBox.width >= 150 && hintBox.height >= 24,
    'Readable hint must have real text area, not a clipped1px accessible-only node',
  );
  assert.equal(
    await page.locator('#feast-hint').evaluate((e) => getComputedStyle(e).clipPath),
    'none',
  );
  assert.ok(await page.locator('#feast-hint').isVisible());
  assert.match(
    await page.locator('#feast-hint').innerText(),
    /Voie attaquée : Centre.*paisible/s,
    'A touch player can read why other lanes are inactive',
  );
  assert.ok(await page.locator('[data-feast-lane="0"]').isDisabled());
  assert.ok(await page.locator('[data-feast-lane="2"]').isDisabled());
  assert.ok(await page.locator('[data-feast-lane="1"]').isEnabled());
  await page.locator('[data-feast-lane="1"]').click();
  assert.equal(await page.evaluate(() => window.tutorialFixture.session.game.feastUsed), true);
  await page.locator('#reinforcements-close').click();
  await page.locator('#pause').click();
  assert.ok(await page.locator('#pause-overlay').isVisible());
  assert.equal(
    await page.evaluate(
      () => window.tutorialFixture.phaser.scene.getScene('Battle').overlay.visible,
    ),
    false,
  );
  await page.goto('http://127.0.0.1:4351/' + fixture + '?legacy');
  await page.waitForFunction(
    () => window.tutorialFixture?.phaser.scene.getScene('Battle').initialized,
  );
  assert.equal(
    await page.locator('#tutorial-lanes').isVisible(),
    false,
    'Legacy camp does not acquire tutorial rules',
  );
  assert.deepEqual(errors, []);
  await writeFile(
    'reports/tutorial-browser-0.30.json',
    JSON.stringify(
      { results, checks: ['three lanes', 'progression1/2/3', 'honey', 'legacy', 'pause'], errors },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser?.close();
  preview?.kill();
  dev?.kill();
  await unlink(fixture).catch(() => {});
}
