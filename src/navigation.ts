import { LANES } from './ai.ts';
import { levelForWave } from './levels.ts';
import type { Level } from './levels.ts';
import * as TEXT from './texts/fr/battle.ts';
export type Point = { x: number; y: number };
export const CELL = 24,
  COLS = 46,
  ROWS = 26;
/** Compatibility export: the original terrain, never a mutable active map. */
export function blocked(x: number, y: number, level: Level = levelForWave(1)): boolean {
  return (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 24 ||
    x > 1080 ||
    y < 96 ||
    y > 552 ||
    (x > 480 && x < 576 && !LANES.some((lane) => Math.abs(y - lane) <= 36)) ||
    level.rocks.some((r) => Math.hypot(x - r.x, y - r.y) < r.r)
  );
}
const center = (n: number) => n * CELL + CELL / 2;
const cache = new Map<string, Point[]>();
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
export function findPath(from: Point, to: Point, level: Level = levelForWave(1)): Point[] {
  if (![from.x, from.y, to.x, to.y].every(Number.isFinite)) return [];
  const sx = Math.floor(from.x / CELL),
    sy = Math.floor(from.y / CELL),
    tx = Math.floor(to.x / CELL),
    ty = Math.floor(to.y / CELL);
  const key = `${level.id}:${sx},${sy}:${tx},${ty}`;
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

/** A legal camp point, with reservations used when moving a whole surviving army. */
export function nearestCampPoint(
  goal: Point,
  level: Level = levelForWave(1),
  reserved: readonly Point[] = [],
): Point {
  if (!Number.isFinite(goal.x) || !Number.isFinite(goal.y))
    throw new RangeError(TEXT.coordonneesDeCampInvalides);
  goal = { x: Math.max(600, Math.min(984, goal.x)), y: Math.max(108, Math.min(540, goal.y)) };
  const legal = (p: Point) =>
    !blocked(p.x, p.y, level) &&
    !blocked(center(Math.floor(p.x / CELL)), center(Math.floor(p.y / CELL)), level) &&
    !reserved.some((r) => Math.hypot(r.x - p.x, r.y - p.y) < 28);
  if (legal(goal)) return goal;
  const candidates: Point[] = [];
  for (let x = 600; x <= 984; x += CELL / 2)
    for (let y = 108; y <= 540; y += CELL / 2) {
      const p = { x, y };
      if (legal(p)) candidates.push(p);
    }
  const closest = candidates.sort(
    (a, b) =>
      Math.hypot(a.x - goal.x, a.y - goal.y) - Math.hypot(b.x - goal.x, b.y - goal.y) ||
      a.y - b.y ||
      a.x - b.x,
  )[0];
  // A full camp must not silently receive an occupied or blocked point.
  if (!closest) throw new Error(TEXT.aucunePlaceLibreDansLeCamp);
  return closest;
}
