import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { chooseLanguage, showHomePage } from '../tests/browser-entry.mjs';
import { capricesForMission } from '../src/caprices.ts';
import { createCapriceAlbums } from '../src/capriceAlbums.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';
import { MISSIONS } from '../src/missions.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { capriceStickerName } from '../src/ui/capriceIcons.ts';
import { capriceToPlay, missionStickers } from '../src/ui/stickerGoals.ts';

const FAMILY = 'conquete-serpents:family:v1';
const LANGUAGE = 'conquete-serpents:language:v1';
const FIXTURE = '.replay-038-fixture.html';
// Android's system margins as the other recipes simulate them.
const systemBars = { top: 30, right: 48, bottom: 24, left: 48 };
const grid = [
  [568, 320, null],
  [780, 360, null],
  [780, 360, systemBars],
  [812, 375, null],
  [1280, 800, null],
];
const allStickers = MISSIONS.flatMap(({ id }) => capricesForMission(id).map((c) => c.id));

/** A family with these best stars (in the order of the map) and these stickers in its book. */
function family(stars, stickers) {
  const progress = createMissionProgress();
  for (const [index, { id }] of MISSIONS.entries()) progress.bestStars[id] = stars[index] ?? 0;
  progress.activeMode = 'missions';
  const albums = createCapriceAlbums();
  albums.children[0].completed = [...stickers];
  return {
    stars: progress.bestStars,
    stickers,
    raw: writeFamilyBackup(null, createCareer().state, progress, albums),
  };
}
// Three missions won, the fourth to play, two still locked.
const midway = family([3, 2, 1], ['refuge-petit', 'refuge-createur-moyen', 'trois-ponts-petit']);
// The six missions won, five stickers in the book.
const finished = family(
  [3, 2, 3, 1, 2, 1],
  ['refuge-petit', 'refuge-moyen', 'refuge-createur-petit', 'course-grand', 'carrefour-petit'],
);
const fullBook = family([3, 3, 3, 3, 3, 3], allStickers);

const TEXT = {
  fr: {
    label: (n) => `Autocollants : ${n} sur 6`,
    left: (n) => `Il te reste ${n} autocollants à gagner ici.`,
    stars: (n) => `Gagne ${n} étoiles ici pour ouvrir d’autres caprices.`,
    full: 'Tu as gagné les 6 autocollants de cette mission !',
    replay: 'Rejouer avec un caprice',
    another: 'Un autre caprice',
    play: 'Jouer',
    playCaprice: 'Jouer un caprice',
    homeLeft: (n) => `Il te reste ${n} autocollants à gagner.`,
    replayMission: (name) => `Rejouer la mission : ${name}`,
    nextMission: (name) => `Prochaine mission : ${name}`,
    earned: '✓ Gagné',
  },
  en: {
    label: (n) => `Stickers: ${n} out of 6`,
    left: (n) => `You have ${n} stickers left to earn here.`,
    stars: (n) => `Earn ${n} stars here to open more caprices.`,
    full: 'You earned all 6 stickers in this mission!',
    replay: 'Replay with a caprice',
    another: 'Another caprice',
    play: 'Play',
    playCaprice: 'Play a caprice',
    homeLeft: (n) => `You have ${n} stickers left to earn.`,
    earned: '✓ Earned',
  },
};

// The result of a mission, on the controlled fixture: what the address asks for, what the
// panel must say, and its buttons in the order of the page.
const RESULTS = [
  {
    name: 'mission won',
    query: 'mission=refuge&stars=2,1&stickers=refuge-petit,refuge-createur-petit&base=70',
    hint: (t) => t.left(4),
    replay: (t) => t.replay,
    earned: 2,
    buttons: ['mission-next', 'mission-caprice-replay', 'mission-back-map', 'mission-again'],
    focus: 'mission-next',
  },
  {
    name: 'caprice won',
    query: 'mission=refuge&caprice=refuge-petit&stars=3,2,1&stickers=refuge-createur-petit',
    hint: (t) => t.left(4),
    replay: (t) => t.another,
    earned: 2,
    buttons: [
      'result-caprice-album',
      'mission-caprice-replay',
      'mission-back-map',
      'mission-again',
    ],
    focus: 'mission-caprice-replay',
  },
  {
    name: 'last mission won',
    query: 'mission=carrefour&stars=3,3,3,3,3&base=95',
    hint: (t) => t.left(6),
    replay: (t) => t.replay,
    earned: 0,
    buttons: ['mission-caprice-replay', 'mission-back-map', 'mission-again'],
    focus: 'mission-caprice-replay',
  },
  {
    name: 'more stars needed',
    query: 'mission=refuge&stars=1&stickers=refuge-petit,refuge-createur-petit&base=30',
    hint: (t) => t.stars(2),
    replay: null,
    earned: 2,
    buttons: ['mission-next', 'mission-back-map', 'mission-again'],
    focus: 'mission-next',
  },
  {
    name: 'six stickers',
    query:
      'mission=refuge&caprice=refuge-grand&stars=3,1&stickers=refuge-petit,refuge-moyen,refuge-createur-petit,refuge-createur-moyen,refuge-createur-grand',
    hint: (t) => t.full,
    replay: null,
    earned: 6,
    buttons: ['result-caprice-album', 'mission-again', 'mission-back-map'],
    focus: 'mission-again',
  },
  {
    name: 'caprice lost',
    query: 'mission=refuge&caprice=refuge-petit&stars=3,1&status=lost',
    hint: null,
    replay: null,
    buttons: ['result-caprice-album', 'mission-again', 'mission-back-map'],
    focus: 'mission-again',
  },
];

