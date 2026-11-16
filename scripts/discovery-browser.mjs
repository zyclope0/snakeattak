import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { DISCOVERY_PAGES } from '../deploy/discoveryCopy.ts';

const origin = 'http://127.0.0.1:4188';
const folder = 'artifacts/web-discovery';
await mkdir(folder, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4188',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
let browser;
try {
  const deadline = Date.now() + 15000;
  while (true) {
    if (server.exitCode !== null) throw Error('Preview exited');
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (Date.now() > deadline) throw Error('Preview timeout');
    await setTimeout(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [],
    outside = [],
    failed = [],
    results = [];
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 780, height: 360 },
    { width: 375, height: 812 },
  ]) {
    const context = await browser.newContext({
      viewport,
      javaScriptEnabled: false,
      hasTouch: viewport.width < 1000,
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('request', (r) => {
      if (new URL(r.url()).origin !== origin) outside.push(r.url());
    });
    page.on('response', (r) => {
      if (r.status() >= 400) failed.push({ url: r.url(), status: r.status() });
    });
    for (const item of DISCOVERY_PAGES) {
      const response = await page.goto(origin + item.path, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.locator('h1').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), item.lang);
      assert.equal(await page.locator('[data-support]').count(), 0);
      const width = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        width.scroll <= width.client + 1,
        `${item.path}: horizontal overflow at ${viewport.width}`,
      );
      for (const img of await page.locator('img').all()) {
        await img.scrollIntoViewIfNeeded();
        assert.ok(
          await img.evaluate((n) => n.complete && n.naturalWidth > 0),
          `image in ${item.path}`,
        );
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.keyboard.press('Tab');
      // A fresh document starts with a skip link; keyboard users reach content directly.
      await page.locator('.skip').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => location.hash), '#content');
      assert.ok((await context.cookies()).length === 0);
      results.push({ path: item.path, ...viewport });
      if (item.key === 'home' || item.key === 'parents')
        await page.screenshot({
          path: `${folder}/${item.lang}-${item.key}-${viewport.width}.png`,
          fullPage: true,
        });
    }
    await page.goto(origin + '/fr/personnages/');
    await page.locator('.language').click();
    assert.equal(new URL(page.url()).pathname, '/en/characters/');
    await page.locator('main .play').click();
    assert.equal(new URL(page.url()).pathname, '/');
    await context.close();
  }
  // Web discovery must not steal space from the compact game menus.
  for (const viewport of [
    { width: 780, height: 360 },
    { width: 1280, height: 800 },
  ]) {
    const context = await browser.newContext({ viewport, locale: 'fr-CH', hasTouch: true });
    const page = await context.newPage();
    await page.goto(origin);
    await page.locator('#home-screen:not([hidden])').waitFor({ timeout: 30000 });
    const footer = await page.locator('.home-footer').boundingBox();
    assert.ok(footer && footer.height <= 20, 'discovery keeps the game footer on one line');
    await page.locator('#home-parents').click();
    assert.ok(
      await page.locator('.home-footer nav').isHidden(),
      'discovery links are home-only and leave secondary footers alone',
    );
    const overflow = await page
      .locator('#home-parent-options')
      .evaluate((node) => node.scrollHeight - node.clientHeight);
    assert.ok(overflow <= 1, 'discovery adds no row to the compact parents screen');
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(outside, []);
  assert.deepEqual(failed, []);
  const report = {
    pagesAndSizes: results.length,
    javascriptRequired: false,
    errors,
    outside,
    failed,
    support: 'hidden',
  };
  await writeFile(`${folder}/browser-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  server.kill();
}
