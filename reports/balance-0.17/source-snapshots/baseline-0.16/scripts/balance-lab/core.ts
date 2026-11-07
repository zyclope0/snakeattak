import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { Game } from '../../src/game.ts';
import { kinds, TOTAL_WAVES } from '../../src/data.ts';
import type { BalanceTuning } from '../../src/balanceTuning.ts';
import { makeBalanceTuning } from '../../src/balanceTuning.ts';
import { PROFILES, makeBot, purchase, honey } from './profiles.ts';
import type { Profile, Action } from './profiles.ts';
import { mean, quantile, wilson, pairedBootstrap, clusterRateBootstrap } from './stats.ts';

export type Stage = 'discovery' | 'confirmation' | 'holdout' | 'discovery2' | 'confirmation2';
export type Job = {
  id: string;
  profile: Profile;
  seed: number;
  tuning?: Partial<BalanceTuning>;
  useDefault?: boolean;
  limits?: { maxWaveSeconds?: number; preparationSeconds?: number };
};
export const METHOD = Object.freeze({
  stepHz: 30,
  preparationSeconds: 10,
  maxWaveSeconds: 240,
  purchaseInterval: 6,
  casualPurchaseInterval: 18,
  profiles: [...PROFILES],
  cohortVersion: 'boss-016-v2',
  aggregateRateInterval:
    '2000 whole-seed cluster percentile bootstrap; pooled Wilson retained as nominal diagnostic',
  honeyPolicy: 'seed/profile hash: 25% none, 25% alternating, 50% profile',
  savingPolicy: 'keep intended purchase until affordable; reset composition cursor each wave',
});
export function cohortSeeds(stage: Stage): number[] {
  const ranges = {
    discovery: [0, 8],
    confirmation: [8, 12],
    holdout: [20, 24],
    discovery2: [44, 8],
    confirmation2: [52, 12],
  };
  if (!Object.hasOwn(ranges, stage)) throw new Error(`Unknown stage: ${stage}`);
  const [offset, count] = ranges[stage];
  return Array.from(
    { length: count },
    (_, i) => (0x16002026 + Math.imul(offset + i + 1, 2654435761)) >>> 0,
  );
}
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
}
export const hashValue = (value: unknown) =>
  createHash('sha256').update(stableJson(value)).digest('hex');
