// Controlled transit measurements, deliberately NOT counted among fair campaigns.
// No defenders or eggs; force one entry lane and variant after the first normal spawn.
// Junction decisions, navigation, speed and base crossing use the production engine.
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { Game } from '../src/game.ts';
import { LANES } from '../src/ai.ts';
const DT = 1 / 30;
const runs = [];
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) / 2)];
for (const wave of [1, 6, 12]) {
  for (const variant of ['normal', 'runner', 'armored']) {
    for (let lane = 0; lane < 3; lane++) {
      for (let i = 0; i < 20; i++) {
        const seed = (2026 + Math.imul(i + 1, 2654435761)) >>> 0;
        const g = new Game(seed);
        g.units = [];
        g.wave = wave - 1;
        g.startWave();
        g.step(DT);
        g.remaining = 0;
        g.eggs = [];
        const e = g.enemies[0];
        Object.assign(e, { x: 108, y: LANES[lane], lane, variant, path: [], nav: 0 });
        const started = g.time;
        let distance = 0,
          junctionSeconds = null,
          campSeconds = null,
          campDistance = null;
        while (g.status === 'fighting' && g.time - started < 180) {
          const { x, y } = e;
          g.step(DT);
          distance += Math.hypot(e.x - x, e.y - y);
          if (junctionSeconds === null && e.stage >= 1) junctionSeconds = g.time - started;
          if (campSeconds === null && e.x >= 600) {
            campSeconds = g.time - started;
            campDistance = distance;
          }
        }
        assert.equal(g.base, 91, 'Snake must cross the base without a stall');
        assert.equal(g.enemies.length, 0);
        assert.ok(campSeconds > junctionSeconds);
        runs.push({
          wave,
          variant,
          lane,
          seed,
          junctionSeconds,
          campSeconds,
          campDistance,
          baseSeconds: g.time - started,
          distance,
          reroutes: g.reroutes,
        });
      }
    }
  }
}
const summary = [];
for (const wave of [1, 6, 12])
  for (const variant of ['normal', 'runner', 'armored']) {
    const group = runs.filter((r) => r.wave === wave && r.variant === variant);
    summary.push({
      wave,
      variant,
      runs: group.length,
      medianJunctionSeconds: median(group.map((r) => r.junctionSeconds)),
      medianCampSeconds: median(group.map((r) => r.campSeconds)),
      medianBaseSeconds: median(group.map((r) => r.baseSeconds)),
      medianDistance: median(group.map((r) => r.distance)),
      minBaseSeconds: Math.min(...group.map((r) => r.baseSeconds)),
      maxBaseSeconds: Math.max(...group.map((r) => r.baseSeconds)),
    });
  }
await mkdir('reports', { recursive: true });
await writeFile(
  'reports/path-transit.json',
  JSON.stringify(
    {
      method: {
        controlledProbes: runs.length,
        fairCampaigns: false,
        noDefenders: true,
        noEggs: true,
        entryLanes: 3,
        pairedSeeds: 20,
        stepHz: 30,
        honey: false,
      },
      summary,
      runs,
    },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify(summary, null, 2));
