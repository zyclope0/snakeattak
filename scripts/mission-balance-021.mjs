import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { Game } from '../src/game.ts';
import { MISSIONS } from '../src/missions.ts';
import { kinds } from '../src/data.ts';
import { LANES, laneDefense } from '../src/ai.ts';

// Every bot uses public commands only. No unit, gold, health or wave mutation.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'reports/missions-0.21');
const SUFFIX = process.env.MISSION_COHORT_SUFFIX ?? '';
assert.match(SUFFIX, /^(?:-[a-z0-9]+(?:-[a-z0-9]+)*)?$/, 'Invalid MISSION_COHORT_SUFFIX');
const BASENAME = `cohort-324${SUFFIX}`;
const DT = 1 / 30;
const MAX_WAVE_TICKS = 300 * 30;
const BOTS = ['methodical', 'casual', 'novice'];
const ASSAULTS = ['balanced', 'rush', 'escort'];
const SEEDS = process.env.MISSION_COHORT_SEEDS
  ? process.env.MISSION_COHORT_SEEDS.split(',').map(Number)
  : [104729, 831947, 20261105];
assert.equal(SEEDS.length, 3, 'MISSION_COHORT_SEEDS needs three comma-separated uint32 seeds');
assert.ok(SEEDS.every((seed) => Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff));
assert.equal(new Set(SEEDS).size, 3, 'Cohort seeds must be distinct');
const REPRODUCE = `${SUFFIX ? `MISSION_COHORT_SUFFIX=${SUFFIX} ` : ''}${process.env.MISSION_COHORT_SEEDS ? `MISSION_COHORT_SEEDS=${SEEDS.join(',')} ` : ''}node --experimental-strip-types scripts/mission-balance-021.mjs`;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
function sourceManifest() {
  const seen = new Set();
  function visit(path) {
    path = resolve(path);
    if (seen.has(path)) return;
    seen.add(path);
    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+\.ts)['"]/g))
      visit(resolve(dirname(path), match[1]));
  }
  visit(resolve(ROOT, 'src/game.ts'));
  return [...seen]
    .sort()
    .map((path) => ({ path: relative(ROOT, path), sha256: sha(readFileSync(path)) }));
}
const beforeManifest = sourceManifest();
function random(seed) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
}
function recruit(game, kind, bot, roll, record) {
  if (!game.isUnlocked(kind) || game.gold < game.recruitCost(kind)) return false;
  const candidates = [];
  if (bot === 'novice') {
    // A legal but weak formation at the rear, clustered around the middle lane.
    for (let index = 0; index < 24; index++)
      candidates.push({ x: 900 + (index % 3) * 36, y: 276 + Math.floor(index / 3) * 30 });
  } else if (bot === 'casual') {
    for (let index = 0; index < 80; index++)
      candidates.push({
        x: 612 + Math.floor(roll() * 16) * 24,
        y: 132 + Math.floor(roll() * 17) * 24,
      });
  } else {
    const scores = laneDefense(game.units);
    const lanes = [0, 1, 2].sort((a, b) => scores[a] - scores[b] || a - b);
    const rear = ['archer', 'dragon', 'tank', 'medic', 'nurse'].includes(kind);
    for (const lane of lanes)
      for (const x of rear ? [924, 852, 780, 708, 636] : [660, 732, 804, 876, 948])
        for (const offset of [0, -48, 48]) candidates.push({ x, y: LANES[lane] + offset });
  }
  for (const point of candidates) {
    record.placementAttempts++;
    const gold = game.gold;
    if (!game.recruit(kind, point.x, point.y)) continue;
    record.spent += gold - game.gold;
    record.purchases[kind] = (record.purchases[kind] ?? 0) + 1;
    return true;
  }
  return false;
}
function prepare(game, bot, roll, record) {
  if (bot !== 'novice' && game.base <= 65 && game.repair()) {
    record.repairs++;
    record.spent += 80;
  }
  const buy = (kind) => recruit(game, kind, bot, roll, record);
  if (bot === 'methodical') {
    if (
      game.units.filter((unit) => unit.kind === 'medic').length <
      Math.min(2, 1 + Math.floor(game.wave / 2))
    )
      buy('medic');
    const pool = ['archer', 'shield', 'ninja', 'dragon', 'knight', 'cavalry', 'twohead'];
    for (let index = 0; index < 14; index++) {
      const offset = (game.wave + index) % pool.length;
      const options = [...pool.slice(offset), ...pool.slice(0, offset)].filter(
        (kind) => game.isUnlocked(kind) && game.gold >= kinds[kind].cost,
      );
      if (!options.some(buy)) break;
    }
  } else if (bot === 'casual') {
    for (let index = 0, count = 1 + Math.floor(roll() * 3); index < count; index++) {
      const options = Object.keys(kinds).filter(
        (kind) => kind !== 'hero' && game.isUnlocked(kind) && game.gold >= kinds[kind].cost,
      );
      if (!options.length) break;
      buy(options[Math.floor(roll() * options.length)]);
    }
  } else {
    const options = ['club', 'archer', 'shield', 'bat', 'raptor'].filter((kind) =>
      game.isUnlocked(kind),
    );
    buy(options[Math.floor(roll() * options.length)]);
  }
  // Preparation is short and finite; no waiting indefinitely for free full healing.
  for (let tick = 0; tick < (bot === 'methodical' ? 120 : 30); tick++) game.step(DT);
}
function play(mission, missionIndex, slot, bot) {
  const layout = slot % 3;
  const assault = ASSAULTS[Math.floor(slot / 3) % 3];
  const nest = slot < 9 ? 'spread' : 'clustered';
  // A fixed shuffled assignment decouples seeds from layout, assault and nest.
  const seedOrder = [2, 0, 1, 1, 2, 0, 0, 1, 2, 1, 0, 2, 2, 1, 0, 0, 2, 1];
  const seed = (SEEDS[seedOrder[slot]] + missionIndex * 1009) >>> 0;
  const run = { missionId: mission.id, seed, layout, assault, nest };
  const game = new Game(seed, undefined, run);
  const roll = random(seed ^ 0x9e3779b9);
  const started = performance.now();
  const record = {
    mission: mission.id,
    bot,
    slot,
    run,
    initialBudget: mission.budget,
    status: 'running',
    wave: 0,
    activeSeconds: 0,
    preparationSeconds: 0,
    baseEnd: 100,
    minBase: 100,
    stars: 0,
    kills: 0,
    hatched: 0,
    deaths: 0,
    deathKinds: {},
    purchases: {},
    spent: 0,
    repairs: 0,
    goldEnd: 0,
    placementAttempts: 0,
    timeout: false,
    error: null,
    waves: [],
    wallMs: 0,
  };
  try {
    while (game.status === 'preparing') {
      prepare(game, bot, roll, record);
      record.preparationSeconds += bot === 'methodical' ? 4 : 1;
      assert.equal(game.startWave(), true);
      const waveRank = game.difficultyWave;
      let ticks = 0;
      const beforeDeaths = record.deaths;
      const beforeKills = game.kills;
      const honeyLane =
        bot === 'methodical'
          ? laneDefense(game.units).reduce(
              (best, score, lane, scores) => (score < scores[best] ? lane : best),
              0,
            )
          : Math.floor(roll() * 3);
      const useCasualPowers = bot === 'casual' && roll() < 0.5;
      while (game.status === 'fighting' && ticks < MAX_WAVE_TICKS) {
        if ((bot === 'methodical' || useCasualPowers) && ticks === 180) game.encourage();
        if ((bot === 'methodical' || useCasualPowers) && ticks === 240)
          game.offerFeast(honeyLane, 'sticky');
        const before = new Map(game.units.map((unit) => [unit.id, unit.kind]));
        game.step(DT);
        const live = new Set(game.units.map((unit) => unit.id));
        for (const [id, kind] of before)
          if (!live.has(id)) {
            record.deaths++;
            record.deathKinds[kind] = (record.deathKinds[kind] ?? 0) + 1;
          }
        assert.ok(Number.isFinite(game.base) && Number.isFinite(game.gold));
        ticks++;
      }
      record.activeSeconds += ticks * DT;
      record.waves.push({
        wave: game.wave,
        rank: waveRank,
        seconds: ticks * DT,
        base: game.base,
        deaths: record.deaths - beforeDeaths,
        kills: game.kills - beforeKills,
        enemiesRemaining: game.enemies.length,
        eggsRemaining: game.eggs.length,
        pendingSpawns: game.remaining,
      });
      if (game.status === 'fighting') {
        record.timeout = true;
        break;
      }
    }
  } catch (error) {
    record.error = String(error?.stack ?? error);
  }
  Object.assign(record, {
    status: game.status,
    wave: game.wave,
    baseEnd: game.base,
    minBase: game.missionMinBase,
    stars: game.missionStars,
    kills: game.kills,
    hatched: game.hatched,
    goldEnd: game.gold,
    wallMs: performance.now() - started,
  });
  return record;
}
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
function summarize(records) {
  return {
    runs: records.length,
    won: records.filter((record) => record.status === 'won').length,
    lost: records.filter((record) => record.status === 'lost').length,
    errors: records.filter((record) => record.error).length,
    timeouts: records.filter((record) => record.timeout).length,
    meanSeconds: mean(records.map((record) => record.activeSeconds)),
    minSeconds: Math.min(...records.map((record) => record.activeSeconds)),
    maxSeconds: Math.max(...records.map((record) => record.activeSeconds)),
    meanBase: mean(records.map((record) => record.baseEnd)),
    minBase: Math.min(...records.map((record) => record.minBase)),
    meanDeaths: mean(records.map((record) => record.deaths)),
    meanSpent: mean(records.map((record) => record.spent)),
    meanGoldEnd: mean(records.map((record) => record.goldEnd)),
  };
}
const started = performance.now();
const records = [];
for (const [index, mission] of MISSIONS.entries()) {
  for (let slot = 0; slot < 18; slot++)
    for (const bot of BOTS) records.push(play(mission, index, slot, bot));
  console.log(
    `${mission.id}: ${JSON.stringify(summarize(records.filter((record) => record.mission === mission.id)))}`,
  );
}
assert.equal(records.length, 324);
assert.deepEqual(sourceManifest(), beforeManifest, 'Engine sources changed during measurement');
const byMissionBot = MISSIONS.flatMap((mission) =>
  BOTS.map((bot) => ({
    mission: mission.id,
    bot,
    ...summarize(records.filter((record) => record.mission === mission.id && record.bot === bot)),
  })),
);
const byConfiguration = Array.from({ length: 18 }, (_, slot) => ({
  slot,
  layout: slot % 3,
  assault: ASSAULTS[Math.floor(slot / 3) % 3],
  nest: slot < 9 ? 'spread' : 'clustered',
  ...summarize(records.filter((record) => record.slot === slot)),
}));
const report = {
  version: 1,
  method: {
    command: REPRODUCE,
    dt: DT,
    maxWaveSeconds: 300,
    missions: 6,
    configurationsPerMission: 18,
    bots: BOTS,
    seeds: SEEDS,
    pairing:
      'Same mission/configuration seed across all bots; fixed shuffled assignment across factors, one seed per mission/configuration.',
    limitations:
      'Descriptive simulations of three scripted policies; no statistical independence across paired bots, no exhaustive seed coverage and no claim about children’s enjoyment.',
    bots: {
      methodical:
        'Spends all affordable gold, distributes fighters by lane defense, one then two medics, 4s preparation, encouragement and sticky honey.',
      casual:
        '1–3 random unlocked affordable purchases per wave, random legal positions, 1s preparation, 50% of waves use powers.',
      novice:
        'One inexpensive random unlocked purchase per wave, clustered rear positions, 1s preparation, no healing policy or powers.',
    },
  },
  sourceHash: sha(JSON.stringify(beforeManifest)),
  scriptHash: sha(readFileSync(fileURLToPath(import.meta.url))),
  sourceFiles: beforeManifest,
  wallMs: performance.now() - started,
  total: summarize(records),
  byMissionBot,
  byConfiguration,
  records,
};
mkdirSync(OUT, { recursive: true });
writeFileSync(resolve(OUT, `${BASENAME}.json`), JSON.stringify(report, null, 2) + '\n');
const rows = byMissionBot
  .map(
    (row) =>
      `| ${row.mission} | ${row.bot} | ${row.won}/${row.runs} | ${row.minBase} | ${row.meanSeconds.toFixed(1)} (${row.minSeconds.toFixed(0)}–${row.maxSeconds.toFixed(0)}) | ${row.meanDeaths.toFixed(1)} | ${row.meanSpent.toFixed(0)} | ${row.meanGoldEnd.toFixed(0)} |`,
  )
  .join('\n');
