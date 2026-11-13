import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { decideTemptation, FEAST_DURATION } from '../src/tactics.ts';
import { chooseLane } from '../src/ai.ts';

test('un goûter gratuit par vague, seulement pendant le combat et sur une vraie voie', () => {
  const g = new Game();
  assert.equal(g.offerFeast(0), false);
  g.startWave();
  const gold = g.gold;
  for (const lane of [-1, 3, 0.5, NaN, Infinity]) assert.equal(g.offerFeast(lane), false);
  g.paused = true;
  assert.equal(g.offerFeast(1), false);
  g.paused = false;
  assert.equal(g.offerFeast(1), true);
  assert.equal(g.feast?.lane, 1);
  assert.equal(g.gold, gold);
  assert.equal(g.offerFeast(2), false);
});
test('le miel expire après 14 secondes de jeu, la pause ne consomme rien', () => {
  const g = new Game();
  g.startWave();
  g.offerFeast(0);
  g.paused = true;
  g.step(0.05);
  assert.equal(g.feast?.remaining, FEAST_DURATION);
  g.paused = false;
  for (let i = 0; i < FEAST_DURATION * 30; i++) g.step(1 / 30);
  assert.equal(g.feast, null);
  assert.equal(g.offerFeast(2), false);
});
test('nouvelle vague recharge le goûter et retire le pot précédent', () => {
  const g = new Game();
  g.startWave();
  g.offerFeast(0);
  g.remaining = 0;
  g.enemies = [];
  g.eggs = [];
  g.step(0.05);
  assert.equal(g.status, 'preparing');
  assert.equal(g.feast, null);
  g.startWave();
  assert.equal(g.offerFeast(2), true);
});
test('sans goûter, la stratégie et le hasard existants sont conservés', () => {
  for (let i = 0; i < 100; i++)
    assert.equal(
      decideTemptation([8, 0, 4], 6, i / 100, null, false).lane,
      chooseLane([8, 0, 4], 6, i / 100),
    );
});
test('le goûter attire même vers une voie défendue mais ne commande pas tous les serpents ; boss plus méfiant', () => {
  const counts = [0, 0];
  let normal = 0,
    boss = 0;
  for (let i = 0; i < 1000; i++) {
    const r = (i + 0.5) / 1000;
    if (decideTemptation([10, 0, 0], 6, r, 0, false).lane === 0) normal++;
    if (decideTemptation([10, 0, 0], 6, r, 0, true).lane === 0) boss++;
    counts[decideTemptation([10, 0, 0], 6, r, 0, false).lane === 0 ? 0 : 1]++;
  }
  assert.ok(normal >= 750 && normal < 950);
  assert.ok(boss < normal - 300);
  assert.ok(counts.every((n) => n > 0));
});
test('le miel change les vraies décisions à la jonction, sans téléporter les monstres', () => {
  let attracted = 0;
  for (let seed = 0; seed < 40; seed++) {
    const g = new Game(seed * 10000019);
    g.startWave();
    g.step(0.05);
    g.offerFeast(2);
    const e = g.enemies[0];
    e.x = 372;
    e.y = 180;
    e.lane = 0;
    e.stage = 0;
    g.step(0.05);
    if (e.lane === 2) {
      attracted++;
      assert.equal(e.turnY, 468);
    }
    assert.equal(e.x, 372);
    assert.equal(e.y, 180);
  }
  assert.ok(attracted >= 28);
});
