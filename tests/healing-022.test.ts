import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consumeBandage,
  ensureMedical,
  medicalRules,
  readMedical,
  tickMedical,
} from '../src/healing.ts';
import type { MedicalState } from '../src/healing.ts';
import { kinds } from '../src/data.ts';
import { healAmount, specialAbility } from '../src/unitRules.ts';

test('chaque soignant épuise son propre stock et doit rentrer dès son dernier soin', () => {
  for (const [kind, capacity] of [
    ['medic', 6],
    ['nurse', 4],
  ] as const) {
    const unit: { kind: string; medical?: MedicalState } = { kind };
    const state = ensureMedical(unit)!;
    assert.equal(unit.medical, state);
    for (let used = 0; used < capacity; used++) {
      assert.equal(state.phase, 'ready');
      assert.equal(consumeBandage(state), true);
    }
    assert.deepEqual(state, { bandages: 0, phase: 'returning', remaining: 0 });
    assert.equal(consumeBandage(state), false);
    assert.equal(ensureMedical(unit), state, 'une consultation ne rend aucun bandage');
  }
  assert.equal(ensureMedical({ kind: 'club' }), null);
});

test('le trajet ne recharge pas et seule une attente complète au fort rend tout le stock', () => {
  for (const [kind, capacity] of [
    ['medic', 6],
    ['nurse', 4],
  ] as const) {
    const state: MedicalState = { bandages: 0, phase: 'returning', remaining: 0 };
    assert.equal(tickMedical(state, 20, false, kind), 'returning');
    assert.equal(tickMedical(state, 0.1, true, kind), 'restocking');
    assert.deepEqual(state, { bandages: 0, phase: 'restocking', remaining: 4 });
    assert.equal(consumeBandage(state), false);
    tickMedical(state, 3, true, kind);
    assert.equal(state.remaining, 1);
    tickMedical(state, 20, false, kind);
    assert.equal(state.remaining, 1, 'aucune recharge à distance');
    assert.equal(consumeBandage(state), false);
    assert.equal(tickMedical(state, 1, true, kind), 'ready');
    assert.deepEqual(state, { bandages: capacity, phase: 'ready', remaining: 0 });
    assert.equal(consumeBandage(state), true);
  }
});

test('pause et durées invalides figent le trajet comme la recharge', () => {
  for (const phase of ['returning', 'restocking'] as const) {
    for (const dt of [0, -1, NaN, Infinity, -Infinity]) {
      const state: MedicalState = { bandages: 0, phase, remaining: phase === 'restocking' ? 2 : 0 };
      const before = { ...state };
      assert.equal(tickMedical(state, dt, true, 'medic'), phase);
      assert.deepEqual(state, before);
    }
  }
});

test('quatre secondes à trente pas par seconde achèvent la recharge sans pas supplémentaire', () => {
  const state: MedicalState = { bandages: 0, phase: 'restocking', remaining: 4 };
  for (let i = 0; i < 119; i++) tickMedical(state, 1 / 30, true, 'nurse');
  assert.equal(state.phase, 'restocking');
  assert.equal(state.bandages, 0);
  tickMedical(state, 1 / 30, true, 'nurse');
  assert.deepEqual(state, { bandages: 4, phase: 'ready', remaining: 0 });
});

test('un état présent invalide est refusé sans le remplacer par des bandages neufs', () => {
  const unit = {
    kind: 'nurse',
    medical: { bandages: 6, phase: 'ready', remaining: 0 } as MedicalState,
  };
  const original = unit.medical;
  assert.equal(ensureMedical(unit), null);
  assert.equal(unit.medical, original);
  assert.equal(unit.medical.bandages, 6);
});

test('un stock partiel reste partiel au fort et lors de consultations répétées', () => {
  const unit = {
    kind: 'medic',
    medical: { bandages: 2, phase: 'ready', remaining: 0 } as MedicalState,
  };
  tickMedical(unit.medical, 100, true, 'medic');
  assert.deepEqual(ensureMedical(unit), { bandages: 2, phase: 'ready', remaining: 0 });
});

test('la lecture accepte les trois phases et produit une copie défensive sans remplissage', () => {
  for (const fixture of [
    { bandages: 2, phase: 'ready', remaining: 0 },
    { bandages: 0, phase: 'returning', remaining: 0 },
    { bandages: 0, phase: 'restocking', remaining: 2.25 },
  ]) {
    const restored = readMedical(fixture, 'nurse');
    assert.deepEqual(restored, fixture);
    assert.notEqual(restored, fixture);
    restored!.bandages = 3;
    assert.notEqual(restored!.bandages, fixture.bandages);
  }
});

test('la lecture refuse les stocks et horloges incohérents plutôt que de les réparer', () => {
  for (const raw of [
    null,
    undefined,
    [],
    {},
    { bandages: -1, phase: 'ready', remaining: 0 },
    { bandages: 4.5, phase: 'ready', remaining: 0 },
    { bandages: 5, phase: 'ready', remaining: 0 },
    { bandages: NaN, phase: 'ready', remaining: 0 },
    { bandages: 0, phase: 'ready', remaining: 0 },
    { bandages: 2, phase: 'ready', remaining: 1 },
    { bandages: 1, phase: 'returning', remaining: 0 },
    { bandages: 0, phase: 'returning', remaining: 1 },
    { bandages: 1, phase: 'restocking', remaining: 2 },
    { bandages: 0, phase: 'restocking', remaining: 0 },
    { bandages: 0, phase: 'restocking', remaining: -1 },
    { bandages: 0, phase: 'restocking', remaining: 4.01 },
    { bandages: 0, phase: 'restocking', remaining: Infinity },
    { bandages: 0, phase: 'other', remaining: 0 },
  ])
    assert.equal(readMedical(raw, 'nurse'), null, JSON.stringify(raw));
  assert.equal(readMedical({ bandages: 1, phase: 'ready', remaining: 0 }, 'club'), null);
});

test('la cadence du catalogue et les fiches rendent le stock, le retour et la recharge compréhensibles', () => {
  for (const [kind, capacity, interval, amount] of [
    ['medic', 6, 1.6, 24],
    ['nurse', 4, 1.4, 14],
  ] as const) {
    assert.equal(kinds[kind].rate, interval);
    assert.equal(medicalRules(kind)!.interval, interval);
    assert.equal(healAmount(kind), amount);
    const description = specialAbility(kind);
    assert.match(description, new RegExp(`${capacity} bandages`));
    assert.match(description, new RegExp(`${String(interval).replace('.', ',')} seconde`));
    assert.match(description, /fort/);
    assert.match(description, /4 secondes/);
    assert.match(description, /Aucune résurrection/);
  }
  assert.equal(medicalRules('club'), null);
  assert.match(specialAbility('tank', 0.5), /voisins 50 %/);
  assert.doesNotMatch(specialAbility('tank', 1), /voisins/);
});