const settle = (page) =>
  page.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
const setMargins = (page, insets) =>
  page.evaluate((margins) => {
    for (const side of ['top', 'right', 'bottom', 'left'])
      document.documentElement.style.setProperty(
        `--safe-area-inset-${side}`,
        `${margins?.[side] ?? 0}px`,
      );
  }, insets);
const saved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), FAMILY);

/** Every mission card, as a child sees it: its row of stickers, where it sits, what it says. */
const cardStates = (page) =>
  page.locator('#mission-cards .mission-card').evaluateAll((cards) =>
    cards.map((card) => {
      const row = card.querySelector('.sticker-row');
      const places = [...row.children].map((place) => place.getBoundingClientRect());
      const frame = card.getBoundingClientRect();
      const box = row.getBoundingClientRect();
      const stars = card.querySelector('.mission-stars').getBoundingClientRect();
      const badge = card.querySelector('.mission-status-badge').getBoundingClientRect();
      return {
        id: card.dataset.missionCard,
        locked: card.disabled,
        shown: row.getClientRects().length > 0,
        role: row.getAttribute('role'),
        label: row.getAttribute('aria-label'),
        earned: row.querySelectorAll('[data-earned="true"]').length,
        places: places.length,
        smallest: Math.min(...places.map((place) => Math.min(place.width, place.height))),
        pictures: [...row.children].map((place) => getComputedStyle(place).backgroundImage),
        inside:
          box.left >= frame.left &&
          box.right <= frame.right + 0.5 &&
          box.bottom <= frame.bottom + 0.5,
        underStars: box.top >= stars.bottom - 0.5,
        clearOfBadge: box.right <= badge.left + 0.5 || box.bottom <= badge.top,
        cut: card.scrollWidth > card.clientWidth + 2 || card.scrollHeight > card.clientHeight + 2,
      };
    }),
  );

/** The result panel: does it fit, are its buttons whole, where is the sticker offer. */
const resultState = (page) =>
  page.evaluate(() => {
    const panel = document.querySelector('#battle-result');
    const frame = panel.getBoundingClientRect();
    const shown = (node) => node.getClientRects().length > 0;
    const boxes = [...panel.querySelectorAll('button')].filter(shown).map((button) => {
      const r = button.getBoundingClientRect();
      return {
        id: button.id,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        small: r.width < 47.5 || r.height < 47.5,
        cut:
          button.scrollWidth > button.clientWidth + 1 ||
          button.scrollHeight > button.clientHeight + 1,
      };
    });
    const overlap = (a, b) =>
      a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    const hint = document.querySelector('#mission-sticker-hint');
    const hintBox = hint.getBoundingClientRect();
    const row = hint.querySelector('.sticker-row');
    const replay = document.querySelector('#mission-caprice-replay');
    // Reading order: row by row, left to right.
    const reading = [...boxes].sort((a, b) =>
      Math.abs(a.top - b.top) > 4 ? a.top - b.top : a.left - b.left,
    );
    return {
      overflow: panel.scrollHeight - panel.clientHeight,
      sideways: panel.scrollWidth - panel.clientWidth,
      onScreen: frame.bottom <= innerHeight + 0.5 && frame.right <= innerWidth + 0.5,
      order: boxes.map((box) => box.id).filter((id) => id !== 'result-allies'),
      reading: reading.map((box) => box.id).filter((id) => id !== 'result-allies'),
      small: boxes.filter((box) => box.small).map((box) => box.id),
      cut: boxes.filter((box) => box.cut).map((box) => box.id),
      outside: boxes
        .filter((box) => box.left < frame.left - 1 || box.right > frame.right + 1)
        .map((box) => box.id),
      overlapping: boxes.flatMap((a, index) =>
        boxes
          .slice(index + 1)
          .filter((b) => overlap(a, b))
          .map((b) => `${a.id}/${b.id}`),
      ),
      offer: shown(hint),
      hint: shown(hint) ? hint.innerText.trim() : null,
      hintClear: !shown(hint) || !boxes.some((box) => overlap(hintBox, box)),
      label: row.getAttribute('aria-label'),
      earned: row.querySelectorAll('[data-earned="true"]').length,
      replay: shown(replay) ? replay.innerText.trim() : null,
      replayInView:
        shown(replay) &&
        replay.getBoundingClientRect().top >= frame.top &&
        replay.getBoundingClientRect().bottom <= frame.bottom + 0.5,
      focus: document.activeElement?.id,
    };
  });

