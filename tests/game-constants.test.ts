import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import {
  CHAPTER_COUNT,
  CRYSTAL_MAX,
  DEFAULT_SEED,
  GOLD_LIMIT,
  ENTITY_ID_LIMIT,
  HERO_TRAINING_FROM,
  STARS_MAX,
  LANE_COUNT,
  REWARD_WAVES,
  START_GOLD,
  START_TEAM_SIZE,
  TOTAL_WAVES,
  WAVES_PER_CHAPTER,
  chapterOfWave,
} from '../src/gameConstants.ts';
import { LANES, LANE_IDS } from '../src/ai.ts';
import { chapterIndex, freshCampaign } from '../src/campaignRules.ts';
import { Game } from '../src/game.ts';
import { chapterIndexForWave, levelForWave } from '../src/levels.ts';
import { isMilestone } from '../src/rewards.ts';
import { chapterIdentityForWave } from '../src/waves.ts';

// Retyped on purpose: these numbers decide every game, every starting code and every save.
// A new value is a new balance revision, never an edit of `src/gameConstants.ts`.
test('les nombres du jeu gardent leur valeur', () => {
  assert.deepEqual(
    {
      LANE_COUNT,
      CHAPTER_COUNT,
      WAVES_PER_CHAPTER,
      TOTAL_WAVES,
      REWARD_WAVES: [...REWARD_WAVES],
      START_GOLD,
      CRYSTAL_MAX,
      START_TEAM_SIZE,
      GOLD_LIMIT,
      ENTITY_ID_LIMIT,
      HERO_TRAINING_FROM,
      STARS_MAX,
      DEFAULT_SEED,
    },
    {
      LANE_COUNT: 3,
      CHAPTER_COUNT: 3,
      WAVES_PER_CHAPTER: 4,
      TOTAL_WAVES: 12,
      REWARD_WAVES: [4, 8],
      START_GOLD: 300,
      CRYSTAL_MAX: 100,
      START_TEAM_SIZE: 3,
      GOLD_LIMIT: 10000000,
      ENTITY_ID_LIMIT: 10000000,
      HERO_TRAINING_FROM: 4,
      STARS_MAX: 3,
      DEFAULT_SEED: 2026,
    },
  );
});

test('les nombres du jeu se tiennent entre eux', () => {
  assert.equal(TOTAL_WAVES, CHAPTER_COUNT * WAVES_PER_CHAPTER);
  assert.equal(LANES.length, LANE_COUNT);
  assert.deepEqual([...LANE_IDS], [0, 1, 2]);
  // A reward waits at the camp that closes each chapter but the last.
  assert.deepEqual(
    [...REWARD_WAVES],
    Array.from({ length: CHAPTER_COUNT - 1 }, (_, chapter) => (chapter + 1) * WAVES_PER_CHAPTER),
  );
  for (let wave = 0; wave <= TOTAL_WAVES; wave++)
    assert.equal(isMilestone(wave), wave === 4 || wave === 8, `vague ${wave}`);
});

test('une partie neuve commence avec ces nombres', () => {
  const game = new Game();
  assert.equal(game.gold, START_GOLD);
  assert.equal(game.base, CRYSTAL_MAX);
  assert.equal(game.units.length, START_TEAM_SIZE);
  assert.equal(game.totalWaves, TOTAL_WAVES);
  assert.equal(game.rng, DEFAULT_SEED);
  assert.equal(new Game(DEFAULT_SEED).rng, game.rng);
  assert.deepEqual(freshCampaign().chapterMin, [100, 100, 100]);
});

test('le chapitre d’une vague se calcule d’une seule façon', () => {
  const before = (wave: number) => Math.max(0, Math.min(2, Math.floor((wave - 1) / 4)));
  for (let wave = -3; wave <= 20; wave++) {
    assert.equal(chapterOfWave(wave), before(wave), `vague ${wave}`);
    assert.equal(chapterIndex(wave), before(wave));
    assert.equal(chapterIndexForWave(wave), before(wave));
  }
  // Camp zero and a wave that is not a number belong to the first chapter of the scenery.
  for (const odd of [NaN, Infinity, -Infinity]) assert.equal(chapterIndexForWave(odd), 0);
  assert.deepEqual(
    [1, 4, 5, 8, 9, 12].map((wave) => chapterOfWave(wave)),
    [0, 0, 1, 1, 2, 2],
  );
  for (let wave = 1; wave <= TOTAL_WAVES; wave++) {
    const identity = chapterIdentityForWave(wave);
    assert.ok(identity.firstWave <= wave && wave <= identity.lastWave, `vague ${wave}`);
    assert.equal(identity.lastWave - identity.firstWave + 1, WAVES_PER_CHAPTER);
    assert.ok(levelForWave(wave));
  }
});

