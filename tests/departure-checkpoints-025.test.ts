import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { createMissionRun } from '../src/missions.ts';
import { departureForGame } from '../src/departures.ts';

test('le camp v6 conserve la graine initiale sans la confondre avec le RNG actuel', () => {
  const game = new Game(4321);
  game.rng = 123;
  const raw = encodeCheckpoint(game)!;
  assert.equal(JSON.parse(raw).version, 6);
  const restored = decodeCheckpoint(raw)!;
  assert.equal(restored.initialSeed, 4321);
  assert.equal(restored.rng, 123);
});
test('un ancien camp classique sans graine se charge mais ne fabrique pas de code', () => {
  const raw = JSON.parse(encodeCheckpoint(new Game(123))!);
  delete raw.initialSeed;
  const restored = decodeCheckpoint(JSON.stringify(raw))!;
  assert.ok(restored);
  assert.equal(restored.initialSeed, null);
  assert.equal(departureForGame(restored), null);
});
test('une ancienne expédition retrouve sa vraie graine et conserve sa configuration', () => {
  const run = createMissionRun('trois-ponts', 456);
  const raw = JSON.parse(encodeCheckpoint(new Game(456, undefined, run))!);
  delete raw.initialSeed;
  const restored = decodeCheckpoint(JSON.stringify(raw))!;
  assert.deepEqual(departureForGame(restored), { kind: 'mission', run });
});
test('métadonnée invalide ou incompatible avec la mission refusée sans modifier le format LEGACY', () => {
  const game = new Game(2026);
  const raw = JSON.parse(encodeCheckpoint(game)!);
  for (const invalid of [-1, null, 1.5, 0x100000000, '2026'])
    assert.equal(decodeCheckpoint(JSON.stringify({ ...raw, initialSeed: invalid })), null);
  const run = createMissionRun('refuge', 123);
  const mission = JSON.parse(encodeCheckpoint(new Game(123, undefined, run))!);
  assert.equal(decodeCheckpoint(JSON.stringify({ ...mission, initialSeed: 321 })), null);
  assert.equal(
    Object.hasOwn(
      JSON.parse(encodeCheckpoint(new Game(2026, { tacticalRulesEnabled: false }))!),
      'initialSeed',
    ),
    false,
  );
});
