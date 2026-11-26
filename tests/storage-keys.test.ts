import test from 'node:test';
import assert from 'node:assert/strict';
import * as KEYS from '../src/storageKeys.ts';
import { PLAYER_KEYS } from '../src/players.ts';
import { CAMP_CHARACTER_LIMIT } from '../src/checkpoints.ts';
import { decodeDeparture, DEPARTURE_INPUT_LIMIT } from '../src/departures.ts';
import { EXPEDITION_LOG_LIMIT } from '../src/expeditionLog.ts';
import {
  EXTRA_CHARACTER_LIMIT,
  FAMILY_APPLES_VERSION,
  FAMILY_EXTRAS_VERSION,
} from '../src/familyBackup.ts';
import { APPLES_TO_UNLOCK } from '../src/apples.ts';
import { ROSTER_SIZE } from '../src/gameConstants.ts';
import {
  mixSeed,
  nextSeed,
  pickOne,
  questionStream,
  seedShare,
  seededStream,
  SEED_RANGE,
  shuffle,
} from '../src/seededRandom.ts';

// Retyped on purpose: a key is the address of a child's save on the device. An edit of
// `src/storageKeys.ts` that changes one character must fail here before it hides a save.
test('les clés de stockage gardent leur valeur, au caractère près', () => {
  assert.deepEqual(
    { ...KEYS },
    {
      FAMILY_STORAGE_KEY: 'conquete-serpents:family:v1',
      FAMILY_REFUSED_KEY: 'conquete-serpents:family-refused:v1',
      FAMILY_PREVIOUS_KEY: 'conquete-serpents:family-previous:v1',
      FAMILY_BEFORE_IMPORT_KEY: 'conquete-serpents:family-before-import:v1',
      CAMP_STORAGE_KEY: 'conquete-serpents:camp:v1',
      CAREER_STORAGE_KEY: 'conquete-serpents:progress:v1',
      VOYAGE_STORAGE_KEY: 'conquete-serpents:voyage:v1',
      REMINDER_STORAGE_KEY: 'conquete-serpents:recruitment-reminder:v1',
      MISSION_DONE_KEY: 'conquete-serpents:mission-done:v1',
      ENDLESS_RECORDS_KEY: 'conquete-serpents:endless-records:v1',
      EXPEDITION_STORAGE_KEY: 'conquete-serpents:expedition:v1',
      APPLES_STORAGE_KEY: 'conquete-serpents:apples:v1',
      PLAYERS_KEY: 'conquete-serpents:players:v1',
      PLAYER_CHOSEN_KEY: 'conquete-serpents:player-chosen:v1',
      LANGUAGE_KEY: 'conquete-serpents:language:v1',
      SOUND_SETTINGS_KEY: 'conquete-serpents:sound:v1',
      VISUAL_SETTINGS_KEY: 'conquete-serpents:visual:v1',
      ADS_OFF_KEY: 'conquete-serpents:ads-off:v1',
    },
  );
  assert.equal(new Set(Object.values(KEYS)).size, 18, 'deux clés ne se partagent pas une adresse');
});

test('effacer un joueur efface ses douze clés, dont son rappel, sa mission gagnée, ses records, son expédition, ses pommes, la sauvegarde mise de côté et les deux copies', () => {
  assert.deepEqual(
    [...PLAYER_KEYS],
    [
      'conquete-serpents:family:v1',
      'conquete-serpents:family-refused:v1',
      'conquete-serpents:family-previous:v1',
      'conquete-serpents:family-before-import:v1',
      'conquete-serpents:camp:v1',
      'conquete-serpents:progress:v1',
      'conquete-serpents:recruitment-reminder:v1',
      'conquete-serpents:voyage:v1',
      'conquete-serpents:mission-done:v1',
      'conquete-serpents:endless-records:v1',
      'conquete-serpents:expedition:v1',
      'conquete-serpents:apples:v1',
    ],
  );
});

