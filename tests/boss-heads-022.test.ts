import test from 'node:test';
import assert from 'node:assert/strict';
import * as boss from '../src/boss.ts';
import { DEFAULT_BALANCE } from '../src/balanceTuning.ts';

function fixture(hp = 1000) {
  const body = { boss: true, hp, maxHp: 1000, x: 700, y: 324 };
  const state = boss.ensureBossState(body, { ...DEFAULT_BALANCE, tacticalRulesEnabled: true })!;
  return { body, state };
}

test('trois réserves indépendantes partagent les PV et respectent un boss déjà blessé', () => {
  const { state } = fixture(600);
  assert.ok(state.heads, 'les têtes possèdent leurs propres PV');
  assert.deepEqual(state.heads.guard, { hp: 300, maxHp: 500, cool: 0 });
  assert.deepEqual(state.heads.ranged, { hp: 120, maxHp: 200, cool: 7 });
  assert.deepEqual(state.heads.hybrid, { hp: 180, maxHp: 300, cool: 0 });
  assert.equal(boss.bossHeadsHealth(state), 600);
});

test('les coups de mêlée visent la gardienne puis la mixte et reportent le surplus', () => {
  const { state } = fixture();
  assert.ok(state.heads);
  assert.equal(boss.receiveBossDamage(state, 550, false), 550);
  assert.equal(state.heads.guard.hp, 0);
  assert.equal(state.heads.hybrid.hp, 250);
  assert.equal(state.heads.ranged.hp, 200);
  assert.equal(boss.receiveBossDamage(state, 9999, false), 450);
  assert.equal(boss.bossHeadsHealth(state), 0);
});

test('les projectiles font tomber la cracheuse avant la mixte sans changer la protection', () => {
  const { state } = fixture();
  assert.ok(state.heads);
  boss.receiveBossDamage(state, 225, true);
  assert.equal(state.heads.ranged.hp, 0);
  assert.equal(state.heads.hybrid.hp, 275);
  assert.equal(state.heads.guard.hp, 500);
  assert.equal(state.shield, 120);
});

test('un soin ne ressuscite aucune tête et ne renouvelle aucune protection consommée', () => {
  const { body, state } = fixture();
  assert.ok(state.heads);
  boss.receiveBossDamage(state, 250, true);
  state.shield = 0;
  state.shieldsBroken = 1;
  const healed = boss.healBossHeads(state, 500);
  assert.equal(healed, 50);
  assert.equal(state.heads.ranged.hp, 0);
  assert.equal(state.heads.hybrid.hp, 300);
  assert.equal(state.shield, 0);
  body.hp = boss.bossHeadsHealth(state);
  boss.ensureBossState(body, { ...DEFAULT_BALANCE, tacticalRulesEnabled: true });
  assert.equal(state.shield, 0);
});

test('les phases restent croissantes après soins et ne créent que trois protections', () => {
  const { body, state } = fixture();
  assert.ok(state.heads);
  for (const hp of [550, 200]) {
    body.hp = hp;
    boss.ensureBossState(body, { ...DEFAULT_BALANCE, tacticalRulesEnabled: true });
    boss.absorbBossHit(state, 1000, 1);
    body.hp = 900;
    boss.ensureBossState(body, { ...DEFAULT_BALANCE, tacticalRulesEnabled: true });
    assert.equal(state.shield, 0);
  }
  assert.equal(state.phase, 3);
  assert.equal(state.shieldsBroken, 2);
});

test('une tête tombée ne peut plus mordre ni préparer un tir', () => {
  const { state } = fixture();
  assert.ok(state.heads);
  assert.deepEqual(
    boss.bossMeleeAttacks(state).map((a) => a.head),
    ['guard', 'hybrid'],
  );
  state.heads.guard.hp = 0;
  state.heads.hybrid.cool = 1.7;
  assert.deepEqual(boss.bossMeleeAttacks(state), []);
  boss.tickBossHeads(state, 1.7);
  assert.deepEqual(
    boss.bossMeleeAttacks(state).map((a) => a.head),
    ['hybrid'],
  );
  state.heads.ranged.hp = 0;
  assert.equal(boss.bossShotAttack(state, true), undefined);
  assert.equal(boss.bossShotAttack(state, false)?.head, 'hybrid');
  state.heads.hybrid.hp = 0;
  assert.equal(boss.bossShotAttack(state, false), undefined);
});

test('annuler un tir efface aussi la tête active et le témoin conserve les anciennes règles', () => {
  const { state } = fixture();
  state.shotHead = 'ranged';
  state.windup = 1;
  boss.cancelBossShot(state);
  assert.equal(state.shotHead, null);
  const body = { boss: true, hp: 1000, maxHp: 1000, x: 700, y: 324 };
  assert.equal(
    boss.ensureBossState(body, { ...DEFAULT_BALANCE, tacticalRulesEnabled: false })?.heads,
    undefined,
  );
});
