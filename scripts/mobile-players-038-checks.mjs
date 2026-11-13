import assert from 'node:assert/strict';
import { chooseLanguage, leaveBattle, showHomePage } from '../tests/browser-entry.mjs';
import { english } from '../src/i18n/english.ts';
import { kinds } from '../src/data.ts';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionRun } from '../src/missions.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { capricesForMission } from '../src/caprices.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';
import {
  PLAYERS_KEY,
  PLAYER_CHARACTERS,
  PLAYER_CHOSEN_KEY,
  PLAYER_KEYS,
  playerKey,
} from '../src/players.ts';

const FAMILY = 'conquete-serpents:family:v1';
// Android's system margins as the other recipes simulate them.
const systemBars = { top: 30, right: 48, bottom: 24, left: 48 };
const grid = [
  [568, 320, null],
  [780, 360, null],
  [780, 360, systemBars],
  [812, 375, null],
  [915, 412, null],
  [1280, 800, null],
];
// Sixteen characters, the longest nickname there is.
const LONG = 'Chevalier Léo 07';
const sticker = capricesForMission('refuge', 'serpents')[0].id;
const one = { version: 1, activeId: 'p1', players: [{ id: 'p1', character: 'hero', name: null }] };
const two = {
  version: 1,
  activeId: 'p1',
  players: [
    { id: 'p1', character: 'hero', name: null },
    { id: 'p2', character: 'dragon', name: 'Zoé' },
  ],
};
const four = {
  version: 1,
  activeId: 'p2',
  players: [
    { id: 'p1', character: 'hero', name: null },
    { id: 'p2', character: 'dragon', name: LONG },
    { id: 'p3', character: 'dragon', name: 'Zoé' },
    { id: 'p4', character: 'dino', name: null },
  ],
};

/** A real adventure: five mission stars, one sticker, and a mission to resume. */
function adventure() {
  const progress = createMissionProgressController();
  const run = createMissionRun('refuge', 321, undefined, 2);
  progress.started(run);
  const mission = new Game(321, undefined, run);
  progress.sync(mission);
  progress.switchMode('missions');
  const missions = progress.state;
  missions.bestStars.refuge = 3;
  missions.bestStars['trois-ponts'] = 2;
  const albums = createCapriceAlbumsController().state;
  albums.children[0].completed.push(sticker);
  const raw = writeFamilyBackup(encodeCheckpoint(mission), createCareer().state, missions, albums);
  assert.ok(raw, 'fixture adventure is a valid family save');
  return raw;
}

/**
 * The players of a shared phone or tablet, in the real game: the chip of the home header,
 * « Qui joue ? », the choice of a character, and the parents' list. One player leaves every
 * screen as it was; several players each keep their own adventure.
 */
