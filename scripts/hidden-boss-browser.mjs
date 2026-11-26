// Recette de Classic Snake, le boss caché (lots 2 et 3, 26 novembre 2026). Dans un vrai
// navigateur, le vrai jeu servi par Vite (la page `index.html` et `src/main.ts`, sans banc
// d'essai) : on pose des pommes dans le carnet du joueur et un camp de la grande aventure, puis
// on regarde l'accueil (rien à 0 pomme, « 5 / 12 » à 5, le bouton « Classic Snake » à 12, sans
// qu'aucune autre chose du premier écran ne bouge), on touche le bouton (le combat, ses images
// et ses mots n'arrivent qu'à ce moment), on prépare le camp, on lance la vague avec le vrai
// bouton, on regarde le boss sortir, avaler un allié, perdre un anneau, s'endormir, l'écran de
// victoire, puis une défaite et son écran, le retour à l'accueil, et un rechargement en plein
// combat qui ramène à l'accueil sans rien toucher du camp gardé. Le combat est avancé pas à pas
// depuis la recette (mêmes pas de 1/30 s que le jeu), sur la partie que le jeu a lui-même mise
// sur le plateau. En 780×360 (tactile, mouvements réduits) et 1280×800. Captures dans
// artifacts/classic-snake/ (jamais dans Git).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { HIDDEN_BOSS_VERSIONS, CURRENT_HIDDEN_BOSS_VERSION } from '../src/hiddenBossTuning.ts';
import { APPLES_TO_UNLOCK } from '../src/apples.ts';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { CURRENT_BALANCE_REVISION } from '../src/balanceRevision.ts';
import {
  APPLES_STORAGE_KEY,
  CAMP_STORAGE_KEY,
  COMPUTER,
  LANGUAGE_KEY,
  PHONE,
  WIDE_PHONE,
  launchChromium,
} from './lib/recipe.mjs';

const folder = 'artifacts/classic-snake';
const DEV_PORT = 4394;
const URL = `http://127.0.0.1:${DEV_PORT}/`;
/** A battle that the camp of the recipe wins, after swallowing allies (seed 1, version 1). */
const SEED = 1;
const TUNING = HIDDEN_BOSS_VERSIONS[CURRENT_HIDDEN_BOSS_VERSION];
/** The camp the recipe buys: three shields in front, three archers behind, a club, a medic. */
const ARMY = [
  ['shield', 660, 180],
  ['shield', 660, 324],
  ['shield', 696, 444],
  ['archer', 900, 180],
  ['archer', 900, 324],
  ['archer', 900, 468],
  ['club', 708, 324],
  ['medic', 948, 324],
];
/** Long enough for the board to let the greeting of the allies just placed fade. */
const WELCOME_MS = 1500;
/** Steps of play the recipe runs at most before it gives up waiting. */
const STEP_LIMIT = 30 * 600;
/** The things of the first screen that must not move when the apples appear. */
const HOME_PIECES = [
  'home-primary',
  'home-voyage',
  'home-expeditions',
  'home-classic',
  'home-caprice-album',
  'home-army',
  'home-parents',
  'player-chip',
  'home-settings',
  'home-next-mission',
  'home-active-team',
];
/** A window standing up (a tablet, a computer): the first screen lays the places on three rows. */
const STANDING = Object.freeze({ width: 600, height: 900 });
/** What the battle of Classic Snake brings with it: asked for at the first touch only. */
const PACKAGE = /classicSnakeBattle|hiddenBoss|bossChain|classic-snake-(?:tete|anneau|queue)/;
const checks = [];
const errors = [];
let dev, browser;

/** A camp of the great adventure before its third wave: it must come out of it untouched. */
function classicCamp() {
  const game = new Game(33, undefined, undefined, CURRENT_BALANCE_REVISION);
  for (let wave = 1; wave <= 2; wave++) {
    assert.ok(game.startWave());
    while (game.status === 'fighting') game.step(0.05);
  }
  return encodeCheckpoint(game);
}
const applesFound = (count) =>
  JSON.stringify({ version: 1, found: Array.from({ length: count }, (_, i) => `${i + 1}:3`) });

