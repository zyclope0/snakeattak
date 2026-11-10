import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { capriceById } from '../src/caprices.ts';
import { enterBattle } from '../tests/browser-entry.mjs';
import { navigationChecks } from './interface-0361-navigation.mjs';

// Extend this production-browser foundation for audit points 1/5 in Task 2.
// All bulky evidence stays ignored; each invocation has a separate run folder.
const folder =
  process.env.INTERFACE_REPORT_DIR ?? `artifacts/interface-0361/task1/run-${Date.now()}`;
const fixture = '.interface-0361-fixture.html';
const base = 'http://127.0.0.1:4391';
const fixtureBase = 'http://127.0.0.1:4392';
const results = [],
  errors = [],
  captures = [];
let browser, preview, dev;
async function check(name, action) {
  try {
    const value = await action();
    results.push({ name, ok: true, value });
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
  }
}
async function ready(url, server) {
  for (let i = 0; i < 150; i++) {
    if (server.exitCode !== null) throw Error('Server exited');
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await delay(100);
  }
  throw Error('Server unavailable: ' + url);
}
async function shot(page, name) {
  const path = `${folder}/${name}.png`;
  await page.screenshot({ path });
  captures.push(path);
}
async function pageAt(width, height, language) {
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: width < 1000,
    locale: language === 'fr' ? 'fr-CH' : 'en-GB',
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((language) => {
    localStorage.setItem('conquete-serpents:language:v1', language);
    window.canvasTexts = [];
    const fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      if (String(text).trim() && window.canvasTexts.length < 1500)
        window.canvasTexts.push({
          text: String(text),
          font: this.font,
          ready: document.fonts.check(this.font),
        });
      return fill.call(this, text, ...args);
    };
  }, language);
  return page;
}
async function terminalState(page) {
  return page.evaluate(() => {
    const g = window.interfaceFixture.session.game;
    return {
      status: g.status,
      paused: g.paused,
      time: g.time,
      wave: g.wave,
      gold: g.gold,
      rng: g.rng,
    };
  });
}
async function resultBounds(page, selector) {
  return page.locator(selector).evaluate((node) => {
    const box = node.getBoundingClientRect();
    const panelNode = document.querySelector('#battle-result');
    const panel = panelNode.getBoundingClientRect();
    const clip = {
      left: panel.left + panelNode.clientLeft,
      top: panel.top + panelNode.clientTop,
      right: panel.left + panelNode.clientLeft + panelNode.clientWidth,
      bottom: panel.top + panelNode.clientTop + panelNode.clientHeight,
    };
    const visible = {
      left: Math.max(box.left, clip.left, 0),
      top: Math.max(box.top, clip.top, 0),
      right: Math.min(box.right, clip.right, innerWidth),
      bottom: Math.min(box.bottom, clip.bottom, innerHeight),
    };
    return {
      box: box.toJSON(),
      panel: panel.toJSON(),
      clip,
      viewport: { width: innerWidth, height: innerHeight },
      intersection: {
        width: Math.max(0, visible.right - visible.left),
        height: Math.max(0, visible.bottom - visible.top),
      },
      scrollTop: document.querySelector('#battle-result').scrollTop,
      focused: document.activeElement?.id,
    };
  });
}
function assertUnclipped(bounds, label) {
  assert.ok(
    bounds.box.width > 0 &&
      bounds.box.height > 0 &&
      bounds.intersection.width >= bounds.box.width - 1 &&
      bounds.intersection.height >= bounds.box.height - 1,
    `${label} inside result panel and viewport: ${JSON.stringify(bounds)}`,
  );
}
try {
  await mkdir(folder, { recursive: true });
  const build = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' });
  await writeFile(`${folder}/build.log`, build.stdout + build.stderr);
  assert.equal(build.status, 0, 'production build');
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      '/src/main.ts',
      '/tests/interface-0361-harness.ts',
    ),
  );
  preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4391',
    '--strictPort',
  ]);
  await ready(base, preview);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  await navigationChecks({ browser, base, check, shot, errors });
  if (!process.env.INTERFACE_NAVIGATION_ONLY) {
    // Actual production bootstrap, cold browser contexts, local requests only.
    for (const [width, height] of [
      [1280, 800],
      [780, 360],
      [812, 375],
    ]) {
      for (const language of ['fr', 'en']) {
        const tag = `${language}-${width}x${height}`;
        const page = await pageAt(width, height, language);
        await page.route('**/*', (route) =>
          new URL(route.request().url()).origin === base ? route.continue() : route.abort(),
        );
        // Slow the local faces to make the first-text readiness assertion meaningful.
        await page.route('**/*.woff2', async (route) => {
          await delay(350);
          await route.continue();
        });
        await page.goto(base);
        await enterBattle(page);
        await page.waitForFunction(
          () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
        );
        await page.waitForFunction(() =>
          window.canvasTexts.some((t) => /REFUGE|REFUGE|SHELTER|CAMP/.test(t.text)),
        );
        await shot(page, `production-${tag}`);
        await check(`cold local fonts ${tag}`, async () => {
          const evidence = await page.evaluate(() => ({
            display: document.fonts.check('500 16px Fredoka'),
            body: document.fonts.check('400 16px "Nunito Sans"'),
            texts: window.canvasTexts,
          }));
          assert.ok(evidence.display && evidence.body, 'both local game faces loaded');
          assert.ok(evidence.texts.length > 0, 'real canvas text was rasterized');
          for (const t of evidence.texts) {
            assert.match(t.font, /Fredoka|Nunito Sans/, `game font for ${t.text}`);
            assert.equal(t.ready, true, `face ready at first rasterization: ${t.text}`);
          }
          return evidence;
        });
        await check(`Threats text and HUD geometry ${tag}`, async () => {
          const geometry = await page.locator('#wave-threats').evaluate((button) => {
            const range = document.createRange();
            range.selectNodeContents(button);
            const text = range.getBoundingClientRect(),
              box = button.getBoundingClientRect();
            return {
              text: text.toJSON(),
              button: box.toJSON(),
              offset: (text.top + text.bottom - box.top - box.bottom) / 2,
              hud: document.querySelector('.dashboard').getBoundingClientRect().toJSON(),
              board: document.querySelector('#game canvas').getBoundingClientRect().toJSON(),
            };
          });
          assert.ok(Math.abs(geometry.offset) < 3, `actual text centered: ${geometry.offset}px`);
          if (width === 812) {
            assert.ok(geometry.hud.height <= 48, 'existing 48px HUD row retained');
            assert.ok(geometry.board.height >= height * 0.85, 'board keeps 85% viewport height');
          }
          return geometry;
        });
        await check(`normal pause preparation and fight ${tag}`, async () => {
          await page.locator('#pause').click();
          assert.equal(await page.locator('#pause-overlay').isVisible(), true);
          await page.locator('#resume-game').click();
          assert.equal(await page.locator('#pause-overlay').isVisible(), false);
          await page.locator('#start').click();
          await page.locator('#game').focus();
          await page.keyboard.press('Space');
          assert.equal(await page.locator('#pause-overlay').isVisible(), true);
          await page.locator('#resume-game').click();
          assert.equal(await page.locator('#pause-overlay').isVisible(), false);
          return 'button and resume in preparation; Space and resume in fight';
        });
        await page.close();
      }
    }
    // Production pages close before the labelled terminal fixture browser starts.
    await browser.close();
    browser = undefined;
    preview.kill();
    preview = undefined;
    dev = spawn(process.execPath, [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      '4392',
      '--strictPort',
    ]);
    await ready(fixtureBase, dev);
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    for (const [width, height] of [
      [1280, 800],
      [780, 360],
      [812, 375],
    ]) {
      for (const language of ['fr', 'en']) {
        for (const mode of ['won', 'lost', 'won-caprice', 'lost-caprice', 'won-classic']) {
          const status = mode.startsWith('won') ? 'won' : 'lost';
          const tag = `${mode}-${language}-${width}x${height}`;
          const page = await pageAt(width, height, language);
          await page.goto(
            `${fixtureBase}/${fixture}?status=${status}${mode.includes('caprice') ? '&caprice=1' : ''}${mode.includes('classic') ? '&classic=1' : ''}`,
          );
          await page.waitForFunction(
            () => window.interfaceFixture?.phaser.scene.keys.Battle?.initialized,
          );
          await page.waitForFunction(() => !document.querySelector('#battle-result').hidden);
          // Observe the initial auto-focus/scroll after layout, before any test
          // scrolls an action into view. isVisible() alone misses clipped content.
          await page.evaluate(
            () =>
              new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
          );
          await shot(page, `fixture-${tag}`);
          await check(`initial result heading and stars unclipped ${tag}`, async () => {
            const heading = await resultBounds(page, '#battle-result-title');
            assertUnclipped(heading, 'sole result heading');
            const stars =
              status === 'won' ? await resultBounds(page, '#battle-result-stars') : null;
            if (stars) assertUnclipped(stars, 'earned stars');
            return { heading, stars };
          });
          if (width < 1000 && mode === 'won-caprice') {
            await check(`native keyboard reaches caprice actions ${tag}`, async () => {
              const reached = [];
              const expected = ['result-caprice-album', 'mission-again', 'mission-back-map'];
              for (let i = 0; i < 8 && reached.length < expected.length; i++) {
                await page.keyboard.press('Tab');
                const id = await page.evaluate(() => document.activeElement?.id);
                if (expected.includes(id) && !reached.includes(id)) {
                  assertUnclipped(await resultBounds(page, '#' + id), 'keyboard action ' + id);
                  reached.push(id);
                }
              }
              assert.deepEqual(reached, expected, 'native Tab reaches album, Retry and map');
              await shot(page, `fixture-keyboard-${tag}`);
              return reached;
            });
          }
          await check(`single accessible result heading ${tag}`, async () => {
            const headings = await page.evaluate(() => {
              const scene = window.interfaceFixture.phaser.scene.keys.Battle;
              const canvas = [],
                families = [];
              function walk(node, shown = true) {
                shown = shown && node.visible !== false;
                if (node.type === 'Text') families.push(node.style.fontFamily);
                if (
                  shown &&
                  node.type === 'Text' &&
                  (Number.parseFloat(node.style.fontSize) >= 50 ||
                    /Bravo|Well done|Victoire|Victory|Caprice réussi|Challenge complete|On réessaie|Try again/.test(
                      node.text,
                    ))
                )
                  canvas.push(node.text);
                if (node.list) node.list.forEach((n) => walk(n, shown));
              }
              scene.children.list.forEach((n) => walk(n));
              return {
                canvas,
                families: [...new Set(families)],
                html: document.querySelector('#battle-result-title').textContent,
              };
            });
            assert.equal(
              await page.locator('#battle-result-title').isVisible(),
              true,
              'accessible HTML result retained',
            );
            assert.equal(headings.canvas.length, 0, 'HTML owns the only terminal heading');
            assert.ok(headings.html.length > 0);
            assert.ok(
              headings.families.every((family) => ['Fredoka', 'Nunito Sans'].includes(family)),
              'every live and cached Phaser text uses game faces',
            );
            const duplicate = page.locator('#mission-result');
            assert.equal(
              (await duplicate.isVisible()) && (await duplicate.textContent()) === headings.html,
              false,
              'no repeated HTML congratulations',
            );
            if (mode.includes('caprice')) {
              if (status === 'lost')
                assert.equal(
                  await duplicate.textContent(),
                  capriceById('refuge-createur-petit').announce,
                  'original French announcement in both languages',
                );
              else {
                const sticker = page.locator('#caprice-sticker-result');
                assert.equal(await sticker.isVisible(), true, 'sticker result retained');
                const stickerSize = await sticker.locator('svg').boundingBox();
                assert.equal(stickerSize.width, 58, 'production caprice CSS constrains sticker');
                assert.equal(stickerSize.height, 58);
                assert.equal(
                  await page.locator('#result-caprice-album').isVisible(),
                  true,
                  'album navigation retained',
                );
              }
            }
            if (status === 'won')
              assert.equal(await page.locator('#battle-result-stars').isVisible(), true);
            const retry = page.locator(
              mode.includes('classic') ? '#end-restart' : '#mission-again',
            );
            assert.equal(await retry.isVisible(), true, 'retry available');
            await retry.scrollIntoViewIfNeeded();
            await retry.focus();
            assertUnclipped(
              await resultBounds(
                page,
                mode.includes('classic') ? '#end-restart' : '#mission-again',
              ),
              'focused Retry',
            );
            return headings;
          });
          await check(`terminal pause hidden and inert ${tag}`, async () => {
            const before = await terminalState(page);
            const visible = await page.locator('#pause').isVisible();
            await page.locator('#game').focus();
            await page.keyboard.press('Space');
            const afterSpace = await terminalState(page);
            // Exercise even stale/programmatic handlers, not only disabled click suppression.
            await page.locator('#pause').evaluate((button) => {
              button.click();
              button.dispatchEvent(new MouseEvent('click'));
            });
            const afterButtons = await terminalState(page);
            await page.evaluate(() => {
              window.interfaceFixture.session.game.paused = true;
              window.interfaceFixture.refresh();
            });
            const held = await terminalState(page);
            await page
              .locator('#resume-game')
              .evaluate((button) => button.dispatchEvent(new MouseEvent('click')));
            const afterResume = await terminalState(page);
            assert.equal(visible, false, 'pause hidden after terminal result');
            assert.deepEqual(afterSpace, before, 'Space cannot mutate terminal state/clock');
            assert.deepEqual(
              afterButtons,
              before,
              'button handlers cannot mutate terminal state/clock',
            );
            assert.deepEqual(afterResume, held, 'stale resume cannot release terminal pause');
            return { before, afterSpace, afterButtons, held, afterResume };
          });
          await page.close();
        }
      }
    }
    await browser.close();
    browser = undefined;
    dev.kill();
    dev = undefined;
    const portable = spawnSync('npm', ['run', 'build:portable'], { encoding: 'utf8' });
    await writeFile(`${folder}/portable-build.log`, portable.stdout + portable.stderr);
    assert.equal(portable.status, 0, 'portable build');
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    for (const language of ['fr', 'en']) {
      for (const mode of ['bundled-offline', 'portable-file']) {
        const page = await pageAt(812, 375, language);
        await page.context().setOffline(true);
        const external = [];
        const offlineOrigin = 'http://serpents-interface.test';
        const root = resolve('dist');
        const mime = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.webp': 'image/webp',
          '.png': 'image/png',
          '.woff2': 'font/woff2',
        };
        if (mode === 'bundled-offline')
          await page.route('**/*', async (route) => {
            const url = new URL(route.request().url());
            if (url.origin !== offlineOrigin) {
              external.push(url.href);
              return route.abort();
            }
            const path = resolve(
              root,
              '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname),
            );
            if (!path.startsWith(root + sep)) return route.abort();
            await route.fulfill({
              status: 200,
              contentType: mime[extname(path)] ?? 'application/octet-stream',
              body: await readFile(path),
            });
          });
        else
          page.on('request', (req) => {
            if (/^https?:/.test(req.url())) external.push(req.url());
          });
        await page.goto(
          mode === 'bundled-offline'
            ? offlineOrigin
            : pathToFileURL(resolve('dist-portable/index.html')).href,
        );
        await enterBattle(page);
        await page.waitForFunction(
          () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
        );
        await shot(page, `${mode}-${language}-812x375`);
        await check(`local fonts ${mode} ${language}`, async () => {
          assert.equal(await page.evaluate(() => navigator.onLine), false);
          assert.deepEqual(external, []);
          const evidence = await page.evaluate(() => ({
            display: document.fonts.check('500 16px Fredoka'),
            body: document.fonts.check('400 16px "Nunito Sans"'),
            texts: window.canvasTexts,
          }));
          assert.ok(evidence.display && evidence.body);
          assert.ok(evidence.texts.some((t) => /REFUGE|SHELTER/.test(t.text)));
          for (const text of evidence.texts) {
            assert.match(text.font, /Fredoka|Nunito Sans/);
            assert.equal(text.ready, true);
          }
          return evidence;
        });
        await page.close();
      }
    }
  }
  await check('no browser errors', () => assert.deepEqual(errors, []));
} finally {
  await browser?.close();
  preview?.kill();
  dev?.kill();
  await rm(fixture, { force: true });
  await writeFile(
    `${folder}/report.json`,
    JSON.stringify(
      {
        scope:
          'Production bootstrap with explicitly controlled valid family progress for navigation, plus labelled terminal fixtures; Chromium emulation, no physical S24 claim',
        results,
        errors,
        captures,
      },
      null,
      2,
    ),
  );
}
console.log(
  JSON.stringify(
    { folder, passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok) },
    null,
    2,
  ),
);
if (results.some((r) => !r.ok)) process.exitCode = 1;
