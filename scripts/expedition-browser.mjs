// Recette de « La Grande Expédition » (20 et 21 novembre 2026) : la porte de l'accueil, qui a
// pris la place du voyage (un voyage commencé se finit d'abord), la route du tableau et ses
// embranchements, une vraie mission gagnée sur le plateau, le cadeau avec sa relance, les deux
// chemins, la halte et la roulotte, les cinq places pleines, l'arrivée. Les états sont écrits
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
const X = await import('../src/expedition.ts');
const KEYS = await import('../src/storageKeys.ts');
const { planVoyage } = await import('../src/voyage.ts');
const { CURRENT_VOYAGE_VERSION } = await import('../src/voyageTuning.ts');
const FR = await import('../src/texts/fr/expedition.ts');
const EN = await import('../src/texts/en/expedition.ts');
const HOME = await import('../src/texts/fr/home.ts');
const HOME_EN = await import('../src/texts/en/home.ts');

const SEED = 4242;
const plan = X.planExpedition(SEED);
const win = (state, path) => {
  const game = X.createExpeditionGame(plan, state, path);
  game.status = 'won';
  return X.winBattle(plan, state, game, path);
};
const log = (current) => JSON.stringify({ version: 1, best: X.battlesWon(current), current });
/** The first halt of the seed, with a roulotte among its two and coins to spend. */
function atRoulotte() {
  let state = X.skipGift(win(X.startExpedition(SEED)));
  state = X.skipGift(win(state, 'calm'));
  const halts = plan.tableaux[0][state.step].halts;
  assert.ok(halts.includes('roulotte'), 'seed 4242 offers the roulotte at its first halt');
  return {
    state: { ...state, camp: { ...state.camp, gold: 420 } },
    choice: halts.indexOf('roulotte'),
  };
}
/** A gift to choose with the five places full, and a new lasting gift among the three. */
function placesFull() {
  const five = ['forge', 'armure', 'marche', 'rente', 'solide'].map((id) => ({ id, level: 1 }));
  let state = X.startExpedition(SEED);
  for (let guard = 0; guard < 40; guard++) {
    if (state.pending?.kind === 'gift') {
      const full = { ...state, boons: five };
      if (X.giftOffer(full).some((id) => id === 'vue' || id === 'miel')) return full;
      state = X.skipGift(state);
    } else if (state.pending?.kind === 'roulotte') state = X.leaveRoulotte(state);
    else if (X.expeditionPhase(state) === 'halt') state = X.chooseHalt(plan, state, 0);
    else state = win(state, 'calm');
  }
  throw Error('no gift offers a new lasting gift');
}
function arrived() {
  let state = X.startExpedition(SEED);
  while (state.status === 'travelling') {
    const phase = X.expeditionPhase(state);
    if (phase === 'gift') state = X.skipGift(state);
    else if (phase === 'roulotte') state = X.leaveRoulotte(state);
    else if (phase === 'halt') state = X.chooseHalt(plan, state, 0);
    else state = win(state, 'calm');
  }
  return state;
}

