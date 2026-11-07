import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { waveStats } from '../src/data.ts';
import { enemies } from '../src/enemies.ts';
import { chapterIdentityForWave, spawnDelay, variantFor } from '../src/waves.ts';

test('les cartes de chapitre décrivent les décisions, bornent les vagues et restent immuables', () => {
  const identify = chapterIdentityForWave;
  const identities = [1, 5, 9].map((wave) => identify(wave));
  assert.deepEqual(
    identities.map(({ firstWave, lastWave }) => [firstWave, lastWave]),
    [
      [1, 4],
      [5, 8],
      [9, 12],
    ],
  );
  assert.equal(new Set(identities.map(({ focus }) => focus)).size, 3);
  for (let chapter = 0; chapter < 3; chapter++) {
    const identity = identities[chapter];
    assert.ok(Object.isFrozen(identity));
    assert.ok(identity.focus.length > 0 && identity.focus.length <= 36);
    assert.ok(identity.tip.length > 0 && identity.tip.length <= 110);
    for (let wave = chapter * 4 + 1; wave <= chapter * 4 + 4; wave++)
      assert.equal(identify(wave), identity);
  }
  for (const wave of [NaN, Infinity, -Infinity, -20, 0])
    assert.equal(identify(wave), identities[0]);
  assert.equal(identify(100), identities[2]);
});

function arrivals(wave: number) {
  const game = new Game(23, { tacticalRulesEnabled: false });
  game.units = [];
  game.wave = wave - 1;
  game.startWave();
  game.eggs = [];
  const born: { at: number; variant: string; hp: number }[] = [];
  for (let tick = 0; game.remaining > 0 && tick < 1200; tick++) {
    game.step(1 / 30);
    for (const enemy of game.enemies)
      born.push({ at: game.time, variant: enemy.variant, hp: enemy.maxHp });
    game.enemies = [];
  }
  assert.equal(game.remaining, 0);
  return born;
}

// Break caught: changing variant priority or reading ascending spawn indices
// would lose the real umbrella escort and the two early springs.
test('le bosquet présente un cracheur après son escorte parapluie', () => {
  assert.deepEqual(
    arrivals(7)
      .slice(0, 3)
      .map((enemy) => enemy.variant),
    ['normal', 'umbrella', 'spitter'],
  );
});

test('le dernier chapitre ouvre avec deux ressorts autour de la carapace', () => {
  assert.deepEqual(
    arrivals(9)
      .slice(0, 3)
      .map((enemy) => enemy.variant),
    ['spring', 'armored', 'spring'],
  );
});

// Break caught: reusing the first chapter's dense rush at the spring introduction.
test('les ressorts arrivent en trios moins serrés avec une respiration plus courte', () => {
  const born = arrivals(9);
  const intervals = born.slice(1).map((enemy, i) => enemy.at - born[i].at);
  for (let i = 0; i < intervals.length; i++)
    assert.ok(Math.abs(intervals[i] - [0.6, 0.6, 1.6][i % 3]) < 0.04);
  // At 30 Hz the existing timer adds one tick after each short interval:
  // 5 * (19 + 19 + 48) ticks, identical to 0.18's 5 * (13 + 13 + 60).
  assert.ok(Math.abs(born.at(-1)!.at - born[0].at - 430 / 30) < 1e-9);
  assert.deepEqual(
    [0, 1, 2].map((i) => spawnDelay(3, i)),
    [0.4, 0.4, 2],
  );
});

// Frozen 0.18 regular-enemy budgets, excluding the distinct final king.
// Break caught: a permutation that duplicates a specialist or changes the
// intersection of variant HP with the even-wave x1.6 health bonus.
const budgets = [
  { count: 5, hp: 5, types: { normal: 5 } },
  { count: 6, hp: 7.2, types: { normal: 6 } },
  { count: 8, hp: 5.55, types: { runner: 7, normal: 1 } },
  { count: 9, hp: 9.11, types: { normal: 4, runner: 4, rattlesnake: 1 } },
  {
    count: 10,
    hp: 10.1,
    types: { runner: 4, armored: 1, normal: 3, clockwork: 1, rattlesnake: 1 },
  },
  {
    count: 12,
    hp: 17.01,
    types: { umbrella: 3, normal: 3, runner: 3, armored: 1, clockwork: 1, rattlesnake: 1 },
  },
  {
    count: 13,
    hp: 15,
    types: {
      normal: 4,
      umbrella: 3,
      runner: 1,
      armored: 1,
      spitter: 2,
      clockwork: 1,
      rattlesnake: 1,
    },
  },
  {
    count: 14,
    hp: 18.96,
    types: {
      runner: 2,
      normal: 4,
      umbrella: 2,
      armored: 1,
      spitter: 2,
      royal: 1,
      clockwork: 1,
      rattlesnake: 1,
    },
  },
  {
    count: 16,
    hp: 15.9,
    types: { spring: 4, armored: 2, runner: 6, umbrella: 2, royal: 1, rattlesnake: 1 },
  },
  {
    count: 17,
    hp: 22.47,
    types: {
      umbrella: 3,
      spring: 4,
      armored: 2,
      runner: 2,
      normal: 1,
      spitter: 2,
      royal: 1,
      mamba: 1,
      rattlesnake: 1,
    },
  },
  {
    count: 18,
    hp: 19.95,
    types: {
      clockwork: 1,
      umbrella: 3,
      spring: 4,
      armored: 2,
      runner: 2,
      normal: 1,
      spitter: 2,
      royal: 1,
      mamba: 1,
      rattlesnake: 1,
    },
  },
  {
    count: 20,
    hp: 26.41,
    types: {
      royal: 2,
      normal: 2,
      clockwork: 1,
      umbrella: 3,
      spring: 3,
      armored: 2,
      runner: 2,
      spitter: 2,
      mamba: 1,
      rattlesnake: 1,
    },
  },
];

test('les douze vagues conservent leurs effectifs, spécialistes et PV cumulés de 0.18', () => {
  for (let wave = 1; wave <= 12; wave++) {
    const expected = budgets[wave - 1];
    assert.equal(waveStats(wave).count, expected.count);
    const types: Record<string, number> = {};
    let hp = 0;
    for (let index = expected.count; index >= 1; index--) {
      if (wave === 12 && index === 1) continue;
      const variant = variantFor(wave, index);
      types[variant] = (types[variant] ?? 0) + 1;
      hp += enemies[variant].hp * (wave % 2 === 0 && index % 3 === 0 ? 1.6 : 1);
    }
    assert.deepEqual(types, expected.types, `composition vague ${wave}`);
    assert.ok(Math.abs(hp - expected.hp) < 1e-9, `PV vague ${wave}: ${hp}`);
    const actual = arrivals(wave);
    assert.equal(actual.length, expected.count);
    const regular = wave === 12 ? actual.slice(0, -1) : actual;
    assert.ok(
      Math.abs(
        regular.reduce((sum, enemy) => sum + enemy.hp, 0) - expected.hp * waveStats(wave).hp,
      ) < 1e-6,
      `PV appliqués dans Game, vague ${wave}`,
    );
  }
});
