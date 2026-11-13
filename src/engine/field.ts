import { blocked, CELL } from '../navigation.ts';
import { routeJunctions } from '../routes.ts';
import type { Level } from '../levels.ts';

// Landmarks of the 1100 × 620 board that the rules of a step refer to. They are part of the
// game: changing one changes every recorded game.

/** Snakes leave their den here. */
export const DEN_EXIT_X = 108;
/** Far end of the three bridges: from here the king lays eggs and spits. */
export const BRIDGE_END_X = 576;
/** The camp, where allies may stand. */
export const CAMP_LEFT = 600;
export const CAMP_RIGHT = 984;
export const CAMP_TOP = 108;
export const CAMP_BOTTOM = 540;
/** First column of the camp for a fight: snakes use their full reach, helpers stop here. */
export const CAMP_FRONT_X = 612;
/** A snake this close to the crystal outranks every other target. */
export const CRYSTAL_ALERT_X = 900;
/** Past this line a snake has reached the crystal. */
export const CRYSTAL_X = 1000;
/** Body contact: a bite outside the camp, a court guard's reach, the king's close combat. */
export const CONTACT_RANGE = 44;

/** Decision and waypoint columns of a lane, den to crystal; indexed by `Entity.stage`. */
export function routeStages(level: Level): number[] {
  const [first, second] = routeJunctions(level);
  return [first, 444, 612, second, 828, 972, 1032];
}

const cellCentre = (v: number) => Math.floor(v / CELL) * CELL + CELL / 2;
/** An ally may stand here: the point is free, and so is the grid cell A* would start from. */
export function standable(x: number, y: number, level: Level): boolean {
  return !blocked(x, y, level) && !blocked(cellCentre(x), cellCentre(y), level);
}
