import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { DEFAULT_ROSTERS, freshRosters, isRoster } from '../src/roster.ts';
import { createCareer } from '../src/progression.ts';

const KEY = 'conquete-serpents:progress:v1';
const CAMP_KEY = 'conquete-serpents:camp:v1';
function memory() {
  const values = new Map<string, string>();
  let writes = 0;
  return {
    values,
    get writes() {
      return writes;
    },
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      writes++;
      values.set(key, value);
    },
  };
}
function result(game: Game, stars: [number, number, number]) {
  Object.assign(game, {
    campaign: { training: 'none', chapterMin: [100, 100, 100], chapterStars: stars },
  });
  return game;
}
function milestone(wave: 4 | 8, seed = 123) {
  const game = result(new Game(seed), wave === 4 ? [3, 0, 0] : [3, 2, 0]);
  game.wave = wave;
  game.gold = 777;
  game.base = 83;
  game.units.shift();
  game.units[0].hp = 41;
  game.rewards.pending = wave;
  return game;
}

test('three valid independent presets preserve the full catalogue and unlock rules', () => {
  assert.equal(DEFAULT_ROSTERS.length, 3);
  for (const roster of DEFAULT_ROSTERS) assert.equal(isRoster(roster), true);
  const first = freshRosters(),
    second = freshRosters();
  first[0][0] = 'tank';
  assert.notDeepEqual(first, second);
  assert.equal(Object.keys(kinds).length, 21);
  assert.equal(new Game(1).recruit('tank', 900, 300), false);
});

test('invalid slots, unknown identities, duplicates, hero and malformed rosters are rejected', () => {
  const storage = memory(),
    career = createCareer(storage);
  const before = career.state;
  const sparse = [...DEFAULT_ROSTERS[0]];
  delete sparse[0];
  for (const slot of [-1, 3, 0.5, NaN, Infinity]) {
    assert.equal(career.setRoster(slot, freshRosters()[0]), false);
    assert.equal(career.activateRoster(slot), false);
  }
  for (const bad of [
    [],
    ['hero', ...DEFAULT_ROSTERS[0].slice(1)],
    ['snake', ...DEFAULT_ROSTERS[0].slice(1)],
    ['__proto__', ...DEFAULT_ROSTERS[0].slice(1)],
    Array(8).fill('club'),
    sparse,
    null,
  ]) {
    assert.equal(isRoster(bad), false);
    assert.equal(career.setRoster(0, bad as Kind[]), false);
  }
  assert.deepEqual(career.state, before);
  assert.equal(storage.writes, 0);
});

test('roster updates persist without modifying a game, and public arrays cannot mutate the profile', () => {
  const storage = memory(),
    career = createCareer(storage),
    game = new Game(51);
  const checkpoint = encodeCheckpoint(game),
    roster = freshRosters()[2];
  assert.equal(career.setRoster(0, roster), true);
  assert.equal(career.activateRoster(2), true);
  roster[0] = 'wall';
  const exposed = career.state;
  exposed.rosters[0][0] = 'hero';
  exposed.bestStars[0] = 3;
  assert.equal(isRoster(career.state.rosters[0]), true);
  assert.equal(career.state.bestStars[0], 0);
  assert.equal(encodeCheckpoint(game), checkpoint);
  assert.deepEqual(createCareer(storage).state, career.state);
  assert.equal(storage.values.has(CAMP_KEY), false);
});

test('best stars are per-chapter maxima, idempotent across reload and limited to nine', () => {
  const storage = memory(),
    career = createCareer(storage);
  career.sync(result(new Game(9), [3, 2, 1]));
  const writes = storage.writes;
  career.sync(result(new Game(9), [1, 0, 1]));
  assert.equal(storage.writes, writes);
  const reloaded = createCareer(storage);
  reloaded.sync(result(new Game(10), [0, 3, 3]));
  assert.deepEqual(reloaded.state.bestStars, [3, 3, 3]);
  reloaded.sync(result(new Game(11), [NaN, 99, -1]));
  assert.deepEqual(reloaded.state.bestStars, [3, 3, 3]);
});

