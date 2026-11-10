import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const phase = process.argv[2] ?? 'all';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const fixture = 'mobile-031-fixture.html';
let browser, preview, dev;
const errors = [],
  results = [],
  dockedResults = [];
const rect = (b) => ({ x: b.x, y: b.y, width: b.width, height: b.height });
async function ready(url) {
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await delay(100);
  }
  throw Error('Preview unavailable: ' + url);
}
async function launch(page, url) {
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.locator('#home-play').click();
  await page.locator('#mission-launch').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
}
async function insets(page, top, right, bottom, left) {
  await page.evaluate(
    ([top, right, bottom, left]) => {
      const s = document.documentElement.style;
      for (const [side, value] of Object.entries({ top, right, bottom, left }))
        s.setProperty('--safe-area-inset-' + side, value + 'px');
    },
    [top, right, bottom, left],
  );
}
function inside(b, width, height, safe, name) {
  const [top, right, bottom, left] = safe;
  assert.ok(
    b.x >= left - 1 &&
      b.y >= top - 1 &&
      b.x + b.width <= width - right + 1 &&
      b.y + b.height <= height - bottom + 1,
    `${name} outside safe area: ${JSON.stringify(b)}, margins ${safe}`,
  );
}
try {
  await mkdir('artifacts/mobile-031', { recursive: true });
  preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4352',
    '--strictPort',
  ]);
  await ready('http://127.0.0.1:4352');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  if (phase === 'all' || phase === 'safe') {
    for (const [width, height, safe] of [
      [812, 375, [0, 0, 0, 0]],
      [812, 375, [24, 48, 16, 0]],
      [667, 375, [24, 48, 16, 0]],
      [915, 412, [24, 0, 24, 48]],
      [960, 432, [24, 24, 16, 24]],
      [1280, 800, [24, 24, 16, 12]],
    ]) {
      const page = await browser.newPage({
        locale: 'fr-CH',
        viewport: { width, height },
        hasTouch: width < 1100,
      });
      await launch(page, 'http://127.0.0.1:4352');
      await insets(page, ...safe);
      await page.screenshot({ path: `artifacts/mobile-031/safe-${width}-${safe[1]}.png` });
      for (const id of ['pause', 'speed', 'start'])
        inside(await page.locator('#' + id).boundingBox(), width, height, safe, id);
      const board = await page.locator('#game canvas').boundingBox();
      inside(board, width, height, safe, 'canvas');
      if (width > 700 && width < 1100)
        assert.ok(
          board.height >= (height - safe[0] - safe[2]) * 0.85,
          'Closed board >=85% useful height',
        );
      // Late inset injection and side swap must update canvas, not leave stale sizing.
      await insets(page, safe[0], safe[3], safe[2], safe[1]);
      await page.waitForFunction(
        ([left, right]) => {
          const b = document.querySelector('#game canvas').getBoundingClientRect();
          return b.x >= left - 1 && b.right <= innerWidth - right + 1;
        },
        [safe[1], safe[3]],
      );
      await page.locator('#pause').click();
      assert.ok(await page.locator('#pause-overlay').isVisible());
      inside(
        await page.locator('#resume-game').boundingBox(),
        width,
        height,
        [safe[0], safe[3], safe[2], safe[1]],
        'resume',
      );
      results.push({ width, height, safe, board: rect(board) });
      await page.close();
    }
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width: 812, height: 375 },
      hasTouch: true,
    });
    await page.goto('http://127.0.0.1:4352');
    await insets(page, 24, 48, 16, 0);
    await page.locator('#home-play').click();
    inside(
      await page.locator('#mission-dialog').boundingBox(),
      812,
      375,
      [24, 48, 16, 0],
      'mission dialog',
    );
    await page.setViewportSize({ width: 375, height: 812 });
    assert.ok(await page.locator('#orientation-notice').isVisible());
    await page.close();
  }
  if (phase === 'all' || phase === 'narrow') {
    for (const [width, height, safe] of [
      [480, 320, [24, 48, 16, 0]],
      [568, 320, [24, 48, 16, 0]],
      [667, 375, [24, 0, 16, 48]],
      [812, 375, [24, 48, 16, 0]],
    ]) {
      const page = await browser.newPage({
        locale: 'fr-CH',
        viewport: { width, height },
        hasTouch: true,
      });
      await launch(page, 'http://127.0.0.1:4352');
      await insets(page, ...safe);
      await page.locator('#reinforcements-toggle').click();
      const panel = await page.locator('#reinforcements').boundingBox();
      inside(panel, width, height, safe, 'narrow panel');
      assert.equal(
        await page
          .locator('.dashboard')
          .evaluate((el) => [...el.children].every((c) => c.scrollWidth <= c.clientWidth + 1)),
        true,
        'Narrow HUD statistics and controls must not overlap',
      );
      await page.screenshot({ path: `artifacts/mobile-031/narrow-${width}.png` });
      await page.evaluate(() =>
        document.querySelectorAll('#reinforcements details').forEach((el) => {
          el.open = true;
        }),
      );
      const controls = await page.locator('#reinforcements').evaluate((panel) =>
        [...panel.querySelectorAll('button,select,summary')]
          .filter(
            (el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden',
          )
          .map((el) => {
            const b = el.getBoundingClientRect();
            return {
              id: el.id || el.textContent.trim().slice(0, 30),
              x: b.x,
              right: b.right,
              width: b.width,
              height: b.height,
            };
          }),
      );
      for (const b of controls) {
        assert.ok(
          b.x >= panel.x - 1 && b.right <= panel.x + panel.width + 1,
          `Narrow ${width} control ${b.id} must fit horizontally: ${JSON.stringify(b)}`,
        );
        assert.ok(
          b.width >= 48 && b.height >= 48,
          `Narrow ${width} control ${b.id} needs48px: ${JSON.stringify(b)}`,
        );
      }
      assert.equal(
        await page
          .locator('.shop-tabs')
          .evaluate((el) =>
            [...el.querySelectorAll('button')].every((b) => b.scrollWidth <= b.clientWidth + 1),
          ),
        true,
        'Catalogue labels cannot overflow',
      );
      dockedResults.push({
        width,
        height,
        safe,
        panel: rect(panel),
        checkedControls: controls.length,
      });
      await page.locator('#feast-flavors').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `artifacts/mobile-031/tools-${width}.png` });
      await page.locator('#reinforcements-close').click();
      await page.close();
    }
  }
  if (phase === 'all' || phase === 'dock') {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width: 812, height: 375 },
      hasTouch: true,
    });
    await launch(page, 'http://127.0.0.1:4352');
    await insets(page, 24, 48, 16, 0);
    const before = await page.locator('#game canvas').boundingBox();
    await page.locator('#reinforcements-toggle').click();
    const panel = await page.locator('#reinforcements').boundingBox();
    assert.ok(panel.width <= (812 - 48) * 0.32 + 1, 'Reinforcements limited to32% useful width');
    await page.waitForFunction(() => {
      const b = document.querySelector('#game canvas').getBoundingClientRect();
      const p = document.querySelector('#reinforcements').getBoundingClientRect();
      return b.right <= p.left + 1;
    });
    inside(panel, 812, 375, [24, 48, 16, 0], 'reinforcements');
    for (const id of ['reinforcements-close', 'unit-guide']) {
      const b = await page.locator('#' + id).boundingBox();
      assert.ok(b.width >= 48 && b.height >= 48, id + ' touch target48px');
      inside(b, 812, 375, [24, 48, 16, 0], id);
    }
    assert.equal(
      await page.locator('#reinforcements-backdrop').isVisible(),
      false,
      'No curtain covers the battlefield',
    );
    await page.locator('#reinforcements-close').focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await page.locator('#reinforcements').evaluate((el) => el.contains(document.activeElement)),
      false,
      'Non-modal catalogue does not trap keyboard focus',
    );
    await page.screenshot({ path: 'artifacts/mobile-031/renforts-812.png' });
    const gold = await page.locator('#gold').innerText();
    await page.locator('[data-kind="club"]').click();
    assert.equal(
      await page.locator('#gold').innerText(),
      gold,
      'Choosing a card does not charge before placement',
    );
    assert.equal(
      await page.locator('#reinforcements-toggle').getAttribute('aria-expanded'),
      'false',
    );
    await page.waitForFunction(
      (w) => Math.abs(document.querySelector('#game canvas').getBoundingClientRect().width - w) < 1,
      before.width,
    );
    await page.locator('#reinforcements-toggle').click();
    await page.keyboard.press('Escape');
    assert.equal(
      await page.locator('#reinforcements-toggle').getAttribute('aria-expanded'),
      'false',
    );
    await page.locator('#reinforcements-toggle').click();
    await page.setViewportSize({ width: 1280, height: 800 });
    assert.equal(
      await page.locator('#reinforcements').evaluate((el) => el.inert),
      true,
      'The on-demand catalogue stays closed after changing to desktop',
    );
    assert.equal(
      await page.locator('#reinforcements-toggle').getAttribute('aria-expanded'),
      'false',
    );
    await page.locator('#dock-catalogue').click();
    assert.equal(await page.locator('#reinforcements').evaluate((el) => el.inert), false);
    assert.ok(await page.locator('[data-kind="club"]').isVisible());
    assert.ok(await page.locator('[data-kind="club"]').isEnabled());
    await page.setViewportSize({ width: 812, height: 375 });
    assert.equal(
      await page.locator('#reinforcements-toggle').getAttribute('aria-expanded'),
      'false',
    );
    await page.close();
    await writeFile(
      fixture,
      (await readFile('index.html', 'utf8')).replace(
        'src="/src/main.ts"',
        'src="/tests/mobile-031-harness.ts"',
      ),
    );
    dev = spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      '4353',
      '--strictPort',
    ]);
    await ready('http://127.0.0.1:4353/' + fixture);
    const live = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width: 812, height: 375 },
      hasTouch: true,
    });
    live.on('pageerror', (e) => errors.push(e.message));
    await live.goto('http://127.0.0.1:4353/' + fixture);
    await live.waitForFunction(() => window.mobileInterface?.phaser.scene.isActive('Battle'));
    const goldBefore = await live.evaluate(() => window.mobileInterface.session.game.gold);
    await live.locator('#reinforcements-toggle').click();
    await live.locator('[data-kind="club"]').click();
    await live.waitForFunction(
      () => document.querySelector('#game canvas').getBoundingClientRect().width > 570,
    );
    await live.waitForFunction(() => {
      const p = document.querySelector('#game').getBoundingClientRect(),
        c = document.querySelector('#game canvas').getBoundingClientRect();
      return Math.abs(c.x + c.width / 2 - p.x - p.width / 2) < 1;
    });
    const spot = await live.evaluate(() => {
      const g = window.mobileInterface.session.game;
      for (let y = 140; y <= 520; y += 40)
        for (let x = 950; x >= 700; x -= 40) if (g.canRecruit('club', x, y)) return { x, y };
      return null;
    });
    assert.ok(spot, 'A legal camp placement exists');
    const canvas = await live.locator('#game canvas').boundingBox();
    await live.touchscreen.tap(
      canvas.x + (canvas.width * spot.x) / 1100,
      canvas.y + (canvas.height * spot.y) / 620,
    );
    await live.waitForFunction(
      (gold) => window.mobileInterface.session.game.gold < gold,
      goldBefore,
    );
    assert.equal(await live.evaluate(() => window.mobileInterface.session.game.units.length), 4);
    await live.locator('#start').click();
    await live.locator('#reinforcements-toggle').click();
    assert.equal(await live.evaluate(() => window.mobileInterface.session.game.paused), false);
    const time = await live.evaluate(() => window.mobileInterface.session.game.time);
    await live.waitForFunction(
      (time) => window.mobileInterface.session.game.time > time + 0.2,
      time,
    );
    await live.locator('#reinforcements-close').click();
    await live.locator('#pause').click();
    await live.locator('#reinforcements-toggle').click();
    await live.locator('#reinforcements-close').click();
    assert.equal(
      await live.evaluate(() => window.mobileInterface.session.game.paused),
      true,
      'Opening/closing retains deliberate pause',
    );
    await live.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `reports/mobile-${version}.json`,
    JSON.stringify(
      {
        version,
        simulatedInsets: true,
        physicalDevice: false,
        results,
        dockedResults,
        checks: [
          'system areas',
          'rotation',
          'dialog',
          'pause',
          'docked reinforcements',
          'touch targets',
          'selection closes',
          'selection then real touch placement',
          'narrow catalogue and complete camp tools',
          'narrow HUD statistics do not overlap',
          'combat continues',
        ],
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify({ phase, sizes: results.length, dockedSizes: dockedResults.length, errors }),
  );
} finally {
  await browser?.close();
  preview?.kill();
  dev?.kill();
  await rm(fixture, { force: true });
}
