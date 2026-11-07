import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCandidates } from '../scripts/balance-selection.ts';
const profileNames = [
  'mixed',
  'melee',
  'ranged',
  'heavy',
  'dinosaurs',
  'mutants',
  'casual',
  'clustered',
];
function summary(id: string, rates: number[], extra = {}) {
  return {
    id,
    games: 80,
    wins: Math.round(rates.reduce((a, b) => a + b, 0) * 10),
    winRate: rates.reduce((a, b) => a + b, 0) / 8,
    earlyLosses: 0,
    timeouts: 0,
    errors: 0,
    medianBossSeconds: 30,
    meanShieldsBroken: 3,
    meanShotsFired: 3,
    profiles: profileNames.map((profile, i) => ({ profile, winRate: rates[i] })),
    ...extra,
  };
}
test('le classement préfère des stratégies viables variées à une victoire garantie', () => {
  const baseline = summary('baseline', [0.7, 0.5, 1, 0.7, 0.8, 0.7, 0.7, 0.7]);
  const result = rankCandidates([
    baseline,
    summary('easy', Array(8).fill(1)),
    summary('fair', Array(8).fill(0.75)),
    summary('brutal', Array(8).fill(0.1)),
  ]);
  assert.equal(result[0].id, 'fair');
  assert.equal(
    result.some((r) => r.id === 'baseline'),
    false,
  );
  assert.equal(result.find((r) => r.id === 'brutal')!.eligible, false);
});
test('un blocage reste visible et disqualifie le réglage même s’il gagne beaucoup', () => {
  const result = rankCandidates([
    summary('baseline', Array(8).fill(0.75)),
    summary('bad', Array(8).fill(0.9), { timeouts: 1 }),
    summary('good', Array(8).fill(0.75)),
  ]);
  assert.equal(result[0].id, 'good');
  assert.equal(result.find((r) => r.id === 'bad')!.eligible, false);
});
test('le profil spontané et les nouvelles défaites précoces ne sont pas masqués par une bonne moyenne', () => {
  const baseline = summary('baseline', Array(8).fill(0.75), { earlyLosses: 4 });
  const ranked = rankCandidates([
    baseline,
    summary('sacrifice', [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0, 0.9]),
    summary('hidden-regression', Array(8).fill(0.75), { earlyLosses: 4, newEarlyLosses: 20 }),
    summary('fair', Array(8).fill(0.75)),
  ]);
  assert.equal(ranked[0].id, 'fair');
  assert.equal(ranked.find((c) => c.id === 'sacrifice')!.eligible, false);
  assert.equal(ranked.find((c) => c.id === 'hidden-regression')!.eligible, false);
});
