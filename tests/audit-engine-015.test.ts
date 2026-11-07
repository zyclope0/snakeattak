import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import type { Kind } from '../src/data.ts';
import { Session } from '../src/session.ts';
import { blocked, findPath, nearestCampPoint } from '../src/navigation.ts';
import { placementSuggestions } from '../src/placement.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';

// Missing catalogue validation used to throw or announce an unknown recruit as unlocked.
test('les commandes refusent les noms de recrue invalides sans changer le camp', () => {
  const game = new Game(15);
  const before = structuredClone(game);
  for (const value of [
    'unicorn',
    '',
    '__proto__',
    'constructor',
    'toString',
    null,
    undefined,
    {},
    1,
  ]) {
    const kind = value as Kind;
    assert.equal(game.isUnlocked(kind), false, String(value));
    assert.equal(game.canRecruit(kind, 900, 300), false);
    assert.equal(game.recruit(kind, 900, 300), false);
    assert.deepEqual(placementSuggestions(game, kind), []);
  }
  assert.deepEqual(structuredClone(game), before);
  const session = new Session(15);
  session.selected = 'unicorn' as Kind;
  assert.equal(session.placeSelected(900, 300), false);
  assert.equal(session.hasPlaced, false);
  assert.equal(session.game.gold, 300);
});

// Clamping to zero still performed attacks/spawns; NaN poisoned all following steps.
test('un pas nul, négatif ou non fini ne déclenche aucune action ni aucun tirage', () => {
  for (const value of [NaN, Infinity, -Infinity, 0, -1, undefined, '1']) {
    const game = new Game(15);
    game.startWave();
    const before = structuredClone(game);
    game.step(value as number);
    assert.deepEqual(structuredClone(game), before, String(value));
    game.step(1 / 30);
    assert.equal(game.time, 1 / 30);
    assert.equal(game.enemies.length, 1);
  }
});

test('une durée positive trop grande reste bornée au pas moteur existant', () => {
  const a = new Game(15);
  const b = new Game(15);
  a.startWave();
  b.startWave();
  a.step(60000);
  b.step(0.05);
  assert.deepEqual(a, b);
});

// A bad runtime speed must not poison the accumulator for subsequent valid frames.
test('une vitesse runtime invalide conserve une horloge bornée et récupérable', () => {
  for (const value of [NaN, Infinity, -Infinity, 0, -1, 3]) {
    const session = new Session(15);
    session.speed = value as 1 | 2;
    session.advance(1000);
    assert.ok(session.game.time > 0 && session.game.time <= 0.101, String(value));
    session.speed = 1;
    session.advance(1000 / 30);
    assert.ok(session.game.time > 0.1);
  }
});

// The length check ran before the parser's try/catch.
test('le décodage refuse toute entrée runtime qui n’est pas du texte', () => {
  for (const value of [null, undefined, 1, {}, [], new String('{}')])
    assert.equal(decodeCheckpoint(value as string), null);
});

// NaN formerly passed collision checks and escaped as a legal camp coordinate.
test('la navigation refuse les coordonnées non finies avant de chercher un chemin', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    for (const point of [
      { x: value, y: 180 },
      { x: 900, y: value },
    ]) {
      assert.equal(blocked(point.x, point.y), true);
      assert.deepEqual(findPath(point, { x: 900, y: 324 }), []);
      assert.deepEqual(findPath({ x: 900, y: 324 }, point), []);
      assert.throws(() => nearestCampPoint(point), RangeError);
    }
  }
});

// Legal recruitment can exceed the old independent save limit of 160 units.
test('un camp dense recruté légalement se recharge avec tous ses survivants', () => {
  const game = new Game(15);
  game.gold = 100000;
  for (let y = 108; y <= 540; y += 28)
    for (let x = 600; x <= 984; x += 28) game.recruit('club', x, y);
  assert.ok(game.units.length > 160);
  const raw = encodeCheckpoint(game);
  assert.ok(raw);
  const restored = decodeCheckpoint(raw);
  assert.ok(restored);
  assert.equal(restored.gold, game.gold);
  assert.equal(restored.units.length, game.units.length);
  assert.deepEqual(
    restored.units.map((u) => [u.id, u.kind, u.hp, u.x, u.y, u.homeX, u.homeY]),
    game.units.map((u) => [u.id, u.kind, u.hp, u.x, u.y, u.homeX, u.homeY]),
  );
});

