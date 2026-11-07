import test from 'node:test';
import assert from 'node:assert/strict';
import { runCampaign, cohortSeeds, replayMetrics } from '../scripts/balance-lab/core.ts';

test('le labo renonce explicitement aux bonus dans la référence et trace les deux décisions', () => {
  const result = runCampaign({ id: 'baseline', profile: 'ranged', seed: 42, rewardPolicy: 'skip' });
  assert.notEqual(result.status, 'error', result.error);
  assert.notEqual(result.status, 'timeout');
  assert.equal(result.rewardChoices.length, 2);
  assert.ok(result.rewardChoices.every((c) => c.id === 'skip'));
});
test('une politique renfort réclame et place gratuitement ses deux cadeaux par les règles publiques', () => {
  const job = {
    id: 'free',
    profile: 'ranged' as const,
    seed: 42,
    rewardPolicy: 'reinforcement' as const,
    // Isolate reward/replay mechanics from the new 0.22 boss and aerial challenge.
    tuning: { tacticalRulesEnabled: false },
  };
  const result = runCampaign(job);
  assert.equal(result.status, 'won', result.error);
  assert.equal(result.rewardChoices.length, 2);
  assert.ok(result.rewardChoices.every((c) => c.id.startsWith('renfort-') && c.used));
  assert.equal(result.actions.filter((a) => a.kind === 'recruit' && a.cost === 0).length, 2);
  assert.deepEqual(replayMetrics(runCampaign(result.replay)), replayMetrics(result));
});
test('la nouvelle cohorte de bonus reste séparée des64 anciennes graines', () => {
  const old = ['discovery', 'confirmation', 'holdout', 'discovery2', 'confirmation2'] as const;
  const bonus = cohortSeeds('rewards017');
  assert.equal(bonus.length, 16);
  assert.equal(new Set([...old.flatMap(cohortSeeds), ...bonus]).size, 80);
});