test('real chapter camps are captured before the reward once per seed, and replay returns fresh exact armies', () => {
  const storage = memory(),
    career = createCareer(storage),
    game = milestone(4);
  assert.equal(career.chapterGame(1), null);
  career.sync(game);
  const saved = career.state.chapterCamps[0];
  assert.ok(saved);
  const replay = career.chapterGame(1)!;
  assert.equal(replay.wave, 4);
  assert.equal(replay.gold, 777);
  assert.equal(replay.base, 83);
  assert.equal(replay.units.length, 2);
  assert.equal(replay.units[0].hp, 41);
  assert.equal(replay.rewards.pending, 4);
  game.gold += 100;
  career.sync(game);
  assert.equal(career.state.chapterCamps[0], saved);
  replay.gold = 0;
  replay.units.length = 0;
  assert.equal(career.chapterGame(1)!.gold, 777);
  assert.equal(career.chapterGame(1)!.units.length, 2);
  const reloaded = createCareer(storage);
  reloaded.sync(game);
  assert.equal(reloaded.state.chapterCamps[0], saved);
  reloaded.sync(milestone(8));
  assert.equal(reloaded.chapterGame(2)!.wave, 8);
  reloaded.sync(milestone(4, 999));
  assert.equal(reloaded.chapterGame(1)!.rewards.seed, 999);
  assert.equal(reloaded.chapterGame(0 as 1), null);
});

test('combat, resolved rewards and mid-chapter camps never invent a chapter restart', () => {
  const career = createCareer();
  const game = milestone(4);
  game.status = 'fighting';
  career.sync(game);
  assert.equal(career.chapterGame(1), null);
  game.status = 'preparing';
  game.skipReward();
  career.sync(game);
  assert.equal(career.chapterGame(1), null);
  game.wave = 6;
  career.sync(game);
  assert.equal(career.chapterGame(1), null);
});

test('legacy partial camps contribute earned stars while preserving the current army and economy', () => {
  const game = milestone(4);
  game.skipReward();
  game.wave = 6;
  const legacy = { ...JSON.parse(encodeCheckpoint(game)!), version: 3 };
  delete legacy.campaign;
  const restored = decodeCheckpoint(JSON.stringify(legacy))!;
  assert.ok(restored);
  const before = encodeCheckpoint(restored);
  const career = createCareer();
  career.sync(restored);
  assert.deepEqual(career.state.bestStars, [1, 0, 0]);
  assert.equal(career.chapterGame(1), null);
  assert.equal(encodeCheckpoint(restored), before);
  assert.equal(restored.gold, 777);
  assert.equal(restored.units.length, 2);
});

test('reloading chapter snapshots never reapplies earlier coin rewards', () => {
  const career = createCareer(memory());
  const game = milestone(4);
  while (!game.rewardOffer.includes('pieces')) game.rewards.seed++;
  assert.equal(game.chooseReward('pieces'), true);
  game.wave = 8;
  game.rewards.pending = 8;
  game.campaign.chapterStars[1] = 2;
  career.sync(game);
  const first = career.chapterGame(2)!;
  assert.ok(first);
  assert.equal(first.gold, 877);
  const offered = first.rewardOffer.includes('pieces');
  assert.equal(first.chooseReward('pieces'), offered);
  assert.equal(career.chapterGame(2)!.gold, 877);
  assert.equal(career.chapterGame(2)!.rewards.choices[0].id, 'pieces');
});

test('malformed profiles and nested camps are rejected without touching the current camp key', () => {
  const good = createCareer().state;
  const camp = encodeCheckpoint(milestone(4))!;
  const malformed = [
    'x',
    'x'.repeat(250001),
    JSON.stringify({ ...good, version: 2 }),
    JSON.stringify({ ...good, bestStars: [4, 0, 0] }),
    JSON.stringify({ ...good, bestStars: [null, 0, 0] }),
    JSON.stringify({ ...good, activeRoster: 0.5 }),
    JSON.stringify({ ...good, rosters: [[], ...good.rosters.slice(1)] }),
    JSON.stringify({ ...good, chapterCamps: ['corrupt', null] }),
    JSON.stringify({ ...good, chapterCamps: ['x'.repeat(100001), null] }),
    JSON.stringify({ ...good, chapterCamps: [null, camp] }),
    JSON.stringify({
      ...good,
      chapterCamps: [JSON.stringify({ ...JSON.parse(camp), gold: -1 }), null],
    }),
  ];
  for (const raw of malformed) {
    const storage = memory();
    storage.values.set(KEY, raw);
    storage.values.set(CAMP_KEY, 'existing-adventure');
    const career = createCareer(storage);
    assert.deepEqual(career.state, good);
    assert.match(career.status, /incompatible|invalide/i);
    assert.equal(storage.values.get(CAMP_KEY), 'existing-adventure');
    assert.equal(storage.writes, 0);
  }
});

test('blocked reads and failed writes retain usable in-memory progress and report a warning', () => {
  const career = createCareer({
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('quota');
    },
  });
  assert.match(career.status, /indisponible/i);
  assert.doesNotThrow(() => career.sync(milestone(4)));
  assert.deepEqual(career.state.bestStars, [3, 0, 0]);
  assert.equal(career.chapterGame(1)!.gold, 777);
  assert.equal(career.activateRoster(1), true);
  assert.match(career.status, /indisponible/i);
});