// Corrupt public state must not overwrite a saved camp with an oversized unreadable frame.
test('l’encodage refuse une trame plus grosse que la limite de lecture', () => {
  const game = new Game();
  game.units[0].kind = 'x'.repeat(100001) as Kind;
  assert.equal(encodeCheckpoint(game), null);
});

test('l’encodage ne produit pas un effectif corrompu dépassant la borne de lecture', () => {
  const game = new Game();
  const unit = game.units[0];
  game.units = Array.from({ length: 513 }, (_, i) => ({ ...unit, id: i + 1 }));
  game.nextId = 513;
  assert.equal(encodeCheckpoint(game), null);
});

// Combat keeps hp > 0 alive, including floating-point remnants smaller than 0.001.
test('la sauvegarde conserve un survivant très faible sans ramener un mort', () => {
  const game = new Game(15);
  game.units[0].hp = 0;
  const hero = game.units[2];
  hero.hp = 1e-12;
  const raw = encodeCheckpoint(game);
  assert.ok(raw);
  const restored = decodeCheckpoint(raw);
  assert.ok(restored);
  assert.equal(restored.units.length, 2);
  assert.equal(restored.units.find((u) => u.id === hero.id)?.hp, 1e-12);
  assert.equal(
    restored.units.some((u) => u.id === game.units[0].id),
    false,
  );
  const corrupt = JSON.parse(raw);
  corrupt.units[0].hp = 0;
  assert.equal(decodeCheckpoint(JSON.stringify(corrupt)), null);
});

test('un camp dense traverse les chapitres avec des domiciles distincts et les mêmes survivants', () => {
  for (const count of [200, 206]) {
    for (const wave of [4, 8]) {
      const game = new Game(15);
      game.gold = 100000;
      for (let y = 108; y <= 540; y += 28)
        for (let x = 600; x <= 984; x += 28)
          if (game.units.length < count) game.recruit('club', x, y);
      const survivors = game.units.map((u) => [u.id, u.hp]);
      const gold = game.gold;
      const rng = game.rng;
      game.wave = wave;
      assert.doesNotThrow(() => game.normalizeCamp(), `${count} unités, vague ${wave}`);
      assert.deepEqual(
        game.units.map((u) => [u.id, u.hp]),
        survivors,
      );
      assert.equal(game.gold, gold);
      assert.equal(game.rng, rng);
      for (const unit of game.units) {
        assert.equal(blocked(unit.homeX, unit.homeY, game.level), false);
        assert.equal(blocked(unit.x, unit.y, game.level), false);
      }
      for (let i = 0; i < game.units.length; i++)
        for (let j = i + 1; j < game.units.length; j++)
          assert.ok(
            Math.hypot(
              game.units[i].homeX - game.units[j].homeX,
              game.units[i].homeY - game.units[j].homeY,
            ) >= 28,
          );
      const restored = decodeCheckpoint(encodeCheckpoint(game)!);
      assert.ok(restored);
      assert.equal(restored.units.length, count);
    }
  }
});

test('un camp massif restauré conserve tous ses vivants même si des domiciles doivent être partagés', () => {
  const raw = JSON.parse(encodeCheckpoint(new Game(15))!);
  raw.wave = 8;
  raw.version = 2;
  delete raw.rewards;
  raw.nextId = 260;
  raw.units = Array.from({ length: 260 }, (_, i) => ({ ...raw.units[0], id: i + 1 }));
  const game = decodeCheckpoint(JSON.stringify(raw));
  assert.ok(game);
  assert.equal(game.units.length, 260);
  assert.equal(game.gold, 300);
  assert.equal(game.rng, 15);
  for (const unit of game.units) {
    assert.equal(unit.hp, 140);
    assert.equal(blocked(unit.homeX, unit.homeY, game.level), false);
    assert.equal(blocked(unit.x, unit.y, game.level), false);
  }
  const homes = new Set(game.units.map((u) => `${u.homeX},${u.homeY}`));
  assert.ok(homes.size < game.units.length);
  assert.doesNotThrow(() => game.startWave());
  assert.equal(game.units.length, 260);
});
