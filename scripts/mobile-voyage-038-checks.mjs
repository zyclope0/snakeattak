import { readFile, rm, writeFile } from 'node:fs/promises';
import { leaveBattle } from '../tests/browser-entry.mjs';
import { revealControl } from '../tests/reveal-controls.mjs';
import { capriceExplanation } from '../src/ui/capriceCopy.ts';
import { english } from '../src/i18n/english.ts';
import { missionById } from '../src/missions.ts';
import { PLAYER_CHOSEN_KEY, PLAYERS_KEY } from '../src/players.ts';
import { REWARDS } from '../src/rewards.ts';
import { planVoyage, stageCaprice } from '../src/voyage.ts';
import { encodeVoyage } from '../src/voyageCode.ts';
import { readVoyageState } from '../src/voyageState.ts';
import { validateVoyageLog, VOYAGE_STORAGE_KEY } from '../src/voyageStorage.ts';

const LANGUAGE = 'conquete-serpents:language:v1';
const FIXTURE = '.voyage-038-fixture.html';
// The first stage of this voyage is the refuge, which the three allies of the start win on
// their own; the fourth falls when nobody is placed (`scripts/balance-voyage.mjs` engine).
const SEED = 2;
// A voyage whose third stage has a caprice, and whose last caprice also brings the king.
const MAP_SEED = 12345;
const grid = [
  [780, 360],
  [812, 375],
  [568, 320],
  [1280, 800],
];

const TEXT = {
  fr: {
    door: 'Le voyage',
    resume: 'Reprendre le voyage',
    fresh: 'Nouveau',
    title: 'Le voyage',
    step: (n) => `Étape ${n} sur 5`,
    won: (n) => `Étape ${n} réussie !`,
    go: 'C’est parti !',
    again: 'Recommencer l’étape',
    record: (n) => `Ton plus long voyage : ${n} étape${n > 1 ? 's' : ''}`,
    bag: (n) => `Ton sac de voyage : ${n} bonus sur 4`,
    note: 'Ton voyage est gardé sur cet appareil entre deux étapes. Une étape quittée repart de son début.',
    stop: (n, name) => `Étape ${n} : ${name}`,
    surprise: (name) => `Caprice surprise : ${name}`,
    king: 'Le roi à trois têtes',
    purse: 'Le roi t’a pris 300 pièces.',
    mark: (n) => `Le voyage · Étape ${n} sur 5`,
    stageWon: 'Étape réussie !',
    wonNote: (n) => `Étape ${n} sur 5 réussie. Choisis maintenant un bonus pour la suite.`,
    kingNote: 'Le roi à trois têtes est battu. Tu as fini le voyage !',
    onward: 'Continuer le voyage',
    lostTitle: 'Le voyage s’arrête ici',
    lostNote: (n) => `Le camp est tombé à l’étape ${n}. Tu pourras refaire ce voyage.`,
    see: 'Voir mon voyage',
    choose: 'Choisis un bonus pour la suite du voyage',
    rule: 'Tu le gardes dans ton sac jusqu’à la fin du voyage.',
    arrived: 'Bravo, tu as fini le voyage !',
    fallen: (n) => `Ton voyage s’arrête à l’étape ${n}`,
    fallenNote: (n) => `Tu as réussi ${n} étapes sur 5. Tu peux repartir !`,
    fallenFirst: 'Le camp est tombé à la première étape. Tu peux repartir !',
    actions: {
      arrived: ['Un nouveau voyage', 'Donner mon voyage', 'J’ai un code'],
      fallen: ['Refaire ce voyage', 'Un nouveau voyage', 'J’ai un code'],
    },
    gift: 'Donne ton voyage',
    giftText: 'Donne ce code à ton frère ou à ta sœur. Il ou elle fera le même voyage que toi.',
    copied: ['Code copié.', 'Code sélectionné : copie-le avec le menu de ton appareil.'],
    other: 'Un autre voyage',
    haveCode: 'Tu as un code ?',
    refused: {
      format: 'Ce n’est pas un code de voyage. Un code s’écrit comme VOYAGE-1-0YK9-AY.',
      checksum: 'Il y a une erreur dans ce code. Vérifie les lettres et les chiffres.',
      version:
        'Ce code vient d’une autre version du jeu. Demande à un parent de mettre le jeu à jour.',
    },
    replace: 'Changer de voyage ?',
    replaceText: (n) =>
      `Tu as déjà réussi ${n} étape${n > 1 ? 's' : ''} de ton voyage. Si tu en commences un autre, il s’arrête là.`,
    stars: '0 / 18 étoiles',
  },
  en: {
    door: 'The Voyage',
    resume: 'Resume the voyage',
    fresh: 'New',
    title: 'The Voyage',
    step: (n) => `Stage ${n} of 5`,
    won: (n) => `Stage ${n} complete!`,
    go: english['C’est parti !'],
    again: 'Start the stage again',
    record: (n) => `Your longest voyage: ${n} stage${n > 1 ? 's' : ''}`,
    bag: (n) => `Your travel bag: ${n} of 4 bonuses`,
    note: 'Your voyage is saved on this device between stages. A stage you leave starts again from the beginning.',
    stop: (n, name) => `Stage ${n}: ${name}`,
    surprise: (name) => `Surprise caprice: ${name}`,
    king: 'The Three-Headed King',
    purse: 'The king took 300 of your coins.',
    mark: (n) => `The Voyage · Stage ${n} of 5`,
    stageWon: 'Stage complete!',
    wonNote: (n) => `Stage ${n} of 5 complete. Now choose a bonus for the rest of the voyage.`,
    kingNote: 'The Three-Headed King is beaten. You finished the voyage!',
    onward: 'Continue the voyage',
    lostTitle: 'The voyage stops here',
    lostNote: (n) => `The camp fell at stage ${n}. You can try this voyage again.`,
    see: 'See my voyage',
    choose: 'Choose a bonus for the rest of the voyage',
    rule: 'You keep it in your bag until the end of the voyage.',
    arrived: 'Well done, you finished the voyage!',
    fallen: (n) => `Your voyage stops at stage ${n}`,
    fallenNote: (n) => `You completed ${n} stages out of 5. You can set off again!`,
    fallenFirst: 'The camp fell at the first stage. You can set off again!',
    actions: {
      arrived: ['A new voyage', 'Share my voyage', 'I have a code'],
      fallen: ['Try this voyage again', 'A new voyage', 'I have a code'],
    },
    gift: 'Share your voyage',
    giftText: 'Give this code to your brother or sister. They will play the same voyage as you.',
    copied: [
      english['Code copié.'],
      english['Code sélectionné : copie-le avec le menu de ton appareil.'],
    ],
    other: 'Another voyage',
    haveCode: 'Do you have a code?',
    refused: {
      format: 'That is not a voyage code. A code looks like VOYAGE-1-0YK9-AY.',
      checksum: 'There is a mistake in this code. Check the letters and numbers.',
      version: 'This code comes from another version of the game. Ask a parent to update the game.',
    },
    replace: 'Change voyage?',
    replaceText: (n) =>
      `You have already completed ${n} stage${n > 1 ? 's' : ''} of your voyage. If you start another one, it stops there.`,
    stars: '0 / 18 stars',
  },
};

