// Recette des pommes du boss caché (lot 1, 26 novembre 2026) : dans un vrai navigateur, une
// pomme apparaît à la troisième vague et pas aux deux premières, un toucher la garde pour le
// joueur (une dans son carnet) sans placer d'allié, et elle s'en va après le toucher comme à
// la fin de sa vague. Deux parties : le vrai plateau sur un banc d'essai (tests/
// apples-harness.ts), servi par Vite, puis le site construit (dist/), avec son vrai démarrage.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { CURRENT_BALANCE_REVISION } from '../src/balanceRevision.ts';
import {
  APPLES_STORAGE_KEY,
  CAMP_STORAGE_KEY,
  COMPUTER,
  LANGUAGE_KEY,
  PHONE,
  launchChromium,
  startPreview,
} from './lib/recipe.mjs';

const fixture = '.apples-fixture.html';
const folder = 'artifacts/pommes';
const DEV_PORT = 4391;
const PREVIEW_PORT = 4392;
/** A mission of « le refuge » whose apple shows 4.7 s into the third wave, top right. */
const MISSION_SEED = 41;
/** A great adventure whose apple shows 4.7 s into the third wave, top left. */
const CLASSIC_SEED = 41;
/** An apple shows between 4 and 15 seconds of play into its wave (src/apples.ts). */
const LONGEST_WAIT_MS = 20_000;
const checks = [];
const errors = [];
let dev, preview, browser;

/** The apple on the board, in board units, or null: the board says where it stands. */
const appleOn = (page) =>
  page.evaluate(() => {
    const at = document.getElementById('game')?.getAttribute('data-apple');
    return at ? at.split(' ').map(Number) : null;
  });
/** A tap (or a click) on a point of the 1100 × 620 board. */
async function pressBoard(page, [x, y], touch) {
  const box = await page.locator('#game canvas').boundingBox();
  const point = [box.x + (box.width * x) / 1100, box.y + (box.height * y) / 620];
  if (touch) await page.touchscreen.tap(...point);
  else await page.mouse.click(...point);
}
const storedApples = (page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{"found":[]}').found,
    APPLES_STORAGE_KEY,
  );

/** Every change of the apple, with the wave and the state of the game at that moment. */
async function watchApple(page) {
  await page.evaluate(() => {
    const board = document.getElementById('game');
    const seen = (window.appleSeen = []);
    new MutationObserver(() => {
      const { game } = window.appleFixture.session;
      seen.push({
        at: board.getAttribute('data-apple'),
        wave: game.wave,
        status: game.status,
        time: game.time,
      });
    }).observe(board, { attributes: true, attributeFilter: ['data-apple'] });
  });
}
const fixtureGame = (page) =>
  page.evaluate(() => {
    const { session } = window.appleFixture;
    const { game } = session;
    return {
      wave: game.wave,
      status: game.status,
      time: game.time,
      units: game.units.length,
      gold: game.gold,
      selected: session.selected,
    };
  });
