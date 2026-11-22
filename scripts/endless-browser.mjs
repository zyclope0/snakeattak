// Recette de l'aventure sans fin (20 novembre 2026) : la porte fermée puis ouverte, le record
// du joueur, le cadeau d'après un roi, « Continuer », « Rentrer avec mon record », l'écran de
// fin, le choix du cadeau remplacé quand les cinq places sont prises. Les camps sont écrits
// par le vrai moteur, puis relus par le jeu construit, à 780×360, 812×375 et 1280×800.
import { spawn } from 'node:child_process';
import { registerHooks } from 'node:module';
import { setTimeout } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp') || url.includes('.mp3'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { Game } = await import('../src/game.ts');
const { ENDLESS_RULES } = await import('../src/endless.ts');
const { encodeCheckpoint } = await import('../src/checkpoints.ts');
const { freshRosters } = await import('../src/roster.ts');
const KEYS = await import('../src/storageKeys.ts');
const { TAP_HOLD_MS } = await import('../src/ui/tapHold.ts');

const rules = ENDLESS_RULES[1];
/** Closes the wave `wave` as if every snake had fallen at once. */
function clear(game, wave) {
  game.wave = wave - 1;
  game.status = 'preparing';
  game.rewards.pending = null;
  assert.ok(game.startWave());
  game.remaining = 0;
  game.enemies = [];
  game.eggs = [];
  game.step(1 / 30);
}
/** Just past the time a control that changed meaning takes no touch (`src/ui/tapHold.ts`). */
const HOLD = TAP_HOLD_MS + 50;
/** The camp right after the first king, its gift still to choose. */
function afterKing() {
  const game = new Game(4242, undefined, undefined, rules.balance, undefined, rules);
  clear(game, 12);
  return encodeCheckpoint(game);
}
/** Three kings beaten, five places full, and « la longue-vue » among the gifts offered. */
function placesFull() {
  for (let seed = 1; seed < 500; seed++) {
    const game = new Game(seed, undefined, undefined, rules.balance, undefined, rules);
    for (let king = 0; king < 3; king++) clear(game, 12);
    game.rewards.pending = 12;
    const five = ['forge', 'armure', 'marche', 'rente', 'solide'].map((id) => ({ id, level: 1 }));
    assert.ok(game.restoreEndless(five));
    if (game.boonOffer.includes('vue')) return encodeCheckpoint(game);
  }
  throw Error('no seed offers la longue-vue');
}
const career = (won) =>
  JSON.stringify({
    version: 1,
    bestStars: won ? [3, 3, 3] : [0, 0, 0],
    rosters: freshRosters(),
    activeRoster: 0,
    chapterCamps: [null, null],
  });

