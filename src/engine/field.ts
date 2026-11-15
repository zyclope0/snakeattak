import { blocked, CELL } from '../navigation.ts';
import { routeJunctions } from '../routes.ts';
import type { Level } from '../levels.ts';

// The landmarks of the board live in `boardLandmarks.ts`; the rules of a step read them here.
export * from '../boardLandmarks.ts';

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
