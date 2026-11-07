import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

// Commands mutate Game exclusively through its public player API. State is read only.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = resolve(
  process.env.TACTICAL_BASELINE ?? '/workspace/conquete-serpents-baseline-0.21',
);
const STAGE = process.env.TACTICAL_STAGE ?? 'discovery';
assert.ok(['discovery', 'holdout'].includes(STAGE));
const MODE = process.env.TACTICAL_MODE ?? 'all';
assert.ok(['missions', 'classic', 'all', 'smoke'].includes(MODE));
const OUT = resolve(ROOT, `reports/balance-0.22/${STAGE}`);
const DT = 1 / 30;
const MAX_WAVE_TICKS = 300 * 30;
const ASSAULTS = ['balanced', 'rush', 'escort'];
const MISSION_BOTS =
  STAGE === 'holdout' ? ['methodical', 'casual'] : ['methodical', 'casual', 'novice'];
const CLASSIC_BOTS = ['mixed', 'melee', 'ranged', 'casual'];
const MISSION_SEEDS =
  STAGE === 'discovery' ? [104729, 831947, 20261105] : [15485863, 32452843, 49979687];
const CLASSIC_SEEDS = Array.from(
  { length: 16 },
  (_, i) => (0x22002026 + Math.imul((STAGE === 'discovery' ? 0 : 32) + i + 1, 2654435761)) >>> 0,
);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
function manifest(root) {
  const seen = new Set();
  function visit(path) {
    path = resolve(path);
    if (seen.has(path)) return;
    seen.add(path);
    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+\.ts)['"]/g))
      visit(resolve(dirname(path), match[1]));
  }
  visit(resolve(root, 'src/game.ts'));
  return [...seen]
    .sort()
    .map((path) => ({ path: relative(root, path), sha256: sha(readFileSync(path)) }));
}
const engines = [];
for (const [version, root] of [
  ['0.21', BASELINE],
  ['0.22', ROOT],
]) {
  const before = manifest(root);
  const [{ Game }, { MISSIONS }, { kinds }, { LANES, laneDefense }] = await Promise.all(
    ['game', 'missions', 'data', 'ai'].map(
      (name) => import(pathToFileURL(resolve(root, `src/${name}.ts`)).href),
    ),
  );
  engines.push({ version, root, before, Game, MISSIONS, kinds, LANES, laneDefense });
}
const scriptHashBefore = sha(readFileSync(fileURLToPath(import.meta.url)));
const random = (seed) => {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
};
const antiAir = (kind) => ['archer', 'dragon', 'tank'].includes(kind);
const actualFlying = (entity) =>
  entity.kind === 'snake' && entity.variant === 'flying' && !entity.boss;
