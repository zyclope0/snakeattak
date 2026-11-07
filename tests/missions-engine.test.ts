import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';

const run = Object.freeze({
  missionId: 'refuge',
  seed: 42,
  layout: 0,
  assault: 'balanced',
  nest: 'spread',
});

test('une mission commence avec un détachement neuf, son budget et ses trois vagues', () => {
  const game = new Game(99, undefined, run);
  assert.equal(game.totalWaves, 3);
  assert.deepEqual(game.mission, run);
  assert.equal(game.rng, 42);
  assert.equal(game.gold, 450);
  assert.deepEqual(
    game.units.map((u) => u.kind),
    ['club', 'club', 'hero'],
  );
  assert.equal(game.missionStars, 0);
});

test('le classique garde douze vagues et son format de camp v6', () => {
  const game = new Game(42);
  assert.equal(game.mission, null);
  assert.equal(game.totalWaves, 12);
  assert.equal(JSON.parse(encodeCheckpoint(game)!).version, 6);
});

test('une victoire de mission attend la fin réelle de toutes ses vagues et ne crée pas de récompense classique', () => {
  const game = new Game(42, undefined, run);
  const survivor = game.units[0];
  survivor.hp = 20;
  for (let wave = 1; wave <= 3; wave++) {
    assert.equal(game.startWave(), true);
    assert.equal(game.wave, wave);
    game.remaining = 0;
    game.enemies = [];
    game.eggs = [];
    game.step(1 / 30);
    assert.equal(game.status, wave === 3 ? 'won' : 'preparing');
    assert.equal(game.rewards.pending, null);
    assert.equal(game.units[0], survivor);
  }
  assert.equal(game.missionStars, 3);
  assert.equal(encodeCheckpoint(game), null);
  assert.equal(game.startWave(), false);
});

test('le minimum du cristal empêche les réparations de regagner des étoiles', () => {
  const game = new Game(42, undefined, run);
  game.startWave();
  game.base = 55;
  game.step(1 / 30);
  game.gold = 500;
  game.repair();
  game.repair();
  assert.equal(game.base, 100);
  assert.equal(game.missionMinBase, 55);
  assert.equal(game.missionStars, 0);
  game.wave = 3;
  game.remaining = 0;
  game.eggs = [];
  game.enemies = [];
  game.step(1 / 30);
  assert.equal(game.missionStars, 1);
});

test('le checkpoint mission v6 reprend configuration, survivants et minimum, sans victoire anticipée', () => {
  const game = new Game(42, undefined, run);
  game.wave = 1;
  game.base = 70;
  game.missionMinBase = 50;
  game.units.shift();
  game.units[0].hp = 21;
  const raw = encodeCheckpoint(game)!;
  assert.equal(JSON.parse(raw).version, 6);
  const restored = decodeCheckpoint(raw)!;
  assert.deepEqual(restored.mission, game.mission);
  assert.equal(restored.units.length, 2);
  assert.equal(restored.units[0].hp, 21);
  assert.equal(restored.missionMinBase, 50);
  assert.equal(restored.missionStars, 0);
  for (const patch of [
    { mission: { ...run, layout: 3 } },
    { missionMinBase: 101 },
    { missionMinBase: 80 },
    { wave: 3 },
  ])
    assert.equal(decodeCheckpoint(JSON.stringify({ ...JSON.parse(raw), ...patch })), null);
});