/**
 * « Rejouer avec un caprice », in the real game and on the controlled result of a mission:
 * the stickers on the mission cards, the offer after a win, the home once the six missions
 * are won. Each one is present, says the right thing in French and in English, fits the
 * screens of the grid with 48 px targets, and reads the save without changing it.
 */
export async function checkReplay({ browser, url, pageAt, check, capture }) {
  const errors = [];
  async function openAt(w, h, insets, language, raw) {
    const page = await pageAt(w, h, raw);
    page.on('pageerror', (error) => errors.push(error.message));
    if (insets) await setMargins(page, insets);
    if (language === 'en') await chooseLanguage(page, 'en');
    return page;
  }

  // 1. Mission cards: six sticker places under the stars of every mission that can be played.
  for (const [w, h, insets] of grid)
    for (const language of ['fr', 'en'])
      for (const [name, save] of [
        ['midway', midway],
        ['finished', finished],
      ]) {
        const where = `${name} ${w}×${h}${insets ? ' with system margins' : ''} ${language}`;
        const page = await openAt(w, h, insets, language, save.raw);
        await showHomePage(page, 'missions');
        await settle(page);
        const cards = await cardStates(page);
        for (const card of cards) {
          const expected = missionStickers(card.id, save.stars[card.id], (id) =>
            save.stickers.includes(id),
          );
          const what = `${card.id} ${where}: ${JSON.stringify(card)}`;
          check(card.shown === !card.locked, `stickers only on a playable mission, ${what}`);
          check(
            card.role === 'img' && card.label === TEXT[language].label(expected.earned),
            `sticker count is said aloud, ${what}`,
          );
          check(
            card.places === 6 && card.earned === expected.earned,
            `six places, the earned ones filled, ${what}`,
          );
          check(
            expected.slots.every((slot, place) =>
              slot.earned
                ? card.pictures[place].includes(`/${capriceStickerName(slot.caprice.id)}.webp`)
                : card.pictures[place] === 'none',
            ),
            `each earned place shows its own sticker, the others none, ${what}`,
          );
          if (card.locked) continue;
          check(
            card.inside && card.underStars && card.clearOfBadge,
            `row sits in its card, ${what}`,
          );
          check(card.smallest >= 8 && !card.cut, `places stay visible and the card whole, ${what}`);
        }
        check(cards.filter((card) => card.locked).length === (name === 'midway' ? 2 : 0), where);
        if (w >= 640)
          check(
            await page
              .locator('#mission-list')
              .evaluate((list) => list.scrollHeight - list.clientHeight <= 1),
            `six cards with their stickers fit: ${where}`,
          );
        assert.deepEqual((await saved(page)).missions.bestStars, save.stars);
        if (language === 'fr' && !insets) await capture(page, `replay-missions-${name}-${w}x${h}`);
        await page.close();
      }

  // 2. The home once the six missions are won: one sentence and one action, to a caprice.
  const goal = capriceToPlay(finished.stars, (id) => finished.stickers.includes(id));
  const goalMission = MISSIONS.find(({ id }) => id === goal.missionId);
  const goalEarned = capricesForMission(goal.missionId).filter((c) =>
    finished.stickers.includes(c.id),
  );
  for (const [w, h, insets] of grid)
    for (const language of ['fr', 'en']) {
      const where = `${w}×${h}${insets ? ' with system margins' : ''} ${language}`;
      const text = TEXT[language];
      const page = await openAt(w, h, insets, language, finished.raw);
      const before = JSON.stringify(await saved(page));
      const home = await page.evaluate(() => {
        const primary = document.querySelector('#home-primary');
        const caption = document.querySelector('#home-next-mission');
        const box = primary.getBoundingClientRect();
        const line = caption.getBoundingClientRect();
        return {
          label: primary.innerText.trim(),
          caption: caption.innerText.trim(),
          target: box.width >= 48 && box.height >= 48,
          whole:
            primary.scrollWidth <= primary.clientWidth + 1 &&
            primary.scrollHeight <= primary.clientHeight + 1,
          captionUnder: line.top >= box.bottom - 1,
          captionInView: line.bottom <= innerHeight && line.right <= innerWidth,
          primaries: [...document.querySelectorAll('#home-screen .primary')].filter(
            (node) => node.getClientRects().length,
          ).length,
          scroll: document.documentElement.scrollHeight - innerHeight,
        };
      });
      check(
        home.label === text.playCaprice && home.caption === text.homeLeft(31),
        `finished home leads to a caprice at ${where}: ${JSON.stringify(home)}`,
      );
      check(
        home.target && home.whole && home.captionUnder && home.captionInView,
        `caprice button and its sentence whole at ${where}: ${JSON.stringify(home)}`,
      );
      check(home.primaries === 1 && home.scroll <= 1, `still one main action, no scroll: ${where}`);
      if (language === 'fr' && !insets) await capture(page, `replay-home-${w}x${h}`);
      await page.locator('#home-primary').click();
      const dialog = page.locator('#mission-dialog');
      check(
        (await dialog.evaluate((d) => d.open)) &&
          (await dialog.getAttribute('data-preparation-view')) === 'caprices',
        `main action opens the preparation on its caprices at ${where}`,
      );
      const run = JSON.parse(await dialog.getAttribute('data-run'));
      check(
        run.missionId === goal.missionId && !run.caprice,
        `preparation is the first mission with a sticker to earn, no caprice chosen: ${where}`,
      );
      if (language === 'fr')
        check(
          (await page.locator('#mission-title').innerText()) === goalMission.name,
          `preparation names its mission at ${where}`,
        );
      assert.deepEqual(
        await page
          .locator('[data-caprice][data-earned="true"]')
          .evaluateAll((nodes) => nodes.map((node) => node.dataset.caprice)),
        goalEarned.map((c) => c.id),
      );
      check(
        (await page.locator('[data-caprice][data-earned="true"] small').allInnerTexts()).every(
          (status) => status === text.earned,
        ),
        `earned caprices say so in the preparation at ${where}`,
      );
      const fit = await dialog.evaluate((d) => {
        const body = d.querySelector('.mission-dialog-body');
        const visible = (node) => {
          const r = node.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= innerHeight + 0.5 && r.width >= 47.5 && r.height >= 47.5;
        };
        return {
          overflow: body.scrollHeight - body.clientHeight,
          launch: visible(d.querySelector('#mission-launch')),
          close: visible(d.querySelector('#mission-close')),
        };
      });
      check(
        fit.overflow <= 1 && fit.launch && fit.close,
        `caprices with earned marks fit with their departure at ${where}: ${JSON.stringify(fit)}`,
      );
      if (language === 'fr' && !insets) await capture(page, `replay-preparation-${w}x${h}`);
      await page.locator('#mission-close').click();
      check((await JSON.stringify(await saved(page))) === before, `save untouched at ${where}`);
      await page.close();
    }
  // Before the sixth mission and with a full book, the main button keeps its usual words.
  const fresh = await openAt(780, 360, null, 'fr', midway.raw);
  check(
    (await fresh.locator('#home-primary').innerText()) === TEXT.fr.play &&
      (await fresh.locator('#home-next-mission').innerText()) ===
        TEXT.fr.nextMission(MISSIONS[3].name),
    'home still leads to the next mission while one is left',
  );
  await fresh.close();
  const complete = await openAt(780, 360, null, 'fr', fullBook.raw);
  check(
    (await complete.locator('#home-primary').innerText()) === TEXT.fr.play &&
      (await complete.locator('#home-next-mission').innerText()) ===
        TEXT.fr.replayMission(MISSIONS.at(-1).name),
    'a full book leaves the home as it was',
  );
  await showHomePage(complete, 'missions');
  check(
    (await cardStates(complete)).every((card) => card.shown && card.earned === 6),
    'a full book fills the six places of the six cards',
  );
  await complete.close();

  // 3. After a mission: the offer in the result panel, on the controlled fixture.
  await writeFile(
    FIXTURE,
    (await readFile('index.html', 'utf8')).replace('/src/main.ts', '/tests/replay-038-harness.ts'),
  );
  try {
    for (const language of ['fr', 'en'])
      for (const result of RESULTS) {
        const text = TEXT[language];
        const page = await browser.newPage({
          viewport: { width: 780, height: 360 },
          locale: 'fr-CH',
          hasTouch: true,
        });
        page.on('pageerror', (error) => errors.push(error.message));
        await page.addInitScript(
          ([key, value]) => localStorage.setItem(key, value),
          [LANGUAGE, language],
        );
        await page.goto(`${url}/${FIXTURE}?${result.query}`);
        await page.waitForFunction(() => !!window.replayFixture);
        await page.evaluate(() => document.fonts.ready);
        await settle(page);
        // The first size is the one the page was opened at: the focus is read there.
        for (const [w, h, insets] of [grid[1], grid[2], grid[3], grid[4], grid[0]]) {
          const where = `${result.name} ${w}×${h}${insets ? ' with system margins' : ''} ${language}`;
          await page.setViewportSize({ width: w, height: h });
          await setMargins(page, insets);
          await settle(page);
          const state = await resultState(page);
          const report = `${where}: ${JSON.stringify(state)}`;
          check(
            state.hint === (result.hint ? result.hint(text) : null) &&
              state.replay === (result.replay ? result.replay(text) : null),
            `offer says what is left, ${report}`,
          );
          if (result.hint)
            check(
              state.label === text.label(result.earned) && state.earned === result.earned,
              `offer shows the six sticker places, ${report}`,
            );
          assert.deepEqual(state.order, result.buttons, report);
          assert.deepEqual(state.reading, result.buttons, `reading order, ${report}`);
          check(
            !state.small.length && !state.cut.length && !state.outside.length,
            `every action is a whole 48 px target, ${report}`,
          );
          check(
            !state.overlapping.length && state.hintClear && state.sideways <= 1,
            `nothing overlaps, ${report}`,
          );
          // A very small phone may scroll its result; the other screens show it whole. With
          // Android's margins a caprice result may scroll too, as it did before: the result of
          // a mission still fits, and the offer's button is in view before any scrolling.
          if (w >= 640 && (!insets || result.name === 'mission won'))
            check(
              state.overflow <= 1 && state.onScreen,
              `result fits without scrolling, ${report}`,
            );
          else if (w >= 640 && result.replay)
            check(state.replayInView, `caprice button in view before scrolling, ${report}`);
          if (w === 780 && !insets)
            check(state.focus === result.focus, `focus on what comes next, ${report}`);
          if (language === 'fr' && result.hint && !insets && [780, 1280].includes(w))
            await capture(page, `replay-result-${result.name.replaceAll(' ', '-')}-${w}x${h}`);
        }
        if (result.replay) {
          await page.setViewportSize({ width: 780, height: 360 });
          await settle(page);
          const before = await page.evaluate(() =>
            JSON.stringify([
              window.replayFixture.progress.state,
              window.replayFixture.albums.state,
            ]),
          );
          await page.locator('#mission-caprice-replay').click();
          const dialog = page.locator('#mission-dialog');
          const run = JSON.parse(await dialog.getAttribute('data-run'));
          check(
            (await dialog.evaluate((d) => d.open)) &&
              (await dialog.getAttribute('data-preparation-view')) === 'caprices' &&
              (await page.locator('#home-screen').isVisible()),
            `${result.name} ${language}: the button opens the preparation on its caprices`,
          );
          check(
            run.missionId === new URLSearchParams(result.query).get('mission') && !run.caprice,
            `${result.name} ${language}: same mission, the caprice still to choose`,
          );
          check(
            (await page.locator('[data-caprice][data-earned="true"]').count()) === result.earned,
            `${result.name} ${language}: the caprices already won are marked`,
          );
          check(
            (await page.evaluate(() =>
              JSON.stringify([
                window.replayFixture.progress.state,
                window.replayFixture.albums.state,
              ]),
            )) === before,
            `${result.name} ${language}: stars and stickers are read, never written`,
          );
        }
        await page.close();
      }
  } finally {
    await rm(FIXTURE, { force: true });
  }
  check(errors.length === 0, JSON.stringify(errors));
}