const controlled = (bot) => ['methodical', 'mixed', 'melee', 'ranged'].includes(bot);
function recruit(engine, game, kind, bot, roll, record) {
  if (!game.isUnlocked(kind) || game.gold < game.recruitCost(kind)) return false;
  const candidates = [];
  if (bot === 'novice') {
    for (let i = 0; i < 24; i++)
      candidates.push({ x: 900 + (i % 3) * 36, y: 276 + Math.floor(i / 3) * 30 });
  } else if (bot === 'casual') {
    for (let i = 0; i < 80; i++)
      candidates.push({
        x: 612 + Math.floor(roll() * 16) * 24,
        y: 132 + Math.floor(roll() * 17) * 24,
      });
  } else {
    const scores = engine.laneDefense(
      antiAir(kind) ? game.units.filter((u) => antiAir(u.kind)) : game.units,
    );
    const lanes = [0, 1, 2].sort((a, b) => scores[a] - scores[b] || a - b);
    if (['medic', 'nurse'].includes(kind)) {
      const support = engine.LANES.map(
        (y) =>
          game.units.filter(
            (u) => ['medic', 'nurse'].includes(u.kind) && Math.abs(u.homeY - y) < 60,
          ).length,
      );
      const medicalLanes = [...lanes].sort(
        (a, b) => support[a] - support[b] || scores[a] - scores[b] || a - b,
      );
      for (const lane of medicalLanes)
        for (const x of [924, 948, 972, 900])
          for (const offset of [0, -48, 48]) candidates.push({ x, y: engine.LANES[lane] + offset });
    } else {
      for (const lane of lanes)
        for (const x of antiAir(kind) ? [852, 924, 780, 708, 636] : [660, 732, 804, 876, 948])
          for (const offset of [0, -48, 48]) candidates.push({ x, y: engine.LANES[lane] + offset });
    }
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
function prepare(engine, game, bot, roll, record, sample) {
  if (game.rewardOffer?.length) game.skipReward();
  if (bot !== 'novice' && game.base <= 65 && game.repair()) {
    record.repairs++;
    record.spent += 80;
  }
  const buy = (kind) => recruit(engine, game, kind, bot, roll, record);
  if (controlled(bot)) {
    // A mixed controller reads the briefing rank and actually buys the advertised counters.
    if (bot !== 'melee' && game.difficultyWave >= 6)
      for (let i = game.units.filter((u) => antiAir(u.kind)).length; i < 3; i++)
        if (!buy('archer')) break;
    if (
      game.units.filter((u) => u.kind === 'medic').length <
      Math.min(2, 1 + Math.floor(game.wave / 2))
    )
      buy('medic');
    const pool =
      bot === 'melee'
        ? ['shield', 'ninja', 'knight', 'cavalry', 'twohead', 'dino']
        : bot === 'ranged'
          ? ['archer', 'dragon', 'tank']
          : ['archer', 'shield', 'ninja', 'dragon', 'knight', 'cavalry', 'twohead'];
    for (let i = 0; i < 14; i++) {
      const offset = (game.wave + i) % pool.length;
      const options = [...pool.slice(offset), ...pool.slice(0, offset)].filter(
        (kind) => game.isUnlocked(kind) && game.gold >= game.recruitCost(kind),
      );
      if (!options.some(buy)) break;
    }
  } else if (bot === 'casual') {
    for (let i = 0, n = 1 + Math.floor(roll() * 3); i < n; i++) {
      const options = Object.keys(engine.kinds).filter(
        (kind) => kind !== 'hero' && game.isUnlocked(kind) && game.gold >= game.recruitCost(kind),
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
  const seconds = record.mode === 'classic' ? (controlled(bot) ? 10 : 3) : controlled(bot) ? 4 : 1;
  for (let tick = 0; tick < seconds * 30; tick++) sample();
  record.preparationSeconds += seconds;
}
function play(engine, job) {
  const game = new engine.Game(job.seed, undefined, job.run);
  const roll = random(job.seed ^ 0x9e3779b9);
  const start = performance.now();
  const record = {
    version: engine.version,
    ...job,
    status: 'running',
    wave: 0,
    activeSeconds: 0,
    preparationSeconds: 0,
    baseEnd: 100,
    minBase: 100,
    stars: 0,
    kills: 0,
    deaths: 0,
    deathKinds: {},
    purchases: {},
    spent: 0,
    repairs: 0,
    goldEnd: 0,
    placementAttempts: 0,
    flyingSeen: 0,
    flyingKills: 0,
    flyingEscaped: 0,
    supplyReturns: 0,
    supplyRefills: 0,
    bandagesUsed: 0,
    injuredSurvivors: 0,
    survivors: 0,
    bossSeen: false,
    bossKilled: false,
    headKills: { guard: 0, ranged: 0, hybrid: 0 },
    courtSeen: { guard: 0, healer: 0 },
    courtKills: { guard: 0, healer: 0 },
    courtHeals: 0,
    timeout: false,
    error: null,
    waves: [],
    wallMs: 0,
  };
  const enemySeen = new Set();
  function observeEntities() {
    for (const enemy of game.enemies)
      if (!enemySeen.has(enemy.id)) {
        enemySeen.add(enemy.id);
        if (actualFlying(enemy)) record.flyingSeen++;
        if (enemy.boss) record.bossSeen = true;
        if (enemy.court) record.courtSeen[enemy.court.role]++;
      }
  }
  function sample() {
    observeEntities();
    const units = game.units.map((u) => ({
      id: u.id,
      kind: u.kind,
      phase: u.medical?.phase,
      bandages: u.medical?.bandages,
    }));
    const enemies = game.enemies.map((e) => ({
      entity: e,
      id: e.id,
      variant: e.variant,
      flying: actualFlying(e),
      boss: e.boss,
      court: e.court?.role,
      charges: e.court?.charges,
      heads:
        e.bossState?.heads &&
        Object.fromEntries(Object.entries(e.bossState.heads).map(([id, head]) => [id, head.hp])),
    }));
    game.step(DT);
    record.minBase = Math.min(record.minBase, game.base);
    const liveUnits = new Map(game.units.map((u) => [u.id, u]));
    for (const before of units) {
      const after = liveUnits.get(before.id);
      if (!after) {
        record.deaths++;
        record.deathKinds[before.kind] = (record.deathKinds[before.kind] ?? 0) + 1;
        continue;
      }
      if (before.phase === 'ready' && after.medical?.phase === 'returning') record.supplyReturns++;
      if (before.phase === 'restocking' && after.medical?.phase === 'ready') record.supplyRefills++;
      if (
        before.bandages !== undefined &&
        after.medical &&
        after.medical.bandages < before.bandages
      )
        record.bandagesUsed += before.bandages - after.medical.bandages;
    }
    const liveEnemies = new Set(game.enemies.map((e) => e.id));
    for (const before of enemies) {
      // Game marks an escape with maxHp=0; a combat kill retains maxHp>0.
      const enemy = before.entity;
      if (!liveEnemies.has(before.id)) {
        if (before.flying) record[enemy.maxHp > 0 ? 'flyingKills' : 'flyingEscaped']++;
        if (enemy.hp <= 0 && enemy.maxHp > 0 && before.court) record.courtKills[before.court]++;
        if (enemy.hp <= 0 && enemy.maxHp > 0 && before.boss) record.bossKilled = true;
      }
      if (before.heads)
        for (const [id, hp] of Object.entries(before.heads))
          if (hp > 0 && enemy.bossState.heads[id].hp <= 0) record.headKills[id]++;
      if (before.court === 'healer' && enemy.court.charges < before.charges)
        record.courtHeals += before.charges - enemy.court.charges;
    }
    observeEntities();
    assert.ok(Number.isFinite(game.base) && Number.isFinite(game.gold));
  }
  try {
    while (game.status === 'preparing') {
      prepare(engine, game, job.bot, roll, record, sample);
      assert.equal(game.startWave(), true);
      const rank = game.difficultyWave;
      const deaths = record.deaths;
      const kills = game.kills;
      let ticks = 0;
      const honeyLane = controlled(job.bot)
        ? engine
            .laneDefense(game.units)
            .reduce((best, score, lane, scores) => (score < scores[best] ? lane : best), 0)
        : Math.floor(roll() * 3);
      const powers = controlled(job.bot) || (job.bot === 'casual' && roll() < 0.5);
      while (game.status === 'fighting' && ticks < MAX_WAVE_TICKS) {
        if (powers && ticks === 180) game.encourage();
        if (powers && ticks === 240) game.offerFeast(honeyLane, 'sticky');
        sample();
        ticks++;
      }
      record.activeSeconds += ticks * DT;
      record.waves.push({
        wave: game.wave,
        rank,
        seconds: ticks * DT,
        base: game.base,
        deaths: record.deaths - deaths,
        kills: game.kills - kills,
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
    stars: game.missionStars,
    kills: game.kills,
    goldEnd: game.gold,
    injuredSurvivors: game.units.filter((u) => u.hp > 0 && u.hp < u.maxHp).length,
    survivors: game.units.length,
    wallMs: performance.now() - start,
  });
  return record;
}
const mean = (items) => (items.length ? items.reduce((s, n) => s + n, 0) / items.length : 0);
function summarize(records) {
  return {
    runs: records.length,
    won: records.filter((r) => r.status === 'won').length,
    lost: records.filter((r) => r.status === 'lost').length,
    errors: records.filter((r) => r.error).length,
    timeouts: records.filter((r) => r.timeout).length,
    ...Object.fromEntries(
      [
        'baseEnd',
        'deaths',
        'activeSeconds',
        'spent',
        'goldEnd',
        'flyingSeen',
        'flyingKills',
        'flyingEscaped',
        'supplyReturns',
        'supplyRefills',
        'bandagesUsed',
        'injuredSurvivors',
        'survivors',
        'courtHeals',
      ].map((key) => [
        `mean${key[0].toUpperCase()}${key.slice(1)}`,
        mean(records.map((r) => r[key])),
      ]),
    ),
    bossSeen: records.filter((r) => r.bossSeen).length,
    bossKilled: records.filter((r) => r.bossKilled).length,
    headKills: Object.fromEntries(
      ['guard', 'ranged', 'hybrid'].map((id) => [
        id,
        records.reduce((sum, r) => sum + r.headKills[id], 0),
      ]),
    ),
    courtSeen: Object.fromEntries(
      ['guard', 'healer'].map((id) => [id, records.reduce((sum, r) => sum + r.courtSeen[id], 0)]),
    ),
    courtKills: Object.fromEntries(
      ['guard', 'healer'].map((id) => [id, records.reduce((sum, r) => sum + r.courtKills[id], 0)]),
    ),
  };
}
const started = performance.now();
const records = [];
const jobs = [];
if (MODE !== 'classic')
  for (const [index, mission] of engines[0].MISSIONS.entries())
    for (let slot = 0; slot < (MODE === 'smoke' ? 1 : 18); slot++)
      for (const bot of MISSION_BOTS) {
        const order = [2, 0, 1, 1, 2, 0, 0, 1, 2, 1, 0, 2, 2, 1, 0, 0, 2, 1];
        const seed = (MISSION_SEEDS[order[slot]] + index * 1009) >>> 0;
        jobs.push({
          mode: 'missions',
          mission: mission.id,
          slot,
          bot,
          seed,
          run: {
            missionId: mission.id,
            seed,
            layout: slot % 3,
            assault: ASSAULTS[Math.floor(slot / 3) % 3],
            nest: slot < 9 ? 'spread' : 'clustered',
          },
        });
      }
if (MODE !== 'missions')
  for (const seed of CLASSIC_SEEDS.slice(0, MODE === 'smoke' ? 1 : 16))
    for (const bot of CLASSIC_BOTS) jobs.push({ mode: 'classic', bot, seed });
mkdirSync(OUT, { recursive: true });
for (const [index, job] of jobs.entries()) {
  const jobEngines =
    STAGE === 'holdout' && job.mode === 'missions'
      ? engines.filter((e) => e.version === '0.22')
      : engines;
  for (const engine of jobEngines) records.push(play(engine, { ...job, jobId: index }));
  if ((index + 1) % (MODE === 'classic' ? 16 : 54) === 0 || index + 1 === jobs.length)
    console.log(`${STAGE}/${MODE}: ${index + 1}/${jobs.length} paired jobs`);
}
const manifests = engines.map((engine) => {
  const after = manifest(engine.root);
  return {
    version: engine.version,
    root: engine.root,
    sourceHashBefore: sha(JSON.stringify(engine.before)),
    sourceHashAfter: sha(JSON.stringify(after)),
    unchanged: JSON.stringify(engine.before) === JSON.stringify(after),
    sourceFilesBefore: engine.before,
    sourceFilesAfter: after,
  };
});
const groups = [];
for (const mode of ['missions', 'classic'])
  for (const version of ['0.21', '0.22'])
    for (const bot of mode === 'missions' ? MISSION_BOTS : CLASSIC_BOTS) {
      const subset = records.filter(
        (r) => r.mode === mode && r.version === version && r.bot === bot,
      );
      if (subset.length) groups.push({ mode, version, bot, ...summarize(subset) });
    }
const byMissionBot = [];
for (const m of engines[0].MISSIONS)
  for (const e of engines)
    for (const bot of MISSION_BOTS) {
      const subset = records.filter(
        (r) => r.mission === m.id && r.version === e.version && r.bot === bot,
      );
      if (subset.length)
        byMissionBot.push({ mission: m.id, version: e.version, bot, ...summarize(subset) });
    }
const pairs = jobs.flatMap((job, index) => {
  const before = records.find((r) => r.jobId === index && r.version === '0.21');
  const after = records.find((r) => r.jobId === index && r.version === '0.22');
  if (!before || !after) return [];
  return [
    {
      mode: job.mode,
      mission: job.mission,
      bot: job.bot,
      seed: job.seed,
      slot: job.slot,
      baselineWon: before.status === 'won',
      candidateWon: after.status === 'won',
      baseDelta: after.baseEnd - before.baseEnd,
      deathsDelta: after.deaths - before.deaths,
      secondsDelta: after.activeSeconds - before.activeSeconds,
    },
  ];
});
const pairedGroups = groups
  .filter((g) => g.version === '0.22')
  .map(({ mode, bot }) => {
    const subset = pairs.filter((r) => r.mode === mode && r.bot === bot);
    return {
      mode,
      bot,
      pairs: subset.length,
      bothWon: subset.filter((r) => r.baselineWon && r.candidateWon).length,
      baselineOnly: subset.filter((r) => r.baselineWon && !r.candidateWon).length,
      candidateOnly: subset.filter((r) => !r.baselineWon && r.candidateWon).length,
      neither: subset.filter((r) => !r.baselineWon && !r.candidateWon).length,
      meanBaseDelta: mean(subset.map((r) => r.baseDelta)),
      meanDeathsDelta: mean(subset.map((r) => r.deathsDelta)),
      meanSecondsDelta: mean(subset.map((r) => r.secondsDelta)),
    };
  });
const nonemptyPairedGroups = pairedGroups.filter((g) => g.pairs > 0);
const report = {
  version: 1,
  stage: STAGE,
  mode: MODE,
  method: {
    policyVersion: 'fort-lanes-v2',
    command: `TACTICAL_STAGE=${STAGE} TACTICAL_MODE=${MODE} node --experimental-strip-types scripts/tactical-balance-022.mjs`,
    dt: DT,
    maxWaveSeconds: 300,
    missionSeeds: MISSION_SEEDS,
    classicSeeds: CLASSIC_SEEDS,
    pairing:
      'Discovery and classic holdout jobs use the real 0.21 engine and current default 0.22 engine with identical seed/configuration/bot. Mission holdout uses only the candidate, 6 missions ×18 configurations ×2 bots=216. No LEGACY_BALANCE substitution. Serial execution in one process, no workers.',
    policies:
      'All actions use Game public commands; mixed/methodical buy at least 3 anti-air from rank6 when affordable, position medics near fort at x924 across lanes with the fewest medics, buy diverse lane coverage, repair <=65 and use powers; melee deliberately has no anti-air; ranged purchases archers/dragons/tanks; casual random unlocked purchases and legal positions, 50% powers; novice one cheap clustered purchase. Public reward skip, no training. Mission prep 4s controlled/1s other; classic10s controlled/3s other.',
    observation:
      'Deaths are disappeared unit IDs. Flying kills are observed removals with HP<=0 and maxHp>0; Game marks escaped enemies with maxHp=0. Entity born and removed within a single step may be unobserved. Head kills are actual positive-to-zero transitions, court heals count consumed charges, supply return/refill count phase transitions. Injured survivors have 0<HP<maxHP at final state.',
    limitations:
      'Descriptive scripted policies, configurations share seeds and are not independent samples. Comparisons do not isolate bandages, flight and boss effects. No human enjoyment estimate, no unit MVP inference. Holdout seeds are reserved and must run only after tuning choice.',
  },
  scriptHashBefore,
  scriptHashAfter: sha(readFileSync(fileURLToPath(import.meta.url))),
  manifests,
  wallMs: performance.now() - started,
  total: summarize(records),
  groups,
  byMissionBot,
  pairedGroups: nonemptyPairedGroups,
  pairs,
  records,
};
writeFileSync(resolve(OUT, `${MODE}.json`), JSON.stringify(report, null, 2) + '\n');
const rows = groups
  .map(
    (g) =>
      `| ${g.mode} | ${g.version} | ${g.bot} | ${g.won}/${g.runs} | ${g.meanBaseEnd.toFixed(1)} | ${g.meanDeaths.toFixed(1)} | ${g.meanActiveSeconds.toFixed(1)} | ${g.meanFlyingKills.toFixed(1)}/${g.meanFlyingSeen.toFixed(1)} | ${g.meanSupplyReturns.toFixed(1)}/${g.meanSupplyRefills.toFixed(1)} | ${g.meanInjuredSurvivors.toFixed(1)} |`,
  )
  .join('\n');
writeFileSync(
  resolve(OUT, `${MODE}.md`),
  `# Cohorte tactique 0.22 — ${STAGE}\n\nCommande : \`${report.method.command}\`. ${report.method.pairing}\n\n${report.method.policies}\n\n| Mode | Moteur | Politique | Victoires | Cristal moy. | Pertes moy. | Secondes combat moy. | Volants tués/vus moy. | Retours/recharges moy. | Blessés survivants moy. |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows}\n\n${report.method.observation}\n\n${report.method.limitations}\n\nErreurs ${report.total.errors}, dépassements ${report.total.timeouts}. Calcul ${(report.wallMs / 1000).toFixed(1)}s. Sources avant/après : ${manifests.map((m) => `${m.version} ${m.sourceHashBefore}/${m.sourceHashAfter} identiques=${m.unchanged}`).join('; ')}. Détails par partie, paire, mission/politique, vagues, achats, têtes et gardes dans ${MODE}.json.\n`,
);
console.log(
  JSON.stringify({
    groups,
    pairedGroups: nonemptyPairedGroups,
    wallMs: report.wallMs,
    unchanged: manifests.every((m) => m.unchanged),
    out: relative(ROOT, OUT),
  }),
);
assert.ok(
  manifests.every((m) => m.unchanged),
  'Engine sources changed during measurement; report is diagnostic, rerun after freeze',
);
assert.equal(report.scriptHashBefore, report.scriptHashAfter);
if (report.total.errors || report.total.timeouts) process.exitCode = 1;
