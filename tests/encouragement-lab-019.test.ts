import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { runCampaign, replayMetrics, cohortSeeds } from '../scripts/balance-lab/core.ts';

test('un timing demandé à 1,5 s passe par la commande réelle et reste rejouable', () => {
  const job = {
    id: 'timing-fixture',
    profile: 'mixed' as const,
    seed: 42,
    encouragement: true,
    encouragementAtSeconds: 1.5,
    limits: { maxWaveSeconds: 2 },
  };
  const result = runCampaign(job);
  assert.equal(result.status, 'timeout');
  const action = result.actions.find((a) => a.kind === 'encourage');
  assert.ok(action, 'le timing demandé est ignoré si aucun encouragement n’est tracé');
  assert.ok(Math.abs(action.time - 11.5) < 1 / 30);
  assert.equal(action.cost, 0);
  assert.equal(result.encouragements, 1);
  assert.deepEqual(replayMetrics(runCampaign(result.replay)), replayMetrics(result));
});

test('les timings non finis et politiques inconnues sont refusés explicitement', () => {
  for (const extra of [
    { encouragementAtSeconds: NaN },
    { encouragementAtSeconds: -1 },
    { encouragementAtSeconds: 241 },
    { encouragementTiming: 'invisible' },
  ]) {
    const result = runCampaign({
      id: 'invalid-timing',
      profile: 'mixed',
      seed: 1,
      encouragement: true,
      ...extra,
    } as never);
    assert.equal(result.status, 'error');
    assert.match(result.error!, /encouragement policy/i);
  }
});

test('l’observation du premier contact attend une vraie attaque sans toucher au moteur', async () => {
  const { shouldEncourage } = await import('../scripts/balance-lab/encouragement.ts');
  const g = new Game(42);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const unit = g.units.find((u) => u.kind === 'hero')!;
  const foe = g.enemies[0];
  const config = { encouragement: true, encouragementTiming: 'contact' as const };
  assert.equal(shouldEncourage(g, 80, config), false);
  Object.assign(foe, { x: unit.x - 25, y: unit.y, hp: 10000, maxHp: 10000, cool: 99 });
  unit.cool = 0;
  g.step(1 / 30);
  assert.equal(unit.state, 'attack');
  const before = JSON.stringify(g);
  assert.equal(shouldEncourage(g, 0.1, config), true);
  assert.equal(JSON.stringify(g), before);
  g.encourage();
  assert.equal(shouldEncourage(g, 0.1, config), false);
});

test('découverte et validation 0.19 ne réutilisent aucune graine des cohortes précédentes', () => {
  const prior = [
    'discovery',
    'confirmation',
    'holdout',
    'discovery2',
    'confirmation2',
    'rewards017',
    'campaign018',
  ] as const;
  const discovery = cohortSeeds('rhythm019' as never),
    validation = cohortSeeds('adventure019' as never);
  assert.equal(discovery.length, 8);
  assert.equal(validation.length, 16);
  assert.equal(new Set([...prior.flatMap(cohortSeeds), ...discovery, ...validation]).size, 120);
});