/** Where each piece of the first screen is drawn. */
const homeBoxes = (page) =>
  page.evaluate((ids) => {
    const boxes = {};
    for (const id of ids) {
      const node = document.getElementById(id);
      if (!node || !node.getClientRects().length) continue;
      const { x, y, width, height } = node.getBoundingClientRect();
      boxes[id] = [x, y, width, height].map((n) => Math.round(n * 10) / 10);
    }
    return boxes;
  }, HOME_PIECES);
const visible = (page, id) =>
  page.evaluate((i) => {
    const node = document.getElementById(i);
    return (
      !!node && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden'
    );
  }, id);
const text = (page, id) => page.evaluate((i) => document.getElementById(i).textContent.trim(), id);
/** The whole storage of the device, but the words of the language. */
const storage = (page) =>
  page.evaluate(() => Object.fromEntries(Object.entries(localStorage).sort()));

/** Plays on, step after step, from the recipe, until `moment`; the state before and after. */
const runUntil = (page, moment) =>
  page.evaluate(
    async ({ moment, limit }) => {
      const { ringsOf } = await import('/src/engine/bossChain.ts');
      const { battleOver } = await import('/src/game.ts');
      const game = window.bossSession.game;
      const state = () => {
        const chain = game.hiddenBoss.chain;
        return {
          status: game.status,
          time: game.time,
          gold: game.gold,
          rings: ringsOf(game).length,
          allies: chain?.allies ?? 0,
          broken: chain?.broken ?? 0,
          grown: chain?.grown ?? 0,
          gulp: chain?.gulp ?? 0,
          asleep: chain?.asleep ?? false,
        };
      };
      const reached = {
        enter: () => (game.hiddenBoss.chain?.head.x ?? 0) >= 380,
        swallow: (before) => (game.hiddenBoss.chain?.allies ?? 0) > before.allies,
        break: (before) => (game.hiddenBoss.chain?.broken ?? 0) > before.broken,
        end: () => battleOver(game),
      };
      const before = state();
      let last = before.rings;
      for (let i = 0; i < limit && !battleOver(game) && !reached[moment](before); i++) {
        last = ringsOf(game).length;
        game.step(1 / 30);
      }
      return { before, last, after: state() };
    },
    { moment, limit: STEP_LIMIT },
  );
/** Lets the board draw a few frames; the ring count it then writes on the plate. */
async function drawnRings(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0;
        const next = () => (++frames >= 6 ? resolve() : requestAnimationFrame(next));
        requestAnimationFrame(next);
      }),
  );
  return page.evaluate(() => document.getElementById('game').dataset.bossRings ?? null);
}

/** The first screen with `count` apples in the player's book: what shows in the den. */
async function homeWith(page, count, name, baseline) {
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [APPLES_STORAGE_KEY, applesFound(count)],
  );
  await page.reload();
  await page.waitForSelector('#home-screen:not([hidden])');
  await page.waitForFunction(() => document.fonts.status === 'loaded');
  const boxes = await homeBoxes(page);
  if (baseline) assert.deepEqual(boxes, baseline, `${name}: nothing else moves (${count})`);
  const counter = await visible(page, 'home-apples-count');
  const door = await visible(page, 'home-classic-snake');
  if (!count) {
    assert.equal(counter || door || (await visible(page, 'home-apples')), false, `${name}: secret`);
  } else if (count < APPLES_TO_UNLOCK) {
    assert.equal(counter, true, `${name}: the apples counted`);
    assert.equal(door, false, `${name}: no button before ${APPLES_TO_UNLOCK}`);
    assert.equal(await text(page, 'home-apples-count'), `${count} / ${APPLES_TO_UNLOCK}`);
    assert.equal(
      await page.locator('#home-apples-count').getAttribute('aria-label'),
      `Pommes trouvées : ${count} sur ${APPLES_TO_UNLOCK}`,
    );
  } else {
    assert.equal(counter, false, `${name}: the counter gives way to the button`);
    assert.equal(door, true, `${name}: the button of Classic Snake`);
    assert.equal(await text(page, 'home-classic-snake'), 'Classic Snake');
    const box = await page.locator('#home-classic-snake').boundingBox();
    const view = page.viewportSize();
    assert.ok(box.width >= 48 && box.height >= 48, `${name}: a 48 px target`);
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= view.width, `${name}: on screen`);
    // The button is the one touched there, not the picture of the den beneath it.
    const hit = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.id,
      { x: box.x + box.width / 2, y: box.y + box.height - 8 },
    );
    assert.equal(hit, 'home-classic-snake', `${name}: the button answers the finger`);
  }
  await page.screenshot({ path: `${folder}/${name}-accueil-${count}-pommes.png` });
  return boxes;
}