const markdown = `# Missions 0.21 — cohorte descriptive de 324 parties${SUFFIX}\n\nCommande : \`${REPRODUCE}\`. Chaque mission couvre les 18 configurations réelles et les trois politiques. Les graines sont identiques entre politiques pour comparer les achats, et distribuées selon une permutation fixe entre configurations. Une seule graine par couple mission/configuration : les écarts ne séparent pas statistiquement terrain, plan et hasard.\n\nAucune mutation privée : achats, préparation, vagues, réparation, encouragement et miel passent par Game public. Durée plafonnée à 300 s par vague. Les unités mortes sont observées par disparition d’identité. Le contrôle dépense efficacement et soigne ; casual achète 1–3 unités au hasard ; novice achète une unité peu chère et groupe ses achats à l’arrière sans pouvoirs.\n\n| Mission | Politique | Victoires | Cristal minimum | Secondes moy. (min–max) | Pertes moy. | Dépenses moy. | Or final moy. |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n${rows}\n\nErreurs : ${report.total.errors}. Délais dépassés : ${report.total.timeouts}. Durée totale de calcul : ${(report.wallMs / 1000).toFixed(1)} s. JSON détaillé : \`${BASENAME}.json\`, avec achats par type, vagues, pertes, morts, apparitions restantes et métriques par configuration.\n\nEmpreinte des sources : \`${report.sourceHash}\`. Les sources ont été vérifiées identiques avant et après mesure. Aucun ajustement de budget automatique. Ces bots ne prouvent ni le plaisir des enfants, ni une difficulté universelle.\n`;
writeFileSync(resolve(OUT, `${BASENAME}.md`), markdown);
console.log(
  JSON.stringify({ total: report.total, sourceHash: report.sourceHash, out: relative(ROOT, OUT) }),
);
if (report.total.errors || report.total.timeouts) process.exitCode = 1;