/** The log of a player who won `won` stages of a voyage, keeping the first card each time. */
function logOf(seed, won, { cards = won, status = 'travelling', best = won } = {}) {
  const plan = planVoyage(seed);
  const bag = Array.from({ length: cards }, (_, index) => plan.stages[index].offer[0]);
  const current = readVoyageState({ version: 1, seed, won, bag, status });
  const log = validateVoyageLog({ version: 1, best, current });
  if (!log) throw new Error(`no such voyage: ${seed} ${won} ${cards} ${status}`);
  return JSON.stringify(log);
}
/** What the map of a seed must show, read from the model. */
const expectedStops = (seed) =>
  planVoyage(seed).stages.map((stage) => ({
    mission: missionById(stage.run.missionId).name,
    caprice: stageCaprice(stage)?.name ?? null,
    king: stage.king,
  }));

const settle = (page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
const text = (page, selector) => page.locator(selector).innerText();
const log = (page, key = VOYAGE_STORAGE_KEY) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
// Not a save: the departures for which « Tu as des pièces, recrute ! » was already shown.
// A stage played without buying anyone adds its own, as any battle does.
const REMINDER = 'conquete-serpents:recruitment-reminder:v1';
/** Every save of the device, but the voyage of the player at play. */
const otherSaves = (page) =>
  page.evaluate(
    (skipped) =>
      JSON.stringify(
        Object.keys(localStorage)
          .filter((k) => !skipped.includes(k))
          .sort()
          .map((k) => [k, localStorage.getItem(k)]),
      ),
    [VOYAGE_STORAGE_KEY, REMINDER],
  );
/** The reminder's memory holds departure codes and nothing else. */
const reminderIsCodes = (page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    const codes = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(codes) && codes.every((code) => /^[A-Z]+(-[A-Z0-9]+)+$/.test(code));
  }, REMINDER);

/** The page of the voyage as a child sees it: what it says, and whether everything fits. */
const voyageState = (page) =>
  page.evaluate(() => {
    const screen = document.querySelector('#home-screen');
    const panel = document.querySelector('.voyage-panel');
    const frame = panel.getBoundingClientRect();
    const shown = (node) => !!node && node.getClientRects().length > 0;
    const inside = (node, box = frame) => {
      const r = node.getBoundingClientRect();
      return (
        r.left >= box.left - 1 &&
        r.right <= box.right + 1 &&
        r.top >= box.top - 1 &&
        r.bottom <= box.bottom + 1
      );
    };
    const words = (selector, root = document) =>
      shown(root.querySelector(selector)) ? root.querySelector(selector).innerText.trim() : null;
    const controls = [...screen.querySelectorAll('button')].filter(shown);
    const stops = [...panel.querySelectorAll('.voyage-stop')];
    const overlap = (a, b) => {
      const x = a.getBoundingClientRect(),
        y = b.getBoundingClientRect();
      return (
        x.left < y.right - 1 && y.left < x.right - 1 && x.top < y.bottom - 1 && y.top < x.bottom - 1
      );
    };
    const buttons = [...panel.querySelectorAll('button')].filter(shown);
    const purse = panel.querySelector('.path-purse');
    return {
      page: screen.dataset.page,
      view: document.querySelector('.voyage-page').dataset.view,
      title: words('.voyage-title span'),
      step: words('.voyage-title em'),
      record: words('#voyage-record'),
      note: words('#voyage-note'),
      // The record and the note of the other pages give their place to the voyage's own.
      strangers: ['#mission-total', '#career-status', '.home-brand', '#player-chip'].filter(
        (selector) => shown(document.querySelector(selector)),
      ),
      stops: stops.map((stop) => ({
        state: stop.dataset.state,
        spoken: [...stop.querySelectorAll('.sr-only')].map((node) => node.textContent),
        caprice: stop.querySelector('.stop-caprice')?.getAttribute('aria-label') ?? null,
        sticker: stop.querySelector('.stop-caprice svg')?.dataset.capriceSticker ?? null,
        king: stop.querySelector('.stop-king')?.getAttribute('alt') ?? null,
        lairs: stop.querySelectorAll('.stop-exits i').length,
        exits: stop.querySelector('.stop-exits').getAttribute('aria-label'),
        map: stop.querySelectorAll('.stop-map svg polyline').length,
        whole:
          inside(stop) &&
          [...stop.querySelectorAll('.stop-caprice, .stop-king')].every((node) => inside(node)),
      })),
      go: words('#voyage-go'),
      // « Le roi t'a pris 300 pièces. » : whole, and clear of every stop and of what hangs on it.
      purse: words('.path-purse'),
      purseClear:
        !purse ||
        (inside(purse) &&
          !stops.some((stop) =>
            [stop, ...stop.querySelectorAll('.stop-badge, .stop-king, .stop-caprice')].some(
              (node) => overlap(purse, node),
            ),
          )),
      bag: panel.querySelector('.voyage-bag')?.getAttribute('aria-label') ?? null,
      cards: [...panel.querySelectorAll('.voyage-bag .bag-card .bonus-picture')].map(
        (node) => node.dataset.bonus,
      ),
      places: panel.querySelectorAll('.voyage-bag > .bag-card, .voyage-bag > .bag-empty').length,
      code: words('#voyage-code .departure-value'),
      best: words('.voyage-best'),
      fallen: words('.voyage-fallen'),
      actions: [...panel.querySelectorAll('.voyage-actions button')].map((b) => b.innerText.trim()),
      heading: words('.voyage-view > h2'),
      rule: words('.bonus-rule'),
      bonuses: [...panel.querySelectorAll('.bonus-card')].map((card) => ({
        id: card.dataset.bonus,
        title: card.querySelector('strong').innerText.trim(),
        detail: card.querySelector('.bonus-detail').innerText.trim(),
        whole: inside(card),
      })),
      panelButtons: buttons.map((b) => b.id || b.className),
      // Fit: the panel does not scroll, the page neither; every control is a whole 48 px target.
      overflow: [panel.scrollHeight - panel.clientHeight, panel.scrollWidth - panel.clientWidth],
      pageOverflow: [
        document.documentElement.scrollWidth - innerWidth,
        document.documentElement.scrollHeight - innerHeight,
      ],
      small: controls
        .filter((b) => {
          const r = b.getBoundingClientRect();
          return r.width < 47.5 || r.height < 47.5;
        })
        .map((b) => b.id || b.className),
      cut: buttons
        .filter(
          (b) =>
            !inside(b) || b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1,
        )
        .map((b) => b.id || b.className),
      overlapping: buttons.flatMap((a, index) =>
        buttons
          .slice(index + 1)
          .filter((b) => overlap(a, b))
          .map((b) => `${a.id || a.className}/${b.id || b.className}`),
      ),
      titleRow: (() => {
        const row = [
          document.querySelector('#home-back'),
          document.querySelector('.voyage-title'),
          document.querySelector('#voyage-record'),
          document.querySelector('#home-settings'),
        ].filter(shown);
        return row.every((node, index) => index === 0 || !overlap(row[index - 1], node));
      })(),
      french: [...panel.querySelectorAll('[lang="fr"]')].map((node) => [
        node.textContent,
        node.hasAttribute('data-copy-raw'),
      ]),
    };
  });
const fits = (state) =>
  state.overflow.every((value) => value <= 1) &&
  state.pageOverflow.every((value) => value <= 0) &&
  !state.small.length &&
  !state.cut.length &&
  !state.overlapping.length &&
  state.titleRow;

