import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { placementReadout } from '../src/render/placementRange.ts';
test('la portée présentée suit la vraie unité et la légalité du placement', () => {
  const g = new Game(3);
  g.gold = 3000;
  for (const [kind, range] of [
    ['archer', 210],
    ['medic', 130],
    ['club', 45],
  ] as const) {
    const r = placementReadout(g, kind, { x: 948, y: 324 })!;
    assert.equal(r.category, kind === 'medic' ? 'Soin' : kind === 'archer' ? 'Tir' : 'Contact');
    assert.equal(r.radius, range);
    assert.equal(r.valid, g.canRecruit(kind, 948, 324));
  }
  assert.equal(placementReadout(g, 'archer', { x: 400, y: 324 })?.valid, false);
  const before = JSON.stringify(g);
  placementReadout(g, 'archer');
  assert.equal(JSON.stringify(g), before);
});
