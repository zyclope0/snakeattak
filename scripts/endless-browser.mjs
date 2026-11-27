// Recette de l'aventure sans fin (20 novembre 2026) : la porte fermée puis ouverte, le record
// du joueur, le cadeau d'après un roi, « Continuer », « Rentrer avec mon record », l'écran de
// fin, le choix du cadeau remplacé quand les cinq places sont prises. Les camps sont écrits
// par le vrai moteur, puis relus par le jeu construit, à 780×360, 812×375 et 1280×800.
// Lot A du rapport du conseil (26 novembre 2026) : les boutons « Continuer sans bonus »,
// « Garder mes cadeaux », « Continuer » et « Rentrer avec mon record » font 48 px au moins et
// restent dans leur bandeau ; « 100 % » et « Vague 12 · rois : 1 » tiennent sur une ligne ;
// le tour est nommé sous le nom du lieu ; le record de l'accueil dit ses rois.
// Lot B (27 novembre 2026) : l'étagère des cadeaux au camp et pendant la vague (cinq places de
// 48 px dans le dock et dans la fenêtre), sa feuille qui s'ouvre et se ferme (Échap, « retour »
// d'Android), les cadeaux tenus au-dessus des cartes, les cinq cartes de « remplacer » dans la
// fenêtre, le prix barré du marché, les secondes du miel, les pièces de la rente, le récap quand
// on rentre et quand le camp tombe. Captures du lot dans artifacts/infini-lot-b/.
import { registerHooks } from 'node:module';
import { setTimeout } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { SCREENS, launchChromium, startPreview } from './lib/recipe.mjs';

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
/** Five gifts held, at several levels: what the shelf and the board show (lot B). */
const FIVE = [
  ['forge', 3],
  ['armure', 2],
  ['marche', 1],
  ['rente', 2],
  ['solide', 2],
].map(([id, level]) => ({ id, level }));
/** The camp after `kings` kings, its gifts held, the next round still to start. */
function campWith(kings, boons, change = () => {}) {
  const game = new Game(4242, undefined, undefined, rules.balance, undefined, rules);
  for (let king = 0; king < kings; king++) clear(game, 12);
  game.rewards.pending = null;
  assert.ok(game.restoreEndless(boons));
  change(game);
  return encodeCheckpoint(game);
}
const career = (won) =>
  JSON.stringify({
    version: 1,
    bestStars: won ? [3, 3, 3] : [0, 0, 0],
    rosters: freshRosters(),
    activeRoster: 0,
    chapterCamps: [null, null],
  });

