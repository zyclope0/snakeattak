import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { placementReadout } from '../src/render/placementRange.ts';
import { ENDLESS_RULES } from '../src/endless.ts';
import { kinds } from '../src/data.ts';
import { turnReach } from '../src/engine/allies.ts';
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

test('le cercle de portée suit « la longue-vue » de l’aventure sans fin, comme le moteur', () => {
  const rules = ENDLESS_RULES[1];
  const g = new Game(3, undefined, undefined, rules.balance, undefined, rules);
  g.kings = 1;
  g.rewards.pending = 12;
  assert.ok(g.restoreEndless([{ id: 'vue', level: 2 }]));
  g.rewards.pending = null;
  const sight = 1 + g.boonGain('vue');
  assert.ok(sight > 1);
  // A shooter sees further; a fighter at contact and a healer keep their reach.
  assert.equal(
    placementReadout(g, 'archer', { x: 948, y: 324 })!.radius,
    kinds.archer.range * sight,
  );
  assert.equal(placementReadout(g, 'club', { x: 948, y: 324 })!.radius, kinds.club.range);
  assert.equal(placementReadout(g, 'medic', { x: 948, y: 324 })!.radius, kinds.medic.range);
  for (const kind of ['archer', 'dragon', 'tank', 'club', 'medic', 'nurse'] as const)
    assert.equal(placementReadout(g, kind, { x: 948, y: 324 })!.radius, turnReach(g, kind));
});
