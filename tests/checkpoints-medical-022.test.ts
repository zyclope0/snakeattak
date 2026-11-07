import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import { decodeCheckpoint, encodeCheckpoint, createPersistence } from '../src/checkpoints.ts';
import { LEGACY_BALANCE } from '../src/balanceTuning.ts';

const mission = {
  missionId: 'refuge',
  seed: 42,
  layout: 0,
  assault: 'balanced',
  nest: 'spread',
} as const;

function medicalCamp(expedition = false) {
  const game = new Game(42, undefined, expedition ? mission : undefined);
  const healer = game.units[0];
  healer.kind = 'medic';
  healer.maxHp = kinds.medic.hp;
  healer.hp = 23;
  Object.assign(healer, {
    medical: { bandages: 2, phase: 'ready', remaining: 0 },
    cool: 1.25,
  });
  return game;
}

// A dropped medical field, refill on decode, or reset cooldown breaks real survivor state.
for (const expedition of [false, true]) {
  test(`v6 ${expedition ? 'mission' : 'classique'} conserve stock partiel, cadence et survivants`, () => {
    const game = medicalCamp(expedition);
    game.units[1].hp = 0;
    if (expedition) game.missionMinBase = 71;
    const raw = encodeCheckpoint(game)!;
    const saved = JSON.parse(raw);
    assert.equal(saved.version, 6);
    assert.deepEqual(saved.units[0].medical, { bandages: 2, phase: 'ready', remaining: 0 });
    assert.equal(saved.units[0].medicalCool, 1.25);
    assert.equal('medical' in saved.units[1], false);
    assert.equal('medicalCool' in saved.units[1], false);
    const restored = decodeCheckpoint(raw)!;
    assert.ok(restored);
    assert.equal(restored.units.length, 2);
    assert.equal(restored.units[0].hp, 23);
    assert.deepEqual(restored.units[0].medical, { bandages: 2, phase: 'ready', remaining: 0 });
    assert.equal(restored.units[0].cool, 1.25);
    assert.deepEqual(restored.mission, expedition ? mission : null);
    if (expedition) assert.equal(restored.missionMinBase, 71);
    assert.equal(encodeCheckpoint(restored), raw);
  });
}

test('v6 reprend le retour et la recharge au même point et sans stock gratuit', () => {
  for (const medical of [
    { bandages: 0, phase: 'returning', remaining: 0 },
    { bandages: 0, phase: 'restocking', remaining: 2.75 },
  ]) {
    const game = medicalCamp();
    Object.assign(game.units[0], { medical });
    const { x, y, homeX, homeY } = game.units[0];
    const restored = decodeCheckpoint(encodeCheckpoint(game)!)!;
    assert.ok(restored);
    assert.deepEqual(restored.units[0].medical, medical);
    assert.deepEqual(
      {
        x: restored.units[0].x,
        y: restored.units[0].y,
        homeX: restored.units[0].homeX,
        homeY: restored.units[0].homeY,
      },
      { x, y, homeX, homeY },
    );
  }
});

test('v6 refuse les stocks et cadences absents, corrompus ou attribués à un combattant', () => {
  const saved = JSON.parse(encodeCheckpoint(medicalCamp())!);
  saved.version = 6;
  for (const patch of [
    { medical: undefined },
    { medical: null },
    { medical: { bandages: 7, phase: 'ready', remaining: 0 } },
    { medical: { bandages: 2, phase: 'restocking', remaining: 2 } },
    { medical: { bandages: 0, phase: 'restocking', remaining: 5 } },
    { medical: { bandages: 0, phase: 'ready', remaining: 0 } },
    { medicalCool: undefined },
    { medicalCool: -0.1 },
    { medicalCool: 1.61 },
    { medicalCool: '0' },
  ]) {
    const units = [{ ...saved.units[0], ...patch }, ...saved.units.slice(1)];
    assert.equal(decodeCheckpoint(JSON.stringify({ ...saved, units })), null);
  }
  for (const patch of [
    { medical: { bandages: 2, phase: 'ready', remaining: 0 } },
    { medicalCool: 0 },
  ]) {
    const units = [saved.units[0], { ...saved.units[1], ...patch }, ...saved.units.slice(2)];
    assert.equal(decodeCheckpoint(JSON.stringify({ ...saved, units })), null);
  }
});

test('encodeur initialise seulement les soignants sans état et refuse un état existant invalide', () => {
  const game = medicalCamp();
  delete game.units[0].medical;
  const saved = JSON.parse(encodeCheckpoint(game)!);
  assert.deepEqual(saved.units[0].medical, { bandages: 6, phase: 'ready', remaining: 0 });
  assert.equal(game.units[0].medical, undefined);
  for (const medical of [null, { bandages: 99, phase: 'ready', remaining: 0 }]) {
    Object.assign(game.units[0], { medical });
    assert.equal(encodeCheckpoint(game), null);
  }
  const badFighter = new Game();
  Object.assign(badFighter.units[0], { medical: { bandages: 1, phase: 'ready', remaining: 0 } });
  assert.equal(encodeCheckpoint(badFighter), null);
});

