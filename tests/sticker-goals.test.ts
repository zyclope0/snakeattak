import test from 'node:test';
import assert from 'node:assert/strict';
import { capricesForMission } from '../src/caprices.ts';
import { MISSIONS, type MissionId } from '../src/missions.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { copy } from '../src/i18n/copy.ts';
import { setLanguage } from '../src/i18n/language.ts';
import {
  capriceToPlay,
  missionStickers,
  replayOffer,
  stickerCountLabel,
} from '../src/ui/stickerGoals.ts';

const none = () => false;
const book = (...ids: string[]) => {
  const earned = new Set(ids);
  return (id: string) => earned.has(id);
};
const allStickers = (mission: MissionId) => capricesForMission(mission).map((c) => c.id);
const stars = (count: number) => {
  const { bestStars } = createMissionProgress();
  for (const { id } of MISSIONS) bestStars[id] = count;
  return bestStars;
};

test('a mission has six stickers, in the order of its page in the book', () => {
  for (const { id } of MISSIONS) {
    const tally = missionStickers(id, 0, none);
    assert.deepEqual(
      tally.slots.map((slot) => slot.caprice.id),
      [...capricesForMission(id, 'serpents'), ...capricesForMission(id, 'createur')].map(
        (caprice) => caprice.id,
      ),
    );
    assert.equal(tally.slots.length, 6);
    assert.deepEqual(
      [tally.earned, tally.left, tally.playable, tally.starsToOpen],
      [0, 6, 0, 1],
      'a mission never won has six stickers to earn and none open',
    );
  }
});

test('stars open the stickers two by two; an earned sticker is no longer to play', () => {
  const count = (won: number, ...ids: string[]) => {
    const { earned, left, playable, starsToOpen } = missionStickers('refuge', won, book(...ids));
    return [earned, left, playable, starsToOpen];
  };
  assert.deepEqual(count(1), [0, 6, 2, 2]);
  assert.deepEqual(count(2), [0, 6, 4, 3]);
  assert.deepEqual(count(3), [0, 6, 6, 0]);
  assert.deepEqual(count(1, 'refuge-petit'), [1, 5, 1, 2]);
  assert.deepEqual(count(1, 'refuge-petit', 'refuge-createur-petit'), [2, 4, 0, 2]);
  assert.deepEqual(
    count(2, 'refuge-petit', 'refuge-createur-petit', 'refuge-moyen', 'refuge-createur-moyen'),
    [4, 2, 0, 3],
  );
  assert.deepEqual(count(3, ...allStickers('refuge')), [6, 0, 0, 0]);
  // A sticker of another mission does not count here.
  assert.deepEqual(count(3, 'course-petit'), [0, 6, 6, 0]);
});

test('the tally reads the real sticker book without changing it', () => {
  const albums = createCapriceAlbumsController({
    version: 1,
    activeId: 'child-1',
    nextId: 2,
    campProfileId: null,
    children: [{ id: 'child-1', name: 'Mon carnet', completed: ['course-petit', 'refuge-grand'] }],
  });
  const before = JSON.stringify(albums.state);
  const tally = missionStickers('refuge', 3, (id) => albums.has(id));
  assert.deepEqual(
    tally.slots.map((slot) => slot.earned),
    [false, false, true, false, false, false],
  );
  assert.equal(stickerCountLabel(tally), 'Autocollants : 1 sur 6');
  assert.equal(JSON.stringify(albums.state), before);
});

