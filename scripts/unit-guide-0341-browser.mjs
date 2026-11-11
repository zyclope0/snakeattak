import { showHomePage } from '../tests/browser-entry.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const before = process.argv.includes('--before'),
  phase = before ? 'before' : 'after';
const folder = 'artifacts/unit-guide-0341',
  root = 'http://127.0.0.1:4391';
let browser, server;
const results = [],
  checks = [],
  errors = [];
try {
  await mkdir(folder, { recursive: true });
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4391',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(root)).ok) break;
    } catch {}
    if (i > 100) throw Error('Preview missing');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height, top, right, touch] of [
    [812, 375, 24, 32, true],
    [780, 360, 24, 32, true],
    [568, 320, 24, 32, true],
    [1280, 800, 0, 0, false],
  ]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width, height },
      hasTouch: touch,
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(root);
    await page.evaluate(
      ({ top, right }) => {
        document.documentElement.style.setProperty('--safe-area-inset-top', `${top}px`);
        document.documentElement.style.setProperty('--safe-area-inset-right', `${right}px`);
      },
      { top, right },
    );
    await showHomePage(page, 'parents');
    await page.locator('#home-guide').click();
    await page.locator('#unit-dialog').waitFor({ state: 'visible' });
    for (const kind of ['club', 'medic', 'twohead', 'mutantStretch']) {
      await page.locator('#guide-select').selectOption(kind);
      await page.evaluate(() => {
        document.querySelector('#unit-dialog').scrollTop = 0;
        const b = document.querySelector('.unit-guide-body');
        if (b) b.scrollTop = 0;
      });
      const metric = await page.evaluate(() => {
        const dialog = document.querySelector('#unit-dialog'),
          body = document.querySelector('.unit-guide-body') ?? dialog;
        const d = dialog.getBoundingClientRect(),
          b = body.getBoundingClientRect();
        const visible = (e) => {
          const r = e.getBoundingClientRect();
          return (
            r.top >= Math.max(d.top, b.top) - 1 &&
            r.bottom <= Math.min(d.bottom, b.bottom) + 1 &&
            r.left >= d.left &&
            r.right <= d.right
          );
        };
        const rect = (e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        };
        return {
          dialog: rect(dialog),
          close: rect(document.querySelector('#close-unit-guide')),
          select: rect(document.querySelector('#guide-select')),
          stats: [...document.querySelectorAll('#guide-stats>div')].map((e) => ({
            name: e.querySelector('small').textContent,
            visible: visible(e),
          })),
          portrait: rect(document.querySelector('#guide-portrait')),
        };
      });
      await page.screenshot({ path: `${folder}/${phase}-${width}-${kind}.png` });
      results.push({ width, height, kind, ...metric });
    }
    if (!before && width === 568) {
      const body = page.locator('.unit-guide-body');
      const selected = await page.locator('#guide-select').inputValue();
      await page.locator('#close-unit-guide').focus();
      await page.keyboard.press('Tab');
      assert.equal(
        await body.evaluate((e) => e === document.activeElement),
        true,
        'Keyboard can enter the scrollable details region',
      );
      await page.keyboard.press('PageDown');
      await page.waitForFunction(() => document.querySelector('.unit-guide-body').scrollTop > 35);
      assert.equal(await page.locator('#guide-select').inputValue(), selected);
      checks.push('568: Tab/PageDown scrolls details without changing selected unit');
      await body.evaluate((e) => (e.scrollTop = 0));
      const box = await body.boundingBox();
      const initial = await body.evaluate((e) => e.scrollTop);
      const pageY = await page.evaluate(() => scrollY);
      const closeBefore = await page.locator('#close-unit-guide').boundingBox();
      const cdp = await page.context().newCDPSession(page);
      try {
        const x = box.x + box.width * 0.7,
          from = box.y + box.height - 14,
          to = box.y + 18;
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
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } finally {
        await cdp.detach();
      }
      await page.waitForFunction(
        (initial) => document.querySelector('.unit-guide-body').scrollTop > initial + 35,
        initial,
      );
      assert.equal(await page.evaluate(() => scrollY), pageY);
      assert.deepEqual(await page.locator('#close-unit-guide').boundingBox(), closeBefore);
      await page.screenshot({ path: `${folder}/after-568-finger-scroll.png` });
      checks.push(
        'Native touch scroll on568px reaches lower fields, page stays still, close pinned',
      );
    }
    await page.locator('#close-unit-guide').click();
    await page.locator('#unit-dialog').waitFor({ state: 'hidden' });
    if (!before) {
      await showHomePage(page, 'parents');
      await page.locator('#home-guide').click();
      await page.keyboard.press('Escape');
      await page.locator('#unit-dialog').waitFor({ state: 'hidden' });
      assert.equal(
        await page.locator('#home-guide').evaluate((e) => e === document.activeElement),
        true,
      );
      checks.push(`${width}: Escape closes and returns focus to Fiches`);
    }
    await page.close();
  }
  await writeFile(
    `${folder}/${phase}.json`,
    JSON.stringify({ results, checks, errors }, null, 2) + '\n',
  );
  console.log(JSON.stringify({ phase, cases: results.length, checks, errors }));
  assert.deepEqual(errors, []);
  if (!before) {
    for (const r of results.filter((r) => r.width >= 780 && r.height < 520)) {
      assert.ok(r.dialog.height <= 290, `${r.width}/${r.kind}: avoid the tall desktop card`);
      assert.ok(r.portrait.height <= 56);
      assert.ok(r.close.width >= 48 && r.close.height >= 48);
      assert.ok(r.select.height >= 48);
      assert.ok(
        r.stats
          .filter((s) => ['Vie', 'Prix', 'Attaque', 'Portée'].includes(s.name))
          .every((s) => s.visible),
        `${r.width}/${r.kind}: essentials visible without scrolling`,
      );
    }
  }
} finally {
  await browser?.close();
  server?.kill();
}