/** A window of the voyage: it does not scroll, and each control is whole and 48 px high. */
const windowState = (page, selector) =>
  page.locator(selector).evaluate((dialog) => {
    const frame = dialog.getBoundingClientRect();
    const controls = [...dialog.querySelectorAll('button, input')].filter(
      (node) => node.getClientRects().length,
    );
    const name = (node) => node.id || node.textContent.trim();
    return {
      open: dialog.open,
      scrolls: dialog.scrollHeight > dialog.clientHeight + 1,
      small: controls.filter((node) => node.getBoundingClientRect().height < 47.5).map(name),
      cut: controls
        .filter(
          (node) =>
            node.tagName === 'BUTTON' &&
            (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1),
        )
        .map(name),
      outside: controls
        .filter((node) => {
          const r = node.getBoundingClientRect();
          return r.left < frame.left || r.right > frame.right || r.bottom > frame.bottom;
        })
        .map(name),
    };
  });
const windowWhole = (state) =>
  state.open && !state.scrolls && !state.small.length && !state.cut.length && !state.outside.length;

/** The result panel of a stage: its title, the one way on, and nothing of a mission. */
const resultState = (page) =>
  page.evaluate(() => {
    const panel = document.querySelector('#battle-result');
    const frame = panel.getBoundingClientRect();
    const shown = (node) => !!node && node.getClientRects().length > 0;
    const visible = (id) => shown(document.getElementById(id));
    const buttons = [...panel.querySelectorAll('button')].filter(shown);
    return {
      title: document.querySelector('#battle-result-title').innerText.trim(),
      note: shown(document.querySelector('#voyage-result-note'))
        ? document.querySelector('#voyage-result-note').innerText.trim()
        : null,
      buttons: buttons.map((b) => b.id).filter((id) => id !== 'result-allies'),
      onward: visible('voyage-continue')
        ? document.querySelector('#voyage-continue').innerText.trim()
        : null,
      stars: visible('battle-result-stars'),
      mission: [
        'mission-battle-actions',
        'mission-next',
        'mission-again',
        'mission-back-map',
        'mission-caprice-replay',
        'mission-sticker-hint',
        'result-caprice-album',
        'caprice-sticker-result',
        'end-restart',
        'end-home',
      ].filter(visible),
      overflow: panel.scrollHeight - panel.clientHeight,
      onScreen: frame.bottom <= innerHeight + 0.5 && frame.right <= innerWidth + 0.5,
      small: buttons.filter((b) => b.getBoundingClientRect().height < 47.5).map((b) => b.id),
      focus: document.activeElement?.id,
    };
  });
/** The mark of the voyage on the board: there, readable, inside the board, never in the way. */
const markState = (page) =>
  page.evaluate(() => {
    const mark = document.querySelector('#voyage-mark');
    if (!mark || !mark.getClientRects().length) return null;
    const r = mark.getBoundingClientRect();
    const board = document.querySelector('.battle-stage').getBoundingClientRect();
    return {
      text: mark.innerText.trim(),
      inside:
        r.left >= board.left &&
        r.right <= board.right &&
        r.top >= board.top &&
        r.bottom <= board.bottom,
      fontSize: parseFloat(getComputedStyle(mark).fontSize),
      passive: getComputedStyle(mark).pointerEvents === 'none',
    };
  });

/**
 * « Le voyage » in the real game and, for the ends of stage a real game takes too long to
 * reach, on a controlled page: the door of the home, the map, a stage played and won, the
 * bonus, the bag, a reload, a stage left, the fallen camp, the end and the record, the code
 * given and received, a second player; in French and in English, on the screens of the grid.
 */
