import test from 'node:test';
import assert from 'node:assert/strict';
import { stageTheme, stageComposition } from '../src/render/stageLayout.ts';
import { levelForWave, missionLevel } from '../src/levels.ts';
import { laneRoad } from '../src/routes.ts';
import { blocked } from '../src/navigation.ts';

test('les trois chapitres ont des fonds distincts et toutes les missions utilisent le nouveau sol', () => {
  const classic = [1, 5, 9].map(levelForWave);
  assert.equal(new Set(classic.map((l) => stageTheme(l).ground)).size, 3);
  for (const layout of [0, 1, 2] as const)
    assert.equal(stageTheme(missionLevel(layout)).ground, 'ground-clearing');
});
test('la présentation ne change pas les parcours et obstacles des six terrains', () => {
  for (const level of [
    ...[1, 5, 9].map(levelForWave),
    ...[0, 1, 2].map((n) => missionLevel(n as 0 | 1 | 2)),
  ]) {
    const before = JSON.stringify(level),
      roads = [0, 1, 2].map((lane) => laneRoad(lane, level));
    const composition = stageComposition(level, 2026);
    stageTheme(level);
    assert.equal(JSON.stringify(level), before);
    assert.ok(composition.decor.length >= 10);
    for (const road of roads) for (const p of road) assert.equal(blocked(p.x, p.y, level), false);
  }
});