const folder = 'artifacts/endless';
await mkdir(folder, { recursive: true });
/** The pictures of lot B, at the size of the screen (one pixel a CSS pixel). */
const shelfFolder = 'artifacts/infini-lot-b';
await mkdir(shelfFolder, { recursive: true });
const server = await startPreview({ port: 4189 });
const origin = server.url;
let browser;
const checks = [];
try {
  browser = await launchChromium();
  /**
   * A fresh page whose storage holds `stored`, written once before the game starts. With
   * `clock`, the page's time jumps only when the recipe says (`page.clock.fastForward`): one
   * frame of the board each time, a wave played in a few seconds.
   */
  async function open(size, stored, { clock = false } = {}) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
    if (clock) await page.clock.install();
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
  /** The element `selector` lies whole inside `band`, and inside the window. */
  const inside = async (page, selector, band, label) => {
    const [box, frame] = await Promise.all(
      [selector, band].map((s) => page.locator(s).evaluate((e) => e.getBoundingClientRect())),
    );
    const view = page.viewportSize();
    for (const [outer, name] of [
      [frame, band],
      [{ left: 0, top: 0, right: view.width, bottom: view.height }, 'the window'],
    ])
      assert.ok(
        box.left >= outer.left - 0.5 &&
          box.right <= outer.right + 0.5 &&
          box.top >= outer.top - 0.5 &&
          box.bottom <= outer.bottom + 0.5,
        `${label}: ${selector} out of ${name}`,
      );
  };
  /** Every piece of text of `selector` stands on one line (pieces of a line overlap in height). */
  const oneLine = async (page, selector, label) => {
    const rects = await page.locator(selector).evaluate((e) => {
      const range = document.createRange();
      range.selectNodeContents(e);
      return [...range.getClientRects()]
        .filter((r) => r.width > 0)
        .map((r) => ({ top: r.top, bottom: r.bottom }));
    });
    assert.ok(rects.length, `${label}: ${selector} shows some text`);
    for (const r of rects)
      assert.ok(
        r.top < rects[0].bottom && r.bottom > rects[0].top,
        `${label}: ${selector} wraps on two lines`,
      );
  };

  for (const size of SCREENS) {
    const { width, height } = size;
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
      assert.equal(await text(page, 'endless-note'), 'Ton record : vague 31 · rois battus : 2');
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
      await tall(page, '#reward-cards button, #skip-reward', name);
      await inside(page, '#skip-reward', '#reward-panel', `${name} gift`);
      await fits(page, `${name} gift`);
      // Lot B: the gifts held above the cards, here five free places, dotted; one word, « cadeau ».
      await page.locator('#reward-held').waitFor();
      assert.equal(await page.locator('#reward-held .boon-case[data-boon=""]:visible').count(), 5);
      await inside(page, '#reward-held', '#reward-panel', `${name} gift`);
      assert.equal(await text(page, 'skip-reward'), 'Continuer sans cadeau');
      assert.equal(await text(page, 'start'), 'Choisir un cadeau');
      await page.screenshot({ path: `${folder}/${name}-cadeau.png` });
      await page.screenshot({ path: `${shelfFolder}/${name}-choix.png` });
      await page.locator('#reward-cards button:visible').first().click();
      assert.equal(await text(page, 'start'), 'Continuer');
      assert.equal(await shown(page, 'endless-home'), true);
      await tall(page, '#start, #endless-home', name);
      for (const button of ['#start', '#endless-home'])
        await inside(page, button, '.dashboard', `${name} camp`);
      for (const number of ['#base', '.wave-stat strong'])
        await oneLine(page, number, `${name} camp`);
      // On a computer the button keeps its words on one line: on two it stood out of the band.
      if (width >= 921) await oneLine(page, '#endless-home', `${name} camp`);
      // The second round is named, with its waves counted from the very first one.
      assert.equal(await text(page, 'level-subtitle'), '2e tour · vagues 13 à 16');
      if (width >= 921) assert.equal(await shown(page, 'level-subtitle'), true);
      await fits(page, `${name} camp`);
      await page.screenshot({ path: `${folder}/${name}-continuer.png` });
      // Lot B: going home shows the recap first, the wave, the kings, the gifts; the child
      // may stay at the camp.
      await page.click('#endless-home');
      await page.locator('#boon-sheet[open][data-recap]').waitFor();
      assert.equal(await text(page, 'boon-sheet-title'), 'Ton aventure');
      assert.equal(
        await page.locator('#boon-sheet .boon-sheet-line').textContent(),
        'Vague 12 · rois battus : 1',
      );
      assert.equal(await page.locator('#boon-sheet .boon-recap-places .boon-case').count(), 5);
      await tall(page, '#boon-sheet .boon-sheet-actions button, #boon-sheet .close', `${name}`);
      for (const button of ['.boon-sheet-actions .primary', '.boon-sheet-actions .secondary'])
        await inside(page, `#boon-sheet ${button}`, '#boon-sheet', `${name} recap`);
      await page.screenshot({ path: `${shelfFolder}/${name}-recap.png` });
      await page.click('#boon-sheet .boon-sheet-actions .secondary');
      assert.equal(await page.locator('#boon-sheet[open]').count(), 0, `${name}: stays`);
      assert.equal(await text(page, 'start'), 'Continuer');
      // Home with the record: the record is written since the king fell; the game waits.
      await page.click('#endless-home');
      await page.click('#boon-sheet .boon-sheet-actions .primary');
      await page.locator('#home-screen').waitFor();
      await page.evaluate(() => document.querySelector('[data-home-target="classic"]').click());
      assert.equal(await text(page, 'endless-note'), 'Ton record : vague 12 · rois battus : 1');
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
      // Lot B: a gift held, offered again, shows its stars climbing.
      for (const card of await page.locator('#reward-cards button:visible').all()) {
        const id = await card.getAttribute('data-reward');
        if (['forge', 'armure', 'marche', 'rente', 'solide'].includes(id))
          assert.equal(await card.locator('small').textContent(), '★ → ★★', `${name} ${id}`);
      }
      await page.locator('#reward-held .boon-case[data-boon="forge"]').waitFor();
      await page.click('#reward-cards button[data-reward="vue"]');
      assert.equal(await text(page, 'reward-title'), 'Tes 5 places sont prises');
      assert.equal(await page.locator('#reward-cards button:visible').count(), 5);
      // Lot B: the five gifts held, whole, in the panel and in the window, on every screen.
      for (const id of ['forge', 'armure', 'marche', 'rente', 'solide'])
        await inside(page, `#reward-cards [data-reward="${id}"]`, '#reward-panel', `${name} ${id}`);
      assert.equal(await shown(page, 'reward-held'), false, `${name}: the cards are the gifts`);
      await page.screenshot({ path: `${shelfFolder}/${name}-remplacer.png` });
      // « Garder mes cadeaux » is in the panel and in the window, not below them.
      await tall(page, '#skip-reward', `${name} replace`);
      await inside(page, '#skip-reward', '#reward-panel', `${name} replace`);
      assert.equal(await text(page, 'skip-reward'), 'Garder mes cadeaux');
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

    // Lot B: the shelf at the camp and during a wave, its sheet, the market's struck prices.
    {
      const { page, errors } = await open(size, {
        [KEYS.CAREER_STORAGE_KEY]: career(true),
        [KEYS.CAMP_STORAGE_KEY]: campWith(4, FIVE, (game) => (game.base = 80)),
      });
      if (await page.locator('#home-continue').isVisible()) await page.click('#home-continue');
      const shelf = page.locator('#boon-shelf');
      await shelf.waitFor();
      const places = shelf.locator('.boon-case');
      assert.deepEqual(await places.evaluateAll((list) => list.map((p) => p.dataset.boon)), [
        'forge',
        'armure',
        'marche',
        'rente',
        'solide',
      ]);
      assert.deepEqual(await places.evaluateAll((list) => list.map((p) => p.textContent)), [
        '⚔★★★',
        '♥★★',
        '%★',
        '+★★',
        '◆★★',
      ]);
      assert.equal(await shelf.getAttribute('aria-label'), 'Tes cadeaux : 5 sur 5 places');
      /** The shelf whole, in the dock and in the window, each place as tall as a finger. */
      const shelfFits = async (label) => {
        await tall(page, '#boon-shelf, #boon-shelf .boon-case', label);
        await inside(page, '#boon-shelf', '#battle-dock', label);
        for (let i = 1; i <= 5; i++)
          await inside(page, `#boon-shelf .boon-case:nth-child(${i})`, '#boon-shelf', label);
        // The favourites and the honey keep their place under it.
        for (const below of ['#dock-honey', '#dock-catalogue'])
          if (await page.locator(below).isVisible())
            await inside(page, below, '#battle-dock', `${label} ${below}`);
        await fits(page, label);
      };
      await shelfFits(`${name} shelf at the camp`);
      // « Le marché »: the price before the gift, struck out, beside the price paid.
      const prices = await page
        .locator('#dock-allies .dock-card:visible')
        .evaluateAll((cards) =>
          cards.map((card) => [
            card.querySelector('.boon-was')?.textContent,
            card.querySelector('.dock-price').textContent,
          ]),
        );
      assert.ok(prices.length, `${name}: favourites`);
      for (const [was, now] of prices) assert.ok(Number(was) > parseInt(now), `${was} > ${now}`);
      await page.screenshot({ path: `${shelfFolder}/${name}-camp.png` });

      // The sheet: the five places in large, what each gift does, its next level.
      await shelf.click();
      const sheet = page.locator('#boon-sheet[open]');
      await sheet.waitFor();
      assert.equal(await text(page, 'boon-sheet-title'), 'Tes cadeaux');
      assert.equal(await sheet.locator('.boon-sheet-list li:visible').count(), 5);
      await tall(page, '#boon-sheet .boon-big, #boon-sheet .close', `${name} sheet`);
      for (let i = 1; i <= 5; i++)
        await inside(page, `#boon-sheet li:nth-child(${i})`, '#boon-sheet', `${name} sheet`);
      // The words, not the signs (« % » is the sign of the market): no percentage is said.
      const words = (await sheet.locator('.boon-sheet-words').allTextContents()).join(' ');
      for (const said of [
        'Tes alliés frappent plus fort.',
        'Tout en haut !',
        'Si tu le reprends : ★★ → ★★★',
        'pièces au lieu de',
        '+80 pièces à chaque vague',
      ])
        assert.ok(words.includes(said), `${name} sheet says « ${said} »`);
      assert.doesNotMatch(words, /%/);
      await page.screenshot({ path: `${shelfFolder}/${name}-feuille.png` });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#boon-sheet[open]').count(), 0, `${name}: Escape closes`);
      // Android's « retour » asks the window as Escape does (`src/ui/backButton.ts`).
      await shelf.click();
      await sheet.waitFor();
      const closed = await page.evaluate(() => {
        const dialog = document.querySelector('#boon-sheet');
        const agreed = dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
        if (agreed && dialog.open) dialog.close();
        return !dialog.open;
      });
      assert.ok(closed, `${name}: « retour » closes the sheet`);

      // During the wave the shelf stays; the board shows the gifts where they act.
      await page.click('#start');
      await page.locator('#app[data-status="fighting"]').waitFor();
      await shelfFits(`${name} shelf in battle`);
      await shelf.click();
      await sheet.waitFor();
      await page.keyboard.press('Escape');
      await page.locator('#app[data-status="fighting"]').waitFor();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${shelfFolder}/${name}-bataille.png` });
      assert.deepEqual(errors, []);
      await page.close();
    }

    // Lot B: the honey's seconds on its pots, the coins of « la rente » when a wave ends.
    {
      const { page, errors } = await open(
        size,
        {
          [KEYS.CAREER_STORAGE_KEY]: career(true),
          [KEYS.CAMP_STORAGE_KEY]: campWith(1, [
            { id: 'rente', level: 1 },
            { id: 'miel', level: 1 },
          ]),
        },
        { clock: true },
      );
      if (await page.locator('#home-continue').isVisible()) await page.click('#home-continue');
      await page.locator('#boon-shelf').waitFor();
      assert.deepEqual(
        await page
          .locator('#dock-honey .boon-more')
          .evaluateAll((list) => list.map((more) => more.textContent)),
        ['+4 s', '+4 s'],
      );
      // Twice as fast: the rules count the same, the recipe waits less.
      await page.click('#speed');
      await page.click('#start');
      const status = () => page.locator('#app').getAttribute('data-status');
      const income = page.locator('.treasure-stat .boon-income');
      // Watched frame after frame: it shows when the wave ends, for two seconds.
      let paid = false;
      for (let i = 0; i < 3000 && (await status()) === 'fighting'; i++) {
        await page.clock.fastForward(100);
        paid ||= await income.isVisible();
      }
      assert.equal(await status(), 'preparing', `${name}: the wave is pushed back`);
      await page.clock.fastForward(100);
      paid ||= await income.isVisible();
      assert.ok(paid, `${name}: « +40 » by the coins`);
      assert.equal(await income.textContent(), '+40');
      await page.clock.fastForward(2500);
      assert.equal(await income.isVisible(), false, `${name}: then gone`);
      assert.deepEqual(errors, []);
      await page.close();
    }

    // Lot B: the camp falls; the result shows the gifts, the kings and the wave.
    {
      const { page, errors } = await open(
        size,
        {
          [KEYS.CAREER_STORAGE_KEY]: career(true),
          [KEYS.CAMP_STORAGE_KEY]: campWith(6, FIVE, (game) => {
            game.base = 5;
            game.units = game.units.filter((u) => u.kind === 'hero');
          }),
        },
        { clock: true },
      );
      if (await page.locator('#home-continue').isVisible()) await page.click('#home-continue');
      await page.locator('#boon-shelf').waitFor();
      await page.click('#speed');
      await page.click('#start');
      const status = () => page.locator('#app').getAttribute('data-status');
      for (let i = 0; i < 3000 && (await status()) === 'fighting'; i++)
        await page.clock.fastForward(100);
      assert.equal(await status(), 'lost', `${name}: the camp falls`);
      await page.clock.fastForward(300);
      const recap = page.locator('#boon-recap');
      await recap.waitFor();
      assert.equal(await recap.locator('.boon-case').count(), 5);
      assert.equal(
        await recap.locator('.boon-held-line').textContent(),
        'Vague 73 · rois battus : 6',
      );
      assert.equal(await page.locator('#boon-shelf').isVisible(), false, `${name}: no shelf`);
      await inside(page, '#boon-recap', '#battle-result', `${name} fall`);
      for (let i = 1; i <= 5; i++)
        await inside(page, `#boon-recap .boon-case:nth-child(${i})`, '#boon-recap', `${name} fall`);
      await fits(page, `${name} fall`);
      await page.screenshot({ path: `${shelfFolder}/${name}-chute.png` });
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
  server.stop();
}
