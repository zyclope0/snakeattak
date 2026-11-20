import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { DISCOVERY_PAGES, SITE_FEATURES } from '../deploy/discoveryCopy.ts';
import { SUPPORT_URL } from '../deploy/discovery.ts';

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
    // The two tightest phones: a small one upright, a small one on its side.
    { width: 360, height: 640 },
    { width: 667, height: 375 },
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
      const support = page.locator('[data-support]');
      // The payment link is on the parents page alone; the other footers lead to its block.
      assert.equal(await support.count(), item.key === 'parents' ? 1 : 0);
      const way = page.locator('.site-footer a', {
        hasText: item.lang === 'fr' ? 'Soutenir le développement' : 'Support development',
      });
      if (item.key === 'parents') assert.equal(await way.count(), 0);
      else
        assert.equal(
          await way.getAttribute('href'),
          item.lang === 'fr' ? '/fr/parents/#soutien' : '/en/parents/#support',
        );
      for (const link of await support.all()) {
        assert.equal(await link.getAttribute('href'), SUPPORT_URL);
        assert.equal(await link.getAttribute('target'), '_blank');
        assert.equal(await link.getAttribute('rel'), 'noopener noreferrer nofollow');
        assert.equal(
          await link.innerText(),
          item.lang === 'fr'
            ? 'Soutenir sur PayPal (nouvel onglet)'
            : 'Support the game on PayPal (new tab)',
        );
      }
      const width = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        width.scroll <= width.client + 1,
        `${item.path}: horizontal overflow at ${viewport.width}`,
      );
      // The way to the game is on the first screen, and a finger finds every link.
      const reach = await page.evaluate(() => {
        const box = (n) => n.getBoundingClientRect();
        const shown = (n) => box(n).width > 0 && box(n).height > 0;
        const links = [...document.querySelectorAll('a:not(.skip)')].filter(shown);
        return {
          play: links.some((n) => n.classList.contains('play') && box(n).bottom <= innerHeight),
          small: links
            .filter((n) => box(n).height < 48 || box(n).width < 48)
            .map(
              (n) =>
                `${n.textContent.trim()} ${Math.round(box(n).width)}×${Math.round(box(n).height)}`,
            ),
        };
      });
      const where = `${item.path} at ${viewport.width}×${viewport.height}`;
      assert.ok(reach.play, `${where}: the button to play is on the first screen`);
      assert.deepEqual(reach.small, [], `${where}: every link is at least 48 px each way`);
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
    // Verify the action with a local interception: no real PayPal request or payment.
    await context.route(SUPPORT_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Payment destination intercepted</title><p>Local verification only</p>',
      }),
    );
    for (const path of ['/fr/parents/', '/en/parents/']) {
      await page.goto(origin + path, { waitUntil: 'networkidle' });
      let reached = false;
      for (let step = 0; step < 50; step++) {
        await page.keyboard.press('Tab');
        reached = await page
          .locator('.support-note [data-support]')
          .evaluate((link) => document.activeElement === link);
        if (reached) break;
      }
      assert.ok(reached, `${path}: support is naturally reachable with the keyboard`);
      const popupPromise = context.waitForEvent('page');
      await page.keyboard.press('Enter');
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      assert.equal(popup.url(), SUPPORT_URL);
      assert.equal(await popup.title(), 'Payment destination intercepted');
      assert.equal(await popup.evaluate(() => window.opener === null), true);
      await popup.close();
    }
    await page.goto(origin + '/confidentialite/', { waitUntil: 'networkidle' });
    // The parents page sends here: the links of its header are as tall as the others.
    for (const link of await page.locator('header nav a').all())
      assert.ok(
        (await link.boundingBox()).height >= 48,
        `policy header link « ${await link.innerText()} » is at least 48 px high`,
      );
    for (const heading of [
      'Soutien facultatif sur le site Web',
      'Optional support on the website',
    ]) {
      await page.getByRole('heading', { name: heading, exact: true }).scrollIntoViewIfNeeded();
      assert.ok(await page.getByRole('heading', { name: heading, exact: true }).isVisible());
    }
    assert.ok((await context.cookies()).length === 0);
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
    assert.equal(await page.locator('.home-footer a').count(), 0, 'no link in the footer');
    // The title stays the name of the game in the player's language.
    assert.equal(await page.title(), 'La Conquête des Serpents');
    await page.locator('#home-parents').click();
    // One link to the public pages, in the language of the game, as tall as a button and
    // on the row of the family save: the screen gains no row.
    const about = page.locator('.parent-actions .about[href="/fr/"]:visible');
    assert.equal(await about.count(), 1);
    // While the Android test is open, its page has a link in the free cell of the same row
    // (20 November 2026).
    const test = page.locator('.parent-actions .about:visible:not([href="/fr/"])');
    const tested = SITE_FEATURES.androidTest ? 1 : 0;
    assert.equal(await test.count(), tested);
    if (tested) {
      assert.equal(await test.getAttribute('href'), '/fr/tester-android/');
      const box = await test.boundingBox();
      assert.ok(box.height >= 48 && box.width >= 96, `test link ${box.width}×${box.height}`);
      const family = await page.locator('#home-family').boundingBox();
      assert.ok(Math.abs(box.y - family.y) <= 1, 'the test link shares the row of the family save');
    }
    assert.equal(await about.getAttribute('href'), '/fr/');
    assert.equal(await about.innerText(), 'À propos du jeu');
    const hit = await about.boundingBox();
    const family = await page.locator('#home-family').boundingBox();
    assert.ok(hit.width >= 96 && hit.height >= 48, `about link ${hit.width}×${hit.height}`);
    assert.ok(Math.abs(hit.y - family.y) <= 1, 'the about link shares the row of the family save');
    assert.ok(hit.x + hit.width <= viewport.width);
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
    support: 'active on static pages only; six keyboard actions locally intercepted, no payment',
  };
  await writeFile(`${folder}/browser-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  server.kill();
}