test('after a win, the offer counts what is left and proposes a caprice only when one is open', () => {
  const offer = (won: number, afterCaprice: boolean, ...ids: string[]) =>
    replayOffer(missionStickers('refuge', won, book(...ids)), afterCaprice);
  assert.deepEqual(offer(1, false), {
    sentence: 'Il te reste 6 autocollants à gagner ici.',
    button: 'Rejouer avec un caprice',
  });
  assert.deepEqual(offer(3, true, 'refuge-petit'), {
    sentence: 'Il te reste 5 autocollants à gagner ici.',
    button: 'Un autre caprice',
  });
  const five = allStickers('refuge').slice(0, 5);
  assert.deepEqual(offer(3, true, ...five), {
    sentence: 'Il te reste 1 autocollant à gagner ici.',
    button: 'Un autre caprice',
  });
  // Everything open is earned: the sentence says which stars open the next caprices.
  assert.deepEqual(offer(1, true, 'refuge-petit', 'refuge-createur-petit'), {
    sentence: 'Gagne 2 étoiles ici pour ouvrir d’autres caprices.',
    button: null,
  });
  assert.deepEqual(
    offer(
      2,
      false,
      'refuge-petit',
      'refuge-createur-petit',
      'refuge-moyen',
      'refuge-createur-moyen',
    ),
    { sentence: 'Gagne 3 étoiles ici pour ouvrir d’autres caprices.', button: null },
  );
  assert.deepEqual(offer(3, true, ...allStickers('refuge')), {
    sentence: 'Tu as gagné les 6 autocollants de cette mission !',
    button: null,
  });
});

test('for a mission that is won, the stars asked for are always two or three', () => {
  for (const { id } of MISSIONS)
    for (const won of [1, 2, 3])
      for (let earned = 0; earned <= 6; earned++) {
        const tally = missionStickers(id, won, book(...allStickers(id).slice(0, earned)));
        if (tally.left && !tally.playable) assert.ok([2, 3].includes(tally.starsToOpen));
      }
});

test('the home leads to a caprice only once the six missions are won', () => {
  const journey = stars(1);
  journey.carrefour = 0;
  assert.equal(capriceToPlay(journey, none), null, 'five missions won: the next mission first');
  assert.equal(capriceToPlay(stars(0), none), null);
  assert.deepEqual(capriceToPlay(stars(1), none), {
    missionId: 'refuge',
    sentence: 'Il te reste 36 autocollants à gagner.',
  });
});

test('the home names the first mission of the map with an open sticker to earn', () => {
  const refugeDone = book('refuge-petit', 'refuge-createur-petit');
  assert.deepEqual(capriceToPlay(stars(1), refugeDone), {
    missionId: 'trois-ponts',
    sentence: 'Il te reste 34 autocollants à gagner.',
  });
  const everything = MISSIONS.flatMap(({ id }) => allStickers(id));
  assert.deepEqual(capriceToPlay(stars(3), book(...everything.slice(0, -1))), {
    missionId: 'carrefour',
    sentence: 'Il te reste 1 autocollant à gagner.',
  });
  assert.equal(capriceToPlay(stars(3), book(...everything)), null, 'a full book has no caprice');
  // Every open sticker is earned: nothing to propose until more stars are won.
  const small = MISSIONS.flatMap(({ id }) => [`${id}-petit`, `${id}-createur-petit`]);
  assert.equal(capriceToPlay(stars(1), book(...small)), null);
});

test('every new sentence has its English, with its number', async () => {
  const pairs: [string, string][] = [
    ['Autocollants : 2 sur 6', 'Stickers: 2 out of 6'],
    ['Il te reste 4 autocollants à gagner ici.', 'You have 4 stickers left to earn here.'],
    ['Il te reste 1 autocollant à gagner ici.', 'You have 1 sticker left to earn here.'],
    [
      'Tu as gagné les 6 autocollants de cette mission !',
      'You earned all 6 stickers in this mission!',
    ],
    [
      'Gagne 3 étoiles ici pour ouvrir d’autres caprices.',
      'Earn 3 stars here to open more caprices.',
    ],
    ['Rejouer avec un caprice', 'Replay with a caprice'],
    ['Un autre caprice', 'Another caprice'],
    ['Jouer un caprice', 'Play a caprice'],
    ['Il te reste 30 autocollants à gagner.', 'You have 30 stickers left to earn.'],
    ['Il te reste 1 autocollant à gagner.', 'You have 1 sticker left to earn.'],
  ];
  await setLanguage('en');
  try {
    for (const [french, english] of pairs) assert.equal(copy(french), english);
  } finally {
    await setLanguage('fr');
  }
  for (const [french] of pairs) assert.equal(copy(french), french);
});