const origin = 'http://127.0.0.1:4189';
const folder = 'artifacts/endless';
await mkdir(folder, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4189',
    '--strictPort',
  ],
  { stdio: 'ignore' },
);
let browser;
const checks = [];
try {
  const deadline = Date.now() + 15000;
  while (true) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {
      /* not yet */
    }
    if (Date.now() > deadline) throw Error('preview did not start');
    await setTimeout(200);
  }
  browser = await chromium.launch();
  /** A fresh page whose storage holds `stored`, written once before the game starts. */
  async function open(size, stored) {
    const page = await browser.newPage({ viewport: size });
    await page.addInitScript(
      (entries) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        for (const [key, value] of entries) localStorage.setItem(key, value);
      },
      Object.entries({ [KEYS.LANGUAGE_KEY]: 'fr', ...stored }),
    );
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(origin);
    // A camp under way opens on its board; otherwise the home shows, and its classic page.
    await page.locator('#home-primary:visible, #start:visible').first().waitFor();
    if (await page.locator('#home-primary').isVisible())
      await page.evaluate(() => document.querySelector('[data-home-target="classic"]').click());
    return { page, errors };
  }
  const text = (page, id) => page.locator(`#${id}`).textContent();
  const shown = (page, id) => page.locator(`#${id}`).isVisible();
  const fits = async (page, label) => {
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewport = page.viewportSize().width;
    assert.ok(width <= viewport, `${label}: no sideways scroll (${width} > ${viewport})`);
  };
  const tall = async (page, selector, label) => {
    for (const box of await page
      .locator(selector)
      .evaluateAll((list) =>
        list.filter((e) => !e.hidden).map((e) => e.getBoundingClientRect().height),
      ))
      assert.ok(box >= 48, `${label}: touch target of ${box}px`);
  };

  for (const [width, height] of [
    [780, 360],
    [812, 375],
    [1280, 800],
  ]) {
    const size = { width, height };
    const name = `${width}x${height}`;

    // Before King Snake is beaten: the door is closed and says how to open it.
    {
      const { page, errors } = await open(size, { [KEYS.CAREER_STORAGE_KEY]: career(false) });
      assert.equal(await page.locator('#home-endless').isDisabled(), true, `${name}: closed`);
      assert.equal(await text(page, 'endless-note'), 'Bats King Snake d’abord');
      assert.deepEqual(errors, []);
      await page.close();
    }

    // King Snake beaten: the door, the player's own record, a new endless game.
    {
      const { page, errors } = await open(size, {
        [KEYS.CAREER_STORAGE_KEY]: career(true),
        [KEYS.ENDLESS_RECORDS_KEY]: JSON.stringify({
          version: 1,
          best: [{ wave: 31, kings: 2, rules: 1, run: 1 }],
        }),
      });
      assert.equal(await page.locator('#home-endless').isEnabled(), true, `${name}: open`);
      assert.equal(await text(page, 'endless-note'), 'Ton record : vague 31');
      await page.screenshot({ path: `${folder}/${name}-porte.png` });
      await page.click('#home-endless');
      await page.locator('#start').waitFor();
      assert.equal(await text(page, 'wave-kings'), '· rois : 0');
      assert.equal(await shown(page, 'wave-of'), false, `${name}: no « / 12 »`);
      assert.deepEqual(errors, []);
      await page.close();
    }

    // The camp after a king: a gift, then « Continuer » or « Rentrer avec mon record ».
    {
      const { page, errors } = await open(size, {
        [KEYS.CAREER_STORAGE_KEY]: career(true),
        [KEYS.CAMP_STORAGE_KEY]: afterKing(),
      });
      if (await page.locator('#home-continue').isVisible()) {
        assert.equal(await text(page, 'home-continue'), 'Continuer · vague 13');
        await page.click('#home-continue');
      }
      await page.locator('#reward-panel').waitFor();
      assert.equal(await text(page, 'reward-title'), 'King Snake est vaincu ! Choisis ton cadeau');
      assert.equal(await page.locator('#reward-cards button:visible').count(), 3);
      await tall(page, '#reward-cards button', name);
      await fits(page, `${name} gift`);
      await page.screenshot({ path: `${folder}/${name}-cadeau.png` });
      await page.locator('#reward-cards button:visible').first().click();
      assert.equal(await text(page, 'start'), 'Continuer');
      assert.equal(await shown(page, 'endless-home'), true);
      await tall(page, '#endless-home', name);
      await fits(page, `${name} camp`);
      await page.screenshot({ path: `${folder}/${name}-continuer.png` });
      // Home with the record: the record is written since the king fell; the game waits.
      await page.click('#endless-home');
      await page.locator('#home-screen').waitFor();
      await page.evaluate(() => document.querySelector('[data-home-target="classic"]').click());
      assert.equal(await text(page, 'endless-note'), 'Ton record : vague 12');
      assert.equal(await text(page, 'home-continue'), 'Continuer · vague 13');
      const records = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)),
        KEYS.ENDLESS_RECORDS_KEY,
      );
      assert.deepEqual(records.best, [{ wave: 12, kings: 1, rules: 1, run: 4242 }]);
      await page.screenshot({ path: `${folder}/${name}-rentre.png` });
      assert.deepEqual(errors, []);
      await page.close();
    }

    // Five places full: a new gift asks which one gives its place, or keeps them all.
    {
      const { page, errors } = await open(size, {
        [KEYS.CAREER_STORAGE_KEY]: career(true),
        [KEYS.CAMP_STORAGE_KEY]: placesFull(),
      });
      if (await page.locator('#home-continue').isVisible()) await page.click('#home-continue');
      await page.locator('#reward-panel').waitFor();
      await page.click('#reward-cards button[data-reward="vue"]');
      assert.equal(await text(page, 'reward-title'), 'Tes 5 places sont prises');
      assert.equal(await page.locator('#reward-cards button:visible').count(), 5);
      // The cards and the button have just changed meaning: they take no touch for a short
      // while (a double tap must neither replace a gift nor skip the offer). The recipe waits
      // as a child's finger does; `scripts/hygiene/reward-double-tap.ts` checks the hold.
      await page.screenshot({ path: `${folder}/${name}-remplacer.png` });
      await page.waitForTimeout(HOLD);
      await page.click('#skip-reward');
      assert.equal(await text(page, 'reward-title'), 'King Snake est vaincu ! Choisis ton cadeau');
      await page.waitForTimeout(HOLD);
      await page.click('#reward-cards button[data-reward="vue"]');
      await page.waitForTimeout(HOLD);
      await page.click('#reward-cards button[data-reward="rente"]');
      assert.equal(await shown(page, 'reward-panel'), false, `${name}: gift taken`);
      assert.match(await text(page, 'reward-summary'), /La longue-vue ★/);
      assert.doesNotMatch(await text(page, 'reward-summary'), /La rente/);
      await fits(page, `${name} replaced`);
      assert.deepEqual(errors, []);
      await page.close();
    }
    checks.push(name);
  }
  console.log(JSON.stringify({ endless: checks, screenshots: folder }));
} finally {
  // A browser that will not close gets ten seconds; once it has closed, the wait is
  // called off so that it does not hold the process.
  const grace = new AbortController();
  await Promise.race([
    browser?.close(),
    setTimeout(10_000, null, { signal: grace.signal }).catch(() => {}),
  ]);
  grace.abort();
  server.kill();
}
