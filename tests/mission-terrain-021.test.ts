import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { LANES } from '../src/ai.ts';
import * as levels from '../src/levels.ts';
import * as routes from '../src/routes.ts';
import { blocked, findPath } from '../src/navigation.ts';
import type { Point } from '../src/navigation.ts';

function missionLevel(layout: 0 | 1 | 2) {
  assert.equal(typeof levels.missionLevel, 'function', 'les terrains de mission existent');
  return levels.missionLevel(layout);
}

function clearSegments(points: readonly Point[], level: levels.Level) {
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)],
      b = points[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
    for (let n = 0; n <= steps; n++) {
      const x = a.x + ((b.x - a.x) * n) / steps,
        y = a.y + ((b.y - a.y) * n) / steps;
      assert.equal(blocked(x, y, level), false, `${level.id}: obstacle à ${x},${y}`);
    }
  }
}

test('les trois dispositions de clairière ont des identités, courbes et rochers distincts', () => {
  const maps = ([0, 1, 2] as const).map(missionLevel);
  assert.equal(
    new Set(
      [...maps, levels.levelForWave(1), levels.levelForWave(5), levels.levelForWave(9)].map(
        (l) => l.id,
      ),
    ).size,
    6,
    'le cache A* sépare les terrains',
  );
  assert.equal(new Set(maps.map((l) => JSON.stringify(l.rocks))).size, 3);
  assert.equal(new Set(maps.map((l) => JSON.stringify(routes.routeJunctions(l)))).size, 3);
  for (let lane = 0; lane < 3; lane++)
    assert.equal(new Set(maps.map((l) => JSON.stringify(routes.laneRoad(lane, l)))).size, 3);
  for (const level of maps) {
    assert.equal(level.artId, 'clearing');
    assert.ok(
      Object.isFrozen(level) && Object.isFrozen(level.layout) && Object.isFrozen(level.rocks),
    );
  }
});

test('les trois voies et leurs traces traversent chaque disposition sans obstacle ni saut', () => {
  for (const layout of [0, 1, 2] as const) {
    const level = missionLevel(layout);
    for (let lane = 0; lane < 3; lane++) {
      for (const track of [-11, 0, 11]) {
        const points = Array.from({ length: 925 }, (_, n) =>
          routes.lanePoint(108 + n, lane, level, track),
        );
        clearSegments(points, level);
        for (let i = 1; i < points.length; i++)
          assert.ok(
            Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y) < 4,
            'courbe continue, y compris la convergence finale au refuge',
          );
      }
      for (let x = 480; x <= 576; x++)
        assert.equal(routes.lanePoint(x, lane, level).y, LANES[lane]);
      const path = findPath({ x: 108, y: LANES[lane] }, { x: 1032, y: 324 }, level);
      assert.ok(path.length > 0 && path.length < 100, 'A* trouve un trajet fini');
      clearSegments([{ x: 108, y: LANES[lane] }, ...path], level);
      clearSegments(
        [
          { x: 108, y: LANES[lane] },
          ...routes.roadLeg({ x: 108, y: LANES[lane] }, 1032, lane, level, 11),
        ],
        level,
      );
    }
  }
});

test('les jonctions déplacées rejoignent exactement les voies et relient les trois passages', () => {
  for (const layout of [0, 1, 2] as const) {
    const level = missionLevel(layout);
    for (const x of routes.routeJunctions(level)) {
      clearSegments(routes.junctionRoad(x, level), level);
      for (let lane = 0; lane < 3; lane++) {
        const p = routes.lanePoint(x, lane, level);
        assert.deepEqual(p, routes.junctionPoint(x, LANES[lane], level));
        for (const y of LANES) {
          clearSegments([p, ...routes.junctionLeg(p, y, x, level)], level);
          if (y !== p.y) assert.ok(findPath(p, { x, y }, level).length > 0);
        }
      }
    }
  }
});

test('les trois terrains et routes classiques gardent leurs coordonnées exactes', () => {
  const hashes = [
    '85ea4b71ca0affc3b79618dd2c9824f47b87212ecc98ffe489d1382469767bb6',
    '6a77b5bc3facab1f9b35afd0153b98d3b8c24105e5a8a8dc4b6c5f554c2d890e',
    'c75881b37a9e3722f9679794019bd183e08ad7fa0f83b7b2743c55bbba59e932',
  ];
  for (const [i, wave] of [1, 5, 9].entries()) {
    const level = levels.levelForWave(wave);
    const snapshot = {
      level,
      lanes: [0, 1, 2].map((lane) => routes.laneRoad(lane, level)),
      junctions: [372, 684].map((x) => routes.junctionRoad(x)),
    };
    assert.equal(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), hashes[i]);
  }
});
