import assert from 'node:assert/strict';
import test from 'node:test';
import { Game } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import { cohortSeeds, runCampaign, replayMetrics } from '../scripts/balance-lab/core.ts';
import { PROFILES, makeBot, purchase } from '../scripts/balance-lab/profiles.ts';
import { pairedBootstrap, wilson } from '../scripts/balance-lab/stats.ts';

test('balance cohorts have frozen sizes, disjoint seeds and repeat exactly', () => {
  const stages = ['discovery', 'confirmation', 'holdout', 'discovery2', 'confirmation2'] as const;
  const cohorts = stages.map(cohortSeeds);
  assert.deepEqual(
    cohorts.map((s) => s.length),
    [8, 12, 24, 8, 12],
  );
  assert.equal(new Set(cohorts.flat()).size, 64);
  assert.deepEqual(cohortSeeds('discovery'), cohorts[0]);
  assert.throws(() => cohortSeeds('invalid' as never));
});

test('eight bot profiles buy real legal units without borrowing game RNG or gold', () => {
  assert.equal(PROFILES.length, 8);
  for (const profile of PROFILES) {
    const game = new Game(42);
    const rng = game.rng;
    const before = game.gold;
    const bot = makeBot(42, profile, 1);
    const actions = purchase(game, bot, 1);
    assert.ok(
      actions.some((a) => a.kind === 'recruit'),
      profile,
    );
    assert.equal(game.rng, rng);
    const recruits = actions.filter((a) => a.kind === 'recruit');
    assert.equal(game.units.length, recruits.length + 3);
    assert.equal(game.gold, before - actions.reduce((n, a) => n + a.cost, 0));
    assert.ok(game.gold >= 0);
    for (const action of recruits) {
      assert.equal(action.cost, kinds[action.unit!].cost);
      assert.ok(Number.isFinite(action.x) && Number.isFinite(action.y));
    }
  }
});

test('a timed-out campaign is retained and replay reproduces every non-timing metric', () => {
  const job = {
    id: 'timeout-test',
    profile: 'mixed' as const,
    seed: 12,
    limits: { maxWaveSeconds: 1 / 30 },
  };
  const first = runCampaign(job);
  assert.equal(first.status, 'timeout');
  assert.equal(first.waves.length, 1);
  assert.ok(first.failureState);
  assert.ok(first.actions.some((a) => a.kind === 'recruit'));
  assert.deepEqual(replayMetrics(runCampaign(first.replay)), replayMetrics(first));
});

test('Wilson intervals and paired cluster bootstrap retain paired seed structure', () => {
  assert.deepEqual(wilson(0, 0), { low: 0, high: 1 });
  const interval = wilson(5, 10);
  assert.ok(interval.low < 0.5 && interval.high > 0.5);
  const pairs = [1, 2, 3].map((seed) => ({ seed, difference: 1 }));
  assert.deepEqual(pairedBootstrap(pairs, 100), { difference: 1, low: 1, high: 1, seeds: 3 });
});

test('honey policies vary by seed/profile and stay fixed across waves', () => {
  const modes = new Set<string>();
  for (let seed = 0; seed < 64; seed++) {
    const first = makeBot(seed, 'mixed', 1).honeyMode;
    assert.equal(makeBot(seed, 'mixed', 12).honeyMode, first);
    modes.add(first);
  }
  assert.deepEqual([...modes].sort(), ['alternating', 'none', 'profile']);
});

test('organized profiles retain the intended purchase when saving', () => {
  const game = new Game(42);
  const bot = makeBot(42, 'mixed', 1);
  purchase(game, bot, 1);
  const cursor = bot.cursor;
  const gold = game.gold;
  assert.deepEqual(purchase(game, bot, 1), []);
  assert.equal(bot.cursor, cursor);
  assert.equal(game.gold, gold);
});

test('production-default verification rejects an unexpected tuning without hiding the failure', () => {
  const result = runCampaign({
    id: 'default-mismatch',
    profile: 'mixed',
    seed: 42,
    useDefault: true,
    tuning: { bossEnabled: false },
  });
  assert.equal(result.status, 'error');
  assert.match(result.error!, /Production default does not match/);
  assert.ok(result.failureState);
  assert.equal(result.replay.useDefault, true);
});

test('the reserved holdout cohort stays identical after round-two expansion', () => {
  assert.deepEqual(
    cohortSeeds('holdout'),
    [
      277683115, 2932118876, 1291587341, 3946023102, 2305491567, 664960032, 3319395793, 1678864258,
      38332723, 2692768484, 1052236949, 3706672710, 2066141175, 425609640, 3080045401, 1439513866,
      4093949627, 2453418092, 812886557, 3467322318, 1826790783, 186259248, 2840695009, 1200163474,
    ],
  );
  assert.equal(cohortSeeds('discovery2')[0], (0x16002026 + Math.imul(45, 2654435761)) >>> 0);
  assert.equal(cohortSeeds('confirmation2')[0], (0x16002026 + Math.imul(53, 2654435761)) >>> 0);
});

test('global rate intervals resample whole seeds and preserve the pooled point estimate', async () => {
  const stats = await import('../scripts/balance-lab/stats.ts');
  assert.equal(typeof stats.clusterRateBootstrap, 'function');
  const correlated = [1, 2].flatMap((seed) =>
    Array.from({ length: 8 }, () => ({ seed, won: seed === 1 })),
  );
  const interval = stats.clusterRateBootstrap(correlated);
  assert.equal(interval.rate, 0.5);
  assert.equal(interval.low, 0);
  assert.equal(interval.high, 1);
  assert.equal(interval.seeds, 2);
  assert.deepEqual(stats.clusterRateBootstrap([...correlated].reverse()), interval);
  const unequal = [
    ...Array.from({ length: 8 }, () => ({ seed: 1, won: true })),
    { seed: 2, won: false },
  ];
  assert.equal(stats.clusterRateBootstrap(unequal).rate, 8 / 9);
});
