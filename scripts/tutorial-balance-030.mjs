import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import { LANES, laneDefense } from '../src/ai.ts';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  out = resolve(root, 'reports/tutorial-0.30');
const seeds = [20261108, 104729, 831947, 2026, 65537, 4294967294],
  bots = ['methodical', 'casual', 'novice'],
  dt = 1 / 30;
const sha = (b) => createHash('sha256').update(b).digest('hex');
function manifest() {
  const seen = new Set();
  function visit(p) {
    p = resolve(p);
    if (seen.has(p)) return;
    seen.add(p);
    for (const m of readFileSync(p, 'utf8').matchAll(
      /(?:from\s*|import\s*)['"](\.[^'"]+\.ts)['"]/g,
    ))
      visit(resolve(dirname(p), m[1]));
  }
  visit(resolve(root, 'src/game.ts'));
  return [...seen].sort().map((p) => ({ file: relative(root, p), sha256: sha(readFileSync(p)) }));
}
const before = manifest(),
  records = [],
  started = performance.now();
function random(seed) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
}
function play(run, bot) {
  const g = new Game(run.seed, undefined, run),
    roll = random(run.seed ^ 0x9e3779b9);
  const r = {
    run,
    bot,
    rules: run.rules ?? 1,
    status: null,
    base: 100,
    minBase: 100,
    seconds: 0,
    spent: 0,
    deaths: 0,
    purchases: {},
    waves: [],
    illegalThreats: 0,
    timeout: false,
  };
  function buy(kind) {
    if (!g.isUnlocked(kind) || g.gold < g.recruitCost(kind)) return false;
    let points = [];
    if (bot === 'methodical') {
      const scores = laneDefense(g.units),
        lanes = [...g.enemyLanes].sort((a, b) => scores[a] - scores[b] || a - b);
      for (const lane of lanes)
        for (const x of ['medic', 'nurse', 'archer'].includes(kind)
          ? [960, 888, 816, 744, 672]
          : [660, 732, 804, 876, 948])
          for (const shift of [0, -36, 36]) points.push({ x, y: LANES[lane] + shift });
    } else if (bot === 'novice')
      for (let i = 0; i < 30; i++)
        points.push({ x: 900 + (i % 3) * 30, y: 264 + Math.floor(i / 3) * 24 });
    else
      for (let i = 0; i < 70; i++)
        points.push({
          x: 612 + Math.floor(roll() * 16) * 24,
          y: 132 + Math.floor(roll() * 17) * 24,
        });
    for (const p of points) {
      const gold = g.gold;
      if (g.recruit(kind, p.x, p.y)) {
        r.spent += gold - g.gold;
        r.purchases[kind] = (r.purchases[kind] ?? 0) + 1;
        return true;
      }
    }
    return false;
  }
  while (g.status === 'preparing') {
    if (bot === 'methodical') {
      if (g.base <= 65 && g.repair()) r.spent += 80;
      if (!g.units.some((u) => u.kind === 'medic')) buy('medic');
      for (let i = 0; i < 12; i++) {
        const pool = ['archer', 'club', 'ninja'];
        const options = pool.slice(i % 3).concat(pool.slice(0, i % 3));
        if (!options.some(buy)) break;
      }
    } else if (bot === 'casual') {
      for (let i = 0, n = 1 + Math.floor(roll() * 3); i < n; i++) {
        const pool = Object.keys(kinds).filter(
          (k) => k !== 'hero' && g.isUnlocked(k) && g.gold >= g.recruitCost(k),
        );
        if (pool.length) buy(pool[Math.floor(roll() * pool.length)]);
      }
    } else buy(['club', 'wall', 'nurse'][Math.floor(roll() * 3)]);
    for (let i = 0; i < (bot === 'methodical' ? 120 : 30); i++) g.step(dt);
    assert.ok(g.startWave());
    const lanes = g.enemyLanes;
    const usePower = bot === 'methodical' || (bot === 'casual' && roll() < 0.5);
    const scores = laneDefense(g.units),
      honey =
        bot === 'methodical'
          ? [...lanes].sort((a, b) => scores[a] - scores[b] || a - b)[0]
          : lanes[Math.floor(roll() * lanes.length)];
    let ticks = 0;
    while (g.status === 'fighting' && ticks < 9000) {
      if (usePower && ticks === 180) g.encourage();
      if (usePower && ticks === 240) g.offerFeast(honey, 'sticky');
      const ids = new Set(g.units.map((u) => u.id));
      g.step(dt);
      for (const u of g.units) ids.delete(u.id);
      r.deaths += ids.size;
      r.illegalThreats +=
        g.enemies.filter((e) => !lanes.includes(e.lane)).length +
        g.eggs.filter((e) => !lanes.includes(e.lane)).length;
      r.minBase = Math.min(r.minBase, g.base);
      ticks++;
      assert.ok(Number.isFinite(g.gold) && Number.isFinite(g.base));
    }
    r.seconds += ticks * dt;
    r.waves.push({
      wave: g.wave,
      seconds: ticks * dt,
      base: g.base,
      allies: g.units.length,
      lanes: [...lanes],
    });
    if (ticks >= 9000) {
      r.timeout = true;
      break;
    }
  }
  r.status = g.status;
  r.base = g.base;
  r.gold = g.gold;
  r.allies = g.units.length;
  r.kills = g.kills;
  r.hatched = g.hatched;
  return r;
}
for (const rules of [1, 2])
  for (const bot of bots) {
    for (const seed of seeds)
      for (let slot = 0; slot < 18; slot++) {
        const run = {
          missionId: 'refuge',
          seed,
          layout: slot % 3,
          assault: ['balanced', 'rush', 'escort'][Math.floor(slot / 3) % 3],
          nest: slot < 9 ? 'spread' : 'clustered',
          ...(rules === 2 ? { rules: 2 } : {}),
        };
        records.push(play(run, bot));
      }
    console.log(JSON.stringify({ rules, bot, completed: records.length }));
  }
