import test from 'node:test';
import assert from 'node:assert/strict';
import { blocked, CELL, COLS, ROWS, findPath, PATH_CACHE_SIZE } from '../src/navigation.ts';
import type { PathRules, Point } from '../src/navigation.ts';
import { reliefTeams } from '../src/defenders.ts';
import { canEngage } from '../src/defenders.ts';
import { diving } from '../src/engine/swim.ts';
import { levelForWave, missionLevel } from '../src/levels.ts';
import type { Level } from '../src/levels.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import type { Entity } from '../src/game.ts';
import { CAMP_FRONT_X } from '../src/boardLandmarks.ts';
import { LANES } from '../src/ai.ts';
import { seededStream } from '../src/seededRandom.ts';

// Lot A of the council report on the endless adventure (26 November 2026): A* keeps its open
// list in a heap, reads the blocked cells of a map from a grid measured once, and its cache
// forgets the oldest paths; the relief teams take the two nearest fighters in one pass. The
// rules as they were written before are copied here: a path or a team that changes is a game
// that changes, so the two must agree everywhere.

const center = (n: number) => n * CELL + CELL / 2;
/** The second path rules' edge test, as written before. */
function clearEdgeBefore(x: number, y: number, dx: number, dy: number, level: Level): boolean {
  if (blocked(center(x), center(y), level)) return true;
  for (let i = 2; i < CELL; i += 2)
    for (const side of [-1, 0, 1])
      if (blocked(center(x) + dx * i + dy * side, center(y) + dy * i + dx * side, level))
        return false;
  return true;
}
function fromStartBefore(from: Point, path: Point[], level: Level): Point[] {
  const copy = path.map((p) => ({ ...p })),
    next = copy[0];
  if (!next) return copy;
  const length = Math.hypot(next.x - from.x, next.y - from.y),
    steps = Math.ceil(length / 2);
  for (let i = 1; i <= steps; i++)
    if (
      blocked(
        from.x + ((next.x - from.x) * i) / steps,
        from.y + ((next.y - from.y) * i) / steps,
        level,
      )
    ) {
      const start = { x: center(Math.floor(from.x / CELL)), y: center(Math.floor(from.y / CELL)) };
      return blocked(start.x, start.y, level) ? [] : [start, ...copy];
    }
  return copy;
}
/** A* as written before: the whole open list sorted before each node, no cache. */
function findPathBefore(from: Point, to: Point, level: Level, rules: PathRules): Point[] {
  if (![from.x, from.y, to.x, to.y].every(Number.isFinite)) return [];
  const sx = Math.floor(from.x / CELL),
    sy = Math.floor(from.y / CELL),
    tx = Math.floor(to.x / CELL),
    ty = Math.floor(to.y / CELL);
  if (blocked(center(tx), center(ty), level)) return [];
  const start = sy * COLS + sx,
    end = ty * COLS + tx;
  const open = [{ id: start, g: 0, f: 0 }],
    cost = new Map([[start, 0]]),
    parent = new Map<number, number>();
  while (open.length) {
    open.sort((a, b) => a.f - b.f || a.id - b.id);
    const n = open.shift()!;
    if (n.id === end) {
      const path: Point[] = [];
      let id = end;
      while (id !== start) {
        path.unshift({ x: center(id % COLS), y: center(Math.floor(id / COLS)) });
        id = parent.get(id)!;
      }
      return fromStartBefore(from, path, level);
    }
    const x = n.id % COLS,
      y = Math.floor(n.id / COLS);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || blocked(center(nx), center(ny), level))
        continue;
      if (rules === 2 && !clearEdgeBefore(x, y, dx, dy, level)) continue;
      const id = ny * COLS + nx,
        g = n.g + 1;
      if (g >= (cost.get(id) ?? Infinity)) continue;
      cost.set(id, g);
      parent.set(id, n.id);
      open.push({ id, g, f: g + Math.abs(nx - tx) + Math.abs(ny - ty) });
    }
  }
  return [];
}
const LEVELS: readonly Level[] = [
  levelForWave(1),
  levelForWave(6),
  levelForWave(11),
  missionLevel(0),
  missionLevel(1),
  missionLevel(2),
];

test('A* with its heap and its grid finds the path the sorted search found, on every map', () => {
  const next = seededStream(20261126);
  const asked: [Point, Point, Level, PathRules][] = [];
  let found = 0;
  for (const level of LEVELS)
    for (const rules of [1, 2] as const)
      for (let i = 0; i < 260; i++) {
        // Anywhere on the board, now and then off it or on a cell edge.
        const wide = i % 9 === 0;
        const point = () => ({
          x: wide ? next() * 1300 - 100 : 24 + next() * 1056,
          y: wide ? next() * 800 - 100 : 96 + next() * 456,
        });
        const from = point(),
          to = point();
        if (i % 7 === 0) [to.x, to.y] = [Math.round(to.x / 24) * 24, Math.round(to.y / 24) * 24];
        asked.push([from, to, level, rules]);
        const path = findPath(from, to, level, rules);
        assert.deepEqual(path, findPathBefore(from, to, level, rules), `${level.id} ${rules}`);
        if (path.length) found++;
      }
  assert.ok(found > 2000, `${found} paths found`);
  // Asked again, some from the cache, some measured again after being forgotten: the same.
  for (const [from, to, level, rules] of asked.slice(-600).concat(asked.slice(0, 300)))
    assert.deepEqual(findPath(from, to, level, rules), findPathBefore(from, to, level, rules));
});

