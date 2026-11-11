import { denseCampHomes } from '../campLayout.ts';
import { blocked, nearestCampPoint, CELL } from '../navigation.ts';
import type { Point } from '../navigation.ts';
import { distance } from './state.ts';
import type { Game } from '../game.ts';

/** Aux frontières de chapitre et à la restauration : garde les identités vivantes. */
export function normalizeCamp(game: Game) {
  const level = game.level;
  const legal = (p: Point) =>
    !blocked(p.x, p.y, level) &&
    !blocked(
      Math.floor(p.x / CELL) * CELL + CELL / 2,
      Math.floor(p.y / CELL) * CELL + CELL / 2,
      level,
    );
  let homes = new Map<number, Point>();
  // Reserve valid homes first so displaced units cannot steal a survivor's place.
  for (const u of game.units) {
    const p = { x: u.homeX, y: u.homeY };
    if (
      p.x >= 600 &&
      p.x <= 984 &&
      p.y >= 108 &&
      p.y <= 540 &&
      legal(p) &&
      ![...homes.values()].some((h) => distance(h, p) < 28)
    )
      homes.set(u.id, p);
  }
  try {
    for (const u of game.units)
      if (!homes.has(u.id))
        homes.set(u.id, nearestCampPoint({ x: u.homeX, y: u.homeY }, level, [...homes.values()]));
  } catch (error) {
    if (error instanceof RangeError) throw error;
    homes = denseCampHomes(game.units, level);
  }
  const positions = game.units.filter(legal).map((u) => ({ x: u.x, y: u.y }));
  const relocated = new Map<number, Point>();
  try {
    for (const u of game.units)
      if (!legal(u)) {
        const reserved = [
          ...positions,
          ...game.units.filter((v) => v.id !== u.id).map((v) => homes.get(v.id)!),
        ];
        const p = nearestCampPoint(u, level, reserved);
        relocated.set(u.id, p);
        positions.push(p);
      }
  } catch (error) {
    if (error instanceof RangeError) throw error;
    // The planned homes are legal even when all other positions fill the camp.
    for (const u of game.units) relocated.set(u.id, homes.get(u.id)!);
  }
  // Commit only after both plans are complete: fallback sees the original camp.
  for (const u of game.units) {
    const home = homes.get(u.id)!;
    u.homeX = home.x;
    u.homeY = home.y;
    const p = relocated.get(u.id);
    if (p) {
      u.x = p.x;
      u.y = p.y;
    }
    u.path = [];
    u.nav = 0;
  }
}
