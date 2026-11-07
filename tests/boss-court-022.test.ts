import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureBossState, healBossHeads, receiveBossDamage } from '../src/boss.ts';
import { DEFAULT_BALANCE } from '../src/balanceTuning.ts';

const courtModule = await import('../src/bossCourt.ts').catch(() => undefined);
function fixture() {
  assert.ok(courtModule, 'le modèle de garde rapprochée est disponible');
  const body = { id: 1, boss: true, hp: 1000, maxHp: 1000, x: 700, y: 324 };
  const state = ensureBossState(body, { ...DEFAULT_BALANCE, tacticalRulesEnabled: true })!;
  return {
    body: { ...body, bossState: state },
    state,
    court: { bossId: 1, role: 'healer' as const, charges: 6, cool: 0 },
  };
}

test('le soigneur ne propose que six vrais bandages espacés, jamais un stock infini', () => {
  const { body, state, court } = fixture();
  receiveBossDamage(state, 400, false);
  body.hp = 600;
  for (let i = 0; i < 6; i++) {
    const heal = courtModule!.tickCourtHeal(court, i === 0 ? 0 : 3, body, [body]);
    assert.ok(heal);
    assert.equal(heal.amount, 35);
    healBossHeads(state, heal.amount);
    body.hp += heal.amount;
    assert.equal(courtModule!.tickCourtHeal(court, 0, body, [body]), undefined);
  }
  assert.equal(court.charges, 0);
  assert.equal(body.hp, 810);
  assert.equal(courtModule!.tickCourtHeal(court, 100, body, [body]), undefined);
});

test('portée, morts et têtes perdues ne consomment pas de bandage', () => {
  const { body, state, court } = fixture();
  receiveBossDamage(state, 500, false);
  body.hp = 500;
  assert.equal(courtModule!.tickCourtHeal(court, 0, body, [body]), undefined);
  receiveBossDamage(state, 20, true);
  body.hp = 480;
  assert.equal(courtModule!.tickCourtHeal(court, 0, { x: 811, y: 324 }, [body]), undefined);
  assert.equal(court.charges, 6);
  body.hp = 0;
  assert.equal(courtModule!.tickCourtHeal(court, 0, body, [body]), undefined);
  assert.equal(court.charges, 6);
});

test('le roi blessé passe avant ses gardes, sans soigner les rouages ni une autre cour', () => {
  const { body, state, court } = fixture();
  const guard = {
    id: 2,
    hp: 10,
    maxHp: 100,
    x: 700,
    y: 324,
    variant: 'armored',
    court: { bossId: 1, role: 'guard' as const, charges: 0, cool: 0 },
  };
  receiveBossDamage(state, 20, false);
  body.hp = 980;
  const bossHeal = courtModule!.tickCourtHeal(court, 0, body, [guard, body]);
  assert.equal(bossHeal?.target, body);
  assert.equal(bossHeal?.amount, 20);
  assert.equal(body.hp, 980, 'le helper ne modifie jamais les PV du corps');
  healBossHeads(state, 20);
  body.hp = 1000;
  assert.equal(courtModule!.tickCourtHeal(court, 3, body, [guard, body])?.target, guard);
  guard.variant = 'clockwork';
  assert.equal(courtModule!.tickCourtHeal(court, 3, body, [guard, body]), undefined);
  guard.variant = 'armored';
  guard.court.bossId = 9;
  assert.equal(courtModule!.tickCourtHeal(court, 3, body, [guard, body]), undefined);
});

test('la cour consomme trois places et présente deux gardes plus un soigneur', () => {
  assert.ok(courtModule);
  assert.deepEqual(
    courtModule.BOSS_COURT.map((c) => c.role),
    ['guard', 'guard', 'healer'],
  );
  assert.deepEqual(
    courtModule.BOSS_COURT.map((c) => c.variant),
    ['armored', 'armored', 'courtHealer'],
  );
});