assert.deepEqual(manifest(), before, 'Engine sources changed during simulation');
const groups = [];
for (const rules of [1, 2])
  for (const bot of bots) {
    const rows = records.filter((r) => r.rules === rules && r.bot === bot),
      mean = (k) => rows.reduce((s, r) => s + r[k], 0) / rows.length;
    groups.push({
      rules,
      bot,
      runs: rows.length,
      wins: rows.filter((r) => r.status === 'won').length,
      meanBase: mean('base'),
      minBase: Math.min(...rows.map((r) => r.minBase)),
      meanSeconds: mean('seconds'),
      meanSpent: mean('spent'),
      meanDeaths: mean('deaths'),
      timeouts: rows.filter((r) => r.timeout).length,
      illegalThreats: mean('illegalThreats'),
    });
  }
const report = {
  version: '0.30.0',
  command: 'npm run balance:tutorial',
  total: records.length,
  wallSeconds: (performance.now() - started) / 1000,
  sourceFiles: before,
  sourceHash: sha(JSON.stringify(before)),
  scriptHash: sha(readFileSync(fileURLToPath(import.meta.url))),
  method:
    '108 matched runs per policy and ruleset:18configurations×6seeds;3layouts×3assaults×2nests and3seeds per second-lane side. Bots use public commands only; independent deterministic bot RNG. Both groups share engine, budget/stats. Active-lane awareness for methodical; casual random placements; novice one cheap rear purchase; finite preparation and300s wave cap.',
  limits:
    'Descriptive paired simulations,6unique seeds reused across configurations, not independent child playtests. No automatic stat/budget tuning; does not establish campaign balance or enjoyment.',
  groups,
  records,
};
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'cohort-648.json'), JSON.stringify(report, null, 2) + '\n');
const table = groups
  .map(
    (g) =>
      `|${g.rules}|${g.bot}|${g.wins}/${g.runs}|${g.meanBase.toFixed(1)}|${g.minBase}|${g.meanSeconds.toFixed(1)}|${g.meanDeaths.toFixed(1)}|${g.meanSpent.toFixed(0)}|`,
  )
  .join('\n');
writeFileSync(
  resolve(out, 'BILAN.md'),
  `# Tutoriel —648 parties appariées\n\n${report.method}\n\n|Règles|Stratégie|Victoires|Cristal moyen|Minimum|Secondes|Pertes|Dépenses|\n|---|---|---|---|---|---|---|---|\n${table}\n\n${report.limits}\n\nSources SHA256 : ${report.sourceHash}. Versions1=historique,2=tutoriel.\n`,
);
console.log(JSON.stringify({ groups, total: records.length, wallSeconds: report.wallSeconds }));
assert.equal(records.length, 648);
assert.ok(groups.every((g) => g.runs === 108 && g.timeouts === 0 && g.illegalThreats === 0));
