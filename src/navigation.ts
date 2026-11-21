import { LANES } from './ai.ts';
import { levelForWave } from './levels.ts';
import type { Level } from './levels.ts';
import * as TEXT from './texts/fr/battle.ts';
import {
  BRIDGE_END_X,
  BRIDGE_HALF_WIDTH,
  CAMP_BOTTOM,
  CAMP_LEFT,
  CAMP_RIGHT,
  CAMP_TOP,
  RIVER_LEFT_X,
} from './boardLandmarks.ts';
export type Point = { x: number; y: number };
export const CELL = 24,
  COLS = 46,
  ROWS = 26;
/** In the river, beside the bridges: only a swimmer goes there. */
export const inRiver = (x: number, y: number): boolean =>
  x > RIVER_LEFT_X &&
  x < BRIDGE_END_X &&
  !LANES.some((lane) => Math.abs(y - lane) <= BRIDGE_HALF_WIDTH);
/** Compatibility export: the original terrain, never a mutable active map. */
export function blocked(x: number, y: number, level: Level = levelForWave(1)): boolean {
  return (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 24 ||
    x > 1080 ||
    y < 96 ||
    y > 552 ||
    inRiver(x, y) ||
    level.rocks.some((r) => Math.hypot(x - r.x, y - r.y) < r.r)
  );
}
const center = (n: number) => n * CELL + CELL / 2;
const cache = new Map<string, Point[]>();
/**
 * The rules of a path. The first ones join two neighbouring cells as soon as both centres are
 * free; a rock between them stopped the walker, who asked for the same path again and stood
 * there. The second ones (21 November 2026) also want the segment between the two centres
 * free. A game keeps the rules it started with: its departure code plays the same game.
 */
export type PathRules = 1 | 2;
/** What `clearEdge` found for each edge of a map: the terrain of a level never changes. */
const edges = new Map<string, Map<number, boolean>>();
/** The segment between two neighbouring cell centres is free: a walker can follow it. */
function clearEdge(x: number, y: number, dx: number, dy: number, level: Level): boolean {
  let known = edges.get(level.id);
  if (!known) edges.set(level.id, (known = new Map()));
  const key = ((y * COLS + x) * 3 + dx + 1) * 3 + dy + 1;
  let clear = known.get(key);
  if (clear === undefined) known.set(key, (clear = measureEdge(x, y, dx, dy, level)));
  return clear;
}
function measureEdge(x: number, y: number, dx: number, dy: number, level: Level): boolean {
  // Leaving a cell whose own centre is blocked stays allowed, as it always was.
  if (blocked(center(x), center(y), level)) return true;
  for (let i = 2; i < CELL; i += 2)
    for (const side of [-1, 0, 1])
      if (blocked(center(x) + dx * i + dy * side, center(y) + dy * i + dx * side, level))
        return false;
  return true;
}
function fromStart(from: Point, path: Point[], level: Level): Point[] {
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
export function findPath(
  from: Point,
  to: Point,
  level: Level = levelForWave(1),
  rules: PathRules = 1,
): Point[] {
  if (![from.x, from.y, to.x, to.y].every(Number.isFinite)) return [];
  const sx = Math.floor(from.x / CELL),
    sy = Math.floor(from.y / CELL),
    tx = Math.floor(to.x / CELL),
    ty = Math.floor(to.y / CELL);
  // The first rules keep the key they always had.
  const key = `${rules === 1 ? '' : `r${rules}:`}${level.id}:${sx},${sy}:${tx},${ty}`;
  const cached = cache.get(key);
  if (cached) return fromStart(from, cached, level);
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
      if (cache.size > 1024) cache.clear();
      cache.set(key, path);
      return fromStart(from, path, level);
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
      if (rules === 2 && !clearEdge(x, y, dx, dy, level)) continue;
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

const campLegal = (p: Point, level: Level) =>
  !blocked(p.x, p.y, level) &&
  !blocked(center(Math.floor(p.x / CELL)), center(Math.floor(p.y / CELL)), level);
/** The camp points an ally may stand on, for each map: the terrain of a level never changes. */
const campPoints = new WeakMap<Level, readonly Point[]>();
function campCandidates(level: Level): readonly Point[] {
  let points = campPoints.get(level);
  if (!points) {
    const found: Point[] = [];
    for (let x = CAMP_LEFT; x <= CAMP_RIGHT; x += CELL / 2)
      for (let y = CAMP_TOP; y <= CAMP_BOTTOM; y += CELL / 2) {
        const p = { x, y };
        if (campLegal(p, level)) found.push(p);
      }
    campPoints.set(level, (points = found));
  }
  return points;
}
/** A legal camp point, with reservations used when moving a whole surviving army. */
export function nearestCampPoint(
  goal: Point,
  level: Level = levelForWave(1),
  reserved: readonly Point[] = [],
): Point {
  if (!Number.isFinite(goal.x) || !Number.isFinite(goal.y))
    throw new RangeError(TEXT.coordonneesDeCampInvalides);
  goal = {
    x: Math.max(CAMP_LEFT, Math.min(CAMP_RIGHT, goal.x)),
    y: Math.max(CAMP_TOP, Math.min(CAMP_BOTTOM, goal.y)),
  };
  const free = (p: Point) => !reserved.some((r) => Math.hypot(r.x - p.x, r.y - p.y) < 28);
  if (campLegal(goal, level) && free(goal)) return goal;
  // The nearest legal candidate: by distance, then by y, then by x (the order the sort had).
  let closest: Point | undefined,
    best = Infinity;
  for (const c of campCandidates(level)) {
    if (!free(c)) continue;
    const d = Math.hypot(c.x - goal.x, c.y - goal.y);
    if (
      !closest ||
      d < best ||
      (d === best && (c.y < closest.y || (c.y === closest.y && c.x < closest.x)))
    ) {
      closest = c;
      best = d;
    }
  }
  if (closest) closest = { x: closest.x, y: closest.y };
  // A full camp must not silently receive an occupied or blocked point.
  if (!closest) throw new Error(TEXT.aucunePlaceLibreDansLeCamp);
  return closest;
}
