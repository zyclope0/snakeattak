import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { writeFile, mkdir } from 'node:fs/promises';
import { Game } from '../src/game.ts';
import { kinds, TOTAL_WAVES } from '../src/data.ts';
import { LANES, laneDefense } from '../src/ai.ts';

const OUTPUT = process.env.BALANCE_OUTPUT || 'reports';
const honeyPolicy = process.env.HONEY_POLICY || 'lure';
assert.ok(['lure', 'sticky', 'alternating'].includes(honeyPolicy), 'Unknown honey policy');
const rosterPolicy = process.env.ROSTER_POLICY || 'classic';
assert.ok(['classic', 'expanded'].includes(rosterPolicy), 'Unknown roster policy');
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const DT = 1 / 30,
  PREP_SECONDS = 10,
  MAX_WAVE_SECONDS = 240;
const profiles = ['balanced', 'melee', 'ranged', 'heavy', 'casual'];
const labels = {
  balanced: 'Équilibrée',
  melee: 'Mêlée et soins',
  ranged: 'Distance',
  heavy: 'Unités lourdes',
  casual: 'Choix spontanés',
};
const samples = [],
  games = [],
  routes = [];
let totalTicks = 0,
  totalStepMs = 0;
const average = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
const quantile = (a, q) => {
  if (!a.length) return null;
  const b = [...a].sort((x, y) => x - y);
  return b[Math.min(b.length - 1, Math.floor((b.length - 1) * q))];
};
function random(seed) {
  let n = seed >>> 0;
  return () => (n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296;
}
function place(g, kind, rng, casual) {
  if (casual) {
    for (let i = 0; i < 80; i++)
      if (g.recruit(kind, 612 + Math.floor(rng() * 16) * 24, 132 + Math.floor(rng() * 17) * 24))
        return true;
    return false;
  }
  const scores = laneDefense(g.units),
    lanes = [0, 1, 2].sort((a, b) => scores[a] - scores[b] || a - b);
  const rear = ['archer', 'dragon', 'tank', 'medic', 'nurse'].includes(kind);
  for (const lane of lanes)
    for (const x of rear ? [948, 876, 804, 732, 660] : [660, 732, 804, 876, 948])
      for (const offset of [0, -48, 48]) if (g.recruit(kind, x, LANES[lane] + offset)) return true;
  return false;
}
function purchases(g, profile, rng, wave, record) {
  const buy = (kind) => {
    if (
      !g.isUnlocked(kind) ||
      g.gold < kinds[kind].cost ||
      !place(g, kind, rng, profile === 'casual')
    )
      return false;
    record.purchases[kind] = (record.purchases[kind] ?? 0) + 1;
    record.spent += kinds[kind].cost;
    return true;
  };
  if (g.base <= 65 && g.repair()) {
    record.repairs++;
    record.spent += 80;
  }
  if (profile === 'casual') {
    for (let i = 0, n = 1 + Math.floor(rng() * 3); i < n; i++) {
      const options = Object.keys(kinds).filter(
        (k) => k !== 'hero' && g.isUnlocked(k) && g.gold >= kinds[k].cost,
      );
      if (!options.length) break;
      buy(options[Math.floor(rng() * options.length)]);
    }
    return;
  }
  const healers = g.units.filter((u) => u.kind === 'medic' || u.kind === 'nurse').length;
  const desired =
    profile === 'melee'
      ? Math.min(3, 1 + Math.floor(wave / 4))
      : Math.min(2, 1 + Math.floor(wave / 5));
  if (healers < desired) buy('medic');
  for (let i = 0; i < 8; i++) {
    let pool;
    if (profile === 'melee')
      pool =
        g.units.filter((u) => u.kind === 'shield').length < Math.ceil(g.units.length / 5)
          ? ['shield', 'ninja', 'bat']
          : ['ninja', 'bat', 'cavalry', 'twohead', 'dino', 'knight'];
    else if (profile === 'ranged') pool = ['archer', 'archer', 'dragon', 'tank'];
    else if (profile === 'heavy') pool = ['shield', 'knight', 'dino', 'twohead', 'tank'];
    else
      pool = [
        'archer',
        'shield',
        'ninja',
        'dragon',
        'cavalry',
        'dino',
        'twohead',
        'tank',
        'knight',
        'bat',
      ];
    if (rosterPolicy === 'expanded')
      pool.push(
        ...(profile === 'melee'
          ? ['raptor', 'triceratops', 'mutantRock', 'mutantStretch']
          : profile === 'heavy'
            ? ['triceratops', 'stegosaurus', 'trex', 'mutantRock']
            : profile === 'balanced'
              ? ['raptor', 'triceratops', 'stegosaurus', 'trex', 'mutantRock', 'mutantStretch']
              : []),
      );
    const unlocked = pool.filter((k) => g.isUnlocked(k));
    if (!unlocked.length) break;
    const wanted = unlocked[(wave + i) % unlocked.length];
    // Heavy armies save up for their next big unit instead of always buying a cheap fallback.
    if (profile === 'heavy' && g.gold < kinds[wanted].cost) break;
    const options = [wanted, ...unlocked.filter((k) => k !== wanted)];
    let bought = false;
    for (const kind of options)
      if (buy(kind)) {
        bought = true;
        break;
      }
    if (!bought) break;
  }
}
function play(profile, seed) {
  const g = new Game(seed),
    rng = random(seed ^ 0x9e3779b9);
  const record = {
    profile,
    label: labels[profile],
    seed,
    status: 'running',
    wave: 0,
    activeSeconds: 0,
    prepSeconds: 0,
    baseEnd: 100,
    minBase: 100,
    baseDamage: 0,
    deaths: 0,
    deathKinds: {},
    purchases: {},
    spent: 0,
    repairs: 0,
    rewardsSkipped: 0,
    coinsEnd: 0,
    kills: 0,
    hatched: 0,
    honeyTurns: 0,
    reroutes: 0,
    waves: [],
    formationSamples: 0,
    guardEdgeSum: 0,
    guardClusterSum: 0,
  };
  const tracks = new Map();
  function advance(monitor) {
    const beforeUnits = monitor ? [...g.units] : [],
      beforeEnemies = monitor ? [...g.enemies] : [],
      base = g.base;
    const sampled = totalTicks % 30 === 0;
    const start = performance.now();
    g.step(DT);
    const elapsed = performance.now() - start;
    totalStepMs += elapsed;
    if (sampled) samples.push(elapsed);
    totalTicks++;
    if (!monitor) return;
    if (sampled) {
      const guards = g.units.filter(
        (u) => kinds[u.kind]?.damage > 0 && !['ninja', 'cavalry'].includes(u.kind),
      );
      if (guards.length) {
        record.formationSamples++;
        record.guardEdgeSum += guards.filter((u) => u.x <= 636).length / guards.length;
        const counts = LANES.map((y) => guards.filter((u) => Math.abs(u.y - y) <= 72).length);
        record.guardClusterSum += Math.max(...counts) / guards.length;
      }
    }
    const aliveUnits = new Set(g.units.map((u) => u.id)),
      aliveEnemies = new Set(g.enemies.map((e) => e.id));
    for (const u of beforeUnits)
      if (!aliveUnits.has(u.id)) {
        record.deaths++;
        record.deathKinds[u.kind] = (record.deathKinds[u.kind] ?? 0) + 1;
      }
    record.baseDamage += Math.max(0, base - g.base);
    record.minBase = Math.min(record.minBase, g.base);
    for (const e of [...g.enemies, ...beforeEnemies.filter((e) => !aliveEnemies.has(e.id))]) {
      let t = tracks.get(e.id);
      if (!t) {
        t = {
          profile,
          seed,
          wave: g.wave,
          id: e.id,
          variant: e.variant,
          boss: e.boss,
          born: g.time - DT,
          x: e.x,
          y: e.y,
          distance: 0,
          defenseSeconds: null,
          defenseDistance: null,
          initialLane: e.lane,
          lastLane: e.lane,
        };
        tracks.set(e.id, t);
      }
      t.distance += Math.hypot(e.x - t.x, e.y - t.y);
      t.x = e.x;
      t.y = e.y;
      t.lastLane = e.lane;
      if (t.defenseSeconds === null && e.x >= 600) {
        t.defenseSeconds = g.time - t.born;
        t.defenseDistance = t.distance;
      }
      if (!aliveEnemies.has(e.id)) {
        routes.push({
          ...t,
          totalSeconds: g.time - t.born,
          outcome: e.maxHp === 0 ? 'escaped' : 'killed',
        });
        tracks.delete(e.id);
      }
    }
  }
  for (let wave = 1; wave <= TOTAL_WAVES; wave++) {
    // Neutral legacy baseline: take the existing Continue without bonus action.
    // Chapter rewards added after this tool otherwise block the next start.
    if (g.rewards.pending !== null) {
      assert.ok(g.skipReward());
      record.rewardsSkipped++;
    }
    purchases(g, profile, rng, wave, record);
    for (let i = 0; i < PREP_SECONDS / DT; i++) advance(false);
    record.prepSeconds += PREP_SECONDS;
    if (!g.startWave()) throw Error('Unexpected blocked start');
    const start = g.time,
      wr = {
        wave,
        seconds: 0,
        firstContact: null,
        attackStateSeconds: 0,
        baseDamage: 0,
        kills: 0,
        deaths: 0,
        eggsHatched: 0,
        bossSeen: false,
      };
    const baseDamage = record.baseDamage,
      kills = g.kills,
      deaths = record.deaths,
      hatched = g.hatched;
    const honeyAt = profile === 'casual' ? 3 + rng() * 8 : 8;
    let honey = false;
    while (g.status === 'fighting' && g.time - start < MAX_WAVE_SECONDS) {
      if (!honey && g.time - start >= honeyAt) {
        const scores = laneDefense(g.units),
          lane = profile === 'casual' ? Math.floor(rng() * 3) : scores.indexOf(Math.max(...scores));
        const flavor =
          honeyPolicy === 'alternating' ? (wave % 2 === 0 ? 'sticky' : 'lure') : honeyPolicy;
        const chosen =
          flavor === 'sticky' && profile !== 'casual' ? scores.indexOf(Math.min(...scores)) : lane;
        honey = g.offerFeast(chosen, flavor);
        if (honey) wr.honeyFlavor = flavor;
      }
      advance(true);
      const combat =
        g.units.some((u) => u.state === 'attack') || g.enemies.some((e) => e.state === 'attack');
      if (combat) {
        wr.firstContact ??= g.time - start;
        wr.attackStateSeconds += DT;
      }
      if (g.enemies.some((e) => e.boss)) wr.bossSeen = true;
    }
    wr.seconds = g.time - start;
    wr.baseDamage = record.baseDamage - baseDamage;
    wr.kills = g.kills - kills;
    wr.deaths = record.deaths - deaths;
    wr.eggsHatched = g.hatched - hatched;
    record.waves.push(wr);
    record.activeSeconds += wr.seconds;
    record.wave = wave;
    record.honeyTurns += g.honeyTurns;
    if (g.status === 'lost') {
      record.status = 'lost';
      break;
    }
    if (g.status === 'fighting') {
      record.status = 'timeout';
      break;
    }
    if (g.status === 'won') {
      record.status = 'won';
      break;
    }
  }
  for (const t of tracks.values())
    routes.push({ ...t, totalSeconds: g.time - t.born, outcome: 'censored' });
  Object.assign(record, {
    baseEnd: g.base,
    coinsEnd: g.gold,
    kills: g.kills,
    hatched: g.hatched,
    reroutes: g.reroutes,
  });
  if (record.status === 'timeout')
    record.stall = { units: g.units, enemies: g.enemies, eggs: g.eggs, remaining: g.remaining };
  return record;
}
const started = performance.now();
const sourceFiles = (await readdir('src')).filter((f) => f.endsWith('.ts')).sort();
const digest = createHash('sha256');
for (const f of sourceFiles) {
  digest.update(f);
  digest.update(await readFile('src/' + f));
}
const sourceHash = digest.digest('hex');
await mkdir(OUTPUT, { recursive: true });
for (let n = 0; n < 20; n++)
  for (const profile of profiles) {
    const seed = (2026 + Math.imul(n + 1, 2654435761)) >>> 0;
    games.push(play(profile, seed));
    if (games.at(-1).status === 'timeout')
      await writeFile(
        OUTPUT + '/stalled-' + profile + '-' + seed + '.json',
        JSON.stringify(games.at(-1), null, 2),
      );
    if (games.length % 10 === 0)
      console.log(
        `Completed ${games.length}/100 (${((performance.now() - started) / 1000).toFixed(1)} s)`,
      );
  }
await writeFile(OUTPUT + '/balance-campaigns.json', JSON.stringify(games, null, 2));
assert.equal(games.length, 100);
assert.equal(new Set(games.map((g) => g.seed)).size, 20);
assert.ok(
  games.every((g) => g.status === 'won' || g.status === 'lost'),
  'A campaign stalled',
);
for (const g of games) {
  assert.ok(g.baseEnd >= 0 && g.baseEnd <= 100);
  assert.ok(g.coinsEnd >= 0);
  assert.ok(g.waves.every((w) => w.seconds > 0 && w.seconds < MAX_WAVE_SECONDS));
}
const summary = {
  version,
  createdAt: new Date().toISOString(),
  nodeVersion: process.version,
  sourceHash,
  method: {
    games: 100,
    honeyPolicy,
    rosterPolicy,
    profiles: 5,
    pairedSeeds: 20,
    rewardPolicy: 'skip chapter bonuses through the public command; legacy control baseline',
    stepHz: 30,
    preparationSeconds: PREP_SECONDS,
    timeoutPerWaveSeconds: MAX_WAVE_SECONDS,
    changesToHPSpawnsGold: false,
    model: 'actual src/game.ts; no renderer; bots buy before waves and use honey during combat',
  },
  wallSeconds: (performance.now() - started) / 1000,
  totalTicks,
  performance: {
    meanStepMs: totalStepMs / totalTicks,
    p95SampledStepMs: quantile(samples, 0.95),
    maxSampledStepMs: Math.max(...samples),
  },
  profiles: profiles.map((profile) => {
    const group = games.filter((g) => g.profile === profile),
      won = group.filter((g) => g.status === 'won'),
      waves = group.flatMap((g) => g.waves);
    return {
      profile,
      label: labels[profile],
      games: group.length,
      wins: won.length,
      losses: group.filter((g) => g.status === 'lost').length,
      timeouts: group.filter((g) => g.status === 'timeout').length,
      meanLastWave: average(group.map((g) => g.wave)),
      meanBaseEnd: average(group.map((g) => g.baseEnd)),
      meanBaseDamage: average(group.map((g) => g.baseDamage)),
      meanDeaths: average(group.map((g) => g.deaths)),
      meanGuardEdgeFraction: average(
        group.map((g) => g.guardEdgeSum / Math.max(1, g.formationSamples)),
      ),
      meanGuardClusterFraction: average(
        group.map((g) => g.guardClusterSum / Math.max(1, g.formationSamples)),
      ),
      medianWinActiveSeconds: quantile(
        won.map((g) => g.activeSeconds),
        0.5,
      ),
      medianWinIncludingPreparationSeconds: quantile(
        won.map((g) => g.activeSeconds + g.prepSeconds),
        0.5,
      ),
      medianWaveSeconds: quantile(
        waves.map((w) => w.seconds),
        0.5,
      ),
      medianFirstContact: quantile(
        waves.map((w) => w.firstContact).filter((x) => x !== null),
        0.5,
      ),
      meanCoinsEnd: average(group.map((g) => g.coinsEnd)),
      meanHoneyTurns: average(group.map((g) => g.honeyTurns)),
    };
  }),
  waves: Array.from({ length: TOTAL_WAVES }, (_, i) => {
    const a = games.flatMap((g) => g.waves).filter((w) => w.wave === i + 1);
    return {
      wave: i + 1,
      runs: a.length,
      medianSeconds: quantile(
        a.map((w) => w.seconds),
        0.5,
      ),
      p90Seconds: quantile(
        a.map((w) => w.seconds),
        0.9,
      ),
      medianFirstContact: quantile(
        a.map((w) => w.firstContact).filter((x) => x !== null),
        0.5,
      ),
      attackStateFraction: average(a.map((w) => w.attackStateSeconds / w.seconds)),
      deaths: average(a.map((w) => w.deaths)),
      baseDamage: average(a.map((w) => w.baseDamage)),
    };
  }),
  routes: {
    count: routes.length,
    reachedDefense: routes.filter((r) => r.defenseSeconds !== null).length,
    medianTimeToDefense: quantile(
      routes.map((r) => r.defenseSeconds).filter((x) => x !== null),
      0.5,
    ),
    medianDistanceToDefense: quantile(
      routes.map((r) => r.defenseDistance).filter((x) => x !== null),
      0.5,
    ),
    escaped: routes.filter((r) => r.outcome === 'escaped').length,
  },
};
await mkdir(OUTPUT, { recursive: true });
await writeFile(
  OUTPUT + '/balance-100.json',
  JSON.stringify({ summary, games, routes }, null, 2) + '\n',
);
await writeFile(OUTPUT + '/balance-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