test('les six missions, les configurations et leurs vagues sont bornées, déterministes et immuables', async () => {
  const { MISSIONS, createMissionRun, readMissionRun, missionWave } =
    await import('../src/missions.ts');
  assert.equal(MISSIONS.length, 6);
  for (const mission of MISSIONS) {
    assert.ok(mission.waves.length >= 3 && mission.waves.length <= 4);
    const first = createMissionRun(mission.id, 42);
    assert.deepEqual(first, createMissionRun(mission.id, 42));
    const next = createMissionRun(mission.id, 42, first);
    assert.equal(next.seed, 42);
    assert.notDeepEqual(next, first);
    assert.ok(Object.isFrozen(next));
    assert.deepEqual(readMissionRun(next), next);
    for (let local = 1; local <= mission.waves.length; local++) {
      const wave = missionWave(first, local);
      assert.equal(wave.rank, mission.waves[local - 1]);
      assert.equal(wave.composition.length, wave.stats.count);
      assert.ok(wave.cadence.every((delay) => delay > 0));
      assert.ok(!wave.composition.includes('spring'));
      if (wave.rank < 4) assert.ok(!wave.composition.includes('rattlesnake'));
      if (wave.rank < 5) assert.ok(!wave.composition.includes('clockwork'));
      if (wave.rank < 6) assert.ok(!wave.composition.includes('umbrella'));
      if (wave.rank < 7) assert.ok(!wave.composition.includes('spitter'));
      if (wave.rank < 8) assert.ok(!wave.composition.includes('royal'));
    }
  }
  for (const patch of [
    { seed: -1 },
    { seed: 1.5 },
    { layout: 3 },
    { assault: 'boss' },
    { nest: 'random' },
    { missionId: 'fake' },
  ])
    assert.equal(readMissionRun({ ...run, ...patch }), null);
});

test('plans d’attaque et de couvée changent les vrais ennemis, leurs tempos et les œufs', async () => {
  const { missionWave } = await import('../src/missions.ts');
  const base = { ...run, missionId: 'carrefour' } as const;
  const balanced = missionWave(base, 4);
  const rush = missionWave({ ...base, assault: 'rush' }, 4);
  const escort = missionWave({ ...base, assault: 'escort' }, 4);
  assert.notDeepEqual(balanced.composition, rush.composition);
  assert.notDeepEqual(balanced.cadence, rush.cadence);
  assert.notDeepEqual(balanced.composition, escort.composition);
  const clustered = missionWave({ ...base, nest: 'clustered' }, 4);
  assert.notDeepEqual(balanced.eggs, clustered.eggs);
  const game = new Game(42, undefined, { ...base, assault: 'rush' });
  game.wave = 3;
  assert.equal(game.isUnlocked('twohead'), true);
  assert.equal(game.isUnlocked('tank'), false);
  game.startWave();
  game.step(1 / 30);
  assert.equal(game.enemies[0].variant, rush.composition[0]);
  assert.equal(game.spawnTimer, rush.cadence[0]);
  assert.deepEqual(
    game.eggs.map((egg) => egg.lane),
    rush.eggs.map((egg) => egg.lane),
  );
  assert.equal(
    game.enemies.some((enemy) => enemy.boss),
    false,
  );
});

test('l’incubation dépend de la graine, reste bornée et se répète au réessai', async () => {
  const { missionWave } = await import('../src/missions.ts');
  const first = missionWave({ ...run, missionId: 'coquilles', seed: 42 }, 1);
  const other = missionWave({ ...run, missionId: 'coquilles', seed: 43 }, 1);
  assert.notDeepEqual(
    first.eggs.map((egg) => egg.hatchIn),
    other.eggs.map((egg) => egg.hatchIn),
  );
  assert.deepEqual(first.eggs, missionWave({ ...run, missionId: 'coquilles', seed: 42 }, 1).eggs);
  for (let seed = 0; seed < 30; seed++) {
    const wave = missionWave({ ...run, missionId: 'carrefour', seed }, 4);
    wave.eggs.forEach((egg, index) =>
      assert.ok(egg.hatchIn >= 7 + index * 6 && egg.hatchIn <= 10 + index * 6),
    );
  }
});

test('un camp mission ne peut importer une formation du héros avant le rang autorisé', () => {
  const raw = JSON.parse(encodeCheckpoint(new Game(42, undefined, run))!);
  raw.campaign.training = 'force';
  assert.equal(decodeCheckpoint(JSON.stringify(raw)), null);
});

test('la formation du héros autorisée reprend avant la première vague de mission', () => {
  const game = new Game(42, undefined, { ...run, missionId: 'trois-ponts' });
  assert.equal(game.trainHero('guard'), true);
  const restored = decodeCheckpoint(encodeCheckpoint(game)!)!;
  assert.equal(restored.campaign.training, 'guard');
  assert.equal(restored.missionStars, 0);
  assert.equal(restored.startWave(), true);
});
