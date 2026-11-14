import test from 'node:test';
import assert from 'node:assert/strict';
import { REWARDS } from '../src/rewards.ts';
import { planVoyage } from '../src/voyage.ts';
import { decodeVoyage } from '../src/voyageCode.ts';
import { VOYAGE_TUNINGS } from '../src/voyageTuning.ts';
import { PROFILES } from '../scripts/voyage-lab/players.ts';
import { summarize } from '../scripts/voyage-lab/report.ts';
import { RAW_TUNING, REASONABLE_ORDER } from '../scripts/voyage-lab/tables.ts';
import { POLICIES, playVoyage, seedAt } from '../scripts/voyage-lab/travel.ts';

// Le laboratoire d'équilibrage du voyage (`npm run balance:voyage`) : ses comptes doivent
// être reproductibles, sinon deux mesures ne se comparent pas.
const tuning = VOYAGE_TUNINGS[1];

test('the lab plays the voyage of the game, the same way every time', () => {
  const seed = seedAt(0);
  const first = playVoyage(seed, 'moyen', 'raisonnable', tuning);
  assert.deepEqual(playVoyage(seed, 'moyen', 'raisonnable', tuning), first);
  assert.deepEqual(decodeVoyage(first.code), { ok: true, seed, version: 1 });
  const plan = planVoyage(seed)!;
  assert.equal(first.stages.length, 5);
  for (const [index, row] of first.stages.entries()) {
    assert.equal(row.mission, plan.stages[index].run.missionId);
    assert.equal(row.caprice, plan.stages[index].run.caprice ?? null);
    assert.ok(['won', 'lost', 'timeout'].includes(row.status));
    assert.ok(row.seconds > 0 && row.wave >= 1 && row.minBase <= 100 && row.minBase >= 0);
    // The reasonable bag keeps the first offered card of its order of preference.
    if (index < 4) {
      const offer = plan.stages[index].offer;
      assert.equal(
        row.card,
        REASONABLE_ORDER.find((card) => offer.includes(card)),
      );
    } else assert.equal(row.card, null);
  }
  const fell = first.stages.findIndex((row) => row.status !== 'won');
  assert.equal(first.won, fell < 0 ? 5 : fell);
});

test('every way to fill the bag is known, and an empty bag stays empty', () => {
  assert.deepEqual([...REASONABLE_ORDER].sort(), Object.keys(REWARDS).sort());
  assert.equal(POLICIES.length, 3 + Object.keys(REWARDS).length);
  const seed = seedAt(1);
  assert.ok(playVoyage(seed, 'petit', 'aucun', tuning).stages.every((row) => row.card === null));
  const honey = playVoyage(seed, 'petit', 'sac:miel', tuning).stages.map((row) => row.card);
  assert.deepEqual(honey, ['miel', 'miel', 'miel', 'miel', null]);
  assert.deepEqual([...PROFILES], ['expert', 'moyen', 'petit', 'massues', 'gros']);
  assert.equal(RAW_TUNING.stages.length, 5);
});

test('the report counts finished voyages, falls and stages over what was played', () => {
  const seeds = [seedAt(2), seedAt(3)];
  const voyages = seeds.flatMap((seed) => [
    playVoyage(seed, 'moyen', 'raisonnable', tuning),
    playVoyage(seed, 'moyen', 'aucun', tuning),
  ]);
  const meta = {
    profiles: ['moyen'],
    policies: ['raisonnable', 'aucun'],
    seeds: 2,
    table: '1',
    tuning,
  };
  const report = summarize(voyages, meta);
  for (const policy of meta.policies) {
    const stats = report.results.moyen[policy];
    const mine = voyages.filter((voyage) => voyage.policy === policy);
    assert.equal(stats.voyages, 2);
    assert.equal(stats.finishedRate, mine.filter((voyage) => voyage.won === 5).length / 2);
    const falls = stats.fallRates.reduce((sum, value) => sum + value, 0);
    assert.ok(Math.abs(falls + stats.finishedRate - 1) < 1e-9);
    assert.equal(stats.meanWon, (mine[0].won + mine[1].won) / 2);
    assert.equal(stats.stages.length, 5);
    for (const [index, stage] of stats.stages.entries()) {
      assert.equal(stage.played, 2);
      const wins = mine.filter((voyage) => voyage.stages[index].status === 'won').length;
      assert.equal(stage.winRate, wins / 2);
    }
  }
  // One line per stage, mission and caprice met with the first way to fill the bag.
  const played = report.cells.reduce(
    (sum, cell) => sum + Number(cell.rates.moyen.split('/')[1]),
    0,
  );
  assert.equal(played, 10);
  assert.equal(report.extremes.hardest.length, 2);
  assert.deepEqual(
    report.extremes.hardest.map((entry) => entry.seed).sort(),
    report.extremes.easiest.map((entry) => entry.seed).sort(),
  );
});
