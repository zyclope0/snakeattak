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
/**
 * One side of the gap (dx, dy) alone reaches `limit`: `Math.hypot(dx, dy) < limit` is false,
 * and is not computed. Math.hypot is never below the larger of its two sides: V8 divides both
 * by that side, which then adds exactly 1 under the root; an engine whose hypot errs by less
 * than an ulp cannot fall under a number the true length reaches. Most pairs of the board are
 * far apart: this skips most calls, and every answer is still the one Math.hypot gives.
 */
export const notCloserThan = (dx: number, dy: number, limit: number): boolean =>
  Math.abs(dx) >= limit || Math.abs(dy) >= limit;
/** The same for `Math.hypot(dx, dy) <= limit`: one side alone is more than `limit`. */
export const fartherThan = (dx: number, dy: number, limit: number): boolean =>
  Math.abs(dx) > limit || Math.abs(dy) > limit;
/** In the river, beside the bridges: only a swimmer goes there. */
export function inRiver(x: number, y: number): boolean {
  if (!(x > RIVER_LEFT_X && x < BRIDGE_END_X)) return false;
  // Plain loops: this runs for every point a path is checked on.
  for (const lane of LANES) if (Math.abs(y - lane) <= BRIDGE_HALF_WIDTH) return false;
  return true;
}
/** Compatibility export: the original terrain, never a mutable active map. */
export function blocked(x: number, y: number, level: Level = levelForWave(1)): boolean {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 24 ||
    x > 1080 ||
    y < 96 ||
    y > 552 ||
    inRiver(x, y)
  )
    return true;
  for (const r of level.rocks)
    if (!notCloserThan(x - r.x, y - r.y, r.r) && Math.hypot(x - r.x, y - r.y) < r.r) return true;
  return false;
}
const center = (n: number) => n * CELL + CELL / 2;
/**
 * Paths already found, by rules, map, start cell and end cell: a path depends on nothing else.
 * When it is full, the path asked for the longest time ago gives its place (it was emptied
 * all at once before 26 November 2026); which paths it keeps never changes a path returned.
 */
const cache = new Map<string, Point[]>();
/** Paths kept at most. */
export const PATH_CACHE_SIZE = 1024;
/**
 * Whether the centre of each cell of a map is blocked, measured once: the terrain of a level
 * never changes, and A* asks it of every neighbour it looks at.
 */
const blockedCells = new WeakMap<Level, Uint8Array>();
function cellBlocked(x: number, y: number, level: Level): boolean {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return blocked(center(x), center(y), level);
  let cells = blockedCells.get(level);
  if (!cells) {
    cells = new Uint8Array(COLS * ROWS);
    for (let cy = 0; cy < ROWS; cy++)
      for (let cx = 0; cx < COLS; cx++)
        cells[cy * COLS + cx] = blocked(center(cx), center(cy), level) ? 1 : 0;
    blockedCells.set(level, cells);
  }
  return cells[y * COLS + x] === 1;
}
/** The four neighbours of a cell, in the order A* has always looked at them. */
const NEIGHBOURS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
type OpenNode = { id: number; g: number; f: number };
/** The node A* looks at first: the lowest estimate, then the lowest cell (as the sort had). */
const before = (a: OpenNode, b: OpenNode) => a.f < b.f || (a.f === b.f && a.id < b.id);
/**
 * A* keeps its open list as a binary heap (26 November 2026): it sorted the whole list before
 * taking each node. Two entries never share both estimate and cell (a cell enters again only
 * with a shorter walk, so a lower estimate), so the heap gives the nodes in the very order
 * the sort gave them, and every path stays the same.
 */
function pushOpen(heap: OpenNode[], node: OpenNode) {
  let i = heap.push(node) - 1;
  while (i > 0) {
    const up = (i - 1) >> 1;
    if (!before(node, heap[up])) break;
    heap[i] = heap[up];
    i = up;
  }
  heap[i] = node;
}
function popOpen(heap: OpenNode[]): OpenNode {
  const top = heap[0],
    last = heap.pop()!;
  if (heap.length) {
    let i = 0;
    for (;;) {
      const left = 2 * i + 1,
        right = left + 1;
      let next = i,
        nextNode = last;
      if (left < heap.length && before(heap[left], nextNode)) {
        next = left;
        nextNode = heap[left];
      }
      if (right < heap.length && before(heap[right], nextNode)) {
        next = right;
        nextNode = heap[right];
      }
      if (next === i) break;
      heap[i] = nextNode;
      i = next;
    }
    heap[i] = last;
  }
  return top;
}
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
  if (cached) {
    // Asked again: it becomes the most recent path of the cache.
    cache.delete(key);
    cache.set(key, cached);
    return fromStart(from, cached, level);
  }
  if (cellBlocked(tx, ty, level)) return [];
  const start = sy * COLS + sx,
    end = ty * COLS + tx;
  const open: OpenNode[] = [{ id: start, g: 0, f: 0 }],
    cost = new Map([[start, 0]]),
    parent = new Map<number, number>();
  while (open.length) {
    const n = popOpen(open);
    if (n.id === end) {
      const path: Point[] = [];
      let id = end;
      while (id !== start) {
        path.push({ x: center(id % COLS), y: center(Math.floor(id / COLS)) });
        id = parent.get(id)!;
      }
      path.reverse();
      while (cache.size >= PATH_CACHE_SIZE) cache.delete(cache.keys().next().value!);
      cache.set(key, path);
      return fromStart(from, path, level);
    }
    const x = n.id % COLS,
      y = Math.floor(n.id / COLS);
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || cellBlocked(nx, ny, level)) continue;
      if (rules === 2 && !clearEdge(x, y, dx, dy, level)) continue;
      const id = ny * COLS + nx,
        g = n.g + 1;
      if (g >= (cost.get(id) ?? Infinity)) continue;
      cost.set(id, g);
      parent.set(id, n.id);
      pushOpen(open, { id, g, f: g + Math.abs(nx - tx) + Math.abs(ny - ty) });
    }
  }
  return [];
}

const campLegal = (p: Point, level: Level) =>
  !blocked(p.x, p.y, level) && !cellBlocked(Math.floor(p.x / CELL), Math.floor(p.y / CELL), level);
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