const origin = 'http://127.0.0.1:4192';
const folder = 'artifacts/expedition';
await mkdir(folder, { recursive: true });
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4192',
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
  /** A fresh page whose storage holds `stored`, on the home; `enter()` opens the expedition. */
  async function open(size, stored = {}, language = 'fr') {
    const page = await browser.newPage({ viewport: size });
    await page.addInitScript(
      (entries) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        for (const [key, value] of entries) localStorage.setItem(key, value);
      },
      Object.entries({ [KEYS.LANGUAGE_KEY]: language, ...stored }),
    );
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(origin);
    await page.locator('#home-voyage').waitFor();
    return { page, errors };
  }
  /** The door of the home, beside « Jouer », now « La Grande Expédition ». */
  const enter = (page) => page.click('#home-voyage');
  const text = async (page, selector) =>
    (await page.locator(selector).first().textContent()).replace(/\s+/g, ' ').trim();
  const stored = (page) =>
    page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEYS.EXPEDITION_STORAGE_KEY);
  /** No sideways scroll, a panel that shows its content, every button a 48 px target. */
  async function fits(page, label) {
    const box = await page.evaluate(() => {
      const panel = document.querySelector('.expedition-page .voyage-panel');
      const small = [...document.querySelectorAll('.expedition-page button')]
        .filter((b) => b.getClientRects().length && !b.classList.contains('stop-caprice'))
        .map((b) => [b.textContent.trim(), Math.round(b.getBoundingClientRect().height)])
        .filter(([, height]) => height < 48);
      return {
        width: document.documentElement.scrollWidth,
        spill: panel.scrollHeight - panel.clientHeight,
        small,
      };
    });
    assert.ok(box.width <= page.viewportSize().width, `${label}: sideways scroll ${box.width}`);
    assert.ok(box.spill <= 8, `${label}: the panel hides ${box.spill}px`);
    assert.deepEqual(box.small, [], `${label}: small touch targets`);
  }
  const status = (page) => page.locator('#app').getAttribute('data-status');
  /** Plays the mission on the board to its end without placing anyone, on a fast clock. */
  async function playOut(page) {
    await page.locator('#speed').click();
    await page.clock.install();
    for (let wave = 0; wave < 8 && (await status(page)) === 'preparing'; wave++) {
      await page.locator('#start').click();
      for (let step = 0; step < 240 && (await status(page)) === 'fighting'; step++)
        await page.clock.runFor(1000);
    }
    await page.clock.runFor(400);
    return status(page);
  }

  for (const [width, height] of [
    [780, 360],
    [812, 375],
    [1280, 800],
  ]) {
    const size = { width, height };
    const name = `${width}x${height}`;

    // A first visit: the door says « Nouveau », opens the first tableau, plays mission 1.
    {
      const { page, errors } = await open(size);
      assert.equal(await text(page, '#home-voyage span'), HOME.laGrandeExpedition);
      assert.equal(await page.locator('#home-voyage .voyage-new').isVisible(), true);
      await page.screenshot({ path: `${folder}/${name}-porte.png` });
      await enter(page);
      await page.locator('.expedition-page .exp-card').waitFor();
      assert.equal(
        await text(page, '.expedition-page .voyage-title span'),
        FR.laValleeDesSifflements,
      );
      assert.equal(await text(page, '.expedition-page .voyage-title em'), 'Étape 1 sur 5');
      // The road: the first mission, two stops at each of the five splits, the guardian.
      assert.equal(await page.locator('.exp-stop').count(), 12);
      assert.equal(await page.locator('.exp-stop[aria-current]').count(), 1);
      assert.equal(await page.locator('.exp-stop[data-kind="guardian"]').count(), 1);
      assert.equal(await page.locator('.exp-card').count(), 1);
      assert.equal((await stored(page)).current.seed > 0, true, 'the expedition is saved');
      await fits(page, `${name} first`);
      await page.screenshot({ path: `${folder}/${name}-premiere.png` });
      await page.click('.exp-go');
      await page.locator('#start').waitFor({ state: 'visible' });
      assert.equal(await text(page, '#voyage-mark'), 'Expédition · étape 1 sur 5');
      assert.equal(await playOut(page), 'won', `${name}: mission 1 is won on the board`);
      assert.equal(await text(page, '#battle-result-title'), FR.etapeGagnee);
      assert.equal(await text(page, '#voyage-result-note'), FR.tonCampTeSuitALEtapeSuivante);
      assert.equal(
        await page.evaluate(() => document.activeElement?.id),
        'voyage-continue',
        `${name}: the way on takes the focus`,
      );
      assert.equal(await text(page, '#voyage-continue'), FR.continuerLExpedition);
      const after = await stored(page);
      assert.equal(after.best, 1, 'the record follows at once');
      assert.equal(after.current.pending.kind, 'gift');
      assert.ok(after.current.camp.units.length > 0, 'the allies standing come along');
      await page.screenshot({ path: `${folder}/${name}-gagnee.png` });
      await page.click('#voyage-continue');
      await page.locator('.exp-gift').first().waitFor();
      assert.equal(await page.locator('.exp-gift').count(), 3);
      const first = await page
        .locator('.exp-gift')
        .evaluateAll((l) => l.map((b) => b.dataset.gift));
      await fits(page, `${name} gift`);
      await page.screenshot({ path: `${folder}/${name}-cadeau.png` });
      await page.click('#expedition-reroll');
      const second = await page
        .locator('.exp-gift')
        .evaluateAll((l) => l.map((b) => b.dataset.gift));
      assert.notDeepEqual(second, first, `${name}: three other gifts`);
      assert.equal(await page.locator('#expedition-reroll').count(), 0, `${name}: one reroll`);
      await page.locator('.exp-gift').first().click();
      // Mission 2 is a fork: the quiet path and the path of the brave.
      await page.locator('.exp-card[data-path="brave"]').waitFor();
      assert.equal(await page.locator('.exp-card').count(), 2);
      // Both paths stand out on the road, as choices; only the way to the first stop is green.
      assert.equal(await page.locator('.exp-stop[data-state="next"]').count(), 2);
      assert.equal(await page.locator('.exp-stop[aria-current]').count(), 0);
      assert.equal(await page.locator('.exp-stop[data-state="done"]').count(), 1);
      assert.equal(await page.locator('.exp-lines-drawn .exp-taken').count(), 1);
      assert.equal(await text(page, '.exp-card[data-path="calm"] h3'), FR.leCheminTranquille);
      assert.equal(await text(page, '.exp-card[data-path="brave"] h3'), FR.leCheminDesBraves);
      await fits(page, `${name} fork`);
      await page.screenshot({ path: `${folder}/${name}-chemins.png` });
      assert.deepEqual(errors, []);
      await page.close();
    }

    // The halt: the roulotte opens, a gift is bought, the child sets off again.
    {
      const { state, choice } = atRoulotte();
      const { page, errors } = await open(size, { [KEYS.EXPEDITION_STORAGE_KEY]: log(state) });
      assert.equal(await page.locator('#home-voyage .voyage-new').isVisible(), false);
      assert.equal(await text(page, '#home-voyage span'), HOME.reprendreLExpedition);
      await enter(page);
      await page.locator('.exp-halt').first().waitFor();
      assert.equal(await page.locator('.exp-halt').count(), 2);
      // Two missions won: the road travelled is drawn in green (to the first stop, then to the
      // meeting point and on to the path taken), the path not taken fades.
      assert.equal(await page.locator('.exp-lines-drawn .exp-taken').count(), 3);
      assert.equal(await page.locator('.exp-stop[data-state="skipped"]').count(), 1);
      await fits(page, `${name} halt`);
      await page.screenshot({ path: `${folder}/${name}-halte.png` });
      await page.locator('.exp-halt .exp-go').nth(choice).click();
      await page.locator('.exp-shop').waitFor();
      assert.equal(
        await text(page, '.expedition-page .voyage-title span'),
        FR.laRoulotteDeMamiePistache,
      );
      assert.equal(await text(page, '.exp-coins'), 'Tu as 420 pièces');
      await fits(page, `${name} roulotte`);
      await page.screenshot({ path: `${folder}/${name}-roulotte.png` });
      await page.locator('.exp-shop .bonus-card:not([disabled])').first().click();
      assert.match(await text(page, '.exp-coins'), /^Tu as 2[27]0 pièces$/);
      await page.click('#expedition-leave');
      await page.locator('.exp-card[data-path]').first().waitFor();
      assert.equal((await stored(page)).current.pending, null);
      assert.deepEqual(errors, []);
      await page.close();
    }

    // The other halt acts at once and says so; the map still shows everything. Then the
    // first guardian, with its picture on the road and its card.
    {
      const { state, choice } = atRoulotte();
      const { page, errors } = await open(size, { [KEYS.EXPEDITION_STORAGE_KEY]: log(state) });
      await enter(page);
      await page
        .locator('.exp-halt .exp-go')
        .nth(1 - choice)
        .click();
      await page.locator('.exp-notice').waitFor();
      await fits(page, `${name} halt said`);
      await page.screenshot({ path: `${folder}/${name}-halte-dite.png` });
      let guardian = state;
      while (guardian.step < X.STEPS_PER_TABLEAU - 1) {
        const phase = X.expeditionPhase(guardian);
        if (phase === 'gift') guardian = X.skipGift(guardian);
        else if (phase === 'roulotte') guardian = X.leaveRoulotte(guardian);
        else if (phase === 'halt') guardian = X.chooseHalt(plan, guardian, 0);
        else guardian = win(guardian, 'calm');
      }
      await page.close();
      const second = await open(size, { [KEYS.EXPEDITION_STORAGE_KEY]: log(guardian) });
      await enter(second.page);
      await second.page.locator('.exp-card[data-path="guardian"]').waitFor();
      await fits(second.page, `${name} guardian`);
      await second.page.screenshot({ path: `${folder}/${name}-gardien.png` });
      assert.deepEqual([...errors, ...second.errors], []);
      await second.page.close();
    }

    // A full roulotte: four gifts to climb and the stock to buy; « Repartir » stays in reach.
    {
      const { state, choice } = atRoulotte();
      const four = ['forge', 'armure', 'marche', 'rente'].map((id) => ({ id, level: 1 }));
      const open_ = X.chooseHalt(plan, { ...state, boons: four }, choice);
      const { page, errors } = await open(size, { [KEYS.EXPEDITION_STORAGE_KEY]: log(open_) });
      await enter(page);
      await page.locator('.exp-shop').waitFor();
      assert.ok((await page.locator('.exp-shop .bonus-card').count()) >= 4);
      await fits(page, `${name} full roulotte`);
      const leave = await page.locator('#expedition-leave').boundingBox();
      assert.ok(leave && leave.y + leave.height <= height, `${name}: « Repartir » on screen`);
      await page.screenshot({ path: `${folder}/${name}-roulotte-pleine.png` });
      assert.deepEqual(errors, []);
      await page.close();
    }

    // Five places full: a new gift asks which one gives its place, or keeps them all.
    {
      const state = placesFull();
      const { page, errors } = await open(size, { [KEYS.EXPEDITION_STORAGE_KEY]: log(state) });
      await enter(page);
      await page.locator('.exp-gift').first().waitFor();
      const fresh = page.locator('.exp-gift[data-gift="vue"], .exp-gift[data-gift="miel"]').first();
      const id = await fresh.getAttribute('data-gift');
      await fresh.click();
      assert.equal(await text(page, '.exp-ask h2'), 'Tes 5 places sont prises');
      assert.equal(await page.locator('[data-replace]').count(), 5);
      await fits(page, `${name} replace`);
      await page.screenshot({ path: `${folder}/${name}-remplacer.png` });
      await page.click('#expedition-keep-gifts');
      await page.locator(`.exp-gift[data-gift="${id}"]`).click();
      await page.click('[data-replace="rente"]');
      const boons = (await stored(page)).current.boons.map((b) => b.id);
      assert.ok(boons.includes(id) && !boons.includes('rente'), `${name}: ${boons}`);
      assert.deepEqual(errors, []);
      await page.close();
    }

    // The end: the missions won, the record, a new expedition. Then another one is asked.
    {
      const { page, errors } = await open(size, { [KEYS.EXPEDITION_STORAGE_KEY]: log(arrived()) });
      await enter(page);
      await page.locator('#expedition-new').waitFor();
      assert.equal(
        await text(page, '.expedition-page .voyage-view h2'),
        'Tu as gagné les 15 étapes !',
      );
      assert.equal(await text(page, '.voyage-best'), 'Ta plus longue expédition : 15 étapes');
      await fits(page, `${name} arrived`);
      await page.screenshot({ path: `${folder}/${name}-arrivee.png` });
      await page.click('#expedition-new');
      await page.locator('.exp-card').first().waitFor();
      assert.equal((await stored(page)).best, 15, 'the record stays');
      assert.deepEqual(errors, []);
      await page.close();
    }
    checks.push(name);
  }

  // A voyage begun before the expedition took its place: the door says so, and it is finished
  // first; once it is over, its last screen leads to the expedition.
  for (const [won, status] of [
    [2, 'travelling'],
    [5, 'arrived'],
  ]) {
    const voyagePlan = planVoyage(SEED);
    const bag = voyagePlan.stages.slice(0, Math.min(won, 4)).map((stage) => stage.offer[0]);
    const voyageLog = JSON.stringify({
      version: 1,
      best: won,
      current: { version: CURRENT_VOYAGE_VERSION, seed: SEED, won, bag, status },
    });
    const { page, errors } = await open(
      { width: 780, height: 360 },
      {
        [KEYS.VOYAGE_STORAGE_KEY]: voyageLog,
      },
    );
    const travelling = status === 'travelling';
    assert.equal(
      await text(page, '#home-voyage span'),
      travelling ? HOME.reprendreLeVoyage : HOME.laGrandeExpedition,
    );
    await enter(page);
    if (travelling) {
      await page.locator('.voyage-page[data-view="map"] #voyage-go').waitFor();
      assert.equal(
        await page.locator('#voyage-other-open, #voyage-code').count(),
        0,
        'no new voyage',
      );
    } else await page.locator('.expedition-page .exp-card').waitFor();
    assert.deepEqual(errors, []);
    await page.close();
  }
  checks.push('voyage');

  // Under way, « Une autre expédition » asks first; in English, the door has its words.
  {
    const { state } = atRoulotte();
    const { page, errors } = await open(
      { width: 1280, height: 800 },
      {
        [KEYS.EXPEDITION_STORAGE_KEY]: log(
          X.leaveRoulotte(X.chooseHalt(plan, state, 0)) ?? X.chooseHalt(plan, state, 0),
        ),
      },
      'en',
    );
    assert.equal(await text(page, '#home-voyage span'), HOME_EN.reprendreLExpedition);
    await enter(page);
    await page.click('#expedition-other');
    await page.locator('#expedition-replace').waitFor();
    assert.equal(await text(page, '#expedition-replace h2'), EN.changerDExpedition);
    await page.click('#expedition-keep');
    assert.equal(await page.locator('#expedition-replace').isVisible(), false);
    assert.deepEqual(errors, []);
    await page.close();
    checks.push('en');
  }
  console.log(JSON.stringify({ expedition: checks, screenshots: folder }));
} finally {
  await Promise.race([browser?.close(), setTimeout(10_000)]);
  server.kill();
}
