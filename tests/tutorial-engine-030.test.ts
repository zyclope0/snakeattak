import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun, missionWave } from '../src/missions.ts';
import { activeEnemyLanes } from '../src/tutorial.ts';
import { chooseLane } from '../src/ai.ts';
import { decideTemptation } from '../src/tactics.ts';

test('les voies progressent1/2/3, des deux côtés, sans effet sur les départs historiques', () => {
  const sides = new Set<number>();
  for (let seed = 0; seed < 12; seed++) {
    const run = createMissionRun('refuge', seed),
      g = new Game(seed, undefined, run),
      rng = g.rng;
    assert.deepEqual(activeEnemyLanes(run, 1), [1]);
    assert.equal(activeEnemyLanes(run, 2).length, 2);
    sides.add(activeEnemyLanes(run, 2).find((l) => l !== 1)!);
    assert.deepEqual(activeEnemyLanes(run, 3), [0, 1, 2]);
    for (let n = 0; n < 20; n++) assert.deepEqual(g.enemyLanes, [1]);
    assert.equal(g.rng, rng);
    const { rules, ...legacy } = run;
    for (let wave = 1; wave <= 3; wave++)
      assert.deepEqual(activeEnemyLanes(legacy, wave), [0, 1, 2]);
  }
  assert.deepEqual([...sides].sort(), [0, 2]);
});
test('les voies paisibles ne gagnent jamais le choix IA ni le miel', () => {
  for (let i = 0; i < 1000; i++) {
    assert.ok([0, 1].includes(chooseLane([20, 50, 0], 10, i / 1000, [0, 1])));
    const d = decideTemptation([20, 50, 0], 10, i / 1000, 2, false, [0, 1]);
    assert.ok([0, 1].includes(d.lane));
    assert.equal(d.tempted, false);
  }
  const g = new Game(2026, undefined, createMissionRun('refuge', 2026));
  g.startWave();
  assert.equal(g.offerFeast(0), false);
  assert.equal(g.feastUsed, false);
  assert.equal(g.offerFeast(1), true);
});
test('108 configurations : spawn, œufs et jonctions restent sur les voies actives', () => {
  for (const layout of [0, 1, 2] as const)
    for (const assault of ['balanced', 'rush', 'escort'] as const)
      for (const nest of ['spread', 'clustered'] as const)
        for (let seed = 0; seed < 6; seed++) {
          const run = { ...createMissionRun('refuge', seed), layout, assault, nest };
          const { rules, ...legacy } = run;
          for (let wave = 1; wave <= 3; wave++) {
            const plan = missionWave(run, wave),
              old = missionWave(legacy, wave);
            assert.deepEqual(plan.stats, old.stats);
            assert.deepEqual(plan.composition, old.composition);
            assert.deepEqual(plan.cadence, old.cadence);
            assert.equal(plan.eggs.length, 1);
            assert.equal(plan.eggs[0].count, 2);
            const g = new Game(seed, undefined, run);
            g.wave = wave - 1;
            g.units = [];
            g.startWave();
            const lanes = g.enemyLanes;
            let ticks = 0,
              seen = 0;
            const ids = new Set<number>();
            assert.ok(g.eggs.every((e) => lanes.includes(e.lane)));
            while (g.status === 'fighting' && ticks++ < 4500) {
              g.step(1 / 30);
              for (const e of g.enemies) {
                assert.ok(lanes.includes(e.lane), `inactive lane${e.lane} wave${wave}`);
                ids.add(e.id);
              }
              seen = Math.max(seen, g.hatched);
            }
            assert.ok(ticks < 4500, 'Finite wave');
            assert.equal(seen, 2);
            assert.equal(ids.size, plan.stats.count + 2);
          }
        }
});
