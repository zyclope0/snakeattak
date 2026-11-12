import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { Presentation } from '../src/render/presentation.ts';
import { characterMotion } from '../src/render/characterMotion.ts';
import { coinTarget } from '../src/render/juice.ts';

test('un coup donne un seul éclair pâle, jamais relancé avant 0,3 s', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  const u = g.units[0];
  u.hp -= 5;
  p.update(g, 16);
  assert.ok((p.flashes.get(u.id) ?? 1) < 0.1, 'éclair visible');
  u.hp -= 5;
  p.update(g, 150);
  assert.ok(p.flashes.get(u.id)! >= 0.1, 'un deuxième coup ne relance pas l’éclair');
  p.update(g, 100);
  p.update(g, 100);
  assert.equal(p.flashes.has(u.id), false);
  u.hp -= 5;
  p.update(g, 16);
  assert.ok(p.flashes.get(u.id)! < 0.1);
});

test('les signaux de vie ne durent qu’une image et ne touchent pas au moteur', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  const rng = g.rng;
  g.effects.push({ x: 300, y: 310, tx: 300, ty: 310, kind: 'gold', life: 0.3 });
  p.update(g, 16);
  assert.deepEqual(p.sparks, [{ kind: 'coin', x: 300, y: 310 }]);
  p.update(g, 16);
  assert.equal(p.sparks.length, 0);
  assert.equal(g.rng, rng);
  assert.equal(p.victoryAge, Infinity);
});

test('respiration au repos bornée ; aucune en mouvement réduit', () => {
  const u = { ...new Game().units[0], state: 'idle' as const };
  let moved = false;
  for (let clock = 0; clock < 6; clock += 0.25) {
    const pose = characterMotion(u, clock, undefined, false);
    assert.ok(Math.abs(pose.sy - 1) <= 0.03 && Math.abs(pose.sx - 1) <= 0.012);
    assert.equal(pose.dx, 0);
    moved ||= pose.sy !== 1;
    assert.deepEqual(characterMotion(u, clock, undefined, true), {
      dx: 0,
      dy: 0,
      angle: 0,
      sx: 1,
      sy: 1,
    });
  }
  assert.ok(moved);
});

test('la pièce vise le compteur et reste sur le plateau', () => {
  const canvas = { left: 0, top: 48, width: 550, height: 310 };
  assert.deepEqual(coinTarget(canvas, { left: 30, top: 14, width: 30, height: 20 }), {
    x: 90,
    y: 12,
  });
  assert.deepEqual(coinTarget(canvas, undefined), { x: 60, y: 12 });
  assert.deepEqual(coinTarget({ ...canvas, width: 0 }, { left: 0, top: 0, width: 1, height: 1 }), {
    x: 60,
    y: 12,
  });
});
