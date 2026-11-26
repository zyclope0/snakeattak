// Recette du boss caché, lot 2 (26 novembre 2026) : dans un vrai navigateur, le vrai plateau
// (`BattleScene`) joue le combat du boss caché sur un banc d'essai (tests/hidden-boss-harness.ts)
// servi par Vite, avec le dessin provisoire (tête du serpent ordinaire, anneaux en ronds de
// pâte, nombre d'anneaux au-dessus de la tête). On achète un camp, on lance la vague avec le
// vrai bouton, puis on regarde le boss sortir, avaler un allié (un anneau de plus), perdre un
// anneau cassé, et s'enrouler quand il n'a plus que sa tête. Captures en 780×360 (tactile,
// mouvements réduits) et 1280×800 dans artifacts/boss-cache/ (jamais dans Git).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { HIDDEN_BOSS_VERSIONS, CURRENT_HIDDEN_BOSS_VERSION } from '../src/hiddenBossTuning.ts';
import { COMPUTER, PHONE, launchChromium } from './lib/recipe.mjs';

const fixture = '.hidden-boss-fixture.html';
const folder = 'artifacts/boss-cache';
const DEV_PORT = 4393;
/** A battle that the camp of the bench wins, after swallowing allies (seed 1, version 1). */
const SEED = 1;
const TUNING = HIDDEN_BOSS_VERSIONS[CURRENT_HIDDEN_BOSS_VERSION];
const ARMY_SIZE = 8;
/** Long enough for the board to let the greeting of the allies just placed fade. */
const WELCOME_MS = 1500;
const checks = [];
const errors = [];
let dev, browser;

/** Rings gained minus rings broken between two states: what the body's length must show. */
const change = ({ before, after }) => after.grown - before.grown - (after.broken - before.broken);
const fixtureState = (page) => page.evaluate(() => window.bossFixture.state());
const runUntil = (page, moment) => page.evaluate((m) => window.bossFixture.runUntil(m), moment);
/** Lets the board draw what the rules now hold, then gives the state it drew. */
async function drawn(page) {
  const { frames } = await fixtureState(page);
  await page.waitForFunction((n) => window.bossFixture.state().frames >= n + 3, frames);
  return fixtureState(page);
}

async function onTheBench(size, touch) {
  const name = `${size.width}x${size.height}`;
  const context = await browser.newContext({
    locale: 'fr-CH',
    viewport: size,
    deviceScaleFactor: 1,
    hasTouch: touch,
    isMobile: touch,
    reducedMotion: touch ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
  await page.goto(`http://127.0.0.1:${DEV_PORT}/${fixture}?seed=${SEED}`);
  await page.waitForFunction(() => window.bossFixture?.phaser.scene.isActive('Battle'));
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  const ready = await drawn(page);
  assert.equal(ready.status, 'preparing', `${name}: the camp prepares`);
  assert.equal(ready.gold, TUNING.startGold, `${name}: the purse of version 1`);
  assert.equal(ready.label, null, `${name}: no boss while the camp prepares`);
  assert.equal(await page.evaluate(() => window.bossFixture.prepare()), ARMY_SIZE);
  // The words that greet each ally placed fade away before the wave (0.9 s of drawing).
  await page.waitForTimeout(WELCOME_MS);
  await page.locator('#start').click();
  const started = await fixtureState(page);
  assert.equal(started.status, 'fighting', `${name}: the real button starts the wave`);
  assert.equal(started.rings, TUNING.startRings);

  await runUntil(page, 'enter');
  const entered = await drawn(page);
  assert.equal(entered.label, String(TUNING.startRings), `${name}: the rings counted on the board`);
  await page.screenshot({ path: `${folder}/${name}-debut.png` });

  const swallow = await runUntil(page, 'swallow');
  assert.equal(swallow.after.status, 'fighting', `${name}: still fighting when it swallows`);
  assert.equal(swallow.after.grown, swallow.before.grown + 1, `${name}: one more ring`);
  assert.equal(swallow.after.rings, swallow.before.rings + change(swallow), `${name}: its length`);
  assert.equal(swallow.after.rings, swallow.last + 1, `${name}: the step of the swallow`);
  assert.ok(swallow.after.gulp > 0, `${name}: it stands still to swallow`);
  const swallowed = await drawn(page);
  assert.equal(swallowed.label, String(swallow.after.rings), `${name}: the board counts it`);
  await page.screenshot({ path: `${folder}/${name}-avale.png` });

  const broken = await runUntil(page, 'break');
  assert.equal(broken.after.broken, broken.before.broken + 1, `${name}: a broken ring is gone`);
  assert.equal(broken.after.rings, broken.before.rings + change(broken), `${name}: its length`);
  assert.equal(broken.after.rings, broken.last - 1, `${name}: the step of the break`);
  assert.equal(broken.after.gold, broken.before.gold + TUNING.ringCoins, `${name}: its coins`);
  const shorter = await drawn(page);
  assert.equal(shorter.label, String(broken.after.rings), `${name}: the board counts one less`);

  const end = await runUntil(page, 'end');
  assert.equal(end.after.status, 'won', `${name}: only the head is left`);
  assert.equal(end.after.rings, 0);
  assert.equal(end.after.asleep, true);
  await page.waitForTimeout(400);
  const won = await drawn(page);
  assert.equal(won.label, '0', `${name}: no ring left`);
  await page.screenshot({ path: `${folder}/${name}-victoire.png` });
  checks.push(
    `${name}: ${TUNING.startRings} anneaux au départ, avalé un allié à ${swallow.after.time.toFixed(0)} s ` +
      `(${swallow.last} → ${swallow.after.rings}), anneau cassé (${broken.last} → ` +
      `${broken.after.rings}, +${TUNING.ringCoins} pièces), victoire à ${end.after.time.toFixed(0)} s ` +
      `après ${end.after.allies} alliés avalés et ${end.after.broken} anneaux cassés`,
  );
  await context.close();
}

try {
  await mkdir(folder, { recursive: true });
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/hidden-boss-harness.ts"',
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
  assert.deepEqual(errors, []);
  await writeFile(`${folder}/report.json`, JSON.stringify({ checks, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ checks }, null, 2));
} finally {
  await browser?.close();
  dev?.kill();
  await rm(fixture, { force: true });
}
