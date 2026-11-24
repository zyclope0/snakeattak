// The ad box of the website, in a build made for this recipe only (`npm run build:ads-test`):
// advertising is switched on and asks a stand-in script that this recipe answers itself.
// No request leaves the machine, and nothing here ever talks to Google.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { enterBattle, leaveBattle, showHomePage, chooseLanguage } from '../tests/browser-entry.mjs';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { ADS_OFF_KEY, CAMP_STORAGE_KEY } from '../src/storageKeys.ts';
import { PREPARED_DISPLAY_ATTRIBUTES } from '../src/ui/webAds/contract.ts';
import { rectGap } from '../src/ui/webAds/layout.ts';

const root = 'dist-ads-test';
const origin = 'http://127.0.0.1:4196';
const folder = 'artifacts/web-ads-delivery';
await mkdir(folder, { recursive: true });
const camp = encodeCheckpoint(new Game(73));
assert.ok(camp);
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4196',
    '--strictPort',
    '--outDir',
    root,
  ],
  { stdio: 'pipe' },
);
// What Google's script would do, reduced to what the page can be asked about afterwards.
const STAND_IN = `window.__ads = { loads: (window.__ads ? window.__ads.loads : 0) + 1, asked: (window.adsbygoogle || []).length };`;
const checks = [],
  errors = [],
  outside = [];
