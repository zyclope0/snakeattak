import { showHomePage } from '../tests/browser-entry.mjs';
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
/**
 * The most a fresh load of the home may download in images, in bytes: every image response
 * added up, whatever asks for it (style sheet or page). Measured on 24 November 2026 with the
 * first screen « la clairière »: 497 434 at every size and for every profile of this recipe.
 * Of these, 340 608 are the ten images of the clearing, 131 486 the twenty stickers of the
 * caprice book (asked for as the game starts) and 25 340 four small pictures (two objects of
 * the menu, the player's portrait, the parents' pictogram). A child's phone on a slow network
 * pays for each of these bytes before seeing the first screen: a new image on the home has to
 * fit here, or the budget is raised knowingly.
 */
const HOME_IMAGE_BUDGET = 512_000;
/**
 * What the first screen is made of (src/ui/homeClearing.css): the scenery, the three places,
 * the name of the game and the clay button. Each is a CSS background: `owner` (with `pseudo`)
 * is what draws it, `fit` how (the scenery covers the screen and may be cropped; a place and
 * the name are shown whole; the button is stretched to its box), `file` the image in the
 * repository that the site must serve unchanged.
 */
const CLEARING = [
  { image: 'clairiere-decor', owner: '#home-screen', pseudo: '::before', fit: 'cover' },
  { image: 'clairiere-antre', owner: '#home-classic', pseudo: '::before', fit: 'contain' },
  { image: 'clairiere-pont', owner: '#home-voyage', pseudo: '::before', fit: 'contain' },
  { image: 'clairiere-chateau', owner: '#home-expeditions', pseudo: '::before', fit: 'contain' },
  { image: 'clairiere-logo-fr', owner: '.home-intro h1', fit: 'contain' },
  { image: 'clairiere-bouton', owner: '#home-primary', fit: '100% 100%' },
].map((part) => ({ ...part, file: `src/assets/home/${part.image}.webp` }));
/** No image of the first screen is drawn smaller than this, in CSS pixels, on any screen. */
const SMALLEST_PICTURE = 48;
/** Nothing of the board, and no original in full size, is fetched before a game starts. */
const HEAVY_IMAGE = /ground-|icone-source|2048/;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
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
        locale: 'fr-CH',
        viewport: { width, height },
        hasTouch: touch,
        isMobile: touch,
      });
      page.on('pageerror', (e) => errors.push(e.message));
      // Every image the home asks for, from its first byte: a page of its own has an empty
      // cache, so each one is a real download.
      const answers = [];
      page.on('response', (answer) => {
        if (answer.request().resourceType() === 'image') answers.push(answer);
      });
      const raw = name === 'empty' ? null : profile(name);
      await page.addInitScript((raw) => {
        if (raw) localStorage.setItem('conquete-serpents:family:v1', raw);
      }, raw);
      await page.goto(base);
      await page.locator('#home-primary').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);
      const images = [];
      for (const answer of answers.splice(0)) {
        const body = await answer.body();
        images.push({
          name: new URL(answer.url()).pathname,
          status: answer.status(),
          bytes: body.length,
          sha256: sha256(body),
        });
      }
      const weight = images.reduce((sum, image) => sum + image.bytes, 0);
      await snap(page, `${width}x${height}-${name}-home`);
      if (width === 375) {
        assert.equal(await page.locator('#orientation-notice').isVisible(), true);
        await page.setViewportSize({ width: 812, height: 375 });
      }
      const play = await page.locator('#home-primary').boundingBox();
      assert.ok(
        play.y >= 0 && play.y + play.height <= (width === 375 ? 375 : height),
        'Play fits first screen',
      );
      if (raw) {
        const resume = await page.locator('#home-primary').boundingBox();
        assert.ok(
          resume && resume.y + resume.height <= (width === 375 ? 375 : height),
          'Resume fits first screen',
        );
      }
      if (!baseline) {
        const where = `${width}x${height} ${name}`;
        // A light first screen: nothing of the board, no original, and a weight under budget.
        assert.deepEqual(
          images.filter((image) => HEAVY_IMAGE.test(image.name)).map((image) => image.name),
          [],
          `No ground or HD original loaded on home (${where})`,
        );
        assert.deepEqual(
          images.filter((image) => image.status !== 200),
          [],
          `Every image of the home arrives (${where})`,
        );
        assert.ok(
          weight <= HOME_IMAGE_BUDGET,
          `Images of the home: ${weight} bytes for a budget of ${HOME_IMAGE_BUDGET} (${where}): ` +
            JSON.stringify(images.map((image) => [image.name, image.bytes])),
        );
        // The clearing is whole: each of its images arrived, is the one of the repository, can
        // be decoded, and is the background of something displayed on the first screen.
        for (const part of CLEARING) {
          const arrived = images.filter((image) =>
            new RegExp(`/${part.image}-[\\w-]+\\.webp$`).test(image.name),
          );
          assert.equal(arrived.length, 1, `${part.image} is loaded once (${where})`);
          assert.equal(
            arrived[0].sha256,
            sha256(await readFile(part.file)),
            `${part.image} is served as ${part.file} (${where})`,
          );
          const drawn = await page.evaluate(
            async ([owner, pseudo, path]) => {
              const element = document.querySelector(owner);
              const style = getComputedStyle(element, pseudo ?? undefined);
              const box = element.getBoundingClientRect();
              let rect = box;
              if (pseudo) {
                // A pseudo-element has no rectangle of its own: its used size and place are in
                // its style. The scenery is fixed to the screen; the picture of a place is
                // centred above its plaque, whose slight tilt keeps the centre where it is.
                const [left, top, width, height] = ['left', 'top', 'width', 'height'].map((side) =>
                  parseFloat(style[side]),
                );
                if (style.position === 'fixed') rect = new DOMRect(left, top, width, height);
                else {
                  const frame = element.offsetParent;
                  const from = frame.getBoundingClientRect().top + frame.clientTop;
                  rect = new DOMRect(
                    (box.left + box.right - width) / 2,
                    from + element.offsetTop + element.clientTop + top,
                    width,
                    height,
                  );
                }
              }
              const picture = new Image();
              picture.src = path;
              await picture.decode();
              return {
                background: style.backgroundImage.includes(path),
                fit: style.backgroundSize,
                shown:
                  style.display !== 'none' &&
                  style.visibility === 'visible' &&
                  style.clipPath === 'none' &&
                  Number(style.opacity) === 1,
                rect: [rect.left, rect.top, rect.right, rect.bottom].map(Math.round),
                screen: [innerWidth, innerHeight],
                complete: picture.complete,
                natural: [picture.naturalWidth, picture.naturalHeight],
              };
            },
            [part.owner, part.pseudo ?? null, arrived[0].name],
          );
          const [left, top, right, bottom] = drawn.rect;
          assert.ok(
            drawn.background &&
              drawn.fit === part.fit &&
              drawn.shown &&
              drawn.complete &&
              Math.min(...drawn.natural) > 0 &&
              Math.min(right - left, bottom - top) >= SMALLEST_PICTURE &&
              // On the screen, whole; the scenery fills it from edge to edge.
              left >= 0 &&
              top >= 0 &&
              right <= drawn.screen[0] &&
              bottom <= drawn.screen[1] &&
              (part.fit !== 'cover' ||
                (right - left === drawn.screen[0] && bottom - top === drawn.screen[1])),
            `${part.image} is displayed by ${part.owner}${part.pseudo ?? ''} (${where}): ` +
              JSON.stringify(drawn),
          );
        }
      }
      await showHomePage(page, 'home');
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
              const clip = node.closest('#mission-list').getBoundingClientRect();
              const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
              const paths = [...node.querySelectorAll('path')].filter(
                (path) => getComputedStyle(path).display !== 'none',
              );
              return (
                box.top >= Math.max(0, clip.top) &&
                box.bottom <= Math.min(innerHeight, clip.bottom) &&
                hit?.closest('.mission-card') === node.closest('.mission-card') &&
                box.width >= 40 &&
                box.height >= 40 &&
                paths.length === 1
              );
            }),
          );
          if (visible.some((v) => !v))
            await snap(page, `diagnostic-glyphs-${width}x${height}-${name}`);
          assert.deepEqual(
            visible,
            [true, true, true],
            'First-row status glyphs fit above the fold: ' +
              JSON.stringify(
                await badges.evaluateAll((ns) =>
                  ns.slice(0, 3).map((n) => ({
                    rect: n.getBoundingClientRect().toJSON(),
                    paths: [...n.querySelectorAll('path')].filter(
                      (p) => getComputedStyle(p).display !== 'none',
                    ).length,
                  })),
                ),
              ),
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
          assert.equal(await page.locator('#home-play').textContent(), 'Préparer encore');
          assert.ok(
            (await cards.last().innerText()).includes(MISSIONS.at(-1).name),
            'Final mission remains discoverable on the Missions page',
          );
          await showHomePage(page, 'missions');
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