// A limit refuses a save or a code: a new value would turn away what an older game wrote.
test('les limites des sauvegardes et des codes gardent leur valeur', () => {
  assert.equal(ROSTER_SIZE, 8);
  assert.equal(CAMP_CHARACTER_LIMIT, 100000);
  assert.equal(DEPARTURE_INPUT_LIMIT, 96);
  // The log of an expedition, and what a family file carries beside the adventure.
  assert.equal(EXPEDITION_LOG_LIMIT, 100000);
  assert.equal(EXTRA_CHARACTER_LIMIT, 100000);
  assert.equal(FAMILY_EXTRAS_VERSION, 6);
  assert.equal(FAMILY_APPLES_VERSION, 7);
  // The apples a player keeps, and that open the hidden boss (decision of 26 November 2026).
  assert.equal(APPLES_TO_UNLOCK, 12);
});

// The voyage code left the game on 21 November 2026: what a child still has on paper is
// refused as a departure code, with a plain « format », never read as something else.
test('un ancien code de voyage n’est pas un code de départ', () => {
  for (const code of [
    'VOYAGE-1-0000-ND',
    'VOYAGE-1-0YK9-AY',
    'VOYAGE-2-0YK9-05',
    'VOYAGE-2-ZZZZ-MY',
  ])
    assert.deepEqual(decodeDeparture(code), { ok: false, reason: 'format' }, code);
});

// The numbers of the draw are retyped: every seed and every shared code depends on them.
test('le tirage au hasard fait le même calcul qu’avant', () => {
  const before = (state: number) => (Math.imul(state, 1664525) + 1013904223) >>> 0;
  let state = 2026;
  const stream = seededStream(2026);
  for (let step = 0; step < 1000; step++) {
    assert.equal(nextSeed(state), before(state));
    state = before(state);
    assert.equal(stream(), state / 4294967296);
    assert.equal(seedShare(state), state / 4294967296);
  }
  for (const edge of [0, 1, 0x7fffffff, 0x80000000, 0xffffffff, -1])
    assert.equal(nextSeed(edge), before(edge));
  assert.equal(SEED_RANGE, 2 ** 32);
  assert.deepEqual([nextSeed(0), nextSeed(1), nextSeed(2026)], [1013904223, 1015568748, 91264577]);
});

// The same for the mixing, the choice and the shuffle: every voyage, every expedition, every
// offer of gifts depends on them. The formulas are retyped as they stood in each module
// before 21 November 2026.
test('le brassage, le choix et le mélange gardent leur calcul', () => {
  const before = (seed: number, salt: number) => {
    let hash = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0;
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b) >>> 0;
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
    return (hash ^ (hash >>> 16)) >>> 0;
  };
  for (const seed of [0, 1, 2026, 0xfffff, 0xffffffff])
    for (const salt of [0, 1, 16, 64, 7000, 9000]) {
      assert.equal(mixSeed(seed, salt), before(seed, salt));
      const mixed = seededStream(before(seed, salt));
      const asked = questionStream(seed, salt);
      for (let draw = 0; draw < 20; draw++) assert.equal(asked(), mixed());
    }
  assert.deepEqual(
    [mixSeed(0, 1), mixSeed(2026, 64), mixSeed(0xfffff, 9000)],
    [2462723854, 3808891587, 2485619693],
  );
  for (const seed of [0, 1, 2026, 31337]) {
    const random = seededStream(seed);
    const expected = seededStream(seed);
    const values = [1, 2, 3, 4, 5, 6, 7];
    const sorted = [...values];
    for (let i = sorted.length - 1; i > 0; i--) {
      const j = Math.floor(expected() * (i + 1));
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
    // The list itself is shuffled and given back.
    assert.equal(shuffle(random, values), values);
    assert.deepEqual(values, sorted);
    const list = ['a', 'b', 'c', 'd'];
    assert.equal(pickOne(random, list), list[Math.floor(expected() * list.length)]);
  }
  assert.deepEqual(shuffle(seededStream(2026), [1, 2, 3, 4, 5, 6]), [4, 3, 2, 5, 6, 1]);
  const asked = questionStream(2026, 16);
  const letters = ['a', 'b', 'c', 'd'];
  assert.deepEqual(
    [pickOne(asked, letters), pickOne(asked, letters), pickOne(asked, letters)],
    ['c', 'b', 'a'],
  );
});