const check = (name, ok, detail = '') => {
  assert.ok(ok, `${name}${detail ? ` — ${detail}` : ''}`);
  checks.push(name);
};
let browser;
/** A browser window of this size, with the saved camp, and the count of stand-in requests. */
async function visit(viewport, touch = false) {
  const context = await browser.newContext({ viewport, locale: 'fr-CH', hasTouch: touch });
  const scripts = [];
  await context.addInitScript(
    ([key, raw]) => localStorage.getItem(key) ?? localStorage.setItem(key, raw),
    [CAMP_STORAGE_KEY, camp],
  );
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      outside.push(url.href);
      return route.abort();
    }
    if (url.pathname === '/fake-ads.js') {
      scripts.push(url.href);
      return route.fulfill({ contentType: 'text/javascript', body: STAND_IN });
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  return { context, page, scripts };
}
const box = (page, selector) =>
  page.locator(selector).evaluate((node) => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  // 1. A large screen with a mouse: one box, asked once, clear of the game.
  {
    const { context, page, scripts } = await visit({ width: 1920, height: 1080 });
    await page.locator('#home-screen:not([hidden])').waitFor();
    await delay(1500);
    check('no ad box and no request on the home screen', scripts.length === 0);
    check('nothing in the page before a game', (await page.locator('#web-ad').count()) === 0);
    await enterBattle(page);
    await page.locator('#web-ad').waitFor({ state: 'visible', timeout: 8000 });
    await page.waitForFunction(() => window.__ads?.loads === 1);
    check('one request for the ad script', scripts.length === 1, String(scripts.length));
    check('one ad asked', (await page.evaluate(() => window.__ads.asked)) === 1);
    const unit = page.locator('#web-ad ins.adsbygoogle');
    for (const [name, value] of Object.entries(PREPARED_DISPLAY_ATTRIBUTES))
      check(`the unit carries ${name}`, (await unit.getAttribute(name)) === value);
    check(
      'the child treatment is asked',
      (await unit.getAttribute('data-tag-for-age-treatment')) === '1',
    );
    check(
      'the box says what it is, large enough to read',
      (await page.locator('.web-ad-label').innerText()) === 'Publicité' &&
        (await page
          .locator('.web-ad-label')
          .evaluate((n) => parseFloat(getComputedStyle(n).fontSize))) >= 14,
    );
    const creative = await box(page, '#web-ad ins');
    for (const part of ['#game', '.battle-dock', '.dashboard']) {
      const gap = rectGap(creative, await box(page, part));
      check(`at least 150 px between the ad and ${part}`, gap >= 149.5, `${Math.round(gap)} px`);
    }
    const frame = await box(page, '#web-ad');
    check(
      'the box is inside the window',
      frame.x >= 0 &&
        frame.y >= 0 &&
        frame.x + frame.width <= 1920 &&
        frame.y + frame.height <= 1080,
    );
    await page.screenshot({ path: `${folder}/fr-1920x1080.png` });
    // Once placed, the box neither hides nor moves nor asks again: a pause, then the home.
    const placed = JSON.stringify(frame);
    await page.keyboard.press('Escape');
    await delay(1500);
    check('a pause does not hide the box', await page.locator('#web-ad').isVisible());
    await page.keyboard.press('Escape');
    await leaveBattle(page);
    await delay(1500);
    check('still one request after a pause and the way home', scripts.length === 1);
    check('the box has not moved', JSON.stringify(await box(page, '#web-ad')) === placed);
    // The box stays on the home, whose first screen fills the window: nothing a child can
    // touch there may come under it or near it, by the distance kept from the game.
    await page.locator('#home-screen[data-page="home"]:not([hidden])').waitFor();
    const touched = await page.locator('#home-screen').evaluate((home) =>
      [...home.querySelectorAll('button, a[href], select, input, summary')]
        .filter((node) => node.checkVisibility({ checkVisibilityCSS: true }))
        .map((node) => {
          const r = node.getBoundingClientRect();
          return { id: node.id, x: r.x, y: r.y, width: r.width, height: r.height };
        })
        .filter((rect) => rect.width > 0 && rect.height > 0),
    );
    check('the home shows its buttons beside the box', touched.length >= 8, `${touched.length}`);
    const nearest = touched
      .map((rect) => ({ id: rect.id, gap: rectGap(creative, rect) }))
      .sort((a, b) => a.gap - b.gap)[0];
    check(
      'at least 150 px between the ad and every button of the home',
      nearest.gap >= 149.5,
      `#${nearest.id} at ${Math.round(nearest.gap)} px`,
    );
    check(
      'the home does not scroll beside the box',
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    );

    // 2. A parent switches advertising off: a fresh page, and nothing is asked any more.
    await showHomePage(page, 'parents');
    const door = page.locator('#home-ads');
    await door.waitFor({ state: 'visible' });
    check(
      'the switch says advertising is shown',
      (await door.innerText()) === 'Publicité : affichée',
    );
    check('the switch is pressed', (await door.getAttribute('aria-pressed')) === 'true');
    const size = await door.boundingBox();
    check('the switch is large enough for a finger', size.height >= 48 && size.width >= 48);
    // The switch takes a row of its own: the family save keeps its "?" and, on the website,
    // the link to the public pages beside it.
    const rows = await page.evaluate(() => {
      const top = (selector) =>
        Math.round(document.querySelector(selector)?.getBoundingClientRect().top ?? -1);
      return {
        family: top('#home-family'),
        help: top('.parent-actions .help-point'),
        about: top('.parent-actions .about:not([hidden])'),
      };
    });
    check('the "?" stays beside the family save', Math.abs(rows.help - rows.family) <= 1);
    check('the switch sits below the family save', size.y > rows.family + 40);
    await Promise.all([page.waitForEvent('load'), door.click()]);
    await page.locator('#home-screen:not([hidden])').waitFor();
    check(
      'the choice is kept on the device',
      (await page.evaluate((key) => localStorage.getItem(key), ADS_OFF_KEY)) === '1',
    );
    const before = scripts.length;
    await enterBattle(page);
    await delay(3000);
    check('switched off: no ad box', (await page.locator('#web-ad').count()) === 0);
    check('switched off: no request for the ad script', scripts.length === before);
    check(
      'switched off: the stand-in never ran',
      (await page.evaluate(() => window.__ads)) === undefined,
    );
    await leaveBattle(page);
    await showHomePage(page, 'parents');
    check('the switch says advertising is off', (await door.innerText()) === 'Publicité : coupée');
    check('the switch is released', (await door.getAttribute('aria-pressed')) === 'false');
    // 3. Switched on again, in English: the box comes back with the next game.
    await door.click();
    check(
      'switched on again',
      (await page.evaluate((key) => localStorage.getItem(key), ADS_OFF_KEY)) === null,
    );
    await showHomePage(page, 'home');
    await chooseLanguage(page, 'en');
    await enterBattle(page);
    await page.locator('#web-ad').waitFor({ state: 'visible', timeout: 8000 });
    check(
      'the box is named in English',
      (await page.locator('.web-ad-label').innerText()) === 'Advertisement',
    );
    await page.screenshot({ path: `${folder}/en-1920x1080.png` });
    await context.close();
  }

  // 4. No room, no ad: an ordinary computer screen, then a phone held sideways.
  for (const [viewport, touch, name] of [
    [{ width: 1280, height: 800 }, false, 'computer 1280×800'],
    [{ width: 812, height: 375 }, true, 'phone 812×375'],
  ]) {
    const { context, page, scripts } = await visit(viewport, touch);
    await enterBattle(page);
    await delay(3000);
    check(`${name}: no ad box`, (await page.locator('#web-ad').count()) === 0);
    check(`${name}: no request for the ad script`, scripts.length === 0);
    await leaveBattle(page);
    await showHomePage(page, 'parents');
    check(`${name}: no switch where no ad can show`, await page.locator('#home-ads').isHidden());
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(outside, [], 'no request left the machine');
  const report = { checks, errors, outside };
  await writeFile(`${folder}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: checks.length, errors, outside }));
} finally {
  await browser?.close();
  server.kill();
}
