import test from 'node:test';
import assert from 'node:assert/strict';
import { runCampaign, cohortSeeds, replayMetrics } from '../scripts/balance-lab/core.ts';
test('les commandes de progression sont tracées avec leur vrai prix et rejouables', () => {
  const job = {
    id: 'combined',
    profile: 'ranged' as const,
    seed: 42,
    heroTraining: 'force' as const,
    encouragement: true,
  };
  const r = runCampaign(job);
  assert.notEqual(r.status, 'error', r.error);
  assert.notEqual(r.status, 'timeout');
  assert.ok(r.encouragements > 0 && r.encouragements <= 12);
  assert.equal(r.actualTraining, 'force');
  assert.ok(r.actions.some((a) => a.kind === 'training' && a.cost === 90));
  assert.deepEqual(replayMetrics(runCampaign(r.replay)), replayMetrics(r));
});
test('seize nouvelles graines de campagne ne réutilisent aucune des80 graines historiques', () => {
  const stages = [
    'discovery',
    'confirmation',
    'holdout',
    'discovery2',
    'confirmation2',
    'rewards017',
  ] as const;
  const seeds = cohortSeeds('campaign018');
  assert.equal(seeds.length, 16);
  assert.equal(new Set([...stages.flatMap(cohortSeeds), ...seeds]).size, 96);
});
