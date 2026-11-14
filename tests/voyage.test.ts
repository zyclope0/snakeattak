import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VOYAGE_SEED_LIMIT,
  drawVoyage,
  isVoyageSeed,
  planVoyage,
  stageCaprice,
  voyageRoutes,
  voyageSeedFrom,
} from '../src/voyage.ts';
import type { VoyagePlan } from '../src/voyage.ts';
import { CURRENT_VOYAGE_VERSION, VOYAGE_TUNINGS, freezeTuning } from '../src/voyageTuning.ts';
import { MISSIONS, missionSetupIndex, readMissionRun } from '../src/missions.ts';
import { capriceById, capricesForMission } from '../src/caprices.ts';
import { REWARDS } from '../src/rewards.ts';

const tuning = VOYAGE_TUNINGS[CURRENT_VOYAGE_VERSION];
const order = (id: string) => MISSIONS.findIndex((mission) => mission.id === id);
// Four thousand seeds: the first ones, the last ones and a spread over the whole million.
const seeds = [
  ...Array.from({ length: 2000 }, (_, index) => index),
  ...Array.from({ length: 1900 }, (_, index) => Math.imul(index + 1, 0x9e3779b1) >>> 12),
  ...Array.from({ length: 100 }, (_, index) => VOYAGE_SEED_LIMIT - index),
];
const plans = seeds.map((seed) => planVoyage(seed)!);

test('the same seed always draws the same voyage', () => {
  for (const seed of [0, 1, 4242, 654321, VOYAGE_SEED_LIMIT]) {
    const first = planVoyage(seed);
    assert.ok(first);
    assert.deepEqual(planVoyage(seed), first);
    assert.deepEqual(planVoyage(seed, 1), first);
    assert.equal(JSON.stringify(planVoyage(seed)), JSON.stringify(first));
  }
  const drawn = new Set(plans.map((plan) => JSON.stringify(plan.stages)));
  assert.ok(drawn.size > seeds.length * 0.99, 'two seeds almost never draw the same voyage');
});

test('what is not a seed has no voyage, and never throws', () => {
  for (const seed of [-1, VOYAGE_SEED_LIMIT + 1, 1.5, NaN, Infinity, '7', null, undefined, {}])
    assert.equal(planVoyage(seed as number), null, String(seed));
  assert.equal(planVoyage(7, 2 as 1), null);
  assert.equal(planVoyage(7, 0 as 1), null);
  assert.equal(isVoyageSeed(0), true);
  assert.equal(isVoyageSeed(VOYAGE_SEED_LIMIT), true);
  for (const entropy of [0, 1, 4095, 4096, 0x7fffffff, 0xffffffff])
    assert.ok(isVoyageSeed(voyageSeedFrom(entropy)), String(entropy));
  assert.equal(voyageSeedFrom(0xffffffff), VOYAGE_SEED_LIMIT);
});

test('no seed draws an invalid voyage: five expeditions the engine accepts', () => {
  for (const plan of plans) {
    assert.equal(plan.version, CURRENT_VOYAGE_VERSION);
    assert.equal(plan.stages.length, 5);
    for (const [index, stage] of plan.stages.entries()) {
      // The run is already canonical: reading it again changes nothing.
      assert.deepEqual(readMissionRun(stage.run), stage.run);
      assert.equal(stage.run.balance, 2);
      assert.equal(stage.run.rules, stage.run.missionId === 'refuge' ? 2 : undefined);
      assert.ok(tuning.stages[index].missions.includes(stage.run.missionId));
      assert.equal(stage.coins, tuning.stages[index].coins);
      assert.ok(Object.isFrozen(stage) && Object.isFrozen(stage.offer));
    }
    assert.ok(Object.isFrozen(plan) && Object.isFrozen(plan.stages));
  }
});

test('the missions follow the order of the game and none comes twice', () => {
  for (const plan of plans) {
    const route = plan.stages.map((stage) => order(stage.run.missionId));
    for (let index = 1; index < route.length; index++)
      assert.ok(route[index] > route[index - 1], `seed ${plan.seed}: ${route}`);
  }
  // Every allowed route is drawn, and nothing else.
  const allowed = voyageRoutes(tuning).map((route) => route.join());
  const drawn = new Set(plans.map((plan) => plan.stages.map((s) => s.run.missionId).join()));
  assert.deepEqual([...drawn].sort(), [...allowed].sort());
});