test('les repères du plateau gardent leur place', async () => {
  const landmarks = await import('../src/boardLandmarks.ts');
  assert.deepEqual(
    { ...landmarks },
    {
      DEN_EXIT_X: 108,
      RIVER_LEFT_X: 480,
      BRIDGE_HALF_WIDTH: 36,
      BRIDGE_END_X: 576,
      CAMP_LEFT: 600,
      CAMP_RIGHT: 984,
      CAMP_TOP: 108,
      CAMP_BOTTOM: 540,
      CAMP_FRONT_X: 612,
      CRYSTAL_ALERT_X: 900,
      CRYSTAL_X: 1000,
      CONTACT_RANGE: 44,
    },
  );
  // The rules of a step read the same landmarks through the engine.
  const field = await import('../src/engine/field.ts');
  for (const [name, value] of Object.entries(landmarks))
    assert.equal((field as Record<string, unknown>)[name], value, name);
  assert.deepEqual([...LANES], [180, 324, 468]);
});

test('une vague de l’aventure pond un œuf de plus par chapitre, trois au plus', async () => {
  const { waveEggCount } = await import('../src/waves.ts');
  assert.deepEqual(
    Array.from({ length: TOTAL_WAVES + 1 }, (_, wave) => waveEggCount(wave)),
    [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3],
  );
});

test('les prix du camp et les récompenses gardent leurs montants', async () => {
  const constants = await import('../src/gameConstants.ts');
  assert.deepEqual(
    [
      constants.REWARD_COINS,
      constants.CRYSTAL_WARD,
      constants.HONEY_REWARD_SECONDS,
      constants.REPAIR_COST,
      constants.REPAIR_AMOUNT,
      constants.HERO_TRAINING_COST,
      constants.ENCOURAGEMENT_SECONDS,
      constants.STAR_MAX,
      constants.MISSION_COUNT,
      constants.ROSTER_SIZE,
    ],
    [100, 18, 4, 80, 25, 90, 8, 3, 6, 8],
  );
  const { MISSIONS } = await import('../src/missions.ts');
  assert.equal(MISSIONS.length, constants.MISSION_COUNT);
});

// A sentence that states a number of the game takes it from its constant
// (`${START_GOLD} pièces`), so that a new value cannot leave a sentence behind. These are
// the shapes such a number has when it is typed by hand.
test('aucune phrase ne retape un nombre du jeu', () => {
  const typed = [
    /(?<![\d.,])300 (?:pièces|coins)\b/,
    /(?<![\d.,])(?:80|90) (?:pièces|coins)\b/,
    /\+100 (?:pièces|coins)\b/,
    /(?<![\d.,])12 (?:vagues|waves)\b/,
    /\b(?:vagues|waves) 4 (?:et|and) 8\b/,
    /(?:pendant|for) 8 s\b/,
    /(?<![\d.,])8 (?:secondes|seconds)\b/,
    /\+4 (?:secondes|seconds)\b/,
    /(?<![\d.,])18 (?:dégâts|damage)\b/,
    /(?<![\d.,])25 (?:points|health)\b/,
    /\/ ?100\b/,
    /\/ (?:8|18) /,
    /(?:sur|out of) 3\b/,
  ];
  for (const language of ['fr', 'en'])
    for (const name of readdirSync(`src/texts/${language}`)) {
      const file = `src/texts/${language}/${name}`;
      // What stands between `${` and `}` is a constant, not a typed number.
      const lines = readFileSync(file, 'utf8')
        .replace(/\$\{[^}]*\}/g, '')
        .split('\n');
      for (const [index, line] of lines.entries())
        for (const shape of typed)
          assert.doesNotMatch(
            line,
            shape,
            `${file}:${index + 1} — prends ce nombre dans src/gameConstants.ts`,
          );
    }
});