/** Plays the current wave to its end, fast. */
async function finishWave(page) {
  await page.evaluate(() => window.appleFixture.fast(1));
  await page.waitForFunction(() => window.appleFixture.session.game.status !== 'fighting', null, {
    timeout: 60_000,
  });
  await page.evaluate(() => window.appleFixture.fast(0));
  if (await page.locator('#skip-reward').isVisible()) await page.locator('#skip-reward').click();
}
async function openFixture(context, query) {
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${DEV_PORT}/${fixture}?seed=${MISSION_SEED}${query}`);
  await page.waitForFunction(() => window.appleFixture?.phaser.scene.isActive('Battle'));
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  await watchApple(page);
  return page;
}

/** The real board on its test bench: the three waves of a mission, at one size of screen. */
async function onTheBench(size, touch) {
  const name = `${size.width}x${size.height}`;
  const options = {
    locale: 'fr-CH',
    viewport: size,
    deviceScaleFactor: 1,
    hasTouch: touch,
    isMobile: touch,
    // On the phone, the player asked for less motion: the apple shows and is taken all the same.
    reducedMotion: touch ? 'reduce' : 'no-preference',
  };
  {
    const context = await browser.newContext(options);
    const page = await openFixture(context, '');
    for (const wave of [1, 2]) {
      await page.locator('#start').click();
      await finishWave(page);
      assert.equal((await fixtureGame(page)).wave, wave);
    }
    assert.deepEqual(
      await page.evaluate(() => window.appleSeen),
      [],
      `${name}: no apple in waves 1-2`,
    );
    checks.push(`${name}: no apple in waves 1 and 2`);
    // The third wave: the apple shows a few seconds in, at the pace of the game.
    await page.locator('#start').click();
    const start = (await fixtureGame(page)).time;
    await page.waitForFunction(
      () => document.getElementById('game').hasAttribute('data-apple'),
      null,
      {
        timeout: LONGEST_WAIT_MS,
      },
    );
    const shown = await page.evaluate(() => window.appleSeen[0]);
    assert.equal(shown.wave, 3);
    assert.equal(shown.status, 'fighting');
    assert.ok(
      shown.time - start >= 4 && shown.time - start < 16,
      `${name}: shown after ${shown.time - start} s`,
    );
    const apple = await appleOn(page);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${folder}/${name}-pomme.png` });
    // An ally is chosen: a tap anywhere free would place it. On the apple, it takes the apple.
    await page.evaluate(() => {
      window.appleFixture.session.selectUnit('club');
      window.appleFixture.session.game.gold = 500;
    });
    const before = await fixtureGame(page);
    assert.equal(before.selected, 'club');
    await pressBoard(page, apple, touch);
    await page.waitForFunction(() => !document.getElementById('game').hasAttribute('data-apple'));
    const after = await fixtureGame(page);
    assert.equal(after.units, before.units, `${name}: the tap placed no ally`);
    assert.equal(after.gold, before.gold, `${name}: nothing bought`);
    assert.equal(after.selected, 'club', `${name}: the ally is still chosen`);
    assert.equal(after.status, 'fighting', `${name}: taken during its wave`);
    assert.deepEqual(await storedApples(page), [`${MISSION_SEED}:3`], `${name}: one apple kept`);
    assert.equal(await page.evaluate(() => window.appleFixture.sounds), 1, `${name}: one sound`);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${folder}/${name}-trouvee.png` });
    checks.push(
      `${name}: apple in wave 3 after ${(shown.time - start).toFixed(1)} s, tapped, kept, no ally placed`,
    );
    await finishWave(page);
    const seen = await page.evaluate(() => window.appleSeen);
    assert.equal(seen.filter((change) => change.at).length, 1, `${name}: it never came back`);
    await page.close();
    // The camp brought back before the third wave: the apple already found does not show again.
    const again = await openFixture(context, '&from=2');
    await again.locator('#start').click();
    await again.evaluate(() => window.appleFixture.fast(0.05));
    // Well past the moment it would have shown, or the end of the wave.
    await again.waitForFunction(
      () => {
        const { game } = window.appleFixture.session;
        return game.time > 20 || game.status !== 'fighting';
      },
      null,
      { timeout: 60_000 },
    );
    await finishWave(again);
    assert.deepEqual(await again.evaluate(() => window.appleSeen), [], `${name}: found once`);
    assert.deepEqual(await storedApples(again), [`${MISSION_SEED}:3`], `${name}: counted once`);
    checks.push(`${name}: the same apple never counts twice`);
    await context.close();
  }
  {
    // Another player's device: the apple shows, nobody touches it, it leaves with its wave.
    const context = await browser.newContext(options);
    const page = await openFixture(context, '&from=2');
    await page.locator('#start').click();
    await page.waitForFunction(
      () => document.getElementById('game').hasAttribute('data-apple'),
      null,
      {
        timeout: LONGEST_WAIT_MS,
      },
    );
    await finishWave(page);
    const seen = await page.evaluate(() => window.appleSeen);
    assert.equal(seen.length, 2, `${name}: shown, then gone`);
    assert.equal(seen[1].at, null);
    assert.notEqual(seen[1].status, 'fighting', `${name}: gone when its wave ended`);
    assert.deepEqual(await storedApples(page), [], `${name}: nothing kept without a tap`);
    checks.push(`${name}: an apple left alone leaves at the end of its wave`);
    await context.close();
  }
}

/** The built site, its real start: a camp of the great adventure before its third wave. */
async function onTheSite(url) {
  const game = new Game(CLASSIC_SEED, undefined, undefined, CURRENT_BALANCE_REVISION);
  for (let wave = 1; wave <= 2; wave++) {
    assert.ok(game.startWave());
    while (game.status === 'fighting') game.step(0.05);
  }
  assert.equal(game.status, 'preparing');
  const camp = encodeCheckpoint(game);
  const context = await browser.newContext({
    locale: 'fr-CH',
    viewport: PHONE,
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  });
  await context.addInitScript(
    (entries) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      for (const [key, value] of entries) localStorage.setItem(key, value);
    },
    [
      [LANGUAGE_KEY, 'fr'],
      [CAMP_STORAGE_KEY, camp],
    ],
  );
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await page.locator('#home-primary:visible, #start:visible').first().waitFor();
  if (await page.locator('#home-primary').isVisible()) await page.locator('#home-primary').click();
  await page.locator('#start').waitFor({ state: 'visible' });
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  await page.locator('#start').click();
  await page.waitForFunction(
    () => document.getElementById('game').hasAttribute('data-apple'),
    null,
    {
      timeout: LONGEST_WAIT_MS,
    },
  );
  const apple = await appleOn(page);
  await page.screenshot({ path: `${folder}/site-${PHONE.width}x${PHONE.height}-pomme.png` });
  // An ally of the dock is chosen; the tap on the apple neither places nor pays for it.
  await page.locator('#battle-dock [data-dock-kind]').first().click();
  await page.locator('#dock-cancel').waitFor({ state: 'visible' });
  const gold = await page.locator('#gold').textContent();
  await pressBoard(page, apple, true);
  await page.waitForFunction(() => !document.getElementById('game').hasAttribute('data-apple'));
  assert.deepEqual(await storedApples(page), [`${CLASSIC_SEED}:3`], 'site: one apple kept');
  assert.equal(await page.locator('#gold').textContent(), gold, 'site: nothing bought');
  assert.equal(await page.locator('#dock-cancel').isVisible(), true, 'site: the ally still chosen');
  checks.push('site: the apple of wave 3 is kept under the player key, no ally placed');
  await context.close();
}

try {
  await mkdir(folder, { recursive: true });
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/apples-harness.ts"',
    ),
  );
  dev = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    String(DEV_PORT),
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${DEV_PORT}/${fixture}`)).ok) break;
    } catch {}
    if (i > 200) throw Error('Fixture unavailable');
    await delay(100);
  }
  browser = await launchChromium();
  await onTheBench(PHONE, true);
  await onTheBench(COMPUTER, false);
  preview = process.env.GAME_URL ? null : await startPreview({ port: PREVIEW_PORT });
  await onTheSite(process.env.GAME_URL ?? preview.url);
  assert.deepEqual(errors, []);
  await writeFile(`${folder}/report.json`, JSON.stringify({ checks, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ checks }, null, 2));
} finally {
  await browser?.close();
  dev?.kill();
  preview?.stop();
  await rm(fixture, { force: true });
}
