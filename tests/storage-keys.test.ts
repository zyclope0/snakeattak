import test from 'node:test';
import assert from 'node:assert/strict';
import * as KEYS from '../src/storageKeys.ts';
import { PLAYER_KEYS } from '../src/players.ts';
import { CAMP_CHARACTER_LIMIT } from '../src/checkpoints.ts';
import { DEPARTURE_INPUT_LIMIT } from '../src/departures.ts';
import { ROSTER_SIZE } from '../src/gameConstants.ts';
import { VOYAGE_INPUT_LIMIT } from '../src/voyageCode.ts';
import { nextSeed, seedShare, seededStream, SEED_RANGE } from '../src/seededRandom.ts';

// Retyped on purpose: a key is the address of a child's save on the device. An edit of
// `src/storageKeys.ts` that changes one character must fail here before it hides a save.
test('les clés de stockage gardent leur valeur, au caractère près', () => {
  assert.deepEqual(
    { ...KEYS },
    {
      FAMILY_STORAGE_KEY: 'conquete-serpents:family:v1',
      CAMP_STORAGE_KEY: 'conquete-serpents:camp:v1',
      CAREER_STORAGE_KEY: 'conquete-serpents:progress:v1',
      VOYAGE_STORAGE_KEY: 'conquete-serpents:voyage:v1',
      REMINDER_STORAGE_KEY: 'conquete-serpents:recruitment-reminder:v1',
      MISSION_DONE_KEY: 'conquete-serpents:mission-done:v1',
      ENDLESS_RECORDS_KEY: 'conquete-serpents:endless-records:v1',
      EXPEDITION_STORAGE_KEY: 'conquete-serpents:expedition:v1',
      PLAYERS_KEY: 'conquete-serpents:players:v1',
      PLAYER_CHOSEN_KEY: 'conquete-serpents:player-chosen:v1',
      LANGUAGE_KEY: 'conquete-serpents:language:v1',
      SOUND_SETTINGS_KEY: 'conquete-serpents:sound:v1',
      VISUAL_SETTINGS_KEY: 'conquete-serpents:visual:v1',
      ADS_OFF_KEY: 'conquete-serpents:ads-off:v1',
    },
  );
  assert.equal(new Set(Object.values(KEYS)).size, 14, 'deux clés ne se partagent pas une adresse');
});

test('effacer un joueur efface ses huit clés, dont son rappel, sa mission gagnée, ses records et son expédition', () => {
  assert.deepEqual(
    [...PLAYER_KEYS],
    [
      'conquete-serpents:family:v1',
      'conquete-serpents:camp:v1',
      'conquete-serpents:progress:v1',
      'conquete-serpents:recruitment-reminder:v1',
      'conquete-serpents:voyage:v1',
      'conquete-serpents:mission-done:v1',
      'conquete-serpents:endless-records:v1',
      'conquete-serpents:expedition:v1',
    ],
  );
});

// A limit refuses a save or a code: a new value would turn away what an older game wrote.
test('les limites des sauvegardes et des codes gardent leur valeur', () => {
  assert.equal(ROSTER_SIZE, 8);
  assert.equal(CAMP_CHARACTER_LIMIT, 100000);
  assert.equal(DEPARTURE_INPUT_LIMIT, 96);
  assert.equal(VOYAGE_INPUT_LIMIT, 64);
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
