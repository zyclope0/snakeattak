import { showHomePage } from '../tests/browser-entry.mjs';
import { catalogueView, REMOVED_CATALOGUE_CONTROLS } from '../tests/reveal-controls.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const artifact =
  process.env.REINFORCEMENTS_SCROLL_REPORT_DIR ?? 'artifacts/reinforcements-scroll-037';
const reportPath = `${artifact}/report.json`;
const positiveScrollCases = [];
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
    open: document.getElementById('reinforcements').open,
    pageY: scrollY,
    body: (() => {
      const body = document.querySelector('.catalog-body');
      return {
        top: body.scrollTop,
        client: body.clientHeight,
        scroll: body.scrollHeight,
        max: body.scrollHeight - body.clientHeight,
      };
    })(),
  }));
}
async function settledBody(page) {
  await page.evaluate(async () => {
    const body = document.querySelector('.catalog-body');
    let previous = body.scrollTop,
      stable = 0;
    for (let frame = 0; frame < 120 && stable < 4; frame++) {
      await new Promise(requestAnimationFrame);
      const current = body.scrollTop;
      stable = Math.abs(current - previous) < 0.1 ? stable + 1 : 0;
      previous = current;
    }
  });
  return snapshot(page);
}
function noAccident(before, after, label) {
  assert.equal(after.gold, before.gold, label + ': no purchase');
  assert.deepEqual(after.selected, before.selected, label + ': no selection');
  assert.equal(after.open, true, label + ': catalogue stays open');
  assert.equal(after.pageY, before.pageY, label + ': no document scroll');
}
async function nativeBodyGesture(page, direction) {
  const rect = await page.locator('.catalog-body').boundingBox();
  const x = rect.x + rect.width - 8;
  const top = rect.y + 6,
    bottom = rect.y + rect.height - 6;
  assert.ok(bottom - top >= 32, 'Body has room for a real native drag');
  assert.ok(
    await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.catalog-body'), {
      x,
      y: (top + bottom) / 2,
    }),
    'Native drag starts in the actual catalogue body',
  );
  await swipe(page, x, direction > 0 ? bottom : top, direction > 0 ? top : bottom);
  return settledBody(page);
}
async function checkPositiveBodyScroll(page, label) {
  const before = await settledBody(page);
  if (before.body.max <= 1) return { range: before.body.max, contentFits: true };
  const card = await pointOnCard(page);
  await swipe(page, card.x, card.y, card.to);
  const up = await settledBody(page);
  noAccident(before, up, label + ' upward card drag');
  assert.ok(
    up.body.top > before.body.top + 1,
    label +
      ' native upward drag must move the real body: ' +
      JSON.stringify({ before: before.body, after: up.body }),
  );
  const down = await nativeBodyGesture(page, -1);
  noAccident(before, down, label + ' downward drag');
  assert.ok(
    down.body.top < up.body.top - 1,
    label +
      ' native downward drag must move the real body: ' +
      JSON.stringify({ before: up.body, after: down.body }),
  );
  let edge = down;
  for (let tries = 0; edge.body.top < edge.body.max - 1 && tries < 12; tries++)
    edge = await nativeBodyGesture(page, 1);
  assert.ok(
    edge.body.top >= edge.body.max - 1,
    label + ' native gestures reach the true lower limit',
  );
  noAccident(before, edge, label + ' lower limit');
  const beyond = await nativeBodyGesture(page, 1);
  assert.ok(
    Math.abs(beyond.body.top - beyond.body.max) <= 1,
    label + ' boundary drag stays at actual body limit',
  );
  noAccident(before, beyond, label + ' beyond lower limit');
  const measurement = {
    range: before.body.max,
    contentFits: false,
    initialTop: before.body.top,
    upwardTop: up.body.top,
    downwardTop: down.body.top,
    lowerLimit: edge.body.top,
    boundaryTop: beyond.body.top,
    documentYBefore: before.pageY,
    documentYAfter: beyond.pageY,
  };
  // Restore the initial page with native gestures so following card/tap checks
  // do not inherit a scripted scroll position.
  let restored = beyond;
  for (let tries = 0; restored.body.top > 1 && tries < 12; tries++)
    restored = await nativeBodyGesture(page, -1);
  assert.ok(restored.body.top <= 1, label + ' native gestures return to top');
  noAccident(before, restored, label + ' return to top');
  positiveScrollCases.push({ label, ...measurement });
  return measurement;
}
async function pointOnCard(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.catalog-body').getBoundingClientRect();
    for (const e of document.querySelectorAll('#shop .unit-card')) {
      const r = e.getBoundingClientRect();
      if (r.width === 0 || r.bottom <= panel.top || r.top >= panel.bottom) continue;
      const top = Math.max(r.top, panel.top);
      const bottom = Math.min(r.bottom, panel.bottom);
      if (bottom - top < 12) continue;
      const y = (top + bottom) / 2;
      const x = r.x + r.width * 0.5;
      if (document.elementFromPoint(x, y)?.closest('.unit-card') !== e) continue;
      return {
        x,
        y,
        to: Math.max(panel.top + 2, y - 120),
        kind: e.dataset.kind,
        disabled: e.disabled,
      };
    }
    throw Error('No visible card to swipe');
  });
}
try {
  await mkdir(artifact, { recursive: true });
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
    await showHomePage(page, 'missions');
    await page.locator('#home-play').click();
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.getElementById('game').getAttribute('aria-busy') === 'false',
    );
    await page.evaluate((safe) => {
      for (const [i, key] of ['top', 'right', 'bottom', 'left'].entries())
        document.documentElement.style.setProperty('--safe-area-inset-' + key, safe[i] + 'px');
    }, safe);
    await page.locator('#dock-catalogue:visible, #reinforcements-toggle:visible').first().tap();
    if (process.env.REINFORCEMENTS_SCROLL_BLOCK_TOUCH === '1')
      await page.addStyleTag({ content: '.catalog-body { touch-action: none !important; }' });
    const bodyScroll = await checkPositiveBodyScroll(
      page,
      `${width}x${height} safe=${safe.join('/')}`,
    );
    const before = await snapshot(page),
      point = await pointOnCard(page);
    await swipe(page, point.x, point.y, point.to);
    let after = await snapshot(page);
    assert.equal(after.gold, before.gold);
    assert.deepEqual(after.selected, before.selected);
    assert.equal(after.open, true);
    assert.equal(after.pageY, before.pageY);
    // Every ally of a tab is on one screen. Both swipe directions must be harmless
    // whether the body scrolls or all the cards already fit.
    await swipe(page, point.x, point.to, point.y);
    assert.equal((await snapshot(page)).gold, before.gold);
    assert.deepEqual((await snapshot(page)).selected, before.selected);
    assert.equal((await snapshot(page)).open, true);
    assert.equal(
      await page.locator(REMOVED_CATALOGUE_CONTROLS).count(),
      0,
      'No pager and no family list',
    );
    const seen = new Set(),
      shown = {};
    for (const tab of ['shop-ready', 'shop-future']) {
      await page.locator('#' + tab).tap();
      const view = await catalogueView(page);
      assert.deepEqual(view.tab, [tab], 'Tab pressed');
      assert.equal(view.scrollTop, 0, 'A tab starts at its first ally');
      assert.equal(
        view.cards.length,
        tab === 'shop-ready' ? view.ready : view.future,
        'A tab shows every ally it announces at once',
      );
      assert.ok(
        view.cards.every((card) => (card.state === 'locked') === (tab === 'shop-future')),
        'Available and future allies stay apart',
      );
      assert.equal(view.columns, width <= 700 ? 4 : 5, 'Five columns, four on a narrow screen');
      assert.ok(
        view.cards.every((card) => card.height >= 48 && card.width >= 48),
        'Every ally card is a 48 px target: ' + JSON.stringify(view.cards),
      );
      // Nothing to turn: a card below the fold is reached by the body's own scroll, and then
      // it is the card itself that a finger meets.
      for (const card of view.cards) {
        assert.ok(
          await page.locator(`#shop [data-kind="${card.kind}"]`).evaluate((node) => {
            // The body's own scroll range, as far as this card needs and no further.
            const body = node.closest('.catalog-body');
            const frame = body.getBoundingClientRect();
            const start = node.getBoundingClientRect();
            if (start.top < frame.top) body.scrollTop -= frame.top - start.top;
            else if (start.bottom > frame.bottom)
              body.scrollTop += Math.min(start.bottom - frame.bottom, start.top - frame.top);
            const r = node.getBoundingClientRect();
            const top = Math.max(r.top, frame.top),
              bottom = Math.min(r.bottom, frame.bottom);
            return (
              bottom - top >= Math.min(r.height, frame.height) - 1 &&
              document
                .elementFromPoint(r.left + r.width / 2, (top + bottom) / 2)
                ?.closest('.unit-card') === node
            );
          }),
          `Ally ${card.kind} reachable in the catalogue body`,
        );
        seen.add(card.kind);
      }
      shown[tab] = {
        cards: view.cards.length,
        columns: view.columns,
        whole: view.cards.filter((card) => card.inBody).length,
        tallest: Math.max(...view.cards.map((card) => card.height)),
      };
    }
    assert.equal(seen.size, 20, 'Every ally reachable through the two visible tabs');
    const locked = await pointOnCard(page);
    assert.equal(locked.disabled, true);
    const lockedBefore = await snapshot(page);
    await swipe(page, locked.x, locked.y, locked.to);
    assert.equal((await snapshot(page)).gold, lockedBefore.gold);
    assert.deepEqual((await snapshot(page)).selected, lockedBefore.selected);
    assert.equal((await snapshot(page)).open, true);
    assert.equal(
      (await snapshot(page)).pageY,
      before.pageY,
      'Boundary swipe does not scroll document',
    );
    await page.locator('#shop-ready').tap();
    assert.equal(
      await page.locator('#shop-ready').getAttribute('aria-pressed'),
      'true',
      'Available tab selected',
    );
    await page.locator('#shop .unit-card:visible').first().scrollIntoViewIfNeeded();
    const actual = await pointOnCard(page);
    assert.equal(actual.disabled, false, 'Real visible tap target is available');
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
    await page.locator('#dock-catalogue:visible, #reinforcements-toggle:visible').first().tap();
    const armedBefore = await snapshot(page),
      armedPoint = await pointOnCard(page);
    await swipe(page, armedPoint.x, armedPoint.y, armedPoint.to);
    const armedAfter = await snapshot(page);
    assert.equal(armedAfter.gold, armedBefore.gold);
    assert.deepEqual(armedAfter.selected, armedBefore.selected);
    assert.equal(armedAfter.open, true);
    assert.equal(await page.locator('#pause-overlay').isVisible(), false);
    cases.push({
      width,
      height,
      safe,
      alliesReached: seen.size,
      shown,
      requestedFingerDistance: Math.round(point.y - point.to),
      bodyScroll,
    });
    await page.screenshot({
      path: `${artifact}/after-${width}-${safe[1]}.png`,
    });
    await page.close();
  }
  // Large screens show the same one-screen catalogue, with harmless touch gestures.
  const desktop = await browser.newPage({
    locale: 'fr-CH',
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
  });
  desktop.on('pageerror', (e) => errors.push(e.message));
  await desktop.goto('http://127.0.0.1:4371');
  await showHomePage(desktop, 'missions');
  await desktop.locator('#home-play').click();
  await desktop.locator('#mission-launch').click();
  await desktop.locator('#dock-catalogue').click();
  await desktop.locator('#shop-future').click();
  const shop = await desktop.locator('#shop').boundingBox();
  await swipe(desktop, shop.x + shop.width * 0.25, shop.y + shop.height - 20, shop.y + 15);
  const desktopBefore = await snapshot(desktop);
  // Each tab shows all its allies whole, with nothing to scroll or turn; going from one tab
  // to the other buys nothing, selects nothing and closes nothing.
  for (const tab of ['shop-future', 'shop-ready']) {
    await desktop.locator('#' + tab).click();
    const view = await catalogueView(desktop);
    assert.deepEqual(view.tab, [tab]);
    assert.equal(view.cards.length, tab === 'shop-ready' ? view.ready : view.future);
    assert.equal(view.ready + view.future, 20);
    assert.equal(view.columns, 5);
    assert.ok(
      view.cards.every((card) => card.inBody && card.height >= 48),
      'Desktop allies whole in the catalogue: ' + JSON.stringify(view.cards),
    );
    assert.equal((await snapshot(desktop)).gold, desktopBefore.gold);
    assert.deepEqual((await snapshot(desktop)).selected, desktopBefore.selected);
    assert.equal((await snapshot(desktop)).open, true);
  }
  assert.equal(await desktop.locator(REMOVED_CATALOGUE_CONTROLS).count(), 0);
  await desktop.close();
  assert.deepEqual(errors, []);
  assert.ok(
    positiveScrollCases.length >= 1,
    'At least one genuinely overflowing body proves native scrolling in both directions',
  );
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        version,
        source: 'Chromium native touch dispatch, not physical Android',
        cases,
        positiveScrollCases,
        checks: [
          'native swipes available and disabled cards',
          'actual body movement in both directions when overflowing',
          'true native lower-limit gesture without document scroll',
          'no selection/purchase/close on drag',
          'tap still selects',
          'no document scroll at boundary',
          'all 20 allies shown by the two tabs without pages, each reachable in the scrolling body, on small and large screens',
        ],
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify({
      cases: cases.length,
      positiveScrollCases: positiveScrollCases.length,
      desktop: true,
      errors,
    }),
  );
} finally {
  await browser?.close();
  server?.kill();
}
