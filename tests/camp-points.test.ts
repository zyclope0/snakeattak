import test from 'node:test';
import assert from 'node:assert/strict';
import { blocked, CELL, nearestCampPoint } from '../src/navigation.ts';
import type { Point } from '../src/navigation.ts';
import { levelForWave, missionLevel } from '../src/levels.ts';
import type { Level } from '../src/levels.ts';
import { CAMP_BOTTOM, CAMP_LEFT, CAMP_RIGHT, CAMP_TOP } from '../src/boardLandmarks.ts';
import { seededStream } from '../src/seededRandom.ts';

// The camp points of a map are now found once and the nearest is picked without sorting.
// This is the rule as it was written before: every point tried, then sorted. An ally sent
// to another place is a game that changes; the two must agree everywhere.
function asBefore(goal: Point, level: Level, reserved: readonly Point[]): Point | null {
  goal = {
    x: Math.max(CAMP_LEFT, Math.min(CAMP_RIGHT, goal.x)),
    y: Math.max(CAMP_TOP, Math.min(CAMP_BOTTOM, goal.y)),
  };
  const center = (n: number) => n * CELL + CELL / 2;
  const legal = (p: Point) =>
    !blocked(p.x, p.y, level) &&
    !blocked(center(Math.floor(p.x / CELL)), center(Math.floor(p.y / CELL)), level) &&
    !reserved.some((r) => Math.hypot(r.x - p.x, r.y - p.y) < 28);
  if (legal(goal)) return goal;
  const candidates: Point[] = [];
  for (let x = CAMP_LEFT; x <= CAMP_RIGHT; x += CELL / 2)
    for (let y = CAMP_TOP; y <= CAMP_BOTTOM; y += CELL / 2) {
      const p = { x, y };
      if (legal(p)) candidates.push(p);
    }
  return (
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - goal.x, a.y - goal.y) - Math.hypot(b.x - goal.x, b.y - goal.y) ||
        a.y - b.y ||
        a.x - b.x,
    )[0] ?? null
  );
}
const LEVELS: readonly Level[] = [
  levelForWave(1),
  levelForWave(6),
  levelForWave(11),
  missionLevel(0),
  missionLevel(1),
  missionLevel(2),
];

test('the nearest camp point is the one the sorted search gave, on every map', () => {
  const next = seededStream(4242);
  let moved = 0;
  for (const level of LEVELS)
    for (let i = 0; i < 1500; i++) {
      // Goals on the grid, between its lines, on the edges and outside the camp; with a
      // crowd around the goal one time in two, as when a whole army is placed.
      const wide = i % 5 === 0;
      const goal = {
        x: wide ? next() * 1200 - 100 : CAMP_LEFT + next() * (CAMP_RIGHT - CAMP_LEFT),
        y: wide ? next() * 800 - 100 : CAMP_TOP + next() * (CAMP_BOTTOM - CAMP_TOP),
      };
      if (i % 7 === 0)
        [goal.x, goal.y] = [Math.round(goal.x / 12) * 12, Math.round(goal.y / 12) * 12];
      const reserved: Point[] = [];
      if (i % 2)
        for (let n = Math.floor(next() * 40); n > 0; n--)
          reserved.push({ x: goal.x + (next() - 0.5) * 160, y: goal.y + (next() - 0.5) * 160 });
      const expected = asBefore(goal, level, reserved);
      assert.ok(expected, 'the camp is never full here');
      const found = nearestCampPoint(goal, level, reserved);
      assert.deepEqual(found, expected, `${level.name ?? ''} ${JSON.stringify(goal)}`);
      if (found.x !== goal.x || found.y !== goal.y) moved++;
    }
  // Many goals really fell in a rock or on a taken place: the search itself is compared.
  assert.ok(moved > 1000, `${moved} goals moved`);
});

test('a point given back is never one the map keeps: changing it changes nothing after', () => {
  const level = levelForWave(1);
  const inRock = level.rocks[0]!;
  const first = nearestCampPoint({ x: inRock.x, y: inRock.y }, level);
  assert.notDeepEqual(first, { x: inRock.x, y: inRock.y });
  const copy = { ...first };
  first.x += 500;
  assert.deepEqual(nearestCampPoint({ x: inRock.x, y: inRock.y }, level), copy);
});

test('a camp with no place left still says so', () => {
  const level = levelForWave(1);
  const everywhere: Point[] = [];
  for (let x = CAMP_LEFT - 12; x <= CAMP_RIGHT + 12; x += 12)
    for (let y = CAMP_TOP - 12; y <= CAMP_BOTTOM + 12; y += 12) everywhere.push({ x, y });
  assert.throws(() => nearestCampPoint({ x: 800, y: 300 }, level, everywhere));
});
