import assert from 'node:assert/strict';
// Étape d'hygiène (21 novembre 2026) : outils communs des recettes de stabilisation.
// Le jeu est servi depuis un dossier du disque, réseau coupé, à l'origine de l'application
// Android (Capacitor : https://localhost) ; changer de dossier sans changer d'origine, c'est
// installer une mise à jour par-dessus les données du joueur.
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { registerHooks } from 'node:module';
import { chromium } from 'playwright-core';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp') || url.includes('.mp3'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});

export const ORIGIN = 'https://localhost';
export const BOARD = { width: 1100, height: 620 };
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
};

/** A browser on a game folder. `root.dir` may change between two loads: an update. */
export async function open({
  dir = 'dist-android',
  viewport = { width: 812, height: 375 },
  touch = true,
  locale = 'fr-CH',
  storage = null,
  launch = {},
} = {}) {
  const root = { dir: resolve(dir) };
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], ...launch });
  const context = await browser.newContext({
    locale,
    viewport,
    hasTouch: touch,
    offline: true,
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  });
  const report = { errors: [], missing: [], external: [] };
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) {
      report.external.push(url.origin);
      return route.abort();
    }
    if (url.pathname === '/__blank')
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html>' });
    const file = resolve(
      root.dir,
      '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname),
    );
    if (!file.startsWith(root.dir + sep)) return route.abort();
    try {
      await route.fulfill({
        status: 200,
        contentType: MIME[extname(file)] ?? 'application/octet-stream',
        body: await readFile(file),
      });
    } catch {
      report.missing.push(url.pathname);
      await route.abort();
    }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/net::ERR_|Failed to load resource/.test(m.text()))
      report.errors.push(m.text());
  });
  if (storage) await restore(page, storage);
  return { browser, context, page, report, root };
}

/** Everything the device holds for the game, as text: what survives a killed process. */
export const snapshot = (page) =>
  page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));

/** A device that holds exactly this, before the game starts. */
export async function restore(page, storage) {
  await page.goto(`${ORIGIN}/__blank`);
  await page.evaluate((entries) => {
    localStorage.clear();
    sessionStorage.clear();
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
  }, storage);
}

/** Opens the game and waits for the real home. `search` is `?perf=1` for the meter. */
export async function start(page, search = '') {
  await page.goto(`${ORIGIN}/${search}`);
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  // A device with several players asks who plays: the first one, unless told otherwise.
  if (await page.locator('#players-dialog[open]').count()) {
    await page.locator('#players-dialog [data-player] button').first().click();
    await page.locator('#players-dialog').waitFor({ state: 'hidden' });
    await page.locator('#home-primary').waitFor({ state: 'visible' });
  }
}

export const status = (page) => page.locator('#app').getAttribute('data-status');
export const boardReady = (page) =>
  page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
export const text = async (page, selector) =>
  ((await page.locator(selector).first().textContent()) ?? '').replace(/\s+/g, ' ').trim();

/** A tap on the board, in the coordinates of the game (1100 × 620). */
export async function tapBoard(page, x, y) {
  const box = await page.locator('#game canvas').boundingBox();
  const point = [box.x + (box.width * x) / BOARD.width, box.y + (box.height * y) / BOARD.height];
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) await page.touchscreen.tap(...point);
  else await page.mouse.click(...point);
}

/** Plays the waves that wait, with the page's clock in hand: same clock, same battle. */
export async function playOut(page, { waves = 12, onWave } = {}) {
  for (let wave = 0; wave < waves && (await status(page)) === 'preparing'; wave++) {
    if (onWave) await onWave(wave);
    await page.locator('#start').click();
    for (let step = 0; step < 400 && (await status(page)) === 'fighting'; step++)
      await page.clock.runFor(1000);
  }
  await page.clock.runFor(400);
  return status(page);
}

export const numbers = (page) =>
  page.evaluate(() => ({
    status: document.querySelector('#app')?.dataset.status,
    gold: document.querySelector('#gold')?.textContent,
    base: document.querySelector('#base')?.textContent,
    wave: document.querySelector('#wave')?.textContent,
    army: document.querySelector('#army-count')?.textContent,
  }));

/** Every button of `selector` is a fair target, and the block stays inside the screen. */
export async function fits(page, selector, label) {
  const view = page.viewportSize();
  const box = await page.locator(selector).boundingBox();
  assert.ok(box, `${label}: shown`);
  assert.ok(
    box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= view.width &&
      box.y + box.height <= view.height,
    `${label}: inside ${view.width}×${view.height} (${JSON.stringify(box)})`,
  );
  // What the child needs is there at once, without scrolling inside the window: the title,
  // the sentence, the button. Only what is folded for a parent may need a scroll.
  for (const part of await page
    .locator(`${selector} > h2, ${selector} > p, ${selector} > button`)
    .all()) {
    const at = await part.boundingBox();
    assert.ok(
      at && at.y >= box.y - 1 && at.y + at.height <= box.y + box.height + 1,
      `${label}: ${await part.evaluate((node) => node.tagName)} is in view (${JSON.stringify(at)} in ${JSON.stringify(box)})`,
    );
  }
  for (const button of await page.locator(`${selector} button, ${selector} summary`).all()) {
    // What is folded away is not a target yet: it is measured once unfolded.
    if (!(await button.isVisible())) continue;
    const size = await button.boundingBox();
    assert.ok(
      size.width >= 48 && size.height >= 48,
      `${label}: a target of ${size.width}×${size.height}`,
    );
  }
}
