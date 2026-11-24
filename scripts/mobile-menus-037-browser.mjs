import { chooseLanguage, leaveBattle, showHomePage } from '../tests/browser-entry.mjs';
import { REMOVED_CATALOGUE_CONTROLS } from '../tests/reveal-controls.mjs';
import { checkCatalogue } from './mobile-catalogue-037-checks.mjs';
import { checkHelpPoints } from './mobile-help-038-checks.mjs';
import { checkClearing, clearingState } from './mobile-home-clearing-checks.mjs';
import { checkPlayers } from './mobile-players-038-checks.mjs';
import { checkPrivacy } from './mobile-privacy-038-checks.mjs';
import { checkReplay } from './mobile-replay-038-checks.mjs';
import { checkVoyage } from './mobile-voyage-038-checks.mjs';
import { checkResume } from './mobile-resume-checks.mjs';
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
// MOBILE_MENUS_KEEP_GOING=1 notes a check that fails and goes on, to list in one run all that
// fails; the recipe still fails at its end. Without it the first failure stops the run.
const keepGoing = !!process.env.MOBILE_MENUS_KEEP_GOING;
const failures = [];
const check = (value, label) => {
  if (keepGoing && !value) {
    failures.push(String(label));
    console.error(`FAILED: ${label}`);
    return;
  }
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
  // The interface no longer creates or renames books: this family already had two, the
  // second with a name that must stay raw text on screen.
  albums.rename('child-1', 'Camille');
  albums.add('Lou <ami>');
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
async function portrait(p, dialog, name) {
  const focus = await p.evaluate(() => document.activeElement?.id);
  await p.setViewportSize({ width: 375, height: 812 });
  await p.waitForTimeout(80);
  check(await p.locator('#orientation-notice').isVisible(), name + ' portrait guidance visible');
  check(
    await p.evaluate(() => {
      const notice = document.querySelector('#orientation-notice');
      return [
        [20, 20],
        [187, 406],
        [350, 780],
      ].every(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return hit === notice || notice.contains(hit);
      });
    }),
    name + ' portrait guidance actually topmost at corners and centre',
  );
  await capture(p, 'portrait-' + name);
  check(await p.locator(dialog).evaluate((d) => d.open), name + ' stays open during rotation');
  await p.setViewportSize({ width: 780, height: 360 });
  // The page reacts to the rotation at its next rendering step: wait two frames, so that
  // the checks that follow read the settled page and not the instant before.
  await p.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
  check(await p.locator(dialog).isVisible(), name + ' restored after rotation');
  check(
    (await p.evaluate(() => document.activeElement?.id)) === focus,
    name + ' retains modal focus across rotation',
  );
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
  // MOBILE_MENUS_ONLY=voyage (for instance) runs one group while it is being worked on;
  // several names go with commas between them. MOBILE_MENUS_EXCEPT=voyage runs all the
  // others: the two tasks of the CI are « voyage » and « all but voyage », so that a group
  // added here later runs in one of them without the workflow being touched.
  const GROUPS = ['catalogue', 'help', 'players', 'replay', 'voyage', 'resume', 'privacy'];
  const names = (value) => value?.split(',').filter(Boolean) ?? [];
  const only = names(process.env.MOBILE_MENUS_ONLY);
  const except = names(process.env.MOBILE_MENUS_EXCEPT);
  for (const name of [...only, ...except])
    assert.ok(GROUPS.includes(name), `unknown group: ${name}`);
  assert.ok(!only.length || !except.length, 'MOBILE_MENUS_ONLY or MOBILE_MENUS_EXCEPT, not both');
  // How long each group took, on the error stream: what the CI tasks are balanced with.
  let since = Date.now();
  let running = 'start';
  const lap = (next) => {
    console.error(`${running}: ${Math.round((Date.now() - since) / 1000)} s`);
    since = Date.now();
    running = next;
  };
  const run = (name) => {
    // A group this list does not know could never be asked for by name.
    assert.ok(GROUPS.includes(name), `group missing from GROUPS: ${name}`);
    const wanted = only.length ? only.includes(name) : !except.includes(name);
    if (wanted) lap(name);
    return wanted;
  };
  if (run('catalogue')) await checkCatalogue({ browser, url, check, reachable, capture, portrait });
  if (run('help')) await checkHelpPoints({ pageAt, check, capture, portrait });
  if (run('players')) await checkPlayers({ browser, url, check, capture, portrait });
  if (run('replay')) await checkReplay({ browser, url, pageAt, check, capture });
  if (run('voyage')) await checkVoyage({ browser, url, check, capture });
  if (run('resume')) await checkResume({ browser, url, check, capture });
  if (run('privacy')) await checkPrivacy({ pageAt, check, capture, url });
  lap('the home, at every size');
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
    // The main action is no longer a flat honey rectangle: it is the clay button of the
    // clearing, the biggest thing to touch, on a first screen where nothing overlaps.
    checkClearing(check, await clearingState(p), `home ${w}×${h}`);
    await capture(p, `after-home-${w}x${h}`);
    // The main button plays at once; the preparation is one page away, on Missions.
    await p.locator('#home-primary').click();
    await p.locator('#start').waitFor({ state: 'visible' });
    check(
      (await p.locator('#mission-dialog[open]').count()) === 0,
      'fresh primary starts the game with no dialog in between',
    );
    check(
      !(await p.locator('#mission-battle-actions').evaluate((n) => n.hidden)),
      'the game started by the primary is a mission',
    );
    await leaveBattle(p);
    await showHomePage(p, 'missions');
    await p.locator('#home-play').click();
    check(await p.locator('#mission-dialog').isVisible(), 'Missions page opens preparation');
    const prepared = JSON.parse(await p.locator('#mission-dialog').getAttribute('data-run'));
    check(
      prepared.balance === 2 && prepared.paths === 2,
      'preparation keeps current balance revision and the path rules of a new departure',
    );
    check(
      (await p.locator('#mission-dialog').getAttribute('data-preparation-view')) === 'summary',
      'preparation opens on short summary',
    );
    check(await p.locator('#mission-summary').isVisible(), 'short summary visible');
    check(!(await p.locator('#mission-caprices').isVisible()), 'caprices have separate view');
    check(
      (await p.locator('[data-preparation="friends"]').isHidden()) &&
        (await p.locator('.preparation-nav button:visible').count()) === 4,
      'normal mission with one book hides the empty friends tab',
    );
    for (const view of ['caprices', 'scouting', 'options']) {
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
    if (w === 780) await portrait(p, '#mission-dialog', 'preparation');
    await p.locator('#mission-close').click();
    await showHomePage(p, 'home');
    await p.locator('#home-expeditions').click();
    check((await p.locator('.mission-card:visible').count()) === 6, 'six mission cards');
    await reachable(p, '#home-back');
    await p.keyboard.press('Escape');
    check(await p.locator('#home-primary').isVisible(), 'Escape returns home');
    await showHomePage(p, 'home');
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
      (await p
        .locator(
          '#caprice-album-manage, #caprice-album-name, #caprice-album-add, #caprice-album-rename',
        )
        .count()) === 0,
      'book management is gone',
    );
    check(
      (await p.locator('#caprice-album-profile').count()) === 1 &&
        (await p.locator('.caprice-profile-tools').isHidden()),
      'single book offers no book choice',
    );
    check(
      (await p.locator('#caprice-album-hint').textContent()) ===
        'Réussis un caprice pour gagner son autocollant.' &&
        (await p.locator('#caprice-album-previous').textContent()) === '← Page précédente' &&
        (await p.locator('#caprice-album-next').textContent()) === 'Page suivante →',
      'book explains itself and names its page buttons',
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
  check(
    await p.locator('#caprice-album-profile').isVisible(),
    'a family with two saved books keeps its book choice',
  );
  await p.locator('#caprice-album-profile').selectOption('child-2');
  check((await saved(p)).albums.activeId === 'child-2', 'book choice selects the saved book');
  check(
    (await saved(p)).albums.children.find((c) => c.id === 'child-2').name === 'Lou <ami>' &&
      (await saved(p)).albums.children.find((c) => c.id === 'child-1').name === 'Camille',
    'choosing a book leaves both saved names unchanged',
  );
  const leaves = await p.locator('[data-sticker]:visible [lang="fr"]').allTextContents();
  await p.locator('#caprice-album-close').click();
  await chooseLanguage(p, 'en');
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
  await p.locator('#caprice-album-close').focus();
  await portrait(p, '#caprice-album-dialog', 'book');
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
  check(
    (await p.locator('#home-next-mission').textContent()) === 'Resume my mission',
    'caption describes active saved mission',
  );
  await p.locator('#home-primary').click();
  check(await p.locator('#app').isVisible(), 'primary resumes active mission');
  check(
    !(await p.locator('#mission-battle-actions').evaluate((n) => n.hidden)),
    'resumed game is a mission',
  );
  await leaveBattle(p);
  await showHomePage(p, 'home');
  await p.locator('#home-classic').click();
  await showHomePage(p, 'classic');
  await p.locator('#home-continue').click();
  check((await saved(p)).missions.activeMode === 'classic', 'classic resume uses existing handler');
  await leaveBattle(p);
  await p.reload();
  await p.locator('#home-primary').waitFor({ state: 'visible' });
  check(
    (await p.locator('#home-next-mission').textContent()) ===
      ((await saved(p)).missions.activeMode === 'classic'
        ? 'Resume my classic adventure'
        : 'Resume my mission'),
    'caption describes retained active mode after reload',
  );
  await p.locator('#home-primary').click();
  check(
    (await saved(p)).missions.activeMode === 'classic',
    'reload primary resumes active classic',
  );
  await leaveBattle(p);
  await showHomePage(p, 'home');
  await p.locator('#home-expeditions').click();
  await showHomePage(p, 'missions');
  await p.locator('#mission-continue').click();
  const after = (await saved(p)).missions;
  check(after.activeMode === 'missions', 'explicit mission resume switches active mode');
  check(
    after.retryCamp === before.retryCamp && after.classicCamp === before.classicCamp,
    'both camps identical after mode roundtrip',
  );
  await leaveBattle(p);
  await p.reload();
  await p.locator('#home-primary').waitFor({ state: 'visible' });
  check(
    (await p.locator('#home-next-mission').textContent()) ===
      ((await saved(p)).missions.activeMode === 'classic'
        ? 'Resume my classic adventure'
        : 'Resume my mission'),
    'caption describes retained active mode after reload',
  );
  await p.locator('#home-primary').click();
  check(
    (await saved(p)).missions.activeMode === 'missions',
    'reload primary resumes active mission',
  );
  await p.close();
  const safeAreas = { top: 24, right: 32, bottom: 16, left: 0 };
  const realSafe = await pageAt(780, 360);
  await realSafe.evaluate((margins) => {
    for (const [side, value] of Object.entries(margins))
      document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`);
  }, safeAreas);
  checkClearing(check, await clearingState(realSafe, safeAreas), 'home 780×360 with safe areas');
  await realSafe.locator('#home-caprice-album').click();
  check(
    await realSafe.locator('[data-sticker]:visible').evaluateAll((ns) =>
      ns.every((n) => {
        const r = n.getBoundingClientRect(),
          p = n.closest('.caprice-album-slots').getBoundingClientRect();
        return r.top >= p.top && r.bottom <= p.bottom + 1;
      }),
    ),
    'all six stickers fully readable at 780 safe areas',
  );
  await capture(realSafe, 'after-album-safe-780x360');
  await realSafe.close();
  const safe = await pageAt(568, 320);
  await safe.evaluate((margins) => {
    for (const [side, value] of Object.entries(margins))
      document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`);
  }, safeAreas);
  // The settings wheel is the last thing of the top row, in the corner of the safe area.
  const settingsBox = await safe.locator('#home-settings').boundingBox();
  check(
    settingsBox.y >= 24 && settingsBox.x + settingsBox.width <= 536,
    'home respects existing safe-area variables',
  );
  check(
    await safe.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1),
    'safe-area home has no page scroll',
  );
  // The smallest phone with its safe areas: the whole first screen, not the wheel alone.
  checkClearing(check, await clearingState(safe, safeAreas), 'home 568×320 with safe areas');
  await safe.locator('#home-caprice-album').click();
  const closeBox = await safe.locator('#caprice-album-close').boundingBox();
  check(closeBox.y >= 24 && closeBox.x + closeBox.width <= 536, 'album exit respects safe areas');
  await capture(safe, 'after-album-safe-568x320');
  await safe.close();
  check(errors.length === 0, JSON.stringify(errors));
  // Secondary home pages adapt to the space they really have. On every screen of this
  // grid, from a small phone to a computer, with and without Android's system margins
  // (status bar, camera cut-out, gesture bar), nothing scrolls, nothing is cut and the six
  // missions show their names.
  const systemBars = { top: 30, right: 48, bottom: 24, left: 48 };
  const scrollers = [
    ['missions', '#mission-list'],
    ['favorites', '#army-editor'],
    ['classic', '[data-home-page="classic"]'],
    ['parents', '#home-parent-options'],
  ];
  async function openAt(w, h, insets, raw) {
    const phone = await pageAt(w, h, raw);
    if (insets)
      await phone.evaluate((margins) => {
        for (const [side, value] of Object.entries(margins))
          document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`);
      }, insets);
    return phone;
  }
  const measurePage = (phone, scroller) =>
    phone.locator(scroller).evaluate((e) => {
      const footer = document.querySelector('.home-footer').getBoundingClientRect();
      const seen = (node) => {
        const r = node.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + 2, r.top + r.height / 2);
        return r.top >= 0 && r.bottom <= innerHeight && !!hit && node.contains(hit);
      };
      const controls = [
        ...document.querySelectorAll('#home-screen button, #home-screen select'),
      ].filter((node) => node.getClientRects().length);
      return {
        overflow: e.scrollHeight - e.clientHeight,
        footer: footer.height,
        gap: innerHeight - footer.bottom,
        names: [...document.querySelectorAll('#mission-cards .mission-card strong')].filter(seen)
          .length,
        cut: controls.filter(
          (node) =>
            node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2,
        ).length,
        small: controls.filter((node) => {
          const r = node.getBoundingClientRect();
          return seen(node) && (r.width < 47.5 || r.height < 47.5);
        }).length,
      };
    });
  for (const [w, h, insets] of [
    [640, 360, null],
    [780, 360, null],
    [812, 375, null],
    [915, 412, null],
    [1024, 600, null],
    [1280, 800, null],
    [1366, 768, null],
    [780, 360, systemBars],
    [832, 384, systemBars],
    [915, 412, systemBars],
    [1024, 600, systemBars],
  ]) {
    const phone = await openAt(w, h, insets);
    const where = `${w}×${h}${insets ? ' with system margins' : ''}`;
    // The first screen first, on the same grid: it leads to the four pages measured below.
    checkClearing(check, await clearingState(phone, insets), `home ${where}`);
    for (const [target, scroller] of scrollers) {
      await showHomePage(phone, target);
      const fit = await measurePage(phone, scroller);
      check(fit.overflow <= 1, `${target} fits ${where}: ${JSON.stringify(fit)}`);
      check(
        fit.footer <= 20 && fit.gap <= 16 + (insets?.bottom ?? 0),
        `${target} leaves no empty band at ${where}`,
      );
      check(fit.cut === 0 && fit.small === 0, `${target} controls whole at ${where}`);
      if (target === 'missions')
        check(fit.names === 6, `six mission names readable at ${where}: ${fit.names}`);
      await showHomePage(phone, 'home');
    }
    await phone.close();
  }
  // Screens too small for the floors of text and touch targets may scroll, never cut.
  for (const [w, h] of [
    [480, 270],
    [568, 320],
  ]) {
    const phone = await openAt(w, h, null);
    for (const [target, scroller] of scrollers) {
      await showHomePage(phone, target);
      const fit = await measurePage(phone, scroller);
      check(fit.cut === 0, `${target} cuts no control at ${w}×${h}: ${JSON.stringify(fit)}`);
      if (target === 'missions')
        check(fit.names === 6, `six mission names readable at ${w}×${h}: ${fit.names}`);
      await showHomePage(phone, 'home');
    }
    await phone.close();
  }
  // Dialogs that work as screens (sticker book, preparation, catalogue, help) on the same
  // grid: what a child must see is entirely in view and every control is a 48 px target.
  const dialogState = (page, selector) =>
    page.locator(selector).evaluate((dialog) => {
      const frame = dialog.getBoundingClientRect();
      const seen = (node) => {
        const r = node.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return (
          r.top >= frame.top - 1 &&
          r.bottom <= frame.bottom + 1 &&
          r.left >= frame.left - 1 &&
          r.right <= frame.right + 1 &&
          !!hit &&
          (node.contains(hit) || hit.contains(node))
        );
      };
      const count = (query) => [...dialog.querySelectorAll(query)].filter(seen).length;
      const body = dialog.querySelector('.mission-dialog-body, .catalog-body');
      return {
        frame: frame.toJSON(),
        stickers: count('.caprice-sticker'),
        hint: count('.caprice-album-hint'),
        choice: count('#caprice-album-profile'),
        cards: count('#shop .unit-card'),
        launch: count('#mission-launch'),
        play: count('#play-help'),
        overflow: body ? body.scrollHeight - body.clientHeight : 0,
        small: [...dialog.querySelectorAll('button, select, summary')]
          .filter(seen)
          .filter((node) => {
            const r = node.getBoundingClientRect();
            return r.width < 47.5 || r.height < 47.5;
          })
          .map((node) => node.id || node.textContent.trim().slice(0, 20)),
      };
    });
  for (const [w, h, insets] of [
    [568, 320, null],
    [780, 360, null],
    [915, 412, null],
    [1280, 800, null],
    [780, 360, systemBars],
    [915, 412, systemBars],
  ]) {
    const where = `${w}×${h}${insets ? ' with system margins' : ''}`;
    const inSafeArea = (frame) =>
      frame.top >= (insets?.top ?? 0) - 1 &&
      frame.left >= (insets?.left ?? 0) - 1 &&
      frame.right <= w - (insets?.right ?? 0) + 1 &&
      frame.bottom <= h - (insets?.bottom ?? 0) + 1;
    const phone = await openAt(w, h, insets);
    await phone.locator('#home-caprice-album').click();
    let state = await dialogState(phone, '#caprice-album-dialog');
    check(state.stickers === 6, `six stickers in view at ${where}: ${JSON.stringify(state)}`);
    check(inSafeArea(state.frame) && !state.small.length, `sticker book whole at ${where}`);
    check(
      state.hint === 1 && state.choice === 0,
      `book sentence in view and no book choice with one book at ${where}`,
    );
    const exitReachable = (page) =>
      page.locator('#caprice-album-close').evaluate((node) => {
        const r = node.getBoundingClientRect();
        return node.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      });
    check(await exitReachable(phone), `book exit stays reachable at ${where}`);
    await phone.locator('#caprice-album-close').click();
    // A family that already had two books keeps its choice: everything must still fit.
    const several = await openAt(w, h, insets, family());
    await several.locator('#home-caprice-album').click();
    state = await dialogState(several, '#caprice-album-dialog');
    check(
      state.stickers === 6 && state.hint === 1 && state.choice === 1,
      `six stickers, sentence and book choice in view with two books at ${where}: ${JSON.stringify(state)}`,
    );
    check(
      inSafeArea(state.frame) && !state.small.length,
      `sticker book with two books whole at ${where}`,
    );
    check(await exitReachable(several), `book exit stays reachable with two books at ${where}`);
    await several.locator('#caprice-album-close').click();
    await showHomePage(several, 'missions');
    await several.locator('#home-play').click();
    await several.locator('#mission-dialog[open]').waitFor();
    await several.locator('#mission-dialog [data-preparation="friends"]').click();
    state = await dialogState(several, '#mission-dialog');
    check(
      state.overflow <= 1 &&
        state.launch === 1 &&
        (await several.locator('#mission-caprice-profile').isVisible()),
      `preparation book choice fits with its departure at ${where}: ${JSON.stringify(state)}`,
    );
    check(
      inSafeArea(state.frame) && !state.small.length,
      `preparation book choice whole at ${where}: ${state.small}`,
    );
    await several.close();
    await showHomePage(phone, 'parents');
    await phone.locator('#home-help').click();
    state = await dialogState(phone, '#help-dialog');
    check(state.play === 1, `help keeps its way back in view at ${where}`);
    check(!state.small.length, `help controls are 48 px at ${where}: ${state.small}`);
    await phone.locator('#play-help').click();
    await showHomePage(phone, 'home');
    await showHomePage(phone, 'missions');
    await phone.locator('#home-play').click();
    await phone.locator('#mission-dialog[open]').waitFor();
    for (const view of ['summary', 'caprices', 'scouting']) {
      await phone.locator(`#mission-dialog [data-preparation="${view}"]`).click();
      state = await dialogState(phone, '#mission-dialog');
      check(
        state.overflow <= 1 && state.launch === 1,
        `preparation ${view} fits with its departure at ${where}: ${JSON.stringify(state)}`,
      );
      check(
        inSafeArea(state.frame) && !state.small.length,
        `preparation ${view} whole at ${where}`,
      );
    }
    await phone.locator('#mission-launch').click();
    await phone.locator('#start').waitFor({ state: 'visible' });
    await phone.locator('#reinforcements-toggle:visible, #dock-catalogue:visible').first().click();
    await phone.locator('#reinforcements[open]').waitFor();
    state = await dialogState(phone, '#reinforcements');
    // Every available ally on one screen. A very small phone shows four columns and whole
    // rows only as far as its height goes; the body scrolls to the others.
    const listed = await phone.locator('#shop .unit-card:visible').count();
    check(
      listed > 0 && (await phone.locator(REMOVED_CATALOGUE_CONTROLS).count()) === 0,
      `allies listed without pages at ${where}`,
    );
    const expected = w >= 640 ? listed : Math.min(listed, 4);
    check(
      state.cards >= expected,
      `${expected} of ${listed} allies in view at ${where}: ${JSON.stringify(state)}`,
    );
    check(inSafeArea(state.frame) && !state.small.length, `catalogue whole at ${where}`);
    await phone.close();
  }
  await writeFile(`${folder}/after-measurements.json`, JSON.stringify(measurements, null, 2));
  await writeFile(`${folder}/report.json`, JSON.stringify({ checks, errors, failures }, null, 2));
  lap('end');
  console.log(JSON.stringify({ checks, errors, failed: failures.length }));
  assert.ok(!failures.length, `${failures.length} checks failed:\n${failures.join('\n')}`);
} finally {
  await browser?.close();
  server?.kill();
}