test('the path cache forgets the oldest path, never a path just asked again', () => {
  const level = levelForWave(1);
  // A path kept from the start, asked again all along: it stays while thousands come and go.
  const kept = findPath({ x: 640, y: 180 }, { x: 960, y: 468 }, level);
  for (let i = 0; i < PATH_CACHE_SIZE * 3; i++) {
    const from = { x: 612 + (i % 15) * 24, y: 120 + (Math.floor(i / 15) % 18) * 24 };
    findPath(from, { x: 900 + (i % 3) * 24, y: 132 + Math.floor(i / 45) * 24 }, level, 2);
    if (i % 100 === 0)
      assert.deepEqual(findPath({ x: 640, y: 180 }, { x: 960, y: 468 }, level), kept);
  }
  assert.deepEqual(findPath({ x: 640, y: 180 }, { x: 960, y: 468 }, level), kept);
});

/** The relief teams as written before: every candidate sorted, the first two kept. */
function reliefTeamsBefore(units: Entity[], enemies: Entity[]): Map<number, Set<number>> {
  const nearestFirst = (target: Point) => (a: Entity, b: Entity) =>
    Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y) ||
    a.id - b.id;
  const teams = new Map<number, Set<number>>();
  const bridgeTeams = new Map<number, Set<number>>();
  const fighters = units.filter((u) => u.hp > 0 && kinds[u.kind as Kind]?.damage > 0 && !diving(u));
  for (const e of enemies)
    if (e.hp > 0 && e.state === 'attack') {
      const engaged = fighters.filter(
        (u) =>
          canEngage(u, e) && Math.hypot(u.x - e.x, u.y - e.y) <= kinds[u.kind as Kind].range + 20,
      );
      const crowded =
        e.x < CAMP_FRONT_X &&
        enemies.filter((v) => v.hp > 0 && Math.hypot(v.x - e.x, v.y - e.y) < 84).length >= 3;
      if (engaged.length && !crowded) continue;
      if (crowded && bridgeTeams.has(e.lane)) {
        teams.set(e.id, bridgeTeams.get(e.lane)!);
        continue;
      }
      const primary = crowded ? [...engaged].sort(nearestFirst(e))[0] : undefined;
      const nearest = fighters
        .filter((u) => (crowded ? u !== primary : !engaged.includes(u)))
        .sort(nearestFirst(e))
        .slice(0, 2);
      teams.set(e.id, new Set(nearest.map((u) => u.id)));
      if (crowded) bridgeTeams.set(e.lane, teams.get(e.id)!);
    }
  return teams;
}

test('the relief teams are the ones the sorted search gave, crowds and ties included', () => {
  const next = seededStream(7);
  const allies = (Object.keys(kinds) as Kind[]).filter((k) => k !== 'hero');
  const entity = (id: number, over: Partial<Entity>): Entity =>
    ({
      id,
      kind: 'snake',
      variant: 'normal',
      x: 0,
      y: 0,
      hp: 50,
      maxHp: 50,
      homeX: 0,
      homeY: 0,
      lane: 0,
      state: 'move',
      ...over,
    }) as Entity;
  let sent = 0;
  for (let round = 0; round < 400; round++) {
    let id = 0;
    const units: Entity[] = [];
    for (let n = Math.floor(next() * 40); n > 0; n--) {
      // Allies on a coarse grid now and then: equal distances, broken by the lower id.
      const coarse = round % 3 === 0;
      const x = coarse ? 612 + Math.floor(next() * 8) * 48 : 560 + next() * 440,
        y = coarse ? 132 + Math.floor(next() * 8) * 48 : 110 + next() * 430;
      units.push(
        entity(id++, {
          kind: allies[Math.floor(next() * allies.length)],
          x,
          y,
          homeX: x,
          homeY: y,
          hp: next() < 0.1 ? 0 : 40,
        }),
      );
    }
    const enemies: Entity[] = [];
    for (let n = Math.floor(next() * 30); n > 0; n--) {
      const lane = Math.floor(next() * 3);
      // Crowds before the camp's front, others in the camp.
      const before = next() < 0.6;
      enemies.push(
        entity(id++, {
          lane,
          x: before ? CAMP_FRONT_X - 120 + next() * 110 : CAMP_FRONT_X + next() * 380,
          y: LANES[lane] + (next() - 0.5) * 60,
          state: next() < 0.7 ? 'attack' : 'move',
          hp: next() < 0.1 ? 0 : 30,
        }),
      );
    }
    // The ids are shuffled: the teams must never depend on the order of the lists.
    const shuffled = units.slice().sort(() => next() - 0.5);
    const expected = reliefTeamsBefore(shuffled, enemies);
    assert.deepEqual(reliefTeams(shuffled, enemies), expected, `round ${round}`);
    sent += expected.size;
  }
  assert.ok(sent > 1000, `${sent} teams sent`);
});
