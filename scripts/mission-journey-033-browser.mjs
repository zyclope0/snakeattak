import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { MISSIONS, createMissionRun } from '../src/missions.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';

const baseline = process.argv.includes('--baseline');
const artifact = 'artifacts/mission-journey-0331';
const base = 'http://127.0.0.1:4375';
let server, browser;
const results = [],
  errors = [];
function profile(name) {
  const state = createMissionProgress();
  if (name === 'middle') {
    state.bestStars.refuge = 3;
    state.bestStars['trois-ponts'] = 1;
  }
  if (name === 'complete') for (const { id } of MISSIONS) state.bestStars[id] = 2;
  if (name === 'irregular') state.bestStars.course = 2;
  const run = createMissionRun('refuge', 33);
  const camp = encodeCheckpoint(new Game(33, undefined, run));
  state.lastRuns.refuge = run;
  state.retryCamp = camp;
  state.activeMode = 'missions';
  if (name === 'complete') state.lastRuns.carrefour = createMissionRun('carrefour', 42);
  return writeFamilyBackup(camp, createCareer().state, state);
}
async function snap(page, name) {
  await page.screenshot({ path: `${artifact}/${baseline ? 'before' : 'after'}-${name}.png` });
}
try {
  await mkdir(artifact, { recursive: true });
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4375',
    '--strictPort',
  ]);
  for (let n = 0; ; n++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    if (n > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height, touch] of [
    [1280, 800, false],
    [1366, 768, false],
    [780, 360, true],
    [375, 812, true],
    [812, 375, true],
    [700, 800, false],
    [400, 800, false],
  ]) {
    for (const name of ['empty', 'middle', 'complete', 'irregular']) {
      if (['irregular'].includes(name) && width !== 1280) continue;
      if ([812, 700, 400].includes(width) && name !== 'empty') continue;
      const page = await browser.newPage({
        viewport: { width, height },
        hasTouch: touch,
        isMobile: touch,
      });
      page.on('pageerror', (e) => errors.push(e.message));
      const raw = name === 'empty' ? null : profile(name);
      await page.addInitScript((raw) => {
        if (raw) localStorage.setItem('conquete-serpents:family:v1', raw);
      }, raw);
      await page.goto(base);
      await page.locator('#home-play').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const images = await page.evaluate(() =>
        performance
          .getEntriesByType('resource')
          .filter((e) => /\.(webp|png|svg)(\?|$)/.test(e.name))
          .map((e) => ({
            name: new URL(e.name).pathname,
            bytes: e.encodedBodySize,
            transferred: e.transferSize,
          })),
      );
      await snap(page, `${width}x${height}-${name}-home`);
      if (width === 375) {
        assert.equal(await page.locator('#orientation-notice').isVisible(), true);
        await page.setViewportSize({ width: 812, height: 375 });
      }
      const play = await page.locator('#home-play').boundingBox();
      assert.ok(
        play.y >= 0 && play.y + play.height <= (width === 375 ? 375 : height),
        'Play fits first screen',
      );
      if (raw) {
        const resume = await page.locator('#mission-continue').boundingBox();
        assert.ok(
          resume && resume.y + resume.height <= (width === 375 ? 375 : height),
          'Resume fits first screen',
        );
      }
      if (!baseline) {
        const icon = page.locator('.home-icon');
        assert.equal(await icon.isVisible(), true);
        const attrs = await icon.evaluate((img) => ({
          complete: img.complete,
          width: img.naturalWidth,
          fit: getComputedStyle(img).objectFit,
          clip: getComputedStyle(img).clipPath,
          src: img.src,
        }));
        assert.deepEqual(
          { complete: attrs.complete, width: attrs.width, fit: attrs.fit, clip: attrs.clip },
          { complete: true, width: 512, fit: 'contain', clip: 'none' },
        );
        assert.equal(
          createHash('sha256')
            .update(Buffer.from(await (await page.request.get(attrs.src)).body()))
            .digest('hex'),
          createHash('sha256')
            .update(await readFile('resources/android-icon/icon-512.png'))
            .digest('hex'),
        );
        assert.equal(
          images.some((i) => /ground-|icone-source|2048/.test(i.name)),
          false,
          'No ground or HD original loaded on home',
        );
      }
      await page.locator('#home-expeditions').click();
      const cards = page.locator('[data-mission-card]');
      assert.equal(await cards.count(), 6);
      if (!baseline) {
        const expected =
          name === 'empty'
            ? ['next', 'locked', 'locked', 'locked', 'locked', 'locked']
            : name === 'middle'
              ? ['complete', 'complete', 'next', 'locked', 'locked', 'locked']
              : name === 'complete'
                ? Array(6).fill('complete')
                : ['next', 'locked', 'locked', 'available', 'locked', 'locked'];
        assert.deepEqual(
          await cards.evaluateAll((nodes) => nodes.map((n) => n.dataset.journeyStatus)),
          expected,
        );
        assert.equal(
          await page.locator('[aria-current="step"]').count(),
          name === 'complete' ? 0 : 1,
        );
        const badges = page.locator('.mission-status-badge');
        assert.equal(await badges.count(), 6, 'Each mission repeats its status beside the emblem');
        if (width === 780 || width === 812 || width === 375) {
          const visible = await badges.evaluateAll((nodes) =>
            nodes.slice(0, 3).map((node) => {
              const box = node.getBoundingClientRect();
              const paths = [...node.querySelectorAll('path')].filter(
                (path) => getComputedStyle(path).display !== 'none',
              );
              return (
                box.top >= 0 &&
                box.bottom <= innerHeight &&
                box.width >= 40 &&
                box.height >= 40 &&
                paths.length === 1
              );
            }),
          );
          assert.deepEqual(
            visible,
            [true, true, true],
            'First-row status glyphs fit above the fold',
          );
        }
        const dims = await cards.evaluateAll((nodes) =>
          nodes.map((n) => ({
            x: n.getBoundingClientRect().x,
            right: n.getBoundingClientRect().right,
            width: n.getBoundingClientRect().width,
          })),
        );
        assert.ok(
          dims.every((d) => d.x >= 0 && d.right <= (width === 375 ? 812 : width) && d.width > 100),
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
        );
        const columns = await page
          .locator('#mission-cards')
          .evaluate((n) => getComputedStyle(n).gridTemplateColumns.split(' ').length);
        assert.equal(columns, width === 700 ? 2 : width === 400 ? 1 : 3);
        const saved = await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem('conquete-serpents:family:v1'))?.missions?.bestStars,
        );
        if (raw) assert.deepEqual(saved, JSON.parse(raw).missions.bestStars);
      }
      await snap(page, `${width === 375 ? '812x375-rotated' : `${width}x${height}`}-${name}-map`);
      await page.locator('.expedition-map').screenshot({
        path: `${artifact}/${baseline ? 'before' : 'after'}-${width}x${height}-${name}-map-full.png`,
      });
      if (!baseline && width === 1280) {
        assert.equal(await page.locator('.mission-stars[role=img]').count(), 6);
        assert.equal(
          await cards.first().evaluate((node) => {
            window.journeyCard = node;
            return true;
          }),
          true,
        );
        await page.waitForTimeout(100);
        assert.equal(
          await cards.first().evaluate((node) => node === window.journeyCard),
          true,
          'Refresh keeps button identity',
        );
        const first = cards.first();
        await first.focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#mission-dialog').isVisible(), true);
        assert.equal(await page.locator('#mission-title').textContent(), 'Le refuge');
        await page.locator('#mission-close').click();
        if (name === 'irregular') assert.equal(await cards.nth(2).isDisabled(), true);
        if (name === 'complete') {
          assert.equal(await page.locator('#home-play').textContent(), 'Rejouer');
          assert.ok(
            (await page.locator('#home-next-mission').textContent()).includes(MISSIONS.at(-1).name),
            'Replay hint names the mission actually opened',
          );
          await page.locator('#home-play').click();
          assert.equal(await page.locator('#mission-title').textContent(), MISSIONS.at(-1).name);
          const run = JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run'));
          assert.notEqual(run.layout, JSON.parse(raw).missions.lastRuns.carrefour.layout);
          await page.locator('#mission-close').click();
        }
      }
      if (!baseline && touch) {
        await cards.first().tap();
        assert.equal(await page.locator('#mission-dialog').isVisible(), true);
        await page.locator('#mission-close').tap();
      }
      results.push({
        width,
        height,
        touch,
        profile: name,
        version: await page.locator('[data-app-version]').first().textContent(),
        images,
        play,
      });
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  server?.kill();
  await writeFile(
    `${artifact}/${baseline ? 'before' : 'after'}.json`,
    JSON.stringify(
      { source: 'Chromium emulation, not physical Android', results, errors },
      null,
      2,
    ) + '\n',
  );
}
console.log(JSON.stringify({ cases: results.length, errors }));