test('a caprice surprises the third stage and the next ones, never the first two', () => {
  const met = new Set<string>();
  for (const plan of plans) {
    const names: string[] = [];
    for (const [index, stage] of plan.stages.entries()) {
      const caprice = stageCaprice(stage);
      if (index < 2) {
        assert.equal(caprice, null, `seed ${plan.seed}, stage ${index + 1}`);
        assert.equal(Object.hasOwn(stage.run, 'caprice'), false);
        continue;
      }
      assert.ok(caprice, `seed ${plan.seed}, stage ${index + 1} has no caprice`);
      assert.equal(caprice.missionId, stage.run.missionId);
      assert.ok(capricesForMission(stage.run.missionId).some((entry) => entry.id === caprice.id));
      assert.ok(tuning.stages[index].tiers.includes(caprice.tier));
      assert.equal(tuning.excluded.includes(caprice.id), false);
      names.push(caprice.name);
      met.add(caprice.id);
    }
    assert.equal(new Set(names).size, names.length, `seed ${plan.seed} meets a caprice twice`);
  }
  // Every caprice the table allows is met by some seed.
  for (const [index, stage] of tuning.stages.entries())
    for (const missionId of stage.missions)
      for (const caprice of capricesForMission(missionId)) {
        const last = index === tuning.stages.length - 1;
        const allowed =
          stage.tiers.includes(caprice.tier) &&
          !tuning.excluded.includes(caprice.id) &&
          (last || !caprice.rules.king);
        if (allowed) assert.ok(met.has(caprice.id), `${caprice.id} is never drawn`);
      }
});

test('the king closes the last stage and comes nowhere else', () => {
  for (const plan of plans)
    for (const [index, stage] of plan.stages.entries()) {
      assert.equal(stage.king, index === 4, `seed ${plan.seed}, stage ${index + 1}`);
      if (index < 4) assert.equal(stageCaprice(stage)?.rules.king ?? false, false);
    }
});

test('three different cards are offered after each stage but the last', () => {
  const offered = new Set<string>();
  for (const plan of plans)
    for (const [index, stage] of plan.stages.entries()) {
      if (index === 4) {
        assert.deepEqual(stage.offer, []);
        continue;
      }
      assert.equal(stage.offer.length, 3);
      assert.equal(new Set(stage.offer).size, 3);
      for (const card of stage.offer) {
        assert.ok(Object.hasOwn(REWARDS, card));
        offered.add(card);
      }
      // Drawn like the cards of the great adventure: one ally and two of the others.
      assert.equal(stage.offer.filter((card) => REWARDS[card].kind).length, 1);
    }
  assert.deepEqual([...offered].sort(), Object.keys(REWARDS).sort());
});

test('terrains, assaults, nests and fight seeds all vary', () => {
  const setups = new Set<number>();
  const fightSeeds = new Set<number>();
  for (const plan of plans)
    for (const stage of plan.stages) {
      setups.add(missionSetupIndex(stage.run));
      fightSeeds.add(stage.run.seed);
    }
  assert.equal(setups.size, 18);
  assert.ok(fightSeeds.size > plans.length * 4.9);
});

test('the table of the voyage is frozen and only names what exists', () => {
  assert.equal(tuning.stages.length, 5);
  assert.deepEqual(tuning.stages[0].tiers, []);
  assert.deepEqual(tuning.stages[1].tiers, []);
  for (const stage of tuning.stages) {
    assert.ok(stage.missions.length > 0);
    for (const id of stage.missions) assert.ok(order(id) >= 0, id);
    assert.ok(Number.isInteger(stage.coins) && stage.coins >= 0);
    assert.ok(Object.isFrozen(stage) && Object.isFrozen(stage.missions));
  }
  for (const id of tuning.excluded) assert.ok(capriceById(id), id);
  assert.ok(Object.isFrozen(tuning) && Object.isFrozen(tuning.stages));
  assert.ok(Object.isFrozen(VOYAGE_TUNINGS));
  assert.ok(tuning.kingHp >= 6 && tuning.kingHp <= 10);
  assert.throws(() => ((tuning as { kingHp: number }).kingHp = 9), TypeError);
});

test('a table with no way through draws nothing; another table draws another voyage', () => {
  const stuck = freezeTuning({
    ...tuning,
    stages: [tuning.stages[4], tuning.stages[0], ...tuning.stages.slice(2)],
  });
  assert.deepEqual(voyageRoutes(stuck), []);
  assert.equal(drawVoyage(7, stuck), null);
  const gentle = freezeTuning({
    ...tuning,
    stages: tuning.stages.map((stage) => ({ ...stage, tiers: [] })),
  });
  const plan = drawVoyage(7, gentle) as VoyagePlan;
  assert.ok(plan.stages.every((stage) => stageCaprice(stage) === null));
  assert.equal(plan.tuning, gentle);
});
