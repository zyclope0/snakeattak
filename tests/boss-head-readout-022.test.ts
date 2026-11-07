import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureBossState, receiveBossDamage } from '../src/boss.ts';
import { DEFAULT_BALANCE } from '../src/balanceTuning.ts';
import type { Entity } from '../src/game.ts';
import { bossReadout } from '../src/render/bossReadout.ts';

function fixture() {
  const entity = { boss: true, hp: 1000, maxHp: 1000, x: 700, y: 324 } as Entity;
  ensureBossState(entity, { ...DEFAULT_BALANCE, tacticalRulesEnabled: true });
  return entity;
}

test('les trois barres nommées lisent les PV réels et la tête qui prépare le tir', () => {
  const entity = fixture();
  const state = entity.bossState!;
  receiveBossDamage(state, 100, true);
  state.shotHead = 'ranged';
  state.windup = 0.9;
  const before = JSON.stringify(entity);
  const r = bossReadout(entity, DEFAULT_BALANCE)!;
  assert.ok(r.heads);
  assert.deepEqual(
    r.heads.map((h) => [h.id, h.hp, h.maxHp, h.ratio, h.alive, h.active]),
    [
      ['guard', 500, 500, 1, true, false],
      ['ranged', 100, 200, 0.5, true, true],
      ['hybrid', 300, 300, 1, true, false],
    ],
  );
  assert.deepEqual(
    r.heads.map((h) => h.label),
    ['Gardienne', 'Cracheuse', 'Mixte'],
  );
  assert.equal(JSON.stringify(entity), before);
});

test('la tête tombée perd sa marque de tir même si le rendu précède le prochain pas moteur', () => {
  const entity = fixture();
  const state = entity.bossState!;
  state.shotHead = 'ranged';
  state.windup = 0.9;
  state.heads!.ranged.hp = 0;
  const r = bossReadout(entity, DEFAULT_BALANCE)!;
  assert.ok(r.heads);
  assert.equal(r.heads[1].alive, false);
  assert.equal(r.heads[1].active, false);
  assert.equal(r.shot, null);
});
