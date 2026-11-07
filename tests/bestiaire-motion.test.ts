import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import type { Entity } from '../src/game.ts';
import { characterMotion } from '../src/render/characterMotion.ts';

test('les nouvelles créatures ont une attaque lisible, bornée et sans déplacement de simulation', () => {
  const base = new Game().units[0];
  for (const kind of [
    'raptor',
    'triceratops',
    'stegosaurus',
    'trex',
    'mutantRock',
    'mutantStretch',
  ]) {
    const unit = { ...base, kind, facing: -1, state: 'attack' } as Entity;
    const before = structuredClone(unit);
    const pose = characterMotion(unit, 0, { age: 0.2, kind: 'hit' }, false);
    assert.ok(
      pose.dx !== 0 || pose.dy !== 0 || pose.sx !== 1 || pose.angle !== 0,
      `${kind} doit avoir une pose d'attaque`,
    );
    assert.ok(Math.abs(pose.dx) <= 6 && Math.abs(pose.dy) <= 5);
    assert.ok(pose.sx >= 0.85 && pose.sx <= 1.15 && pose.sy >= 0.85 && pose.sy <= 1.15);
    assert.deepEqual(unit, before, 'une animation ne modifie pas la collision ou le moteur');
    assert.deepEqual(characterMotion(unit, 0, { age: 0.2, kind: 'hit' }, true), {
      dx: 0,
      dy: 0,
      angle: 0,
      sx: 1,
      sy: 1,
    });
  }
});

test('le raptor attaque dans son orientation et le mutant élastique étend sa silhouette', () => {
  const unit = new Game().units[0];
  const raptor = { ...unit, kind: 'raptor', state: 'attack' } as Entity;
  const left = characterMotion({ ...raptor, facing: -1 }, 0, { age: 0.2, kind: 'hit' }, false);
  const right = characterMotion({ ...raptor, facing: 1 }, 0, { age: 0.2, kind: 'hit' }, false);
  assert.ok(left.dx < 0 && right.dx > 0);
  assert.equal(left.dx, -right.dx);
  const stretch = characterMotion(
    { ...raptor, kind: 'mutantStretch' } as Entity,
    0,
    { age: 0.2, kind: 'hit' },
    false,
  );
  assert.ok(stretch.sx > 1 && stretch.sy < 1);
});