export async function checkPlayers({ browser, url, check, capture, portrait }) {
  const errors = [];
  const settle = (page) =>
    page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
  /** `seed` is written once in this tab; a reload keeps what the game wrote since. */
  async function open(w, h, { seed = {}, chosen = false, insets = null, language = 'fr' } = {}) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      locale: language === 'en' ? 'en-US' : 'fr-CH',
      hasTouch: true,
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(
      ({ seed, chosen, insets, flag }) => {
        if (!sessionStorage.getItem('seeded')) {
          for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value);
          if (chosen) sessionStorage.setItem(flag, '1');
          sessionStorage.setItem('seeded', 'yes');
        }
        if (insets)
          addEventListener('DOMContentLoaded', () => {
            for (const [side, value] of Object.entries(insets))
              document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`);
          });
      },
      { seed, chosen, insets, flag: PLAYER_CHOSEN_KEY },
    );
    await page.goto(url);
    await ready(page);
    return page;
  }
  async function ready(page) {
    await page.locator('#home-caprice-album').waitFor({ state: 'visible' });
    await page.locator('#player-chip').waitFor({ state: 'attached' });
    // The portraits are small separate images: wait for the ones on screen.
    await page.waitForLoadState('networkidle');
    await settle(page);
  }
  /** After a touch that changes player: the page is rebuilt on that player's keys. */
  async function reloaded(page, action) {
    await page.evaluate(() => {
      window.samePage = true;
    });
    await action();
    await page.waitForFunction(() => !window.samePage && !!document.querySelector('#player-chip'));
    await ready(page);
  }
  const stored = (page) =>
    page.evaluate(() =>
      Object.fromEntries(
        Object.keys(localStorage)
          .sort()
          .map((key) => [key, localStorage.getItem(key)]),
      ),
    );
  const players = async (page) => JSON.parse((await stored(page))[PLAYERS_KEY] ?? 'null');
  const chipState = (page) =>
    page.evaluate(() => {
      const box = (node) => node.getBoundingClientRect().toJSON();
      const chip = document.querySelector('#player-chip');
      const r = chip.getBoundingClientRect();
      const mine = ([fx, fy]) => {
        const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
        return !!hit && chip.contains(hit);
      };
      const header = document.querySelector('#home-screen .home-header');
      return {
        rect: r.toJSON(),
        whole: [
          [0.5, 0.5],
          [0.15, 0.15],
          [0.85, 0.15],
          [0.15, 0.85],
          [0.85, 0.85],
          [0.5, 0.04],
          [0.5, 0.96],
          [0.04, 0.5],
          [0.96, 0.5],
        ].every(mine),
        type: chip.type,
        popup: chip.getAttribute('aria-haspopup'),
        name: chip.querySelector('.player-name').textContent,
        raw: chip.querySelector('.player-name').hasAttribute('data-copy-raw'),
        action: chip.querySelector('small').textContent,
        character: chip.querySelector('.player-avatar').dataset.character,
        portrait: getComputedStyle(chip.querySelector('.player-avatar')).backgroundImage,
        badge: getComputedStyle(chip.querySelector('.player-chip-badge')).display !== 'none',
        text: chip.querySelector('.player-chip-text').getBoundingClientRect().width > 2,
        cut: [...chip.querySelectorAll('.player-chip-text > *')]
          .filter((node) => node.scrollWidth > node.clientWidth + 1)
          .map((node) => node.textContent),
        siblings: [...header.children].map((node) => node.id || node.className),
        brand: box(header.querySelector('.home-brand')),
        stars: box(header.querySelector('#mission-total')),
        settings: box(header.querySelector('#home-settings')),
        card: box(document.querySelector('#home-main')),
        sideways: header.scrollWidth - header.clientWidth,
        pageScroll: document.documentElement.scrollHeight - innerHeight,
        dialogs: document.querySelectorAll('dialog[open]').length,
      };
    });
  const dialogState = (page) =>
    page.locator('#players-dialog').evaluate((dialog) => {
      const frame = dialog.getBoundingClientRect();
      const shown = (node) => node.getClientRects().length > 0;
      const controls = [...dialog.querySelectorAll('button, input')].filter(shown);
      const inside = (node) => {
        const r = node.getBoundingClientRect();
        return (
          r.top >= frame.top - 0.5 &&
          r.bottom <= frame.bottom + 0.5 &&
          r.left >= frame.left - 0.5 &&
          r.right <= frame.right + 0.5
        );
      };
      const reached = (node) => {
        const r = node.getBoundingClientRect();
        return [
          [0.5, 0.5],
          [0.1, 0.1],
          [0.9, 0.1],
          [0.1, 0.9],
          [0.9, 0.9],
        ].every(([fx, fy]) => {
          const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
          return !!hit && (node.contains(hit) || hit.contains(node));
        });
      };
      const label = (node) => node.id || node.className || node.tagName;
      const pressed = dialog.querySelector('.player-character[aria-pressed="true"]');
      let ring = null;
      if (pressed) {
        const disc = pressed.querySelector('.player-avatar');
        const style = getComputedStyle(disc);
        const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
        const d = disc.getBoundingClientRect();
        const n = pressed.querySelector('span:not(.player-avatar)').getBoundingClientRect();
        const b = pressed.getBoundingClientRect();
        ring = {
          drawn: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 3,
          reach,
          toName: n.top - (d.bottom + reach),
          toTop: d.top - reach - b.top,
          character: pressed.dataset.character,
        };
      }
      return {
        open: dialog.open,
        modal: dialog.matches(':modal'),
        view: dialog.dataset.view,
        title: dialog.querySelector('#players-title').textContent,
        named: dialog.getAttribute('aria-labelledby'),
        frame: frame.toJSON(),
        overflow: dialog.scrollHeight - dialog.clientHeight,
        sideways: dialog.scrollWidth - dialog.clientWidth,
        small: controls
          .filter((node) => {
            const r = node.getBoundingClientRect();
            return r.width < 47.99 || r.height < 47.99;
          })
          .map(label),
        outside: controls.filter((node) => !inside(node)).map(label),
        covered: controls.filter((node) => !reached(node)).map(label),
        cut: [...dialog.querySelectorAll('.player-name, .player-stars, .player-character span, h2')]
          .filter(shown)
          .filter((node) => node.scrollWidth > node.clientWidth + 1 || !inside(node))
          .map((node) => node.textContent),
        cards: [...dialog.querySelectorAll('.player-card[data-player]')]
          .filter(shown)
          .map((card) => ({
            id: card.dataset.player,
            name: card.querySelector('.player-name').textContent,
            raw: card.querySelector('.player-name').hasAttribute('data-copy-raw'),
            stars: card.querySelector('.player-stars')?.textContent ?? null,
            character: card.querySelector('.player-avatar').dataset.character,
            current: card.querySelector('.player-face').getAttribute('aria-current') === 'true',
            plays: card.querySelector('.player-face').tagName === 'BUTTON',
            tool: card.querySelector('.player-tool')?.textContent ?? null,
          })),
        fresh: [...dialog.querySelectorAll('#player-new')].filter(shown).length,
        close: [...dialog.querySelectorAll('#players-close')].filter(shown).length,
        characters: [...dialog.querySelectorAll('.player-character')].filter(shown).map((node) => ({
          id: node.dataset.character,
          name: node.textContent,
          disabled: node.disabled || node.getAttribute('aria-disabled') === 'true',
          portrait: getComputedStyle(node.querySelector('.player-avatar')).backgroundImage,
        })),
        ring,
        note: dialog.querySelector('.players-note')?.textContent ?? null,
        status: dialog.querySelector('.players-status').textContent,
        focus: document.activeElement?.id || document.activeElement?.className || null,
        focusPlayer: document.activeElement?.closest('[data-player]')?.dataset.player ?? null,
      };
    });

  // ---- Every size, both languages, with one, two and four players. ----
  for (const language of ['fr', 'en'])
    for (const [w, h, insets] of grid) {
      const say = (text) => (language === 'en' ? english[text] : text);
      const starsOf = (n) => (language === 'en' ? `★${n} / 18 stars` : `★${n} / 18 étoiles`);
      const size = `${w}×${h}${insets ? ' with system margins' : ''} ${language}`;
      const safe = {
        left: insets?.left ?? 0,
        top: insets?.top ?? 0,
        right: w - (insets?.right ?? 0),
        bottom: h - (insets?.bottom ?? 0),
      };
      const inSafeArea = (r) =>
        r.left >= safe.left - 0.5 &&
        r.top >= safe.top - 0.5 &&
        r.right <= safe.right + 0.5 &&
        r.bottom <= safe.bottom + 0.5;
      const chipFits = async (page, where, player, action) => {
        const chip = await chipState(page);
        check(
          chip.rect.width >= 47.99 && chip.rect.height >= 47.99,
          `${where}: chip is a 48 px target: ${JSON.stringify(chip.rect)}`,
        );
        check(inSafeArea(chip.rect) && chip.whole, `${where}: chip whole inside the safe area`);
        assert.deepEqual(
          chip.siblings,
          ['home-brand', 'player-chip', 'mission-total', 'home-settings'],
          `${where}: header order`,
        );
        check(true, `${where}: chip sits between the title and the stars`);
        check(
          chip.brand.right <= chip.rect.left + 0.5 &&
            chip.rect.right <= chip.stars.left + 0.5 &&
            chip.stars.right <= chip.settings.left + 0.5 &&
            inSafeArea(chip.settings) &&
            chip.sideways <= 0,
          `${where}: nothing overlaps in the header: ${JSON.stringify([chip.brand, chip.rect, chip.stars, chip.settings])}`,
        );
        check(
          chip.rect.bottom <= chip.card.top + 0.5 && chip.settings.bottom <= chip.card.top + 0.5,
          `${where}: header stays above the card: ${chip.rect.bottom} / ${chip.card.top}`,
        );
        check(chip.pageScroll <= 1, `${where}: home has no page scroll`);
        check(
          chip.type === 'button' && chip.popup === 'dialog',
          `${where}: chip is a button that opens a window`,
        );
        check(
          chip.name === player.name && chip.raw === player.raw && chip.action === say(action),
          `${where}: chip names the player and what it does: ${chip.name} / ${chip.action}`,
        );
        check(
          chip.character === player.character &&
            chip.portrait.includes(`joueur-${player.character}`),
          `${where}: chip shows the player's small portrait: ${chip.portrait}`,
        );
        check(
          chip.text ? !chip.badge && !chip.cut.length : chip.badge,
          `${where}: chip shows its two lines whole, or its portrait with a badge: ${chip.cut}`,
        );
        // Only the smallest phone folds the chip; a phone with system margins keeps its words.
        check(
          chip.text === w >= 780,
          `${where}: chip ${w >= 780 ? 'says what it does in words' : 'folds to its portrait'}`,
        );
        check(
          chip.brand.height <= chip.rect.height,
          `${where}: the game's title stays on one line: ${chip.brand.height}`,
        );
        return chip;
      };
      const dialogFits = async (page, where, view, title) => {
        await settle(page);
        const state = await dialogState(page);
        check(
          state.open && state.modal && state.view === view,
          `${where}: modal window on ${view}: ${state.view}`,
        );
        check(
          state.title === say(title) && state.named === 'players-title',
          `${where}: title: ${state.title}`,
        );
        check(
          inSafeArea(state.frame) && state.overflow <= 1 && state.sideways <= 1,
          `${where}: fits inside the safe area without scrolling: ${JSON.stringify(state.frame)} ${state.overflow}`,
        );
        check(!state.small.length, `${where}: every control is a 48 px target: ${state.small}`);
        check(
          !state.outside.length && !state.covered.length,
          `${where}: every control whole and in reach: ${state.outside} ${state.covered}`,
        );
        check(!state.cut.length, `${where}: no name is cut: ${state.cut}`);
        return state;
      };

      // One player, as at the very first launch: no question, and a visible way to add.
      let page = await open(w, h, { insets, language });
      let chip = await chipFits(
        page,
        `one player ${size}`,
        { name: say('Héros'), raw: false, character: 'hero' },
        'Ajouter un joueur',
      );
      check(chip.dialogs === 0, `first launch shows no player screen at ${size}`);
      check(
        (await page.locator('#home-primary').textContent()) === say('Jouer') &&
          (await players(page)) === null,
        `first launch plays at once as the default player at ${size}`,
      );
      if (!insets) await capture(page, `players-home-1-${w}x${h}-${language}`);
      await page.locator('#player-chip').click();
      let state = await dialogFits(page, `who (one player) ${size}`, 'who', 'Qui joue ?');
      assert.deepEqual(
        state.cards,
        [
          {
            id: 'p1',
            name: say('Héros'),
            raw: false,
            stars: starsOf(0),
            character: 'hero',
            current: true,
            plays: true,
            tool: say('Modifier'),
          },
        ],
        `who (one player) ${size}: cards`,
      );
      check(
        state.fresh === 1 && state.close === 1,
        `who (one player) ${size}: new player card and close`,
      );
      check(
        state.note === say('Chaque joueur garde ses étoiles et son carnet sur cet appareil.'),
        `who (one player) ${size}: says what a player keeps`,
      );
      check(
        (await page.locator('#player-new').textContent()) ===
          '+' + say('Nouveau joueur') + say('Choisis ton personnage'),
        `who (one player) ${size}: new player card text`,
      );
      await page.locator('#player-new').click();
      state = await dialogFits(page, `pick (new) ${size}`, 'pick', 'Choisis ton personnage');
      assert.deepEqual(
        state.characters.map(({ id, name, disabled }) => ({ id, name, disabled })),
        PLAYER_CHARACTERS.map((id) => ({ id, name: say(kinds[id].name), disabled: false })),
        `pick (new) ${size}: characters`,
      );
      check(true, `pick (new) ${size}: eight characters named from the game's data, none disabled`);
      check(
        state.characters.every((entry) => entry.portrait.includes(`joueur-${entry.id}`)),
        `pick (new) ${size}: each character has its small portrait`,
      );
      check(
        state.ring.character === 'club',
        `pick (new) ${size}: starts on a character nobody has: ${state.ring.character}`,
      );
      check(
        (await page.locator('#player-save').textContent()) === say('C’est moi !') &&
          (await page.locator('#player-back').textContent()) === say('Retour') &&
          (await page.locator('.player-nickname span').textContent()) ===
            say('Ton surnom (si tu veux)'),
        `pick (new) ${size}: field and buttons`,
      );
      check(
        (await page.locator('#player-nickname').getAttribute('maxlength')) === '16' &&
          (await page.locator('#player-nickname').inputValue()) === '',
        `pick (new) ${size}: nickname is optional and at most 16 characters`,
      );
      for (const kind of ['hero', 'triceratops', 'dino']) {
        await page.locator(`.player-character[data-character="${kind}"]`).click();
        state = await dialogState(page);
        check(
          state.ring.character === kind &&
            state.ring.drawn &&
            state.ring.toName >= 2 &&
            state.ring.toTop >= 0,
          `pick (new) ${size}: ${kind} ring is clear and does not touch its name: ${JSON.stringify(state.ring)}`,
        );
        check(
          (await page.locator('.player-character[aria-pressed="true"]').count()) === 1,
          `pick (new) ${size}: one character chosen at a time`,
        );
      }
      await page.locator('#player-nickname').fill(LONG + ' en trop');
      check(
        (await page.locator('#player-nickname').inputValue()) === LONG,
        `pick (new) ${size}: the field stops at 16 characters`,
      );
      await dialogFits(page, `pick (new, typed) ${size}`, 'pick', 'Choisis ton personnage');
      if (!insets) await capture(page, `players-pick-${w}x${h}-${language}`);
      await page.locator('#player-back').click();
      state = await dialogFits(page, `who (back) ${size}`, 'who', 'Qui joue ?');
      check(
        state.focus === 'player-new' && (await players(page)) === null,
        `pick (new) ${size}: Retour creates nothing and returns to the new player card`,
      );
      await page.locator('#players-close').click();
      check(
        await page.locator('#player-chip').evaluate((node) => node === document.activeElement),
        `who ${size}: closing returns the focus to the chip`,
      );
      await page.context().close();

      // Two players: the chip changes player, the window lists both and offers a third.
      page = await open(w, h, {
        seed: { [PLAYERS_KEY]: JSON.stringify(two) },
        chosen: true,
        insets,
        language,
      });
      chip = await chipFits(
        page,
        `two players ${size}`,
        { name: say('Héros'), raw: false, character: 'hero' },
        'Changer de joueur',
      );
      check(chip.dialogs === 0, `a player already chosen in this session is not asked at ${size}`);
      if (!insets) await capture(page, `players-home-2-${w}x${h}-${language}`);
      await page.locator('#player-chip').click();
      state = await dialogFits(page, `who (two players) ${size}`, 'who', 'Qui joue ?');
      assert.deepEqual(
        state.cards.map(({ id, name, raw, current }) => ({ id, name, raw, current })),
        [
          { id: 'p1', name: say('Héros'), raw: false, current: true },
          { id: 'p2', name: 'Zoé', raw: true, current: false },
        ],
        `who (two players) ${size}: cards`,
      );
      check(state.fresh === 1 && state.close === 1, `who (two players) ${size}: new and close`);
      if (!insets) await capture(page, `players-who-2-${w}x${h}-${language}`);
      await page.keyboard.press('Escape');
      await page.locator('#players-dialog').waitFor({ state: 'hidden' });
      check(true, `who ${size}: Escape closes a window opened from the chip`);
      await page.context().close();

      // Four players, a 16-character nickname: the game opens on « Qui joue ? ».
      page = await open(w, h, { seed: { [PLAYERS_KEY]: JSON.stringify(four) }, insets, language });
      state = await dialogFits(page, `who (four players, opening) ${size}`, 'who', 'Qui joue ?');
      assert.deepEqual(
        state.cards.map(({ id, name, raw, current, character }) => ({
          id,
          name,
          raw,
          current,
          character,
        })),
        [
          { id: 'p1', name: say('Héros'), raw: false, current: false, character: 'hero' },
          { id: 'p2', name: LONG, raw: true, current: true, character: 'dragon' },
          { id: 'p3', name: 'Zoé', raw: true, current: false, character: 'dragon' },
          { id: 'p4', name: say('Petit dinosaure'), raw: false, current: false, character: 'dino' },
        ],
        `who (four players) ${size}: cards`,
      );
      check(
        state.fresh === 0 && state.close === 0,
        `who (four players, opening) ${size}: no fifth player and no way out without choosing`,
      );
      check(
        state.focus === 'player-face' && state.focusPlayer === 'p2',
        `who (four players, opening) ${size}: the active player's card has the focus`,
      );
      if (!insets) await capture(page, `players-who-4-${w}x${h}-${language}`);
      await page.locator('[data-player="p2"] .player-tool').click();
      state = await dialogFits(page, `pick (edit) ${size}`, 'pick', 'Choisis ton personnage');
      check(
        state.ring.character === 'dragon' &&
          state.ring.toName >= 2 &&
          (await page.locator('#player-nickname').inputValue()) === LONG &&
          (await page.locator('#player-save').textContent()) === say('Enregistrer'),
        `pick (edit) ${size}: opens on the player's character and nickname`,
      );
      await page.locator('#player-back').click();
      state = await dialogState(page);
      check(
        state.view === 'who' && state.focus === 'player-tool' && state.focusPlayer === 'p2',
        `pick (edit) ${size}: Retour returns to that player's card`,
      );
      await page.locator('[data-player="p2"] .player-face').click();
      await page.locator('#players-dialog').waitFor({ state: 'hidden' });
      await chipFits(
        page,
        `four players ${size}`,
        { name: LONG, raw: true, character: 'dragon' },
        'Changer de joueur',
      );
      if (!insets) await capture(page, `players-home-4-${w}x${h}-${language}`);
      await showHomePage(page, 'parents');
      const parents = await page.evaluate(() => {
        const options = document.querySelector('#home-parent-options');
        const controls = [
          ...document.querySelectorAll('#home-screen button, #home-screen select'),
        ].filter((node) => node.getClientRects().length);
        const button = document.querySelector('#home-players');
        return {
          overflow: options.scrollHeight - options.clientHeight,
          pageScroll: document.documentElement.scrollHeight - innerHeight,
          rect: button.getBoundingClientRect().toJSON(),
          text: button.textContent,
          cut: controls.filter(
            (node) =>
              node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2,
          ).length,
          small: controls.filter((node) => {
            const r = node.getBoundingClientRect();
            return r.width < 47.5 || r.height < 47.5;
          }).length,
          chip: document.querySelector('#player-chip').getClientRects().length,
          help: document.querySelectorAll('.parent-actions .help-point').length,
        };
      });
      check(
        parents.text === say('Joueurs') &&
          parents.rect.width >= 48 &&
          parents.rect.height >= 48 &&
          inSafeArea(parents.rect),
        `parents ${size}: « Joueurs » is a 48 px target in view: ${JSON.stringify(parents.rect)}`,
      );
      check(
        parents.cut === 0 && parents.small === 0 && parents.help === 1 && parents.chip === 0,
        `parents ${size}: page controls whole with the players button: ${JSON.stringify(parents)}`,
      );
      // As for the other pages: only a screen too small for the floors may scroll.
      if (w >= 640)
        check(
          parents.overflow <= 1 && parents.pageScroll <= 1,
          `parents ${size}: page still fits with four players: ${parents.overflow}`,
        );
      if (!insets) await capture(page, `players-parents-${w}x${h}-${language}`);
      await page.locator('#home-players').click();
      state = await dialogFits(page, `manage ${size}`, 'manage', 'Joueurs');
      check(
        state.cards.length === 4 &&
          state.cards.every((card) => card.tool === say('Supprimer') && !card.plays) &&
          state.fresh === 0 &&
          state.close === 1,
        `manage ${size}: four players, each with its « Supprimer », nothing else to touch`,
      );
      if (!insets) await capture(page, `players-manage-${w}x${h}-${language}`);
      await page.locator('[data-player="p2"] .player-tool').click();
      state = await dialogFits(page, `confirm ${size}`, 'confirm', 'Supprimer ce joueur ?');
      check(
        (await page.locator('#player-delete-text').textContent()) ===
          say('Ses étoiles et son carnet seront effacés de cet appareil.') &&
          (await page.locator('#player-delete').textContent()) === say('Supprimer') &&
          (await page.locator('#player-keep').textContent()) === say('Annuler') &&
          (await page.locator('#players-dialog .player-name').textContent()) === LONG,
        `confirm ${size}: says who and what will be erased`,
      );
      check(
        state.focus === 'player-keep',
        `confirm ${size}: the focus is on « Annuler », not on « Supprimer »`,
      );
      if (!insets) await capture(page, `players-confirm-${w}x${h}-${language}`);
      await page.locator('#player-keep').click();
      state = await dialogState(page);
      check(
        state.view === 'manage' && state.cards.length === 4 && state.focusPlayer === 'p2',
        `confirm ${size}: « Annuler » deletes nothing`,
      );
      assert.deepEqual(await players(page), four, `confirm ${size}: stored players`);
      await page.locator('#players-close').click();
      check(
        await page.locator('#home-players').evaluate((node) => node === document.activeElement),
        `manage ${size}: closing returns the focus to « Joueurs »`,
      );
      await page.context().close();
    }

  // ---- A save from before the players is player 1, with its progress. ----
  const legacy = adventure();
  let page = await open(812, 375, { seed: { [FAMILY]: legacy } });
  check(
    (await page.locator('dialog[open]').count()) === 0 &&
      (await page.locator('#mission-total').textContent()) === '5 / 18 étoiles' &&
      (await page.locator('#home-primary').textContent()) === 'Reprendre',
    'legacy save opens straight on its home, with its stars and its mission to resume',
  );
  let before = await stored(page);
  check(
    !(PLAYERS_KEY in before) &&
      Object.keys(before).every((key) => !/:p\d$/.test(key)) &&
      JSON.parse(before[FAMILY]).missions.bestStars.refuge === 3,
    `legacy save is read in place, with no migration: ${Object.keys(before)}`,
  );
  await page.locator('#player-chip').click();
  let state = await dialogState(page);
  check(
    state.cards.length === 1 &&
      state.cards[0].id === 'p1' &&
      state.cards[0].name === 'Héros' &&
      state.cards[0].stars === '★5 / 18 étoiles',
    `legacy save is player 1, the Héros, with its stars: ${JSON.stringify(state.cards)}`,
  );

  // ---- A second player from the home: a character, an optional nickname, a fresh adventure. ----
  await page.locator('#player-new').click();
  // The same character as the first player is allowed.
  await page.locator('.player-character[data-character="hero"]').click();
  await page.locator('#player-nickname').fill('  Massue  ');
  await reloaded(page, () => page.locator('#player-save').click());
  let after = await stored(page);
  assert.deepEqual(
    JSON.parse(after[PLAYERS_KEY]),
    {
      version: 1,
      activeId: 'p2',
      players: [
        { id: 'p1', character: 'hero', name: null },
        { id: 'p2', character: 'hero', name: 'Massue' },
      ],
    },
    'stored players after creation',
  );
  check(true, 'a second player is created with a character and a trimmed nickname');
  check(
    (await page.locator('dialog[open]').count()) === 0,
    'the new player lands on the home, without being asked who plays',
  );
  let chip = await chipState(page);
  check(
    chip.name === 'Massue' && chip.raw && chip.action === 'Changer de joueur',
    `the home shows the new player: ${chip.name}`,
  );
  check(
    (await page.locator('#mission-total').textContent()) === '0 / 18 étoiles' &&
      (await page.locator('#home-primary').textContent()) === 'Jouer' &&
      (await page.locator('#home-next-mission').textContent()).includes('Le refuge'),
    'the new player starts a fresh adventure: no star, nothing to resume',
  );
  await page.locator('#home-caprice-album').click();
  check(
    (await page.locator('[data-sticker][data-earned="true"]').count()) === 0,
    'the new player has an empty sticker book',
  );
  await page.locator('#caprice-album-close').click();
  for (const key of PLAYER_KEYS)
    assert.equal(after[key], before[key], `player 1 untouched by the creation: ${key}`);
  check(true, "the first player's four keys are byte for byte what they were");
  check(
    Object.keys(after).every((key) => !/:p[134]$/.test(key)) &&
      Object.keys(after).filter((key) => key.endsWith(':p2')).length > 0 &&
      Object.keys(after)
        .filter((key) => key.endsWith(':p2'))
        .every((key) => PLAYER_KEYS.includes(key.slice(0, -3))) &&
      JSON.parse(after[FAMILY + ':p2']).missions.bestStars.refuge === 0,
    `the second player's adventure lives under its own keys: ${Object.keys(after)}`,
  );
  // The second player plays: a mission started is theirs alone.
  await page.locator('#home-primary').click();
  await page.locator('#start').waitFor({ state: 'visible' });
  await leaveBattle(page);
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  const second = await stored(page);
  for (const key of PLAYER_KEYS)
    assert.equal(second[key], before[key], `player 1 untouched by player 2's game: ${key}`);
  check(true, "playing as the second player never writes the first player's keys");
  check(
    JSON.parse(second[FAMILY + ':p2']).missions.activeMode === 'missions' &&
      (await page.locator('#home-primary').textContent()) === 'Reprendre',
    'the second player has a mission of their own to resume',
  );
  // The family save speaks of the player in progress.
  await showHomePage(page, 'parents');
  await page.locator('#home-family').click();
  check(
    (await page.locator('#family-player-note').isVisible()) &&
      (await page.locator('#family-player-note').textContent()) ===
        'Ce fichier ne garde que l’aventure du joueur en cours : Massue',
    'with several players the family save says whose adventure it keeps',
  );
  await page.locator('#family-close').click();
  await showHomePage(page, 'home');

  // ---- Switching back: the first player's stars, sticker and mission are all there. ----
  await page.locator('#player-chip').click();
  state = await dialogState(page);
  assert.deepEqual(
    state.cards.map(({ id, name, stars, current }) => ({ id, name, stars, current })),
    [
      { id: 'p1', name: 'Héros', stars: '★5 / 18 étoiles', current: false },
      { id: 'p2', name: 'Massue', stars: '★0 / 18 étoiles', current: true },
    ],
    'who plays, each with their own stars',
  );
  check(true, 'each card reads its stars from that player’s own save, without switching');
  await capture(page, 'players-who-after-creation');
  await reloaded(page, () => page.locator('[data-player="p1"] .player-face').click());
  after = await stored(page);
  check(
    JSON.parse(after[PLAYERS_KEY]).activeId === 'p1' &&
      (await page.locator('dialog[open]').count()) === 0,
    'touching a card plays as that player, without asking again',
  );
  check(
    (await page.locator('#mission-total').textContent()) === '5 / 18 étoiles' &&
      (await page.locator('#home-primary').textContent()) === 'Reprendre' &&
      (await chipState(page)).name === 'Héros',
    "the first player's stars and mission come back",
  );
  await page.locator('#home-caprice-album').click();
  check(
    (await page.locator(`[data-sticker="${sticker}"]`).getAttribute('data-earned')) === 'true' &&
      (await page.locator('[data-sticker][data-earned="true"]').count()) === 1,
    "the first player's sticker book comes back",
  );
  await page.locator('#caprice-album-close').click();
  for (const key of PLAYER_KEYS) {
    assert.equal(after[key], before[key], `player 1 after the round trip: ${key}`);
    assert.equal(after[key + ':p2'], second[key + ':p2'], `player 2 kept while away: ${key}`);
  }
  check(true, 'a round trip between two players loses nothing on either side');
  await showHomePage(page, 'parents');
  await page.locator('#home-family').click();
  check(
    (await page.locator('#family-player-note').textContent()) ===
      'Ce fichier ne garde que l’aventure du joueur en cours : Héros',
    'the family save follows the active player',
  );
  await page.locator('#family-close').click();
  await showHomePage(page, 'home');

  // ---- Editing changes the character and the nickname, nothing else. ----
  before = await stored(page);
  await page.evaluate(() => {
    window.samePage = true;
  });
  await page.locator('#player-chip').click();
  await page.locator('[data-player="p1"] .player-tool').click();
  await page.locator('.player-character[data-character="ninja"]').click();
  await page.locator('#player-nickname').fill('Lou <ami>');
  await page.locator('#player-nickname').press('Enter');
  state = await dialogState(page);
  check(
    state.view === 'who' &&
      state.cards[0].name === 'Lou <ami>' &&
      state.cards[0].raw &&
      state.cards[0].character === 'ninja' &&
      state.cards[0].stars === '★5 / 18 étoiles' &&
      state.focusPlayer === 'p1',
    `editing shows the new character and nickname at once: ${JSON.stringify(state.cards[0])}`,
  );
  after = await stored(page);
  assert.deepEqual(JSON.parse(after[PLAYERS_KEY]), {
    version: 1,
    activeId: 'p1',
    players: [
      { id: 'p1', character: 'ninja', name: 'Lou <ami>' },
      { id: 'p2', character: 'hero', name: 'Massue' },
    ],
  });
  for (const key of Object.keys(before))
    if (key !== PLAYERS_KEY) assert.equal(after[key], before[key], `edit leaves ${key}`);
  check(
    Object.keys(after).length === Object.keys(before).length &&
      (await page.evaluate(() => window.samePage === true)),
    'editing changes the character and the nickname only, without leaving the page',
  );
  await page.locator('#players-close').click();
  chip = await chipState(page);
  check(
    chip.name === 'Lou <ami>' && chip.raw && chip.character === 'ninja',
    'the home chip follows the edit',
  );
  check(
    (await page.locator('#player-chip .player-name').evaluate((node) => node.children.length)) ===
      0,
    'a nickname is plain text, never markup',
  );
  // An emptied nickname gives the character's name back.
  await page.locator('#player-chip').click();
  await page.locator('[data-player="p1"] .player-tool').click();
  await page.locator('#player-nickname').fill('   ');
  await page.locator('#player-save').click();
  await page.locator('#players-close').click();
  chip = await chipState(page);
  check(
    chip.name === 'Ninja' && !chip.raw && (await players(page)).players[0].name === null,
    'an empty nickname means no nickname: the character names the player',
  );

  // ---- A nickname is shown as typed in English; a character's name is translated. ----
  await chooseLanguage(page, 'en');
  chip = await chipState(page);
  check(
    chip.name === 'Ninja' && chip.action === 'Switch player',
    `English home chip: ${chip.name} / ${chip.action}`,
  );
  await page.locator('#player-chip').click();
  state = await dialogState(page);
  check(
    state.title === 'Who is playing?' &&
      state.cards[1].name === 'Massue' &&
      state.cards[1].raw &&
      state.cards[1].stars === '★0 / 18 stars' &&
      state.cards[1].tool === 'Edit',
    `the nickname « Massue » stays raw in English, where the character is a Clubber: ${JSON.stringify(state.cards[1])}`,
  );
  await page.locator('[data-player="p2"] .player-tool').click();
  check(
    (await page.locator('.player-character[data-character="club"]').textContent()) === 'Clubber' &&
      (await page.locator('#player-nickname').inputValue()) === 'Massue' &&
      (await page.locator('#player-save').textContent()) === 'Save',
    'English edit view translates characters and keeps the nickname',
  );
  await capture(page, 'players-edit-en');
  await page.locator('#player-back').click();
  await reloaded(page, () => page.locator('[data-player="p2"] .player-face').click());
  chip = await chipState(page);
  check(
    chip.name === 'Massue' && chip.raw && chip.action === 'Switch player',
    'the raw nickname survives the change of player in English',
  );
  await showHomePage(page, 'parents');
  await page.locator('#home-family').click();
  check(
    (await page.locator('#family-player-note').textContent()) ===
      'This file only keeps the adventure of the current player: Massue',
    'English family note keeps the nickname raw',
  );
  await page.locator('#family-close').click();
  await page.context().close();

  // ---- With two players, the game opens on « Qui joue ? », once per session. ----
  page = await open(780, 360, {
    seed: { [PLAYERS_KEY]: JSON.stringify(two), [FAMILY]: legacy, [FAMILY + ':p2']: legacy },
  });
  state = await dialogState(page);
  check(
    state.open && state.modal && state.view === 'who' && state.close === 0,
    'two players: the game opens on « Qui joue ? », with no close button',
  );
  check(
    state.cards[0].current && state.focusPlayer === 'p1' && state.focus === 'player-face',
    "the opening highlights the active player's card and gives it the focus",
  );
  for (let press = 0; press < 3; press++) {
    await page.keyboard.press('Escape');
    await settle(page);
  }
  state = await dialogState(page);
  check(
    state.open && state.modal && state.view === 'who',
    'the opening question cannot be dismissed without choosing',
  );
  // It lives with the "turn your phone" notice like every other window.
  await portrait(page, '#players-dialog', 'players');
  state = await dialogState(page);
  check(
    state.view === 'who' &&
      state.cards.length === 2 &&
      state.focusPlayer === 'p1' &&
      (await page.evaluate(
        () =>
          !document.querySelector('#orientation-notice').closest('dialog') &&
          document.querySelector('#players-dialog').children.length === 3,
      )),
    'a rotation leaves the question as it was, and the notice leaves the window',
  );
  await page.locator('#player-new').click();
  await page.locator('#player-back').click();
  state = await dialogState(page);
  check(
    state.view === 'who' && state.close === 0,
    'looking at the characters and coming back still asks who plays',
  );
  await page.evaluate(() => {
    window.samePage = true;
  });
  await page.locator('[data-player="p1"] .player-face').click();
  await page.locator('#players-dialog').waitFor({ state: 'hidden' });
  check(
    (await page.evaluate(() => window.samePage === true)) &&
      (await page.evaluate(() => !document.querySelector('#orientation-notice').closest('dialog'))),
    'choosing the active player closes the question without rebuilding the page',
  );
  check(
    await page.locator('#player-chip').evaluate((node) => node === document.activeElement),
    'the home takes the focus back after the question',
  );
  await page.reload();
  await ready(page);
  check(
    (await page.locator('dialog[open]').count()) === 0,
    'the question is not asked again in the same session',
  );
  // A new tab is a new session of the application, on the same saved players.
  const again = await page.context().newPage();
  again.on('pageerror', (e) => errors.push(e.message));
  await again.goto(url);
  await ready(again);
  state = await dialogState(again);
  check(state.open && state.view === 'who', 'a new session asks who plays again');
  await reloaded(again, () => again.locator('[data-player="p2"] .player-face').click());
  check(
    (await again.locator('dialog[open]').count()) === 0 &&
      (await chipState(again)).name === 'Zoé' &&
      (await players(again)).activeId === 'p2',
    'choosing the other player at the opening plays as that player, asked once',
  );
  await again.reload();
  await ready(again);
  check(
    (await again.locator('dialog[open]').count()) === 0,
    'a reload after the choice does not ask again',
  );
  await page.context().close();

  // ---- Deleting: behind a confirmation, that player's keys only, never the last one. ----
  const three = {
    version: 1,
    activeId: 'p1',
    players: [
      { id: 'p1', character: 'hero', name: null },
      { id: 'p2', character: 'dragon', name: 'Zoé' },
      { id: 'p3', character: 'archer', name: null },
    ],
  };
  const seed = { [PLAYERS_KEY]: JSON.stringify(three), 'conquete-serpents:sound:v1': '00' };
  for (const id of ['p1', 'p2', 'p3']) {
    seed[playerKey(FAMILY, id)] = legacy;
    // The three other keys of the players who are away: any content, never read here.
    if (id !== 'p1')
      for (const key of PLAYER_KEYS.slice(1)) seed[playerKey(key, id)] = `${id} ${key}`;
  }
  page = await open(812, 375, { seed, chosen: true });
  before = await stored(page);
  await showHomePage(page, 'parents');
  await page.locator('#home-players').click();
  await page.locator('[data-player="p3"] .player-tool').click();
  state = await dialogState(page);
  check(
    state.view === 'confirm' && (await players(page)).players.length === 3,
    '« Supprimer » asks first and deletes nothing',
  );
  assert.deepEqual(await stored(page), before, 'nothing changes before the confirmation');
  await capture(page, 'players-confirm');
  await page.locator('#player-delete').click();
  state = await dialogState(page);
  after = await stored(page);
  check(
    state.view === 'manage' && state.cards.map((card) => card.id).join() === 'p1,p2',
    'the confirmed player leaves the list',
  );
  const expected = { ...before };
  for (const key of PLAYER_KEYS) delete expected[playerKey(key, 'p3')];
  expected[PLAYERS_KEY] = JSON.stringify({ ...three, players: three.players.slice(0, 2) });
  assert.deepEqual(after, expected, 'deleting player 3 removes its four keys and its entry only');
  check(true, 'deleting removes that player’s four keys and nothing else');
  // Deleting the player in progress, player 1: the historical keys go, the other player stays.
  await page.locator('[data-player="p1"] .player-tool').click();
  await reloaded(page, () => page.locator('#player-delete').click());
  after = await stored(page);
  assert.deepEqual(
    JSON.parse(after[PLAYERS_KEY]),
    { version: 1, activeId: 'p2', players: [{ id: 'p2', character: 'dragon', name: 'Zoé' }] },
    'stored players after deleting player 1',
  );
  check(
    PLAYER_KEYS.every((key) => !(key in after)),
    `deleting player 1 clears the historical keys, and the page left does not write them back: ${Object.keys(after)}`,
  );
  check(
    JSON.parse(after[FAMILY + ':p2']).missions.bestStars.refuge === 3 &&
      after['conquete-serpents:sound:v1'] === '00',
    'the remaining player and the device settings are untouched',
  );
  chip = await chipState(page);
  check(
    chip.dialogs === 0 && chip.name === 'Zoé' && chip.action === 'Ajouter un joueur',
    'one player left: the home opens directly and offers to add a player',
  );
  check(
    (await page.locator('#mission-total').textContent()) === '5 / 18 étoiles',
    'the remaining player keeps their stars',
  );
  await showHomePage(page, 'parents');
  check(
    (await page.locator('#home-players').isHidden()) &&
      (await page.locator('#home-family').isVisible()),
    'the last player cannot be deleted: the parents page no longer lists players',
  );
  await page.locator('#home-family').click();
  check(
    await page.locator('#family-player-note').isHidden(),
    'with one player the family save needs no extra sentence',
  );
  await page.locator('#family-close').click();
  await showHomePage(page, 'home');
  // The freed id serves again, and its new player starts fresh.
  await page.locator('#player-chip').click();
  await page.locator('#player-new').click();
  await reloaded(page, () => page.locator('#player-save').click());
  after = await stored(page);
  check(
    (await players(page)).activeId === 'p1' &&
      (await page.locator('#mission-total').textContent()) === '0 / 18 étoiles' &&
      JSON.parse(after[FAMILY]).missions.bestStars.refuge === 0,
    'a freed id is reused by a new player who starts fresh',
  );
  check(
    (await chipState(page)).name === 'Héros',
    'a new player without a nickname is named after the character',
  );
  await page.context().close();

  // ---- A device that refuses storage still plays; it just cannot keep a second player. ----
  const context = await browser.newContext({
    viewport: { width: 812, height: 375 },
    locale: 'fr-CH',
    hasTouch: true,
  });
  page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('refused', 'QuotaExceededError');
    };
  });
  await page.goto(url);
  await ready(page);
  await page.evaluate(() => {
    window.samePage = true;
  });
  await page.locator('#player-chip').click();
  await page.locator('#player-new').click();
  await page.locator('#player-save').click();
  state = await dialogState(page);
  check(
    state.view === 'pick' &&
      state.status === 'Impossible d’enregistrer ce joueur sur cet appareil.' &&
      (await page.evaluate(() => window.samePage === true)),
    `a refused storage says so and changes nothing: ${state.status}`,
  );
  check(
    await page.locator('#players-dialog').evaluate((dialog) => {
      const frame = dialog.getBoundingClientRect();
      const r = dialog.querySelector('.players-status').getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return (
        r.height > 10 &&
        r.top >= frame.top &&
        r.bottom <= frame.bottom &&
        hit === dialog.querySelector('.players-status')
      );
    }),
    'the refusal is in view inside the window',
  );
  await page.locator('#player-back').click();
  check(
    (await dialogState(page)).cards.length === 1 && (await dialogState(page)).status === '',
    'the refused player is not listed',
  );
  await context.close();

  // ---- Two tabs of the game: each one starts from the stored players, not from its own. ----
  page = await open(812, 375, { seed: { [FAMILY]: adventure() } });
  const otherTab = await page.context().newPage();
  otherTab.on('pageerror', (e) => errors.push(e.message));
  await otherTab.goto(url);
  await ready(otherTab);
  // Both tabs loaded a single player. The first tab creates Alice.
  await page.locator('#player-chip').click();
  await page.locator('#player-new').click();
  await page.locator('.player-character[data-character="dragon"]').click();
  await page.locator('#player-nickname').fill('Alice');
  await reloaded(page, () => page.locator('#player-save').click());
  // The otherTab tab follows the change without being touched.
  await otherTab.waitForFunction(
    () => document.querySelector('#player-chip')?.dataset.players === 'several',
  );
  check(
    (await chipState(otherTab)).action === 'Changer de joueur',
    'a tab follows the players created in another tab',
  );
  // Alice earns a star in her own adventure.
  const aliceKeys = await stored(page);
  // The otherTab tab now creates Bob: he must not take Alice's place.
  await otherTab.locator('#player-chip').click();
  check(
    (await dialogState(otherTab)).cards.length === 2,
    'the other tab lists the player created elsewhere',
  );
  await otherTab.locator('#player-new').click();
  await otherTab.locator('.player-character[data-character="dino"]').click();
  await otherTab.locator('#player-nickname').fill('Bob');
  await reloaded(otherTab, () => otherTab.locator('#player-save').click());
  after = await stored(otherTab);
  assert.deepEqual(
    JSON.parse(after[PLAYERS_KEY]).players,
    [
      { id: 'p1', character: 'hero', name: null },
      { id: 'p2', character: 'dragon', name: 'Alice' },
      { id: 'p3', character: 'dino', name: 'Bob' },
    ],
    'players after a creation in each tab',
  );
  check(true, 'a player created in a otherTab tab gets a free place, not the other tab’s');
  for (const key of PLAYER_KEYS.map((key) => playerKey(key, 'p2')))
    assert.equal(after[key], aliceKeys[key], `Alice untouched by Bob's creation: ${key}`);
  check(
    (await chipState(otherTab)).name === 'Bob' &&
      (await otherTab.locator('#mission-total').textContent()) === '0 / 18 étoiles',
    'the player created in the otherTab tab starts a fresh adventure',
  );
  // A tab whose own player was deleted elsewhere reloads instead of writing it back.
  await otherTab.locator('#home-parents').click();
  await otherTab.locator('#home-players').click();
  await otherTab.locator('[data-player="p2"] .player-tool').click();
  await page.evaluate(() => {
    window.samePage = true;
  });
  await otherTab.locator('#player-delete').click();
  await page.waitForFunction(() => !window.samePage && !!document.querySelector('#player-chip'));
  await ready(page);
  after = await stored(page);
  check(
    !JSON.parse(after[PLAYERS_KEY]).players.some((player) => player.id === 'p2') &&
      PLAYER_KEYS.every((key) => !(playerKey(key, 'p2') in after)),
    `a tab whose player was deleted elsewhere leaves without restoring it: ${Object.keys(after)}`,
  );
  await page.context().close();
  check(errors.length === 0, 'players: ' + JSON.stringify(errors));
}
