import { denseCampHomes } from '../campLayout.ts';
import { nearestCampPoint } from '../navigation.ts';
import type { Point } from '../navigation.ts';
import type { Level } from '../levels.ts';
import { distance, forgetPath } from './state.ts';
import { CAMP_BOTTOM, CAMP_LEFT, CAMP_RIGHT, CAMP_TOP, standable } from './field.ts';
import type { Game } from '../game.ts';

/** Two homes closer than this would put two allies on the same spot. */
const HOME_SPACING = 28;

/** Aux frontières de chapitre et à la restauration : garde les identités vivantes. */
export function normalizeCamp(game: Game) {
  const level = game.level;
  const homes = planHomes(game, level);
  const relocated = planPositions(game, level, homes);
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
    forgetPath(u);
  }
}
/** A home for every ally, by id: its own when still legal on this map, else the nearest free. */
function planHomes(game: Game, level: Level): Map<number, Point> {
  const homes = new Map<number, Point>();
  // Reserve valid homes first so displaced units cannot steal a survivor's place.
  for (const u of game.units) {
    const p = { x: u.homeX, y: u.homeY };
    if (
      p.x >= CAMP_LEFT &&
      p.x <= CAMP_RIGHT &&
      p.y >= CAMP_TOP &&
      p.y <= CAMP_BOTTOM &&
      standable(p.x, p.y, level) &&
      ![...homes.values()].some((h) => distance(h, p) < HOME_SPACING)
    )
      homes.set(u.id, p);
  }
  try {
    for (const u of game.units)
      if (!homes.has(u.id))
        homes.set(u.id, nearestCampPoint({ x: u.homeX, y: u.homeY }, level, [...homes.values()]));
  } catch (error) {
    if (error instanceof RangeError) throw error;
    // No room left for separate homes: lay the whole camp out again, densely.
    return denseCampHomes(game.units, level);
  }
  return homes;
}
/** New positions, by id, for the allies standing where this map has an obstacle. */
function planPositions(game: Game, level: Level, homes: Map<number, Point>): Map<number, Point> {
  const positions = game.units
    .filter((u) => standable(u.x, u.y, level))
    .map((u) => ({ x: u.x, y: u.y }));
  const relocated = new Map<number, Point>();
  try {
    for (const u of game.units) {
      if (standable(u.x, u.y, level)) continue;
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
  return relocated;
}