async function onTheGame(size, touch) {
  const name = `${size.width}x${size.height}`;
  const camp = classicCamp();
  const context = await browser.newContext({
    locale: 'fr-CH',
    viewport: size,
    deviceScaleFactor: 1,
    hasTouch: touch,
    isMobile: touch,
    reducedMotion: touch ? 'reduce' : 'no-preference',
  });
  await context.addInitScript(
    ({ entries, seed }) => {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1');
        for (const [key, value] of entries) localStorage.setItem(key, value);
      }
      // The seed of a battle of Classic Snake is drawn by the game when its button is touched:
      // the recipe gives its own, once it asks for it, to play a battle it knows.
      const draw = crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues = (array) => {
        if (window.bossSeed && array instanceof Uint32Array && array.length === 1) {
          array[0] = seed;
          return array;
        }
        return draw(array);
      };
    },
    {
      entries: [
        [LANGUAGE_KEY, 'fr'],
        [CAMP_STORAGE_KEY, camp],
      ],
      seed: SEED,
    },
  );
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
  const asked = [];
  page.on('request', (request) => {
    if (PACKAGE.test(request.url())) asked.push(request.url());
  });
  await page.goto(URL);
  await page.waitForSelector('#home-screen:not([hidden])');

  // The first screen: 0, 5, then 12 apples, and nothing else moves.
  const baseline = await homeWith(page, 0, name);
  await homeWith(page, 5, name, baseline);
  await homeWith(page, APPLES_TO_UNLOCK, name, baseline);
  assert.deepEqual(asked, [], `${name}: nothing of the battle before the touch`);
  checks.push(`${name}: accueil — rien à 0 pomme, « 5 / 12 » à 5, bouton à 12, rien ne bouge`);
  // The classic page offers the camp kept; it must offer it the same after the battle.
  await page.evaluate(() => document.getElementById('home-classic').click());
  const resume = await text(page, 'home-continue');
  assert.equal(await visible(page, 'home-continue'), true, `${name}: a camp to resume`);
  await page.evaluate(() => document.getElementById('home-back').click());
  const kept = await storage(page);

  // The button: the battle, its pictures and its words arrive now.
  await page.evaluate(async () => {
    const { Session } = await import('/src/session.ts');
    const advance = Session.prototype.advance;
    Session.prototype.advance = function (delta) {
      window.bossSession = this;
      return advance.call(this, delta);
    };
    window.bossSeed = true;
  });
  const door = page.locator('#home-classic-snake');
  if (touch) await door.tap();
  else await door.click();
  await page.locator('#start').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.bossSession?.game.hiddenBoss);
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  assert.ok(
    asked.some((url) => /classicSnakeBattle|hiddenBoss\.ts/.test(url)),
    'the package',
  );
  for (const piece of ['tete', 'anneau', 'queue'])
    assert.ok(
      asked.some((url) => url.includes(`classic-snake-${piece}`)),
      piece,
    );
  const ready = await page.evaluate(() => {
    const game = window.bossSession.game;
    return {
      status: game.status,
      gold: game.gold,
      version: game.hiddenBoss.version,
      seed: game.initialSeed,
    };
  });
  assert.deepEqual(ready, {
    status: 'preparing',
    gold: TUNING.startGold,
    version: CURRENT_HIDDEN_BOSS_VERSION,
    seed: SEED,
  });
  assert.equal(await drawnRings(page), null, `${name}: no boss while the camp prepares`);
  await page.screenshot({ path: `${folder}/${name}-preparation.png` });
  const placed = await page.evaluate(
    (army) => army.filter(([kind, x, y]) => window.bossSession.game.recruit(kind, x, y)).length,
    ARMY,
  );
  assert.equal(placed, ARMY.length);
  await page.waitForTimeout(WELCOME_MS);
  await page.locator('#start').click();
  assert.equal(await page.evaluate(() => window.bossSession.game.status), 'fighting');

  await runUntil(page, 'enter');
  assert.equal(await drawnRings(page), String(TUNING.startRings), `${name}: rings on the board`);
  await page.screenshot({ path: `${folder}/${name}-debut.png` });

  const swallow = await runUntil(page, 'swallow');
  assert.equal(swallow.after.status, 'fighting', `${name}: still fighting when it swallows`);
  assert.equal(swallow.after.grown, swallow.before.grown + 1, `${name}: one more ring`);
  assert.equal(swallow.after.rings, swallow.last + 1, `${name}: the step of the swallow`);
  assert.ok(swallow.after.gulp > 0, `${name}: it stands still to swallow`);
  assert.equal(await drawnRings(page), String(swallow.after.rings), `${name}: counted`);
  await page.screenshot({ path: `${folder}/${name}-avale.png` });

  const broken = await runUntil(page, 'break');
  assert.equal(broken.after.broken, broken.before.broken + 1, `${name}: a broken ring is gone`);
  assert.equal(broken.after.rings, broken.last - 1, `${name}: the step of the break`);
  assert.equal(broken.after.gold, broken.before.gold + TUNING.ringCoins, `${name}: its coins`);

  const end = await runUntil(page, 'end');
  assert.equal(end.after.status, 'won', `${name}: only the head is left`);
  assert.equal(end.after.asleep, true);
  await page.locator('#battle-result').waitFor({ state: 'visible' });
  await page.waitForTimeout(touch ? 300 : 1800);
  assert.equal(await drawnRings(page), '0', `${name}: no ring left`);
  const rings = (n) => `${n} anneau${n > 1 ? 'x' : ''}`;
  assert.equal(await text(page, 'battle-result-title'), 'Classic Snake s’endort\u00a0!');
  assert.equal(await visible(page, 'battle-result-stars'), false, `${name}: no stars`);
  assert.equal(
    await text(page, 'battle-result-summary'),
    `Tes alliés ont cassé ${rings(end.after.broken)}. Il a grandi de ${rings(end.after.grown)}.`,
  );
  await resultButtons(page, name);
  await page.screenshot({ path: `${folder}/${name}-victoire.png` });
  checks.push(
    `${name}: ${TUNING.startRings} anneaux au départ, avalé un allié à ` +
      `${swallow.after.time.toFixed(0)} s (${swallow.last} → ${swallow.after.rings}), anneau ` +
      `cassé (+${TUNING.ringCoins} pièces), victoire à ${end.after.time.toFixed(0)} s après ` +
      `${end.after.allies} alliés avalés et ${end.after.broken} anneaux cassés ; écran de victoire`,
  );

  // « Rejouer contre Classic Snake »: a new battle; the camp is left as it is: it falls.
  await page.locator('#end-restart').click();
  await page.waitForFunction(() => window.bossSession.game.status === 'preparing');
  await page.locator('#start').click();
  const lost = await runUntil(page, 'end');
  assert.equal(lost.after.status, 'lost', `${name}: the head reached the crystal`);
  await page.locator('#battle-result').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  assert.equal(await text(page, 'battle-result-title'), 'Classic Snake a atteint le cristal');
  assert.match(await text(page, 'battle-result-summary'), /On réessaie\u00a0\?$/);
  assert.equal(await visible(page, 'battle-result-stars'), false);
  await resultButtons(page, name);
  await page.screenshot({ path: `${folder}/${name}-defaite.png` });
  checks.push(`${name}: défaite après ${lost.after.time.toFixed(0)} s, écran de défaite`);

  // « Retour à l'accueil »: the home, its button, and the camp of the adventure as it was.
  await page.locator('#end-home').click();
  await page.waitForSelector('#home-screen:not([hidden])');
  assert.equal(await visible(page, 'home-classic-snake'), true, `${name}: to play again`);
  assert.deepEqual(await storage(page), kept, `${name}: nothing written by the battle`);
  await page.evaluate(() => document.getElementById('home-classic').click());
  assert.equal(await text(page, 'home-continue'), resume, `${name}: the same camp to resume`);
  await page.evaluate(() => document.getElementById('home-back').click());

  // A reload during a battle: the home again, the camp kept untouched, nothing to resume.
  await page.locator('#home-classic-snake').click();
  await page.locator('#start').waitFor({ state: 'visible' });
  await page.evaluate(() => window.bossSession.game.recruit('archer', 900, 324));
  await page.locator('#start').click();
  await runUntil(page, 'enter');
  await page.reload();
  await page.waitForSelector('#home-screen:not([hidden])');
  assert.equal(await visible(page, 'app'), false, `${name}: the reload goes home`);
  assert.equal(await visible(page, 'home-classic-snake'), true);
  assert.deepEqual(await storage(page), kept, `${name}: the camp kept, untouched`);
  assert.notEqual(await text(page, 'home-primary'), '', `${name}: the big button`);
  await page.evaluate(() => document.getElementById('home-classic').click());
  assert.equal(await text(page, 'home-continue'), resume, `${name}: « Reprendre » the camp`);
  checks.push(`${name}: retour à l'accueil et rechargement en plein combat — camp gardé intact`);
  await context.close();
}

