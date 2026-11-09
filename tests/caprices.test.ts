import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { MISSIONS, createMissionRun, missionWave, readMissionRun } from '../src/missions.ts';
import type { MissionId } from '../src/missions.ts';
import {
  CAPRICES,
  CAPRICE_TIERS,
  NO_CAPRICE,
  capriceById,
  capriceRules,
  capricesForMission,
  capriceUnlocked,
  defineCaprice,
} from '../src/caprices.ts';

const run = (caprice: string, seed = 4242) => {
  const definition = capriceById(caprice);
  assert.ok(definition, caprice);
  return { ...createMissionRun(definition.missionId, seed), caprice };
};
const isFighting = (g: Game) => g.status === 'fighting';
function playOut(g: Game) {
  for (let w = 1; w <= g.totalWaves && g.status === 'preparing'; w++) {
    assert.ok(g.startWave());
    for (let i = 0; i < 30 * 400 && isFighting(g); i++) g.step(1 / 30);
  }
  return { status: g.status, base: g.base, kills: g.kills, rng: g.rng, gold: g.gold, time: g.time };
}

test('catalogue : trois caprices par mission, un par niveau, annonces courtes', () => {
  assert.equal(CAPRICES.length, 18);
  assert.equal(new Set(CAPRICES.map((c) => c.id)).size, 18);
  for (const mission of MISSIONS) {
    const list = capricesForMission(mission.id);
    assert.deepEqual(
      list.map((c) => c.tier),
      CAPRICE_TIERS,
      mission.id,
    );
    for (const caprice of list) {
      assert.ok(caprice.name.trim(), caprice.id);
      assert.ok(
        caprice.announce.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length <= 6,
        caprice.id,
      );
      assert.deepEqual(Object.keys(caprice.rules).sort(), Object.keys(NO_CAPRICE).sort());
    }
  }
});

test('les caprices respectent les règles du fils', () => {
  for (const { id, rules } of CAPRICES) {
    // Œufs : on peut en ajouter ou les faire éclore plus tôt, jamais en retirer.
    assert.ok(rules.eggs >= 0 && rules.hatch <= 1, id);
    // Jamais moins de serpents ni plus lents : un caprice durcit, il ne retire rien.
    assert.ok(rules.count >= 1 && rules.speed >= 1, id);
    // L'achat d'alliés reste possible : au moins une sorte et une bourse non nulle.
    assert.ok(rules.kinds === 0 || rules.kinds >= 1, id);
    assert.ok(rules.budget > 0, id);
  }
  // Le roi à trois têtes vient de ses règles : il apparaît dans deux caprices.
  assert.equal(CAPRICES.filter((c) => c.rules.king).length, 2);
});

test('déblocage : petit dès la victoire, moyen à 2 étoiles, grand à 3', () => {
  assert.equal(capriceUnlocked('petit', 0), false);
  assert.equal(capriceUnlocked('petit', 1), true);
  assert.equal(capriceUnlocked('moyen', 1), false);
  assert.equal(capriceUnlocked('moyen', 2), true);
  assert.equal(capriceUnlocked('grand', 2), false);
  assert.equal(capriceUnlocked('grand', 3), true);
});

test('un caprice est lu avec sa mission et refusé sur une autre', () => {
  assert.equal(readMissionRun(run('carrefour-petit'))?.caprice, 'carrefour-petit');
  assert.equal(
    readMissionRun({ ...createMissionRun('refuge', 1), caprice: 'carrefour-petit' }),
    null,
  );
  assert.equal(readMissionRun({ ...createMissionRun('course', 1), caprice: 'inconnu' }), null);
  assert.equal(capriceRules(createMissionRun('course', 1)), NO_CAPRICE);
  assert.throws(() =>
    defineCaprice({
      id: 'refuge-petit',
      missionId: 'refuge',
      tier: 'petit',
      name: 'x',
      announce: 'x',
      rules: {},
    }),
  );
});

test('même départ et même caprice donnent la même partie, pour les dix-huit', () => {
  for (const { id } of CAPRICES) {
    const a = playOut(new Game(0, undefined, run(id)));
    const b = playOut(new Game(0, undefined, run(id)));
    assert.deepEqual(a, b, id);
  }
});