test('migration v1–v5 : premier stock plein uniquement, PV et morts conservés', () => {
  for (const version of [1, 2, 3, 4, 5]) {
    const game = medicalCamp(version === 5);
    game.units[1].kind = 'nurse';
    game.units[1].hp = 13;
    game.units[1].maxHp = kinds.nurse.hp;
    game.units[2].hp = 0;
    const saved = JSON.parse(encodeCheckpoint(game)!);
    saved.version = version;
    if (version < 4) delete saved.campaign;
    if (version < 3) delete saved.rewards;
    for (const unit of saved.units) {
      delete unit.medical;
      delete unit.medicalCool;
      if (version === 1) delete unit.homeX;
    }
    const restored = decodeCheckpoint(JSON.stringify(saved))!;
    assert.ok(restored);
    assert.deepEqual(
      restored.units.map((u) => u.hp),
      [23, 13],
    );
    assert.deepEqual(
      restored.units.map((u) => u.medical),
      [
        { bandages: 6, phase: 'ready', remaining: 0 },
        { bandages: 4, phase: 'ready', remaining: 0 },
      ],
    );
    assert.deepEqual(
      restored.units.map((u) => u.cool),
      [0, 0],
    );
    restored.units[0].medical!.bandages = 1;
    assert.equal(decodeCheckpoint(encodeCheckpoint(restored)!)!.units[0].medical!.bandages, 1);
  }
});

test('v6 valide les missions facultatives et exige leur minimum de cristal', () => {
  const saved = JSON.parse(encodeCheckpoint(medicalCamp(true))!);
  saved.version = 6;
  for (const patch of [
    { mission: null },
    { mission: { ...mission, layout: 9 } },
    { missionMinBase: undefined },
    { missionMinBase: 101 },
    { wave: 3 },
    { rewards: { ...saved.rewards, ward: 1 } },
    { campaign: { ...saved.campaign, chapterStars: [1, 0, 0] } },
  ])
    assert.equal(decodeCheckpoint(JSON.stringify({ ...saved, ...patch })), null);
});

test('un état médical invalide ne remplace pas le camp persistant', () => {
  let stored = '';
  const persistence = createPersistence({
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value;
    },
  });
  const game = medicalCamp();
  persistence.sync(game);
  const before = stored;
  Object.assign(game.units[0], { medical: { bandages: 100, phase: 'ready', remaining: 0 } });
  persistence.sync(game);
  assert.equal(stored, before);
});

test('le témoin classique LEGACY conserve son format v4', () => {
  const game = new Game(42, LEGACY_BALANCE);
  assert.equal(JSON.parse(encodeCheckpoint(game)!).version, 4);
});

test('v6 valide la capacité et la cadence propres aux infirmiers', () => {
  const game = medicalCamp();
  game.units[0].kind = 'nurse';
  game.units[0].hp = 13;
  game.units[0].maxHp = kinds.nurse.hp;
  Object.assign(game.units[0], {
    medical: { bandages: 4, phase: 'ready', remaining: 0 },
    cool: 1.4,
  });
  const raw = encodeCheckpoint(game)!;
  assert.ok(raw);
  const restored = decodeCheckpoint(raw)!;
  assert.equal(restored.units[0].medical!.bandages, 4);
  assert.equal(restored.units[0].cool, 1.4);
  const saved = JSON.parse(raw);
  for (const patch of [
    { medical: { bandages: 5, phase: 'ready', remaining: 0 } },
    { medicalCool: 1.41 },
  ]) {
    assert.equal(
      decodeCheckpoint(
        JSON.stringify({
          ...saved,
          units: [{ ...saved.units[0], ...patch }, ...saved.units.slice(1)],
        }),
      ),
      null,
    );
  }
});

// Le compteur de combat peut passer sous zéro entre deux pas : le fichier reste canonique.
test('encodeur borne la cadence médicale finie avant de sauvegarder', () => {
  for (const [cool, expected] of [
    [-0.03, 0],
    [9, 1.6],
  ]) {
    const game = medicalCamp();
    game.units[0].cool = cool;
    const raw = encodeCheckpoint(game);
    assert.ok(raw);
    assert.equal(JSON.parse(raw).units[0].medicalCool, expected);
    assert.equal(decodeCheckpoint(raw)!.units[0].cool, expected);
    assert.equal(game.units[0].cool, cool);
  }
  for (const cool of [NaN, Infinity, -Infinity]) {
    const game = medicalCamp();
    game.units[0].cool = cool;
    assert.equal(encodeCheckpoint(game), null);
  }
});
