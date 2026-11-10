import { checkCatalogue } from './mobile-catalogue-037-checks.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionRun, MISSIONS } from '../src/missions.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { capricesForMission } from '../src/caprices.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';

const folder = process.env.MOBILE_MENUS_REPORT_DIR ?? 'artifacts/mobile-menus-037';
const key = 'conquete-serpents:family:v1';
const url = 'http://127.0.0.1:4387';
const errors = [],
  measurements = [];
let browser,
  server,
  checks = 0;
const check = (value, label) => {
  assert.ok(value, label);
  checks++;
};
function family(mode = 'missions') {
  const progress = createMissionProgressController();
  const run = createMissionRun('refuge', 321, undefined, 2);
  progress.started(run);
  const mission = new Game(321, undefined, run);
  progress.sync(mission);
  const classic = new Game(654, undefined, undefined, 2);
  progress.sync(classic);
  progress.switchMode(mode);
  const albums = createCapriceAlbumsController();
  albums.rename('child-1', 'Camille');
  albums.add('Lou');
  albums.select('child-1');
  return writeFamilyBackup(
    encodeCheckpoint(mode === 'missions' ? mission : classic),
    createCareer().state,
    progress.state,
    albums.state,
  );
}
async function pageAt(width, height, raw) {
  const p = await browser.newPage({ viewport: { width, height }, locale: 'fr-CH', hasTouch: true });
  p.on('pageerror', (e) => errors.push(e.message));
  if (raw)
    await p.addInitScript(
      ({ key, raw }) => {
        if (!sessionStorage.getItem('seeded')) {
          localStorage.setItem(key, raw);
          sessionStorage.setItem('seeded', 'yes');
        }
      },
      { key, raw },
    );
  await p.goto(url);
  await p.locator('#home-caprice-album').waitFor({ state: 'visible' });
  return p;
}
async function capture(p, name) {
  measurements.push({
    name,
    ...(await p.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      preparation: (() => {
        const d = document.querySelector('#mission-dialog[open]');
        const b = d?.querySelector('.mission-dialog-body');
        return d
          ? {
              rect: d.getBoundingClientRect().toJSON(),
              client: d.clientHeight,
              scroll: d.scrollHeight,
              bodyClient: b.clientHeight,
              bodyScroll: b.scrollHeight,
              view: d.dataset.preparationView,
            }
          : null;
      })(),
      catalogue: (() => {
        const d = document.querySelector('#reinforcements[open]');
        const b = d?.querySelector('.catalog-body');
        return d
          ? {
              rect: d.getBoundingClientRect().toJSON(),
              client: d.clientHeight,
              scroll: d.scrollHeight,
              bodyClient: b.clientHeight,
              bodyScroll: b.scrollHeight,
              cards: d.querySelectorAll('.unit-card:not([hidden])').length,
            }
          : null;
      })(),
      primary: document.querySelector('#home-primary')?.getBoundingClientRect().toJSON(),
      dialog: document.querySelector('#caprice-album-dialog[open]')
        ? {
            clientHeight: document.querySelector('#caprice-album-dialog').clientHeight,
            scrollHeight: document.querySelector('#caprice-album-dialog').scrollHeight,
          }
        : null,
      slots: document.querySelector('#caprice-album-dialog[open] .caprice-album-slots')
        ? {
            clientHeight: document.querySelector('.caprice-album-slots').clientHeight,
            scrollHeight: document.querySelector('.caprice-album-slots').scrollHeight,
          }
        : null,
    }))),
  });
  await p.screenshot({ path: `${folder}/${name}.png` });
}
async function reachable(p, selector) {
  const box = await p.locator(selector).boundingBox(),
    view = p.viewportSize();
  check(
    box &&
      box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= view.width + 1 &&
      box.y + box.height <= view.height + 1,
    selector + ' within viewport',
  );
  check(box.width >= 48 && box.height >= 48, selector + ' 48px target');
}
async function saved(p) {
  return p.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
}
try {
  await mkdir(folder, { recursive: true });
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4387',
    '--strictPort',
  ]);
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  await checkCatalogue({ browser, url, check, reachable, capture });
  if (process.env.MOBILE_MENUS_BEFORE) {
    for (const [w, h] of [
      [780, 360],
      [812, 375],
      [1280, 800],
      [568, 320],
    ]) {
      const p = await pageAt(w, h);
      await capture(p, `before-home-${w}x${h}`);
      await p.locator('#home-caprice-album').click();
      await capture(p, `before-album-${w}x${h}`);
      await p.close();
    }
    await writeFile(`${folder}/before-measurements.json`, JSON.stringify(measurements, null, 2));
  }
  for (const [w, h] of [
    [780, 360],
    [812, 375],
    [1280, 800],
    [568, 320],
  ]) {
    const p = await pageAt(w, h);
    check(await p.locator('#home-primary').isVisible(), 'one contextual primary entry exists');
    check(
      (await p.locator('#home-screen .primary:visible').count()) === 1,
      'exactly one home primary',
    );
    check(
      await p.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1),
      'compact home has no page scroll',
    );
    for (const id of [
      'home-primary',
      'home-expeditions',
      'home-classic',
      'home-parents',
      'home-army',
      'home-caprice-album',
    ])
      await reachable(p, '#' + id);
    check(
      (await p.locator('#home-primary').evaluate((n) => getComputedStyle(n).backgroundColor)) ===
        'rgb(237, 189, 87)',
      'primary keeps gold action hierarchy',
    );
    await capture(p, `after-home-${w}x${h}`);
    await p.locator('#home-primary').click();
    check(await p.locator('#mission-dialog').isVisible(), 'fresh primary opens preparation');
    check(
      JSON.parse(await p.locator('#mission-dialog').getAttribute('data-run')).balance === 2,
      'preparation keeps current balance revision',
    );
    check(
      (await p.locator('#mission-dialog').getAttribute('data-preparation-view')) === 'summary',
      'preparation opens on short summary',
    );
    check(await p.locator('#mission-summary').isVisible(), 'short summary visible');
    check(!(await p.locator('#mission-caprices').isVisible()), 'caprices have separate view');
    for (const view of ['caprices', 'friends', 'scouting', 'options']) {
      await p.locator(`[data-preparation="${view}"]`).click();
      check(
        (await p.locator('#mission-dialog').getAttribute('data-preparation-view')) === view,
        'separate preparation ' + view,
      );
      await reachable(p, '#mission-launch');
      await reachable(p, '#mission-close');
      if (view === 'options') await reachable(p, '#mission-reroll');
      await p.locator('[data-preparation="summary"]').click();
    }
    const landBox = await p.locator('#mission-land').boundingBox();
    const actionsBox = await p.locator('.mission-dialog-actions').boundingBox();
    check(
      landBox.y + landBox.height <= actionsBox.y,
      'normal short summary exposes terrain without inner scrolling',
    );
    await capture(p, `after-preparation-${w}x${h}`);
    await p.locator('#mission-close').click();
    await p.locator('#home-expeditions').click();
    check((await p.locator('.mission-card:visible').count()) === 6, 'six mission cards');
    await reachable(p, '#home-back');
    await p.keyboard.press('Escape');
    check(await p.locator('#home-primary').isVisible(), 'Escape returns home');
    await p.locator('#home-army').click();
    check((await p.locator('.roster-card:visible').count()) === 6, 'six favorite cards');
    const first = await p
      .locator('.roster-card:visible')
      .evaluateAll((ns) => ns.map((n) => n.dataset.rosterKind));
    await p.locator('#roster-page-next').click();
    check((await p.locator('.roster-card:visible').count()) === 6, 'favorites next page');
    check(
      (
        await p
          .locator('.roster-card:visible')
          .evaluateAll((ns) => ns.map((n) => n.dataset.rosterKind))
      ).every((id) => !first.includes(id)),
      'favorites pages disjoint',
    );
    await p.locator('#home-back').click();
    await p.locator('#home-caprice-album').click();
    check(
      !(await p.locator('#caprice-album-manage').evaluate((n) => n.open)),
      'book management collapsed',
    );
    const seen = [];
    for (let i = 0; i < MISSIONS.length; i++) {
      const visible = await p
        .locator('[data-sticker]:visible')
        .evaluateAll((ns) => ns.map((n) => n.dataset.sticker));
      const expected = ['serpents', 'createur'].flatMap((set) =>
        capricesForMission(MISSIONS[i].id, set).map((c) => c.id),
      );
      assert.deepEqual(visible, expected);
      checks++;
      seen.push(...visible);
      check(
        (await p.locator('#caprice-album-previous').isDisabled()) === (i === 0),
        'previous boundary',
      );
      check(
        (await p.locator('#caprice-album-next').isDisabled()) === (i === MISSIONS.length - 1),
        'next boundary',
      );
      if (i < MISSIONS.length - 1) await p.locator('#caprice-album-next').click();
    }
    check(new Set(seen).size === 36, '36 distinct protected IDs across pages');
    for (const id of ['caprice-album-close', 'caprice-album-previous', 'caprice-album-next'])
      await reachable(p, '#' + id);
    await capture(p, `after-album-${w}x${h}`);
    await p.locator('#caprice-album-close').click();
    check(
      await p.locator('#home-caprice-album').evaluate((n) => n === document.activeElement),
      'book returns focus',
    );
    await p.close();
  }
  const p = await pageAt(780, 360, family());
  await p.locator('#home-caprice-album').click();
  await p.locator('#caprice-album-next').click();
  await p.locator('#caprice-album-profile').selectOption('child-2');
  await p.locator('#caprice-album-manage > summary').click();
  await p.locator('#caprice-album-name').fill('Lou <ami>');
  await p.locator('#caprice-album-rename').click();
  check(
    (await saved(p)).albums.children.find((c) => c.id === 'child-2').name === 'Lou <ami>',
    'rename targets selected book',
  );
  check(
    (await saved(p)).albums.children.find((c) => c.id === 'child-1').name === 'Camille',
    'other book unchanged',
  );
  await p.locator('#caprice-album-manage > summary').click();
  const leaves = await p.locator('[data-sticker]:visible [lang="fr"]').allTextContents();
  await p.locator('#caprice-album-close').click();
  await p.locator('[data-language-picker]:visible').selectOption('en');
  await p.waitForFunction(() => document.documentElement.lang === 'en');
  await p.locator('#home-caprice-album').click();
  assert.deepEqual(await p.locator('[data-sticker]:visible [lang="fr"]').allTextContents(), leaves);
  checks++;
  check(
    (await p.locator('#caprice-album-profile').inputValue()) === 'child-2',
    'book selection survives language refresh',
  );
  check(
    (await p.locator('#caprice-album-profile option:checked').textContent()) === 'Lou <ami>',
    'raw child name preserved',
  );
  check(
    (await p.locator('.caprice-album-pagination').getAttribute('aria-label')) ===
      'Sticker book missions',
    'new pagination accessible label is translated',
  );
  await capture(p, 'after-album-en');
  await p.locator('#caprice-album-previous').click();
  for (let i = 0; i < MISSIONS.length; i++) {
    const expectedNames = ['serpents', 'createur'].flatMap((set) =>
      capricesForMission(MISSIONS[i].id, set).map((c) => c.name),
    );
    assert.deepEqual(
      await p.locator('[data-sticker]:visible [lang="fr"]').allTextContents(),
      expectedNames,
    );
    checks++;
    if (i < MISSIONS.length - 1) await p.locator('#caprice-album-next').click();
  }
  await p.setViewportSize({ width: 375, height: 812 });
  check(await p.locator('#orientation-notice').isVisible(), 'portrait retains rotation guidance');
  await p.setViewportSize({ width: 780, height: 360 });
  check(
    (await p.locator('#caprice-album-page').textContent()) === '6 / 6',
    'rotation preserves album page',
  );
  check(
    (await p.locator('#caprice-album-profile').inputValue()) === 'child-2',
    'rotation preserves chosen book',
  );
  await p.locator('#caprice-album-close').click();
  const before = (await saved(p)).missions;
  await p.locator('#home-primary').click();
  check(await p.locator('#app').isVisible(), 'primary resumes active mission');
  check(
    !(await p.locator('#mission-battle-actions').evaluate((n) => n.hidden)),
    'resumed game is a mission',
  );
  await p.locator('#menu-home:visible, #mobile-home:visible').first().click();
  await p.locator('#home-classic').click();
  await p.locator('#home-continue').click();
  check((await saved(p)).missions.activeMode === 'classic', 'classic resume uses existing handler');
  await p.locator('#menu-home:visible, #mobile-home:visible').first().click();
  await p.reload();
  await p.locator('#home-primary').waitFor({ state: 'visible' });
  await p.locator('#home-primary').click();
  check(
    (await saved(p)).missions.activeMode === 'classic',
    'reload primary resumes active classic',
  );
  await p.locator('#menu-home:visible, #mobile-home:visible').first().click();
  await p.locator('#home-expeditions').click();
  await p.locator('#mission-continue').click();
  const after = (await saved(p)).missions;
  check(after.activeMode === 'missions', 'explicit mission resume switches active mode');
  check(
    after.retryCamp === before.retryCamp && after.classicCamp === before.classicCamp,
    'both camps identical after mode roundtrip',
  );
  await p.locator('#menu-home:visible, #mobile-home:visible').first().click();
  await p.reload();
  await p.locator('#home-primary').waitFor({ state: 'visible' });
  await p.locator('#home-primary').click();
  check(
    (await saved(p)).missions.activeMode === 'missions',
    'reload primary resumes active mission',
  );
  await p.close();
  const safe = await pageAt(568, 320);
  await safe.evaluate(() => {
    for (const [side, value] of Object.entries({ top: 24, right: 32, bottom: 16, left: 0 }))
      document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`);
  });
  const languageBox = await safe.locator('[data-language-picker]:visible').boundingBox();
  check(
    languageBox.y >= 24 && languageBox.x + languageBox.width <= 536,
    'home respects existing safe-area variables',
  );
  check(
    await safe.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1),
    'safe-area home has no page scroll',
  );
  await safe.locator('#home-caprice-album').click();
  const closeBox = await safe.locator('#caprice-album-close').boundingBox();
  check(closeBox.y >= 24 && closeBox.x + closeBox.width <= 536, 'album exit respects safe areas');
  await capture(safe, 'after-album-safe-568x320');
  await safe.close();
  check(errors.length === 0, JSON.stringify(errors));
  await writeFile(`${folder}/after-measurements.json`, JSON.stringify(measurements, null, 2));
  await writeFile(`${folder}/report.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await browser?.close();
  server?.kill();
}