test('« Plus de miel ! » refuse le goûter et le miel collant', () => {
  const g = new Game(0, undefined, run('carrefour-petit'));
  g.startWave();
  assert.equal(g.offerFeast(g.enemyLanes[0], 'sticky'), false);
  assert.equal(g.offerFeast(g.enemyLanes[0], 'lure'), false);
  const plain = new Game(0, undefined, createMissionRun('carrefour', 4242));
  plain.startWave();
  assert.equal(plain.offerFeast(plain.enemyLanes[0], 'sticky'), true);
});

test('« Deux copains seulement » limite les sortes, pas le nombre d’alliés', () => {
  const g = new Game(0, undefined, run('sonnette-petit'));
  g.gold = 5000;
  assert.ok(g.recruit('club', 660, 180));
  assert.ok(g.recruit('archer', 900, 180));
  assert.ok(g.recruit('club', 660, 324));
  assert.equal(g.capriceAllows('shield'), false);
  assert.equal(g.recruit('shield', 708, 468), false);
  assert.deepEqual([...g.capriceKindsChosen].sort(), ['archer', 'club']);
});

test('le choix des copains se fait avant le premier recrutement', () => {
  const g = new Game(0, undefined, run('carrefour-moyen'));
  assert.equal(g.chooseCapriceKinds(['archer', 'club']), false, 'un seul copain');
  assert.equal(g.chooseCapriceKinds(['hero']), false);
  assert.ok(g.chooseCapriceKinds(['shield']));
  assert.equal(g.chooseCapriceKinds(['club']), false, 'déjà choisi');
  g.gold = 5000;
  assert.equal(g.recruit('club', 660, 180), false);
  assert.ok(g.recruit('shield', 660, 180));
  assert.equal(
    new Game(0, undefined, createMissionRun('carrefour', 1)).chooseCapriceKinds(['club']),
    false,
  );
});

test('bourse, œufs et nombre de serpents suivent le caprice', () => {
  assert.equal(new Game(0, undefined, run('trois-ponts-petit')).gold, 275);
  const plain = missionWave(createMissionRun('coquilles', 4242), 2);
  const eggs = missionWave(run('coquilles-petit'), 2);
  assert.equal(eggs.eggs.length, Math.min(3, plain.eggs.length + 2));
  assert.ok(eggs.eggs[0].hatchIn < plain.eggs[0].hatchIn);
  assert.equal(missionWave(run('coquilles-moyen'), 2).stats.count, plain.stats.count * 2);
});

test('sans caprice, rien ne change', () => {
  for (const mission of MISSIONS) {
    const id = mission.id as MissionId;
    const plain = createMissionRun(id, 99);
    assert.equal(new Game(0, undefined, plain).gold, mission.budget);
    assert.deepEqual(missionWave(plain, 1), missionWave(readMissionRun(plain)!, 1));
  }
});

test('noHealers retire infirmiers et médecins (levier gardé en réserve)', () => {
  defineCaprice({
    id: 'test-bandages',
    missionId: 'course',
    tier: 'moyen',
    name: 'Bandages mangés',
    announce: 'On a mangé les bandages !',
    rules: { noHealers: true },
  });
  const g = new Game(0, undefined, { ...createMissionRun('course', 1), caprice: 'test-bandages' });
  assert.equal(g.capriceAllows('nurse'), false);
  assert.equal(g.capriceAllows('medic'), false);
  assert.equal(g.capriceAllows('club'), true);
});

test('le roi d’un caprice n’apparaît que dans la dernière vague', () => {
  assert.ok(capriceById('course-grand')?.rules.king);
  defineCaprice({
    id: 'test-roi',
    missionId: 'refuge',
    tier: 'grand',
    name: 'Le roi s’invite',
    announce: 'Le roi veut voir ça !',
    rules: { king: true },
  });
  const g = new Game(0, undefined, { ...createMissionRun('refuge', 7), caprice: 'test-roi' });
  const bossByWave: boolean[] = [];
  for (let w = 1; w <= g.totalWaves && g.status === 'preparing'; w++) {
    g.startWave();
    let boss = false;
    for (let i = 0; i < 30 * 400 && isFighting(g); i++) {
      g.step(1 / 30);
      boss ||= g.enemies.some((e) => e.boss);
    }
    bossByWave.push(boss);
  }
  assert.deepEqual(bossByWave, [false, false, true]);
});
