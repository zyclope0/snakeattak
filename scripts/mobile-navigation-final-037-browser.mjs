import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { showHomePage } from '../tests/browser-entry.mjs';

const folder = process.env.FINAL_NAVIGATION_REPORT_DIR;
assert.ok(folder, 'Use an external proof directory');
await mkdir(folder, { recursive: true });
const url = 'http://127.0.0.1:4397';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4397', '--strictPort'],
  { stdio: 'ignore' },
);
const results = [],
  errors = [];
let browser;
async function check(label, run) {
  try {
    const evidence = await run();
    results.push({ label, passed: true, evidence });
  } catch (error) {
    results.push({ label, passed: false, error: error.message });
  }
}
try {
  for (let i = 0; ; i++) {
    if (server.exitCode !== null) throw Error('Preview exited');
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    assert.ok(i < 100, 'Preview timeout');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await browser.newPage({
    viewport: { width: 780, height: 360 },
    hasTouch: true,
    locale: 'fr-CH',
  });
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(url);
  await p.locator('#home-classic').waitFor();
  for (const [destination, scroller] of [
    ['parents', '[data-home-page="parents"]'],
    ['classic', '[data-home-page="classic"]'],
    ['missions', '#mission-list'],
  ]) {
    await showHomePage(p, destination);
    const before = await p.locator(scroller).evaluate((e) => {
      e.scrollTop = e.scrollHeight;
      return e.scrollTop;
    });
    assert.ok(before > 0, `${destination} must really scroll`);
    await showHomePage(p, 'home');
    await showHomePage(p, destination);
    await check(`M2 ${destination} re-entry reveals the focused heading`, async () => {
      const evidence = await p.locator(scroller).evaluate((e) => {
        const target = document.activeElement,
          r = target.getBoundingClientRect(),
          clip = e.getBoundingClientRect();
        return {
          scrollTop: e.scrollTop,
          target: target.textContent,
          rect: r.toJSON(),
          clip: clip.toJSON(),
          visible: e.contains(target) && r.top >= clip.top && r.bottom <= clip.bottom,
        };
      });
      assert.ok(evidence.visible, JSON.stringify(evidence));
      assert.equal(evidence.scrollTop, 0);
      return evidence;
    });
  }
  await showHomePage(p, 'classic');
  await p.locator('#home-new').click();
  await p.locator('#app').waitFor({ state: 'visible' });
  await p.locator('#dock-catalogue').click();
  await p.locator('#shop-future').click();
  for (const id of ['catalog-tools', 'camp-tools']) await p.locator(`#${id} > summary`).click();
  const body = p.locator('#reinforcements .catalog-body');
  const gold = await p.locator('#gold').textContent();
  async function bottom() {
    const scrollTop = await body.evaluate((e) => {
      e.scrollTop = e.scrollHeight;
      return e.scrollTop;
    });
    assert.ok(scrollTop > 0, 'expanded tools must really scroll');
    await delay(150);
    assert.equal(
      await body.evaluate((e) => e.scrollTop),
      scrollTop,
      'ordinary refresh preserves tool scrolling',
    );
  }
  for (const [label, navigate] of [
    ['Next', () => p.locator('#catalog-next').click()],
    ['Previous', () => p.locator('#catalog-previous').click()],
    ['Family creatures', () => p.locator('#shop-family').selectOption('creatures')],
    ['Family all', () => p.locator('#shop-family').selectOption('all')],
    ['Ready', () => p.locator('#shop-ready').click()],
    ['Future', () => p.locator('#shop-future').click()],
  ]) {
    await bottom();
    await navigate();
    await check(`I1 ${label} reveals a resulting card inside body clip`, async () => {
      const evidence = await body.evaluate((e) => {
        const clip = e.getBoundingClientRect();
        const cards = [...e.querySelectorAll('.unit-card:not([hidden])')].map((card) => {
          const r = card.getBoundingClientRect(),
            x = (Math.max(r.left, clip.left) + Math.min(r.right, clip.right)) / 2,
            y = (Math.max(r.top, clip.top) + Math.min(r.bottom, clip.bottom)) / 2;
          return {
            kind: card.dataset.kind,
            rect: r.toJSON(),
            hit:
              r.bottom > clip.top &&
              r.top < clip.bottom &&
              card.contains(document.elementFromPoint(x, y)),
          };
        });
        return { scrollTop: e.scrollTop, clip: clip.toJSON(), cards };
      });
      assert.ok(
        evidence.cards.some((c) => c.hit),
        JSON.stringify(evidence),
      );
      assert.equal(evidence.scrollTop, 0);
      return evidence;
    });
    assert.equal(await p.locator('#gold').textContent(), gold, 'navigation never spends');
  }
  await p.screenshot({ path: `${folder}/catalogue-after-navigation.png` });
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  server.kill();
  await writeFile(`${folder}/report.json`, JSON.stringify({ results, errors }, null, 2) + '\n');
}
console.log(
  JSON.stringify({
    checks: results.length,
    failed: results.filter((r) => !r.passed).map((r) => r.label),
    errors,
  }),
);
assert.ok(
  results.every((r) => r.passed),
  'navigation regressions failed; see external report',
);