export function replayMetrics<T extends { performance?: unknown }>(
  record: T,
): Omit<T, 'performance'> {
  const { performance: _performance, ...rest } = record;
  return rest;
}
function snapshot(game: Game) {
  return JSON.parse(
    JSON.stringify({
      status: game.status,
      time: game.time,
      wave: game.wave,
      gold: game.gold,
      base: game.base,
      rng: game.rng,
      units: game.units,
      enemies: game.enemies,
      eggs: game.eggs,
      remaining: game.remaining,
      spawnTimer: game.spawnTimer,
      feast: game.feast,
      kills: game.kills,
      hatched: game.hatched,
      nextId: game.nextId,
    }),
  );
}
function createRecord(job: Job) {
  const limits = Object.freeze({
    preparationSeconds: job.limits?.preparationSeconds ?? METHOD.preparationSeconds,
    maxWaveSeconds: job.limits?.maxWaveSeconds ?? METHOD.maxWaveSeconds,
  });
  const record = {
    id: job.id,
    profile: job.profile,
    seed: job.seed,
    status: 'error' as string,
    tuning: {} as Readonly<BalanceTuning>,
    useDefault: !!job.useDefault,
    limits,
    replay: { ...job, limits },
    wave: 0,
    completedWaves: 0,
    activeSeconds: 0,
    prepSeconds: 0,
    baseEnd: 100,
    minBase: 100,
    baseDamage: 0,
    healthEnd: 0,
    unitsEnd: 0,
    coinsEnd: 300,
    earned: 0,
    spent: 0,
    repairs: 0,
    kills: 0,
    deaths: 0,
    deathKinds: {} as Record<string, number>,
    purchases: {} as Record<string, number>,
    actions: [] as Action[],
    honeyMode: 'unknown' as string,
    honeyUses: 0,
    honeyTurns: 0,
    hatched: 0,
    reroutes: 0,
    ticks: 0,
    bossSeen: false,
    bossEntered: false,
    bossFirstSeenAt: null as number | null,
    bossEnteredAt: null as number | null,
    bossFightStartedAt: null as number | null,
    bossDuration: null as number | null,
    bossEncounterDuration: null as number | null,
    bossKilled: false,
    bossHpEnd: null as number | null,
    shieldsBroken: 0,
    shotsFired: 0,
    waves: [] as {
      wave: number;
      seconds: number;
      status: string;
      baseEnd: number;
      kills: number;
      deaths: number;
      goldEnd: number;
      bossSeen: boolean;
      honeyMode: string;
      honeyFlavor: string | null;
      honeyAtSeconds: number;
    }[],
    failureState: undefined as unknown,
    error: undefined as string | undefined,
    performance: { wallSeconds: 0, cpuSeconds: 0, ticks: 0 },
  };
  return record;
}
export function failedCampaign(job: Job, error: unknown) {
  const record = createRecord(job);
  record.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  record.failureState = { workerFailure: true };
  return record;
}
export function runCampaign(job: Job) {
  const wallStart = performance.now();
  const cpuStart = process.threadCpuUsage();
  const record = createRecord(job);
  const limits = record.limits;
  let game: Game | undefined;
  try {
    record.honeyMode = makeBot(job.seed, job.profile, 1).honeyMode;
    if (
      !Number.isFinite(limits.maxWaveSeconds) ||
      limits.maxWaveSeconds <= 0 ||
      limits.maxWaveSeconds > 240 ||
      !Number.isFinite(limits.preparationSeconds) ||
      limits.preparationSeconds < 0 ||
      limits.preparationSeconds > 60
    )
      throw new Error('Invalid simulation limits');
    game = job.useDefault ? new Game(job.seed) : new Game(job.seed, job.tuning);
    record.tuning = game.tuning;
    if (
      job.useDefault &&
      job.tuning &&
      stableJson(game.tuning) !== stableJson(makeBalanceTuning(job.tuning))
    )
      throw new Error('Production default does not match expected tuning');
    record.replay = { ...job, tuning: { ...game.tuning }, limits };
    let boss: Game['enemies'][number] | undefined;
    let lastBossHp: number | undefined;
    const advance = () => {
      const before = game!.units,
        base = game!.base;
      game!.step(1 / METHOD.stepHz);
      record.ticks++;
      if (before.length !== game!.units.length) {
        const alive = new Set(game!.units.map((u) => u.id));
        for (const unit of before)
          if (!alive.has(unit.id)) {
            record.deaths++;
            record.deathKinds[unit.kind] = (record.deathKinds[unit.kind] ?? 0) + 1;
          }
      }
      record.baseDamage += Math.max(0, base - game!.base);
      record.minBase = Math.min(record.minBase, game!.base);
      boss ??= game!.enemies.find((e) => e.boss);
      if (boss) {
        if (!record.bossSeen) {
          record.bossSeen = true;
          record.bossFirstSeenAt = game!.time;
        }
        if (!record.bossEntered && boss.x >= 576) {
          record.bossEntered = true;
          record.bossEnteredAt = game!.time;
        }
        if (
          record.bossFightStartedAt === null &&
          (record.bossEntered ||
            boss.hp < boss.maxHp ||
            (lastBossHp !== undefined && boss.hp < lastBossHp))
        )
          record.bossFightStartedAt = game!.time;
        lastBossHp = boss.hp;
        record.shieldsBroken = boss.bossState?.shieldsBroken ?? 0;
        record.shotsFired = boss.bossState?.shotsFired ?? 0;
        record.bossHpEnd = Math.max(0, boss.hp);
        if (!record.bossKilled) {
          record.bossDuration =
            record.bossFightStartedAt === null ? null : game!.time - record.bossFightStartedAt;
          record.bossEncounterDuration = game!.time - record.bossFirstSeenAt!;
          record.bossKilled = boss.hp <= 0 && boss.maxHp > 0;
        }
      }
    };
    const actions = (list: Action[]) => {
      record.actions.push(...list);
      for (const action of list) {
        record.spent += action.cost;
        if (action.kind === 'recruit')
          record.purchases[action.unit!] = (record.purchases[action.unit!] ?? 0) + 1;
        if (action.kind === 'repair') record.repairs++;
        if (action.kind === 'honey') record.honeyUses++;
      }
    };
    for (let wave = 1; wave <= TOTAL_WAVES; wave++) {
      const bot = makeBot(job.seed, job.profile, wave);
      actions(purchase(game, bot, wave));
      for (let tick = 0; tick < Math.round(limits.preparationSeconds * METHOD.stepHz); tick++)
        advance();
      record.prepSeconds += Math.round(limits.preparationSeconds * METHOD.stepHz) / METHOD.stepHz;
      if (!game.startWave()) throw new Error(`Blocked start of wave ${wave}`);
      const start = game.time,
        deaths = record.deaths,
        kills = game.kills;
      const maxTicks = Math.ceil(limits.maxWaveSeconds * METHOD.stepHz);
      let nextPurchase = bot.interval,
        honeyUsed = false;
      for (let tick = 0; game.status === 'fighting' && tick < maxTicks; tick++) {
        const elapsed = tick / METHOD.stepHz;
        if (elapsed >= nextPurchase) {
          actions(purchase(game, bot, wave));
          nextPurchase += bot.interval;
        }
        if (!honeyUsed && elapsed >= bot.honeyAt) {
          actions(honey(game, bot, wave));
          honeyUsed = true;
        }
        advance();
      }
      const seconds = game.time - start;
      record.wave = wave;
      record.activeSeconds += seconds;
      record.honeyTurns += game.honeyTurns;
      record.waves.push({
        wave,
        seconds,
        status: game.status === 'fighting' ? 'timeout' : game.status,
        baseEnd: game.base,
        kills: game.kills - kills,
        deaths: record.deaths - deaths,
        goldEnd: game.gold,
        bossSeen: record.bossSeen,
        honeyMode: bot.honeyMode,
        honeyFlavor:
          record.actions.find((a) => a.wave === wave && a.kind === 'honey')?.flavor ?? null,
        honeyAtSeconds: bot.honeyAt,
      });
      if (game.status !== 'fighting' && game.status !== 'lost') record.completedWaves++;
      if (game.status === 'lost' || game.status === 'won') {
        record.status = game.status;
        break;
      }
      if (game.status === 'fighting') {
        record.status = 'timeout';
        break;
      }
    }
    Object.assign(record, {
      baseEnd: game.base,
      healthEnd: game.units.reduce((n, u) => n + u.hp, 0),
      unitsEnd: game.units.length,
      coinsEnd: game.gold,
      earned: game.gold - 300 + record.spent,
      kills: game.kills,
      hatched: game.hatched,
      reroutes: game.reroutes,
    });
    if (record.status !== 'won') record.failureState = snapshot(game);
  } catch (error) {
    record.status = 'error';
    record.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    if (game) record.failureState = snapshot(game);
  }
  const cpu = process.threadCpuUsage(cpuStart);
  record.performance = {
    wallSeconds: (performance.now() - wallStart) / 1000,
    cpuSeconds: (cpu.user + cpu.system) / 1e6,
    ticks: record.ticks,
  };
  return record;
}
export type Campaign = ReturnType<typeof runCampaign>;
function groupSummary(games: Campaign[]) {
  const wins = games.filter((g) => g.status === 'won').length;
  const bossDurations = games
    .filter((g) => g.bossKilled && g.bossDuration !== null)
    .map((g) => g.bossDuration!);
  return {
    games: games.length,
    wins,
    losses: games.filter((g) => g.status === 'lost').length,
    timeouts: games.filter((g) => g.status === 'timeout').length,
    errors: games.filter((g) => g.status === 'error').length,
    winRate: games.length ? wins / games.length : 0,
    winWilson95: wilson(wins, games.length),
    earlyLosses: games.filter((g) => g.status === 'lost' && g.wave < TOTAL_WAVES).length,
    meanLastWave: mean(games.map((g) => g.wave)),
    meanDeaths: mean(games.map((g) => g.deaths)),
    meanGoldEnd: mean(games.map((g) => g.coinsEnd)),
    bossSeen: games.filter((g) => g.bossSeen).length,
    bossEntered: games.filter((g) => g.bossEntered).length,
    bossKilled: games.filter((g) => g.bossKilled).length,
    medianBossSeconds: quantile(bossDurations, 0.5),
    p90BossSeconds: quantile(bossDurations, 0.9),
    meanShieldsBroken: mean(games.filter((g) => g.bossSeen).map((g) => g.shieldsBroken)),
    meanShotsFired: mean(games.filter((g) => g.bossSeen).map((g) => g.shotsFired)),
    bossDurationCensored: games.filter((g) => g.bossSeen && !g.bossKilled).length,
    medianActiveSeconds: quantile(
      games.map((g) => g.activeSeconds),
      0.5,
    ),
    p90ActiveSeconds: quantile(
      games.map((g) => g.activeSeconds),
      0.9,
    ),
    waves: Array.from({ length: TOTAL_WAVES }, (_, i) => {
      const waves = games.flatMap((g) => g.waves).filter((w) => w.wave === i + 1);
      return {
        wave: i + 1,
        runs: waves.length,
        medianSeconds: quantile(
          waves.map((w) => w.seconds),
          0.5,
        ),
        p90Seconds: quantile(
          waves.map((w) => w.seconds),
          0.9,
        ),
      };
    }),
  };
}
export function summarize(games: Campaign[]) {
  const ids = [...new Set(games.map((g) => g.id))].sort();
  const configs = ids.map((id) => ({
    id,
    ...groupSummary(games.filter((g) => g.id === id)),
    winClusterBootstrap95: clusterRateBootstrap(
      games.filter((g) => g.id === id).map((g) => ({ seed: g.seed, won: g.status === 'won' })),
    ),
    winWilson95Interpretation:
      'nominal pooled diagnostic; profiles within the same seed are correlated',
    profiles: PROFILES.map((profile) => ({
      profile,
      ...groupSummary(games.filter((g) => g.id === id && g.profile === profile)),
    })),
  }));
  const baseline = ids.includes('baseline') ? 'baseline' : ids[0];
  const paired = ids
    .filter((id) => id !== baseline)
    .map((id) => {
      const reference = new Map(
        games.filter((g) => g.id === baseline).map((g) => [`${g.seed}:${g.profile}`, g]),
      );
      const pairs = games
        .filter((g) => g.id === id)
        .flatMap((g) => {
          const other = reference.get(`${g.seed}:${g.profile}`);
          return other
            ? [
                {
                  seed: g.seed,
                  difference: Number(g.status === 'won') - Number(other.status === 'won'),
                },
              ]
            : [];
        });
      return {
        id,
        baseline,
        pairs: pairs.length,
        winRateDifferenceClusterBootstrap95: pairedBootstrap(pairs),
      };
    });
  return { games: games.length, configs, paired };
}
export { PROFILES };
