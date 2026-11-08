import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { visibleWords } from './visible-words.mjs';
const before = process.argv.includes('--before'),
  phase = before ? 'before' : 'after';
let server, browser;
try {
  await mkdir('artifacts/lisibilite-029', { recursive: true });
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4344',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4344')).ok) break;
    } catch {}
    if (i > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const results = [],
    errors = [];
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
    await page.goto('http://127.0.0.1:4344');
    await page.locator('#home-screen').waitFor({ state: 'visible' });
    await page.screenshot({ path: `artifacts/lisibilite-029/${phase}-home-${width}.png` });
    if (before) {
      await page.locator('#home-expeditions').click();
      await page.locator('[data-mission-card="refuge"]').click();
    } else {
      assert.ok(await page.locator('#home-play').isVisible(), 'Jouer primary visible');
      await page.locator('#home-play').click();
    }
    await page.locator('#mission-dialog').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#mission-title').textContent(), 'Le refuge');
    if (!before) {
      assert.equal(
        await page.locator('#mission-departure-code').isVisible(),
        false,
        'Code stays in parent disclosure',
      );
      const labels = await page.locator('.mission-facts dd').allTextContents();
      assert.ok(labels.every((s) => s.trim().split(/\s+/).length <= 3));
      await page.locator('#mission-parent-options summary').click();
      assert.ok(await page.locator('#mission-departure-code').isVisible());
      await page.locator('#mission-parent-options summary').click();
    }
    await page.screenshot({ path: `artifacts/lisibilite-029/${phase}-prepare-${width}.png` });
    const launch = await page.locator('#mission-launch').boundingBox();
    assert.ok(launch.y >= 0 && launch.y + launch.height <= height);
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
    const words = await page.evaluate(visibleWords, '#app');
    if (!before) {
      if (width === 1280) assert.ok(words <= 60, 'Mission1 visible words: ' + words);
      if (width === 812) await page.locator('#reinforcements-toggle').click();
      await page.locator('#camp-observation summary').click();
      assert.ok(await page.locator('#encounter').isVisible());
      await page.locator('#camp-observation summary').click();
      assert.equal(await page.locator('#repair').count(), 1, 'Repair retained');
      assert.equal(await page.locator('#encourage').count(), 1, 'Encourage retained');
    }
    if (!before) {
      await page.locator('.unit-card[data-kind="archer"]').click();
      const board = await page.locator('#game canvas').boundingBox();
      const x = board.x + (board.width * 960) / 1100,
        y = board.y + (board.height * 468) / 620;
      if (width === 812) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
      assert.equal(
        await page.locator('#gold').textContent(),
        '300',
        'Recruitment spent150 before resume check',
      );
      await page.locator(width === 812 ? '#mobile-home' : '#menu-home').click();
      assert.ok(
        await page.locator('#mission-continue').isVisible(),
        'Mission resume visible directly on home',
      );
      await page.locator('#home-play').click();
      assert.ok(
        await page.locator('#mission-replacement-note').isVisible(),
        'Replacement warning outside parent disclosure',
      );
      await page.locator('#mission-close').click();
      await page.locator('#mission-continue').click();
      assert.equal(
        await page.locator('#gold').textContent(),
        '300',
        'Resume retains spent budget rather than restarting450',
      );
      assert.equal(
        await page.locator('#army-count').textContent(),
        '4',
        'Recruited archer survives resume',
      );
      await page.locator(width === 812 ? '#mobile-home' : '#menu-home').click();
      await page.evaluate(() => {
        const key = 'conquete-serpents:family:v1';
        const f = JSON.parse(localStorage.getItem(key));
        f.missions.bestStars.refuge = 3;
        localStorage.setItem(key, JSON.stringify(f));
      });
      await page.reload();
      await page.locator('#home-play').click();
      assert.equal(
        await page.locator('#mission-title').textContent(),
        'Les trois ponts',
        'Jouer selects next unfinished mission from existing progress',
      );
    }
    results.push({ width, height, words });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `artifacts/lisibilite-029/${phase}.json`,
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(JSON.stringify({ phase, results, errors }));
} finally {
  await browser?.close();
  server?.kill();
}