/** The first screen alone, at another size: the den shows the apples, nothing else moves. */
async function homeOnly(size) {
  const name = `${size.width}x${size.height}`;
  const context = await browser.newContext({
    locale: 'fr-CH',
    viewport: size,
    deviceScaleFactor: 1,
  });
  await context.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(key, value);
    },
    [LANGUAGE_KEY, 'fr'],
  );
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
  await page.goto(URL);
  await page.waitForSelector('#home-screen:not([hidden])');
  const baseline = await homeWith(page, 0, name);
  await homeWith(page, 5, name, baseline);
  await homeWith(page, APPLES_TO_UNLOCK, name, baseline);
  checks.push(`${name}: accueil — rien à 0 pomme, « 5 / 12 » à 5, bouton à 12, rien ne bouge`);
  await context.close();
}

/** The two buttons of the end: play Classic Snake again (honey, on top), and go home. */
async function resultButtons(page, name) {
  const again = page.locator('#end-restart');
  const home = page.locator('#end-home');
  assert.equal(await again.textContent(), 'Rejouer contre Classic Snake');
  assert.equal(await home.textContent(), 'Retour à l’accueil');
  assert.ok(await again.evaluate((n) => n.classList.contains('primary')), `${name}: honey`);
  assert.equal(await visible(page, 'mission-battle-actions'), false, `${name}: no mission`);
  const [top, bottom] = [await again.boundingBox(), await home.boundingBox()];
  assert.ok(top.y < bottom.y, `${name}: « Rejouer » first`);
  for (const box of [top, bottom]) assert.ok(box.height >= 44, `${name}: buttons for a finger`);
}

try {
  await mkdir(folder, { recursive: true });
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
      if ((await fetch(URL)).ok) break;
    } catch {}
    if (i > 200) throw Error('Game unavailable');
    await delay(100);
  }
  browser = await launchChromium();
  await onTheGame(PHONE, true);
  await onTheGame(COMPUTER, false);
  await homeOnly(WIDE_PHONE);
  await homeOnly(STANDING);
  assert.deepEqual(errors, []);
  await writeFile(`${folder}/report.json`, JSON.stringify({ checks, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ checks }, null, 2));
} finally {
  await browser?.close();
  dev?.kill();
}
