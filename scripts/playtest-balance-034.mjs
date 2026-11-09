import { Game } from '../src/game.ts';
import { MISSIONS, createMissionRun } from '../src/missions.ts';
import { LANES, laneDefense } from '../src/ai.ts';
import { kinds } from '../src/data.ts';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const folder = 'reports/playtest-0.34.1',
  started = performance.now(),
  games = [],
  dt = 1 / 30;
await mkdir(folder, { recursive: true });
const files = (await readdir('src')).filter((n) => n.endsWith('.ts')).sort(),
  digest = createHash('sha256');
for (const n of files) {
  digest.update(n);
  digest.update(await readFile('src/' + n));
}
const sourceSha256 = digest.digest('hex');
function play(run, profile) {
  const g = new Game(run.seed, undefined, run),
    r = {
      run,
      profile,
      status: null,
      base: 100,
      minBase: 100,
      gold: 0,
      deaths: 0,
      purchases: {},
      waves: [],
      honey: 0,
      encouragement: 0,
      seconds: 0,
    };
  function buy(kind) {
    if (!g.isUnlocked(kind) || g.gold < g.recruitCost(kind)) return false;
    const scores = laneDefense(g.units),
      lanes = [0, 1, 2].sort((a, b) => scores[a] - scores[b] || a - b);
    const rear = ['archer', 'medic', 'nurse', 'dragon'].includes(kind);
    for (const lane of lanes)
      for (const x of rear
        ? [900, 948, 852, 804, 756, 708, 660]
        : [660, 708, 756, 804, 852, 900, 948])
        for (const offset of [0, -48, 48]) {
          if (g.recruit(kind, x, LANES[lane] + offset)) {
            r.purchases[kind] = (r.purchases[kind] ?? 0) + 1;
            return true;
          }
        }
    return false;
  }
  function step() {
    const count = g.units.length;
    g.step(dt);
    r.deaths += Math.max(0, count - g.units.length);
    r.minBase = Math.min(r.minBase, g.base);
  }
  for (let wave = 1; wave <= g.totalWaves; wave++) {
    if (profile === 'mixed') {
      if (!g.units.some((u) => ['medic', 'nurse'].includes(u.kind)))
        buy(g.isUnlocked('medic') ? 'medic' : 'nurse');
      for (let i = 0; i < 16; i++)
        if (
          !['archer', 'shield', 'club']
            .slice(i % 3)
            .concat(['archer', 'shield', 'club'].slice(0, i % 3))
            .some(buy)
        )
          break;
    } else if (profile === 'ranged') {
      for (let i = 0; i < 20; i++)
        if (!buy('archer')) {
          buy('club');
          break;
        }
    } else if (profile === 'healers')
      for (let i = 0; i < 20; i++) if (!buy(g.isUnlocked('medic') ? 'medic' : 'nurse')) break;
    for (let i = 0; i < 90; i++) step();
    if (!g.startWave()) throw Error('Unexpected blocked start');
    const t = g.time,
      w = {
        wave,
        rank: g.difficultyWave,
        firstContact: null,
        seconds: 0,
        baseStart: g.base,
        deathsStart: r.deaths,
        peakArmy: g.units.length,
        peakEnemies: 0,
        idleSamples: 0,
        samples: 0,
      };
    let tick = 0;
    while (g.status === 'fighting' && g.time - t < 180) {
      step();
      tick++;
      w.peakArmy = Math.max(w.peakArmy, g.units.length);
      w.peakEnemies = Math.max(w.peakEnemies, g.enemies.length);
      const fighting =
        g.units.some((u) => u.state === 'attack') || g.enemies.some((e) => e.state === 'attack');
      if (w.firstContact === null && fighting) w.firstContact = g.time - t;
      if (tick % 30 === 0) {
        w.samples++;
        if (!fighting) w.idleSamples++;
      }
      if (
        ['mixed', 'ranged'].includes(profile) &&
        !g.feastUsed &&
        g.enemies.some((e) => e.x > 570)
      ) {
        const e = g.enemies.find((e) => e.x > 570);
        if (g.offerFeast(e.lane, 'sticky')) r.honey++;
      }
      if (profile === 'mixed' && !g.encouragementUsed && fighting && g.encourage())
        r.encouragement++;
    }
    w.seconds = g.time - t;
    w.baseEnd = g.base;
    w.deaths = r.deaths - w.deathsStart;
    delete w.deathsStart;
    r.waves.push(w);
    r.seconds += w.seconds;
    if (g.status === 'fighting') {
      r.status = 'timeout';
      break;
    }
    if (g.status === 'lost') break;
  }
  r.status ??= g.status;
  r.base = g.base;
  r.gold = g.gold;
  r.stars = g.missionStars;
  r.survivors = g.units.length;
  return r;
}
for (const [mi, mission] of MISSIONS.entries())
  for (const layout of [0, 1, 2])
    for (const assault of ['balanced', 'rush', 'escort'])
      for (const nest of ['spread', 'clustered']) {
        const seed = (20261109 + mi * 104729 + layout * 997) >>> 0,
          run = { ...createMissionRun(mission.id, seed), layout, assault, nest };
        for (const profile of ['mixed', 'ranged', 'healers', 'none'])
          games.push(play(run, profile));
        if (games.length % 24 === 0)
          console.log(
            JSON.stringify({
              completed: games.length,
              expected: 432,
              wallSeconds: (performance.now() - started) / 1000,
            }),
          );
      }
const aggregate = (set) => ({
  games: set.length,
  wins: set.filter((g) => g.status === 'won').length,
  losses: set.filter((g) => g.status === 'lost').length,
  timeouts: set.filter((g) => g.status === 'timeout').length,
  meanBase: set.reduce((n, g) => n + g.base, 0) / set.length,
  meanDeaths: set.reduce((n, g) => n + g.deaths, 0) / set.length,
  meanCombatSeconds: set.reduce((n, g) => n + g.seconds, 0) / set.length,
  meanGold: set.reduce((n, g) => n + g.gold, 0) / set.length,
});
const summary = {
  version: '0.34.1',
  sourceSha256,
  method:
    'Deterministic real engine at30Hz, not browser or child playtest;6missions x18configurations x4fixed strategies; profiles share seeds/configs, no repairs/training; mixed uses sticky/encouragement, ranged sticky; placements know weakest lane, so not human prediction',
  wallSeconds: (performance.now() - started) / 1000,
  total: games.length,
  overall: aggregate(games),
  byMission: MISSIONS.map((m) => ({
    mission: m.id,
    ...aggregate(games.filter((g) => g.run.missionId === m.id)),
    profiles: ['mixed', 'ranged', 'healers', 'none'].map((p) => ({
      profile: p,
      ...aggregate(games.filter((g) => g.run.missionId === m.id && g.profile === p)),
    })),
  })),
  byProfile: ['mixed', 'ranged', 'healers', 'none'].map((p) => ({
    profile: p,
    ...aggregate(games.filter((g) => g.profile === p)),
  })),
};
await writeFile(folder + '/balance-games.json', JSON.stringify({ summary, games }, null, 2) + '\n');
await writeFile(folder + '/balance-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
