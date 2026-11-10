import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
let server, browser;
const cases = [],
  errors = [];
async function swipe(page, x, from, to) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: from }],
    });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y: from + ((to - from) * i) / 12 }],
      });
      await delay(20);
    }
    await delay(80);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await cdp.detach();
  }
}
async function snapshot(page) {
  return page.evaluate(() => ({
    gold: document.getElementById('gold').textContent,
    selected: [...document.querySelectorAll('#shop [aria-pressed="true"]')].map(
      (e) => e.dataset.kind,
    ),
    open: document.getElementById('app').classList.contains('reinforcements-open'),
    pageY: scrollY,
    panel: document.getElementById('reinforcements').scrollTop,
    shop: document.getElementById('shop').scrollTop,
  }));
}
async function pointOnCard(page) {
  return page.evaluate(() => {
    const panel = document.getElementById('reinforcements').getBoundingClientRect();
    for (const e of document.querySelectorAll('#shop .unit-card')) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.bottom <= panel.top + 70 || r.top >= panel.bottom) continue;
      const top = Math.max(r.top, panel.top + 70);
      const bottom = Math.min(r.bottom, panel.bottom);
      if (bottom - top < 12) continue;
      const y = (top + bottom) / 2;
      return {
        x: r.x + r.width * 0.5,
        y,
        to: Math.max(panel.top + 45, y - 120),
        kind: e.dataset.kind,
        disabled: e.disabled,
      };
    }
    throw Error('No visible card to swipe');
  });
}
try {
  await mkdir('artifacts/reinforcements-scroll-037', { recursive: true });
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4371',
    '--strictPort',
  ]);
  for (let n = 0; ; n++) {
    try {
      if ((await fetch('http://127.0.0.1:4371')).ok) break;
    } catch {}
    if (n > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height, safe] of [
    [812, 375, [0, 0, 0, 0]],
    [812, 375, [24, 48, 16, 0]],
    [568, 320, [24, 48, 16, 0]],
    [480, 320, [24, 48, 16, 0]],
    [667, 375, [24, 0, 16, 48]],
  ]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width, height },
      hasTouch: true,
      isMobile: true,
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4371');
    await page.locator('#home-play').click();
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.getElementById('game').getAttribute('aria-busy') === 'false',
    );
    await page.evaluate((safe) => {
      for (const [i, key] of ['top', 'right', 'bottom', 'left'].entries())
        document.documentElement.style.setProperty('--safe-area-inset-' + key, safe[i] + 'px');
    }, safe);
    await page.locator('#reinforcements-toggle').tap();
    const before = await snapshot(page),
      point = await pointOnCard(page);
    await swipe(page, point.x, point.y, point.to);
    assert.ok(
      (await snapshot(page)).panel > before.panel + 40,
      `Finger on available card scrolls catalogue at ${width}x${height}`,
    );
    let after = await snapshot(page);
    assert.equal(after.gold, before.gold);
    assert.deepEqual(after.selected, before.selected);
    assert.equal(after.open, true);
    assert.equal(after.pageY, before.pageY);
    assert.equal(after.shop, 0);
    const b = await page.locator('#reinforcements').boundingBox();
    const high = after.panel;
    await swipe(page, b.x + b.width * 0.5, b.y + 55, Math.min(b.y + b.height - 24, b.y + 190));
    await page.waitForFunction(
      (high) => document.getElementById('reinforcements').scrollTop < high - 25,
      high,
    );
    // Reset only prepares the next case; every scrolling assertion uses native touch events.
    await page.locator('#reinforcements').evaluate((e) => (e.scrollTop = 0));
    await page.locator('#shop-future').tap();
    const locked = await pointOnCard(page);
    assert.equal(locked.disabled, true);
    const lockedBefore = await snapshot(page);
    await swipe(page, locked.x, locked.y, locked.to);
    assert.ok(
      (await snapshot(page)).panel > lockedBefore.panel + 40,
      'Swipe on a locked card still scrolls',
    );
    assert.deepEqual((await snapshot(page)).selected, []);
    assert.equal((await snapshot(page)).open, true);
    // At the edge, a further swipe stays in the catalogue rather than moving the document.
    await page.locator('#reinforcements').evaluate((e) => (e.scrollTop = e.scrollHeight));
    const pageY = await page.evaluate(() => scrollY);
    await swipe(page, b.x + b.width * 0.5, b.y + b.height - 25, b.y + 60);
    assert.equal(await page.evaluate(() => scrollY), pageY);
    await page.locator('#reinforcements').evaluate((e) => (e.scrollTop = 0));
    await page.locator('#shop-ready').tap();
    const actual = await pointOnCard(page);
    await page.touchscreen.tap(actual.x, actual.y);
    await page.locator('#reinforcements').waitFor({ state: 'hidden' });
    assert.equal(
      await page.locator(`#shop [data-kind="${actual.kind}"]`).getAttribute('aria-pressed'),
      'true',
    );
    assert.equal(
      await page.locator('#gold').innerText(),
      before.gold,
      'A tap selects without purchasing',
    );
    // An already selected ally must also survive a swipe without a purchase.
    await page.locator('#reinforcements-toggle').tap();
    const armedBefore = await snapshot(page),
      armedPoint = await pointOnCard(page);
    await swipe(page, armedPoint.x, armedPoint.y, armedPoint.to);
    const armedAfter = await snapshot(page);
    assert.ok(
      armedAfter.panel > armedBefore.panel + 40,
      'Armed selection does not prevent catalogue scrolling',
    );
    assert.equal(armedAfter.gold, armedBefore.gold);
    assert.deepEqual(armedAfter.selected, armedBefore.selected);
    assert.equal(armedAfter.open, true);
    assert.equal(await page.locator('#pause-overlay').isVisible(), false);
    cases.push({ width, height, safe, dragDistance: Math.round(after.panel - before.panel) });
    await page.screenshot({
      path: `artifacts/reinforcements-scroll-037/after-${width}-${safe[1]}.png`,
    });
    await page.close();
  }
  // The large-screen catalogue intentionally retains its own scroll container.
  const desktop = await browser.newPage({
    locale: 'fr-CH',
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  });
  desktop.on('pageerror', (e) => errors.push(e.message));
  await desktop.goto('http://127.0.0.1:4371');
  await desktop.locator('#home-play').click();
  await desktop.locator('#mission-launch').click();
  await desktop.locator('#dock-catalogue').click();
  const shop = await desktop.locator('#shop').boundingBox();
  await swipe(desktop, shop.x + shop.width * 0.25, shop.y + shop.height - 20, shop.y + 15);
  assert.ok(
    await desktop.locator('#shop').evaluate((e) => e.scrollTop > 20),
    'Large-screen shop scroll retained',
  );
  await desktop.close();
  assert.deepEqual(errors, []);
  await writeFile(
    `reports/reinforcements-scroll-${version}.json`,
    JSON.stringify(
      {
        version,
        source: 'Chromium native touch dispatch, not physical Android',
        cases,
        checks: [
          'native swipes available and disabled cards',
          'both directions',
          'no selection/purchase/close on drag',
          'tap still selects',
          'no document scroll at boundary',
          'large-screen own scroll retained',
        ],
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ cases: cases.length, desktop: true, errors }));
} finally {
  await browser?.close();
  server?.kill();
}