export async function checkVoyage({ browser, url, check, capture }) {
  const errors = [];
  /** `seed` is written once in this tab: a reload keeps what the game wrote since. */
  async function open(w, h, { seed = {}, language = 'fr', target = url, chosen = false } = {}) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      locale: 'fr-CH',
      hasTouch: true,
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.requested = [];
    page.on('request', (request) => page.requested.push(request.url()));
    await page.addInitScript(
      ({ seed, language, key, chosen, flag }) => {
        if (sessionStorage.getItem('seeded')) return;
        localStorage.setItem(key, language);
        for (const [name, value] of Object.entries(seed)) localStorage.setItem(name, value);
        if (chosen) sessionStorage.setItem(flag, '1');
        sessionStorage.setItem('seeded', 'yes');
      },
      { seed, language, key: LANGUAGE, chosen, flag: PLAYER_CHOSEN_KEY },
    );
    await page.goto(target);
    await page.locator('#home-voyage').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    return page;
  }
  async function enter(page) {
    await page.locator('#home-voyage').click();
    await page.locator('#home-screen[data-page="voyage"]').waitFor();
    await page.waitForLoadState('networkidle');
    await settle(page);
  }
  /** Types a code in « Un autre voyage », opened from the map. */
  async function typeCode(page, code) {
    if (!(await page.locator('#voyage-other').evaluate((dialog) => dialog.open)))
      await page.locator('#voyage-other-open, #voyage-have-code').first().click();
    await page.locator('#voyage-code-input').fill(code);
    await page.locator('#voyage-code-form button[type="submit"]').click();
    await settle(page);
  }
  const status = (page) => page.locator('#app').getAttribute('data-status');
  /** Plays the stage on the board to its end without placing anyone, on the real clock. */
  async function playOut(page, clock = true) {
    await page.locator('#speed').click();
    if (clock) await page.clock.install();
    for (let wave = 0; wave < 6 && (await status(page)) === 'preparing'; wave++) {
      await page.locator('#start').click();
      for (let step = 0; step < 240 && (await status(page)) === 'fighting'; step++)
        await page.clock.runFor(1000);
    }
    await page.clock.runFor(400);
    return status(page);
  }

  // 1. The door of the home, on every screen of the grid, in both languages.
  for (const language of ['fr', 'en'])
    for (const [w, h] of grid) {
      const t = TEXT[language];
      const where = `${w}×${h} ${language}`;
      const page = await open(w, h, { language });
      const door = () =>
        page.evaluate(() => {
          const button = document.querySelector('#home-voyage');
          const r = button.getBoundingClientRect();
          const play = document.querySelector('#home-primary').getBoundingClientRect();
          const hero = document.querySelector('.home-hero').getBoundingClientRect();
          const next = document.querySelector('#home-next-mission').getBoundingClientRect();
          const tag = button.querySelector('.voyage-new');
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return {
            label: button.querySelector('span').innerText.trim(),
            tag: tag.getClientRects().length ? tag.innerText.trim() : null,
            size: [r.width, r.height],
            reachable: !!hit && button.contains(hit),
            inHero:
              r.top >= hero.top &&
              r.bottom <= hero.bottom &&
              r.left >= hero.left &&
              r.right <= hero.right,
            besidePlay:
              r.left >= play.right - 1 || r.top >= play.bottom - 1 || r.right <= play.left + 1,
            sameRow:
              Math.abs(r.top + r.height / 2 - (play.top + play.height / 2)) < play.height / 2,
            nextWhole: next.height > 0 && next.bottom <= hero.bottom + 0.5,
            links: [...document.querySelectorAll('.home-links button')].filter(
              (b) => b.getClientRects().length,
            ).length,
            play: [play.width, play.height],
            overflow: [
              document.documentElement.scrollWidth - innerWidth,
              document.documentElement.scrollHeight - innerHeight,
            ],
          };
        });
      let state = await door();
      check(
        state.label === t.door && state.tag === t.fresh,
        `home ${where}: the door says « ${t.door} » and « ${t.fresh} »: ${JSON.stringify(state)}`,
      );
      check(
        state.size[0] >= 48 && state.size[1] >= 48 && state.reachable && state.inHero,
        `home ${where}: the door is a whole 48 px target: ${JSON.stringify(state)}`,
      );
      check(
        state.besidePlay && state.play[0] >= 120 && state.play[1] >= 48,
        `home ${where}: the door sits beside « Jouer » without covering it: ${JSON.stringify(state)}`,
      );
      // A low screen has no room for a second row of buttons.
      if (h <= 520)
        check(state.sameRow, `home ${where}: both buttons share one row: ${JSON.stringify(state)}`);
      check(
        state.links === 5 && state.nextWhole && state.overflow.every((value) => value <= 0),
        `home ${where}: five destinations, the next mission in view, nothing overflows: ${JSON.stringify(state)}`,
      );
      check(
        !page.requested.some((address) => address.includes('/ui/voyage/')),
        `home ${where}: the screens of the voyage are not loaded with the home`,
      );
      await capture(page, `voyage-home-${w}x${h}-${language}`);
      await page.close();
      // A voyage under way: the door says so, without the label of a novelty.
      const back = await open(w, h, {
        language,
        seed: { [VOYAGE_STORAGE_KEY]: logOf(MAP_SEED, 2) },
      });
      state = await back.evaluate(() => ({
        label: document.querySelector('#home-voyage span').innerText.trim(),
        tag: document.querySelector('#home-voyage .voyage-new').getClientRects().length,
        whole:
          document.querySelector('#home-voyage').scrollWidth <=
          document.querySelector('#home-voyage').clientWidth + 1,
        next:
          document.querySelector('#home-next-mission').getBoundingClientRect().bottom <=
          document.querySelector('.home-hero').getBoundingClientRect().bottom + 0.5,
      }));
      check(
        state.label === t.resume && state.tag === 0 && state.whole && state.next,
        `home ${where}: a voyage under way reads « ${t.resume} »: ${JSON.stringify(state)}`,
      );
      await back.close();
    }

  // 2. The map, the choice of a bonus, the end and the fallen camp on every screen.
  const stops = expectedStops(MAP_SEED);
  const mapPlan = planVoyage(MAP_SEED);
  for (const language of ['fr', 'en'])
    for (const [w, h] of grid) {
      const t = TEXT[language];
      const where = `${w}×${h} ${language}`;
      const wide = w > 700;
      // The map at the third stage: two stops done, the third to play, its caprice in view.
      let page = await open(w, h, {
        language,
        seed: { [VOYAGE_STORAGE_KEY]: logOf(MAP_SEED, 2, { best: 3 }) },
      });
      await enter(page);
      check(
        page.requested.some((address) => address.includes('/ui/voyage/voyageScreens')),
        `map ${where}: the screens arrive when the door is touched`,
      );
      let state = await voyageState(page);
      let report = `${where}: ${JSON.stringify(state)}`;
      check(
        state.page === 'voyage' && state.view === 'map' && state.title === t.title,
        `map is the page shown, ${report}`,
      );
      check(state.step === t.step(3), `map says « ${t.step(3)} », ${report}`);
      check(
        state.record === (wide ? t.record(3) : null) && state.note === t.note,
        `map shows the record and what is kept, ${report}`,
      );
      check(state.strangers.length === 0, `map hides the stars and the brand, ${report}`);
      check(
        state.stops.length === 5 &&
          state.stops.map((stop) => stop.state).join() === 'done,done,next,ahead,ahead',
        `five stops, two done, the third to play, ${report}`,
      );
      check(
        state.stops.every((stop, index) => stop.spoken[0] === copyName(t, index, stops, language)),
        `each stop names its stage and its mission, ${report}`,
      );
      check(
        state.stops.every(
          (stop, index) =>
            stop.caprice === (stops[index].caprice ? t.surprise(stops[index].caprice) : null) &&
            !!stop.sticker === !!stops[index].caprice,
        ) &&
          state.stops.slice(0, 2).every((stop) => !stop.caprice) &&
          state.stops.slice(2).every((stop) => stop.caprice),
        `the surprise caprice shows from the third stop on, its name in French, ${report}`,
      );
      check(
        state.stops.map((stop) => stop.king).join() === `,,,,${t.king}`,
        `the king waits at the fifth stop only, ${report}`,
      );
      check(
        state.stops.every(
          (stop, index) =>
            stop.map === 5 &&
            stop.lairs === (mapPlan.stages[index].run.missionId === 'refuge' ? 1 : 3) &&
            stop.whole,
        ),
        `each stop shows its terrain and one snake head per lair, whole, ${report}`,
      );
      check(state.go === t.go, `the stop to play says « ${t.go} », ${report}`);
      check(
        state.bag === t.bag(2) &&
          state.places === 4 &&
          state.cards.join() ===
            mapPlan.stages
              .slice(0, 2)
              .map((s) => s.offer[0])
              .join(),
        `the bag shows its two cards and two free places, ${report}`,
      );
      check(state.code === encodeVoyage(MAP_SEED), `the code of the voyage is shown, ${report}`);
      check(fits(state), `map fits with 48 px targets, ${report}`);
      check(
        state.purse === null,
        `nothing is said of the king's purse before his stage, ${report}`,
      );
      await capture(page, `voyage-map-${w}x${h}-${language}`);
      // A sticker tells what its caprice does: the child's words in French, the rules translated.
      await page.locator('.voyage-stop[data-state="ahead"] .stop-caprice').first().click();
      const bubble = await page.locator('#voyage-caprice').evaluate((dialog) => ({
        open: dialog.open,
        french: [...dialog.querySelectorAll('[lang="fr"][data-copy-raw]')].map(
          (n) => n.textContent,
        ),
        rules: dialog.querySelector('#voyage-caprice-rules').innerText.trim(),
        fits: dialog.scrollHeight <= dialog.clientHeight + 1,
        small: [...dialog.querySelectorAll('button')].filter(
          (b) => b.getBoundingClientRect().height < 47.5,
        ).length,
      }));
      const fourth = stageCaprice(mapPlan.stages[3]);
      check(
        bubble.open &&
          bubble.french.join('|') === `${fourth.name}|${fourth.announce}` &&
          bubble.fits &&
          !bubble.small,
        `caprice window ${where} keeps the child's words: ${JSON.stringify(bubble)}`,
      );
      check(
        language === 'fr'
          ? bubble.rules === capriceExplanation(fourth.rules)
          : bubble.rules.length > 10 && bubble.rules !== capriceExplanation(fourth.rules),
        `caprice window ${where} explains the rules in the language: ${bubble.rules}`,
      );
      const bubbleWindow = await windowState(page, '#voyage-caprice');
      check(
        windowWhole(bubbleWindow),
        `caprice window ${where} is whole: ${JSON.stringify(bubbleWindow)}`,
      );
      await page.locator('#voyage-caprice > button').click();
      // The code of the voyage and « Autre voyage », opened from the map.
      for (const [opener, selector] of [
        ['#voyage-code', '#voyage-gift'],
        ['#voyage-other-open', '#voyage-other'],
      ]) {
        await page.locator(opener).click();
        const shown = await windowState(page, selector);
        check(windowWhole(shown), `${selector} ${where} is whole: ${JSON.stringify(shown)}`);
        await page.locator(`${selector} > button:last-child`).click();
      }
      await page.close();

      // The last stage to play: the king and the sticker stay inside the largest stop.
      page = await open(w, h, { language, seed: { [VOYAGE_STORAGE_KEY]: logOf(MAP_SEED, 4) } });
      await enter(page);
      state = await voyageState(page);
      check(
        state.step === t.step(5) && state.stops[4].state === 'next' && fits(state),
        `last stage ${where} fits: ${JSON.stringify(state)}`,
      );
      check(
        state.stops[4].king === t.king && state.stops[4].whole && state.places === 4,
        `last stage ${where} keeps its king and a full bag in view: ${JSON.stringify(state)}`,
      );
      check(
        state.purse === t.purse && state.purseClear,
        `last stage ${where} tells the smaller purse, clear of the stops: ${JSON.stringify(state)}`,
      );
      await page.close();

      // Between two stages: three cards, the rule in a child's words, no way to pass.
      page = await open(w, h, {
        language,
        seed: { [VOYAGE_STORAGE_KEY]: logOf(MAP_SEED, 2, { cards: 1, best: 3 }) },
      });
      await enter(page);
      state = await voyageState(page);
      report = `${where}: ${JSON.stringify(state)}`;
      const offer = mapPlan.stages[1].offer;
      check(
        state.view === 'bonus' && state.title === t.won(2) && state.step === null,
        `bonus says « ${t.won(2)} », ${report}`,
      );
      check(state.heading === t.choose && state.rule === t.rule, `bonus says its rule, ${report}`);
      check(
        state.bonuses.map((card) => card.id).join() === offer.join() &&
          state.bonuses.every((card) => card.whole && card.detail.length > 8),
        `three cards of the voyage, whole, ${report}`,
      );
      if (language === 'fr')
        check(
          state.bonuses.every(
            (card) =>
              card.title === REWARDS[card.id].title && /à chaque étape\.$/.test(card.detail),
          ),
          `cards keep the titles of the great adventure and say « à chaque étape », ${report}`,
        );
      check(
        state.panelButtons.join() === 'bonus-card,bonus-card,bonus-card',
        `no button to pass, ${report}`,
      );
      check(state.bag === t.bag(1) && state.places === 4, `bonus shows the bag, ${report}`);
      check(fits(state), `bonus fits with 48 px targets, ${report}`);
      await capture(page, `voyage-bonus-${w}x${h}-${language}`);
      await page.close();

      // The voyage finished, then the fallen camp.
      for (const [name, raw, expected] of [
        [
          'arrived',
          logOf(MAP_SEED, 5, { cards: 4, status: 'arrived' }),
          { title: t.arrived, states: 'done,done,done,done,done', best: t.record(5), cards: 4 },
        ],
        [
          'fallen',
          logOf(MAP_SEED, 2, { status: 'fallen', best: 3 }),
          {
            title: t.fallen(3),
            states: 'done,done,fallen,ahead,ahead',
            best: t.record(3),
            cards: 2,
            sentence: t.fallenNote(2),
          },
        ],
      ]) {
        page = await open(w, h, { language, seed: { [VOYAGE_STORAGE_KEY]: raw } });
        await enter(page);
        state = await voyageState(page);
        report = `${where}: ${JSON.stringify(state)}`;
        check(
          state.view === name && state.title === expected.title && state.step === null,
          `${name} says « ${expected.title} », ${report}`,
        );
        check(
          state.stops.map((stop) => stop.state).join() === expected.states && !state.go,
          `${name} shows the path travelled and no stage to start, ${report}`,
        );
        check(
          state.best === expected.best &&
            state.record === null &&
            state.cards.length === expected.cards,
          `${name} shows the record and the bag, ${report}`,
        );
        check(state.fallen === (expected.sentence ?? null), `${name} says how far, ${report}`);
        check(
          state.actions.join('|') === t.actions[name].join('|'),
          `${name} offers its three ways on, ${report}`,
        );
        check(fits(state), `${name} fits with 48 px targets, ${report}`);
        await capture(page, `voyage-${name}-${w}x${h}-${language}`);
        await page.close();
      }
    }

  // 3. A whole stretch of voyage in the real game: a code received, a stage played and won,
  // the bonus, the bag, a reload, a stage left and started again. Nothing else is written.
  for (const [w, h, language] of [
    [812, 375, 'fr'],
    [1280, 800, 'en'],
  ]) {
    const t = TEXT[language];
    const where = `${w}×${h} ${language}`;
    const plan = planVoyage(SEED);
    const page = await open(w, h, { language });
    // A first reload lets the game rewrite its own saves in their settled order: from there
    // on, nothing but the voyage may change.
    await page.reload();
    await page.locator('#home-voyage').waitFor({ state: 'visible' });
    const before = await otherSaves(page);
    await enter(page);
    let state = await voyageState(page);
    const drawn = (await log(page)).current;
    check(
      state.view === 'map' && state.step === t.step(1) && state.code === encodeVoyage(drawn.seed),
      `voyage ${where}: a first visit draws a voyage and saves it: ${JSON.stringify(state)}`,
    );
    check(state.record === null, `voyage ${where}: no record before a stage is won`);

    // Wrong codes are refused in words; the voyage does not change.
    for (const [reason, typed] of [
      ['format', 'bonjour'],
      ['format', 'PONTS-1-0000-7X8R-A1'],
      [
        'checksum',
        `${encodeVoyage(SEED).slice(0, -1)}${encodeVoyage(SEED).endsWith('A') ? 'B' : 'A'}`,
      ],
      ['version', encodeVoyage(SEED).replace('VOYAGE-1', 'VOYAGE-9')],
    ]) {
      await typeCode(page, typed);
      const refusal = await page.evaluate(() => ({
        open: document.querySelector('#voyage-other').open,
        heading: document.querySelector('#voyage-other-title').innerText.trim(),
        message: document.querySelector('#voyage-code-message').innerText.trim(),
        invalid: document.querySelector('#voyage-code-input').getAttribute('aria-invalid'),
        fits:
          document.querySelector('#voyage-other').scrollHeight <=
          document.querySelector('#voyage-other').clientHeight + 1,
      }));
      check(
        refusal.open &&
          refusal.heading === t.other &&
          refusal.message === t.refused[reason] &&
          refusal.invalid === 'true' &&
          refusal.fits,
        `voyage ${where}: « ${typed} » is refused in words: ${JSON.stringify(refusal)}`,
      );
      check(
        (await log(page)).current.seed === drawn.seed,
        `voyage ${where}: a refused code leaves the voyage as it was`,
      );
    }
    await capture(page, `voyage-code-refused-${w}x${h}-${language}`);
    // The code of a brother or a sister, typed as a child types, in small letters and
    // without its dashes: the same voyage, at once.
    await typeCode(page, ` ${encodeVoyage(SEED).toLowerCase().replace(/-/g, ' ')} `);
    state = await voyageState(page);
    check(
      state.code === encodeVoyage(SEED) &&
        state.stops.every(
          (stop, index) =>
            stop.spoken[0] === copyName(t, index, expectedStops(SEED), language) &&
            stop.caprice ===
              (expectedStops(SEED)[index].caprice
                ? t.surprise(expectedStops(SEED)[index].caprice)
                : null),
        ),
      `voyage ${where}: a code received gives the very same voyage: ${JSON.stringify(state)}`,
    );
    check(
      JSON.stringify((await log(page)).current) ===
        JSON.stringify({ version: 1, seed: SEED, won: 0, bag: [], status: 'travelling' }),
      `voyage ${where}: the voyage received is saved`,
    );

    // The first stage, on the board.
    await page.locator('#voyage-go').click();
    await page.locator('#start').waitFor({ state: 'visible' });
    await settle(page);
    let mark = await markState(page);
    check(
      mark?.text === t.mark(1) && mark.inside && mark.fontSize >= 12 && mark.passive,
      `stage ${where}: the mark says « ${t.mark(1)} » on the board: ${JSON.stringify(mark)}`,
    );
    check(
      await page.evaluate(
        () =>
          document.querySelector('#mission-battle-actions').hidden &&
          document.querySelector('#current-departure').hidden &&
          document.querySelector('#departure-unavailable').hidden,
      ),
      `stage ${where}: no mission panel and no departure code during a stage`,
    );
    await capture(page, `voyage-stage-${w}x${h}-${language}`);
    check((await playOut(page)) === 'won', `stage ${where}: the first stage is really won`);
    let result = await resultState(page);
    let report = `${where}: ${JSON.stringify(result)}`;
    check(
      result.title === t.stageWon && result.note === t.wonNote(1) && result.onward === t.onward,
      `stage won says what comes next, ${report}`,
    );
    check(
      result.buttons.join() === 'voyage-continue' && !result.mission.length && !result.stars,
      `stage won offers one way on: no next mission, no caprice, no star, ${report}`,
    );
    check(
      result.overflow <= 1 && result.onScreen && !result.small.length,
      `stage won fits with a 48 px target, ${report}`,
    );
    check(result.focus === 'voyage-continue', `stage won gives the focus to its way on, ${report}`);
    check((await markState(page))?.text === t.mark(1), `stage ${where}: the mark stays at the end`);
    check(
      JSON.stringify(await log(page)) ===
        JSON.stringify({
          version: 1,
          best: 1,
          current: { version: 1, seed: SEED, won: 1, bag: [], status: 'travelling' },
        }),
      `stage ${where}: the stage won is saved at once, with the record`,
    );
    await capture(page, `voyage-stage-won-${w}x${h}-${language}`);

    // « Continuer le voyage » leads to the choice of a bonus; the bag follows.
    await page.locator('#voyage-continue').click();
    await page.clock.runFor(300);
    state = await voyageState(page);
    check(
      state.view === 'bonus' &&
        state.title === t.won(1) &&
        state.bonuses.map((card) => card.id).join() === plan.stages[0].offer.join(),
      `voyage ${where}: the way on leads to the three cards of the stage: ${JSON.stringify(state)}`,
    );
    check(
      (await page.evaluate(() => document.activeElement?.className)) === 'voyage-title',
      `voyage ${where}: the choice of a bonus announces itself`,
    );
    const kept = plan.stages[0].offer[0];
    await page.locator(`.bonus-card[data-bonus="${kept}"]`).click();
    await page.clock.runFor(300);
    state = await voyageState(page);
    check(
      state.view === 'map' &&
        state.step === t.step(2) &&
        state.bag === t.bag(1) &&
        state.cards.join() === kept &&
        state.record === (w > 700 ? t.record(1) : null),
      `voyage ${where}: the card kept is in the bag, the second stage waits: ${JSON.stringify(state)}`,
    );
    check(
      JSON.stringify((await log(page)).current.bag) === JSON.stringify([kept]),
      `voyage ${where}: the bag is saved`,
    );

    // A reload: the door says « Reprendre », the voyage is where it was.
    await page.reload();
    await page.locator('#home-voyage').waitFor({ state: 'visible' });
    check(
      (await text(page, '#home-voyage span')) === t.resume &&
        !(await page.locator('#home-voyage .voyage-new').isVisible()),
      `voyage ${where}: after a reload the door says « ${t.resume} »`,
    );
    await enter(page);
    state = await voyageState(page);
    check(
      state.step === t.step(2) &&
        state.code === encodeVoyage(SEED) &&
        state.cards.join() === kept &&
        state.go === t.go,
      `voyage ${where}: resumed at the second stage with its bag: ${JSON.stringify(state)}`,
    );
    await capture(page, `voyage-resumed-${w}x${h}-${language}`);

    // A stage left halfway starts again from its beginning, and the map says so.
    const purse = String(
      missionById(plan.stages[1].run.missionId).budget +
        (kept === 'pieces' ? plan.tuning.bonusCoins : 0),
    );
    await page.locator('#voyage-go').click();
    await page.locator('#start').waitFor({ state: 'visible' });
    check(
      (await text(page, '#gold')) === purse && (await markState(page))?.text === t.mark(2),
      `stage ${where}: the second stage opens with the bag unpacked (${purse} coins)`,
    );
    await page.clock.install();
    await page.locator('#start').click();
    await page.clock.runFor(4000);
    check((await text(page, '#wave')) === '1', `stage ${where}: the first wave is under way`);
    await leaveBattle(page);
    await page.clock.runFor(300);
    check(
      (await text(page, '#home-voyage span')) === t.resume,
      `voyage ${where}: leaving a stage keeps the voyage under way`,
    );
    await page.locator('#home-voyage').click();
    await page.clock.runFor(300);
    state = await voyageState(page);
    check(
      state.go === t.again && state.step === t.step(2) && state.note === t.note && fits(state),
      `voyage ${where}: the stage left says « ${t.again} » where the child comes back: ${JSON.stringify(state)}`,
    );
    await capture(page, `voyage-stage-left-${w}x${h}-${language}`);
    await page.locator('#voyage-go').click();
    await page.clock.runFor(600);
    check(
      (await text(page, '#wave')) === '0' &&
        (await text(page, '#gold')) === purse &&
        (await status(page)) === 'preparing',
      `stage ${where}: the stage left starts again from its beginning`,
    );
    // « Nouvelle partie » during a stage starts the stage again, never a mission.
    await page.locator('#start').click();
    await page.clock.runFor(3000);
    await revealControl(page, '#reset');
    await page.locator('#reset').click();
    await page.locator('#confirm-restart').click();
    await page.clock.runFor(600);
    check(
      (await text(page, '#wave')) === '0' &&
        (await status(page)) === 'preparing' &&
        (await page.evaluate(() => document.querySelector('#mission-battle-actions').hidden)),
      `stage ${where}: « Recommencer » starts the same stage again`,
    );
    if (await page.locator('#reinforcements[open]').count())
      await page.locator('#reinforcements-close').click();
    check(
      (await markState(page))?.text === t.mark(2),
      `stage ${where}: the stage started again is still the second of the voyage`,
    );

    // Back home: no star, no sticker, and not a byte of the other saves has changed.
    await leaveBattle(page);
    await page.clock.runFor(300);
    check(
      (await text(page, '#mission-total')) === t.stars,
      `voyage ${where}: a stage won gives no star to its mission`,
    );
    await page.locator('#home-caprice-album').click();
    check(
      (await page.locator('#caprice-album-dialog .caprice-sticker[data-earned="true"]').count()) ===
        0,
      `voyage ${where}: a stage gives no sticker`,
    );
    await page.locator('#caprice-album-close').click();
    check(
      (await otherSaves(page)) === before && (await reminderIsCodes(page)),
      `voyage ${where}: the other saves are the same to the byte: ${before}`,
    );
    check(
      JSON.stringify(await log(page)) ===
        JSON.stringify({
          version: 1,
          best: 1,
          current: { version: 1, seed: SEED, won: 1, bag: [kept], status: 'travelling' },
        }),
      `voyage ${where}: a stage left or started again changes nothing in the voyage`,
    );
    await page.close();
  }

  // 4. The camp falls in the real game: the voyage stops there, kindly, and can be done again.
  {
    const t = TEXT.fr;
    const page = await open(780, 360, { seed: { [VOYAGE_STORAGE_KEY]: logOf(SEED, 3) } });
    await page.reload();
    await page.locator('#home-voyage').waitFor({ state: 'visible' });
    const before = await otherSaves(page);
    await enter(page);
    await page.locator('#voyage-go').click();
    await page.locator('#start').waitFor({ state: 'visible' });
    check((await markState(page))?.text === t.mark(4), 'fallen: the fourth stage is on the board');
    check((await playOut(page)) === 'lost', 'fallen: the camp really falls with nobody placed');
    const result = await resultState(page);
    const report = JSON.stringify(result);
    check(
      result.title === t.lostTitle && result.note === t.lostNote(4) && result.onward === t.see,
      `fallen: the board says where the voyage stops, ${report}`,
    );
    check(
      result.buttons.join() === 'voyage-continue' && !result.mission.length && !result.stars,
      `fallen: one way on, no retry of a mission, ${report}`,
    );
    check(
      result.overflow <= 1 && result.onScreen && !result.small.length,
      `fallen fits, ${report}`,
    );
    check(
      (await log(page)).current.status === 'fallen' && (await log(page)).best === 3,
      'fallen: the end of the voyage is saved at once',
    );
    await capture(page, 'voyage-stage-lost-780x360-fr');
    await page.locator('#voyage-continue').click();
    await page.clock.runFor(300);
    let state = await voyageState(page);
    check(
      state.view === 'fallen' &&
        state.title === t.fallen(4) &&
        state.fallen === 'Tu as réussi 3 étapes sur 5. Tu peux repartir !' &&
        state.stops.map((stop) => stop.state).join() === 'done,done,done,fallen,ahead' &&
        state.best === t.record(3) &&
        fits(state),
      `fallen: the screen says how far the voyage went: ${JSON.stringify(state)}`,
    );
    check(
      (await text(page, '#home-back')).length > 0 &&
        (await page.locator('#home-voyage').count()) === 1,
      'fallen: the way home stays',
    );
    // « Refaire ce voyage » : the same voyage from its first stage; the record stays.
    await page.locator('#voyage-again').click();
    await page.clock.runFor(300);
    state = await voyageState(page);
    check(
      state.view === 'map' &&
        state.step === t.step(1) &&
        state.code === encodeVoyage(SEED) &&
        state.cards.length === 0 &&
        state.record === t.record(3),
      `fallen: the same voyage starts again, the record stays: ${JSON.stringify(state)}`,
    );
    check(
      JSON.stringify(await log(page)) ===
        JSON.stringify({
          version: 1,
          best: 3,
          current: { version: 1, seed: SEED, won: 0, bag: [], status: 'travelling' },
        }),
      'fallen: the voyage done again is saved',
    );
    check((await otherSaves(page)) === before, 'fallen: the other saves are the same to the byte');
    await page.close();
  }

  // 5. The end of the voyage on the controlled page: the fifth stage won, the record, the
  // code given; then a stage lost at once, and a voyage replaced only after a question.
  await writeFile(
    FIXTURE,
    (await readFile('index.html', 'utf8')).replace('/src/main.ts', '/tests/voyage-038-harness.ts'),
  );
  try {
    for (const [w, h, language] of [
      [812, 375, 'fr'],
      [568, 320, 'fr'],
      [780, 360, 'en'],
      [1280, 800, 'en'],
    ]) {
      const t = TEXT[language];
      const where = `${w}×${h} ${language}`;
      const page = await open(w, h, {
        language,
        target: `${url}/${FIXTURE}`,
        seed: { [VOYAGE_STORAGE_KEY]: logOf(SEED, 4) },
      });
      await page.waitForFunction(() => !!window.voyageFixture);
      await enter(page);
      await page.locator('#voyage-go').click();
      await settle(page);
      check((await markState(page))?.text === t.mark(5), `end ${where}: the fifth stage is played`);
      await page.evaluate(() => window.voyageFixture.end('won'));
      await settle(page);
      const result = await resultState(page);
      check(
        result.title === t.stageWon &&
          result.note === t.kingNote &&
          result.onward === t.onward &&
          result.buttons.join() === 'voyage-continue' &&
          !result.mission.length &&
          !result.stars &&
          result.overflow <= 1 &&
          !result.small.length,
        `end ${where}: the last stage won leads on, one way: ${JSON.stringify(result)}`,
      );
      check(
        JSON.stringify(await log(page)) ===
          JSON.stringify(JSON.parse(logOf(SEED, 5, { cards: 4, status: 'arrived' }))),
        `end ${where}: the voyage finished is saved with its record of five stages`,
      );
      await capture(page, `voyage-last-won-${w}x${h}-${language}`);
      await page.locator('#voyage-continue').click();
      await settle(page);
      let state = await voyageState(page);
      check(
        state.view === 'arrived' &&
          state.title === t.arrived &&
          state.best === t.record(5) &&
          fits(state),
        `end ${where}: « ${t.arrived} » and the record: ${JSON.stringify(state)}`,
      );
      // « Donner mon voyage » : the code, « Copier », « Fermer ».
      await page.locator('#voyage-give').click();
      await page.locator('#voyage-gift-copy').click();
      await settle(page);
      const gift = await page.evaluate(async () => {
        const dialog = document.querySelector('#voyage-gift');
        return {
          open: dialog.open,
          heading: dialog.querySelector('h2').innerText.trim(),
          text: dialog.querySelector('p').innerText.trim(),
          code: dialog.querySelector('#voyage-gift-code').value,
          message: dialog.querySelector('#voyage-gift-message').innerText.trim(),
          clipboard: await navigator.clipboard.readText().catch(() => null),
          fits: dialog.scrollHeight <= dialog.clientHeight + 1,
          small: [...dialog.querySelectorAll('button, input')].filter(
            (node) => node.getBoundingClientRect().height < 47.5,
          ).length,
        };
      });
      check(
        gift.open &&
          gift.heading === t.gift &&
          gift.text === t.giftText &&
          gift.code === encodeVoyage(SEED) &&
          gift.fits &&
          !gift.small,
        `end ${where}: the window gives the code of the voyage: ${JSON.stringify(gift)}`,
      );
      check(
        gift.message === t.copied[0]
          ? gift.clipboard === encodeVoyage(SEED)
          : gift.message === t.copied[1],
        `end ${where}: « Copier » copies the code, or selects it: ${JSON.stringify(gift)}`,
      );
      await capture(page, `voyage-gift-${w}x${h}-${language}`);
      await page.locator('#voyage-gift > button').click();
      // « J’ai un code » keeps only the field; the code just given leads back to this voyage.
      await page.locator('#voyage-have-code').click();
      const have = await page.evaluate(() => ({
        heading: document.querySelector('#voyage-other-title').innerText.trim(),
        fresh: document.querySelector('#voyage-other-new').getClientRects().length,
        fits:
          document.querySelector('#voyage-other').scrollHeight <=
          document.querySelector('#voyage-other').clientHeight + 1,
        small: [...document.querySelectorAll('#voyage-other button, #voyage-other input')].filter(
          (node) => node.getClientRects().length && node.getBoundingClientRect().height < 47.5,
        ).length,
      }));
      check(
        have.heading === t.haveCode && have.fresh === 0 && have.fits && !have.small,
        `end ${where}: « J’ai un code » asks for the code only: ${JSON.stringify(have)}`,
      );
      const receive = await windowState(page, '#voyage-other');
      check(
        windowWhole(receive),
        `end ${where}: the window of a code received is whole: ${JSON.stringify(receive)}`,
      );
      await capture(page, `voyage-receive-${w}x${h}-${language}`);
      await typeCode(page, gift.code);
      state = await voyageState(page);
      check(
        state.view === 'map' &&
          state.step === t.step(1) &&
          state.code === encodeVoyage(SEED) &&
          state.record === (w > 700 ? t.record(5) : null),
        `end ${where}: the code given then received starts the same voyage, the record stays: ${JSON.stringify(state)}`,
      );
      // Lost at the very first stage: the screen stays kind, and nothing is counted.
      await page.locator('#voyage-go').click();
      await settle(page);
      await page.evaluate(() => window.voyageFixture.end('lost'));
      await settle(page);
      const lost = await resultState(page);
      check(
        lost.title === t.lostTitle &&
          lost.note === t.lostNote(1) &&
          lost.onward === t.see &&
          lost.buttons.join() === 'voyage-continue' &&
          !lost.mission.length,
        `end ${where}: a stage lost at once says so and leads on: ${JSON.stringify(lost)}`,
      );
      await page.locator('#voyage-continue').click();
      await settle(page);
      state = await voyageState(page);
      check(
        state.view === 'fallen' &&
          state.title === t.fallen(1) &&
          state.fallen === t.fallenFirst &&
          state.best === t.record(5) &&
          fits(state),
        `end ${where}: fallen at the first stage, the record of five stays: ${JSON.stringify(state)}`,
      );
      await capture(page, `voyage-fallen-first-${w}x${h}-${language}`);
      // « Un nouveau voyage » after an end asks nothing: there is nothing to lose.
      await page.locator('#voyage-new').click();
      await settle(page);
      state = await voyageState(page);
      check(
        state.view === 'map' &&
          state.step === t.step(1) &&
          !(await page.locator('#voyage-replace').evaluate((dialog) => dialog.open)),
        `end ${where}: a new voyage starts at once after an end: ${JSON.stringify(state)}`,
      );
      await page.close();

      // A voyage under way is replaced only after a question, and « Garder » keeps it.
      const under = await open(w, h, {
        language,
        target: `${url}/${FIXTURE}`,
        seed: { [VOYAGE_STORAGE_KEY]: logOf(SEED, 2) },
      });
      await enter(under);
      const kept = JSON.stringify(await log(under));
      await under.locator('#voyage-other-open').click();
      check(
        (await text(under, '#voyage-other-title')) === t.other &&
          (await under.locator('#voyage-other-new').isVisible()),
        `replace ${where}: « ${t.other} » offers a new voyage and a code`,
      );
      await under.locator('#voyage-other-new').click();
      await settle(under);
      const question = await under.evaluate(() => {
        const dialog = document.querySelector('#voyage-replace');
        return {
          open: dialog.open,
          heading: dialog.querySelector('h2').innerText.trim(),
          text: dialog.querySelector('#voyage-replace-text').innerText.trim(),
          fits: dialog.scrollHeight <= dialog.clientHeight + 1,
          small: [...dialog.querySelectorAll('button')].filter(
            (b) => b.getBoundingClientRect().height < 47.5,
          ).length,
        };
      });
      check(
        question.open &&
          question.heading === t.replace &&
          question.text === t.replaceText(2) &&
          question.fits &&
          !question.small,
        `replace ${where}: the question says what would stop: ${JSON.stringify(question)}`,
      );
      const asked = await windowState(under, '#voyage-replace');
      check(
        windowWhole(asked),
        `replace ${where}: the question is whole: ${JSON.stringify(asked)}`,
      );
      await capture(under, `voyage-replace-${w}x${h}-${language}`);
      await under.locator('#voyage-keep').click();
      check(
        JSON.stringify(await log(under)) === kept,
        `replace ${where}: « Garder mon voyage » changes nothing`,
      );
      await typeCode(under, encodeVoyage(MAP_SEED));
      check(
        (await under.locator('#voyage-replace').evaluate((dialog) => dialog.open)) &&
          JSON.stringify(await log(under)) === kept,
        `replace ${where}: a code received asks the same question first`,
      );
      await under.locator('#voyage-change').click();
      await settle(under);
      const next = await log(under);
      check(
        next.current.seed === MAP_SEED && next.current.won === 0 && next.best === 2,
        `replace ${where}: the answer « Changer » starts the other voyage, the record stays: ${JSON.stringify(next)}`,
      );
      await under.close();
    }
  } finally {
    await rm(FIXTURE, { force: true });
  }

  // 6. Two players on one device: each has a voyage of their own.
  {
    const t = TEXT.fr;
    const second = `${VOYAGE_STORAGE_KEY}:p2`;
    const players = (activeId) =>
      JSON.stringify({
        version: 1,
        activeId,
        players: [
          { id: 'p1', character: 'hero', name: null },
          { id: 'p2', character: 'ninja', name: null },
        ],
      });
    const firstLog = logOf(MAP_SEED, 2);
    let page = await open(812, 375, {
      chosen: true,
      seed: { [PLAYERS_KEY]: players('p2'), [VOYAGE_STORAGE_KEY]: firstLog },
    });
    check(
      (await text(page, '#home-voyage span')) === t.door &&
        (await page.locator('#home-voyage .voyage-new').isVisible()),
      'players: the second player does not see the voyage of the first',
    );
    await enter(page);
    await typeCode(page, encodeVoyage(SEED));
    const state = await voyageState(page);
    check(
      state.step === t.step(1) && state.code === encodeVoyage(SEED) && state.record === null,
      `players: the second player starts a voyage of their own: ${JSON.stringify(state)}`,
    );
    check(
      (await page.evaluate((key) => localStorage.getItem(key), VOYAGE_STORAGE_KEY)) === firstLog &&
        (await log(page, second)).current.seed === SEED,
      'players: the voyage of the first player is the same to the byte',
    );
    const secondLog = await page.evaluate((key) => localStorage.getItem(key), second);
    await page.close();
    // The first player comes back: their voyage, where they left it.
    page = await open(812, 375, {
      chosen: true,
      seed: {
        [PLAYERS_KEY]: players('p1'),
        [VOYAGE_STORAGE_KEY]: firstLog,
        [second]: secondLog,
      },
    });
    check(
      (await text(page, '#home-voyage span')) === t.resume,
      'players: the first player finds their voyage under way',
    );
    await enter(page);
    const mine = await voyageState(page);
    check(
      mine.step === t.step(3) && mine.code === encodeVoyage(MAP_SEED),
      `players: the first player resumes their own voyage: ${JSON.stringify(mine)}`,
    );
    check(
      (await page.evaluate((key) => localStorage.getItem(key), second)) === secondLog,
      'players: the voyage of the second player is the same to the byte',
    );
    await page.close();
  }
  check(errors.length === 0, JSON.stringify(errors));
}

/** What a stop says to a screen reader, as the page writes it in each language. */
function copyName(t, index, stops, language) {
  const name = stops[index].mission;
  return t.stop(index + 1, language === 'fr' ? name : english[name]);
}
