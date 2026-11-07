import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint, createPersistence } from '../src/checkpoints.ts';

test('checkpoint : survivants, économie et hasard sont restaurés sans ressusciter les morts', () => {
  const g = new Game(123);
  g.wave = 3;
  g.gold = 800;
  g.units.shift();
  g.units[0].hp = 41;
  g.recruit('dragon', 900, 300);
  const raw = encodeCheckpoint(g);
  assert.ok(raw);
  const restored = decodeCheckpoint(raw!);
  assert.ok(restored);
  assert.equal(restored!.gold, 560);
  assert.equal(restored!.wave, 3);
  assert.equal(restored!.rng, 123);
  assert.equal(restored!.units.length, 3);
  assert.equal(restored!.units[0].hp, 41);
  restored!.startWave();
  assert.equal(restored!.wave, 4);
});
test('un combat en cours ne remplace pas le dernier camp', () => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
  const p = createPersistence(storage),
    g = new Game(12);
  g.wave = 2;
  p.sync(g);
  const before = [...map.values()][0];
  g.startWave();
  g.gold = 0;
  p.sync(g);
  assert.equal([...map.values()][0], before);
  assert.equal(p.load()!.wave, 2);
});
test('formats incompatibles, valeurs corrompues, doublons et fichiers trop gros sont refusés', () => {
  assert.equal(decodeCheckpoint('x'), null);
  assert.equal(decodeCheckpoint('x'.repeat(100001)), null);
  const raw = JSON.parse(encodeCheckpoint(new Game())!);
  for (const patch of [{ version: 999 }, { wave: 12 }, { base: -4 }, { gold: 1e99 }, { rng: 'x' }])
    assert.equal(decodeCheckpoint(JSON.stringify({ ...raw, ...patch })), null);
  assert.equal(
    decodeCheckpoint(JSON.stringify({ ...raw, units: [raw.units[0], raw.units[0]] })),
    null,
  );
  assert.equal(
    decodeCheckpoint(JSON.stringify({ ...raw, units: [{ ...raw.units[0], kind: 'unicorn' }] })),
    null,
  );
});
test('stockage bloqué ou saturé : le jeu continue sans exception', () => {
  const p = createPersistence({
    getItem: () => {
      throw Error('blocked');
    },
    setItem: () => {
      throw Error('quota');
    },
  });
  assert.equal(p.load(), null);
  assert.doesNotThrow(() => p.sync(new Game()));
  assert.match(p.status, /indisponible/i);
});
