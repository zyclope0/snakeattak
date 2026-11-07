import { blocked, CELL } from './navigation.ts';
import type { Point } from './navigation.ts';
import type { Game } from './game.ts';
import type { Kind } from './data.ts';
import { levelForWave } from './levels.ts';
import type { Level } from './levels.ts';
export function isPlacementFree(
  units: (Point & { homeX?: number; homeY?: number })[],
  x: number,
  y: number,
  level: Level = levelForWave(1),
) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 600 &&
    x <= 984 &&
    y >= 108 &&
    y <= 540 &&
    !blocked(x, y, level) &&
    !blocked(
      Math.floor(x / CELL) * CELL + CELL / 2,
      Math.floor(y / CELL) * CELL + CELL / 2,
      level,
    ) &&
    !units.some(
      (u) =>
        Math.hypot(u.x - x, u.y - y) < 28 ||
        (u.homeX !== undefined &&
          u.homeY !== undefined &&
          Math.hypot(u.homeX - x, u.homeY - y) < 28),
    )
  );
}
/** Only hints: the player can still place on any legal open spot in the camp. */
export function placementSuggestions(game: Game, kind: Kind): Point[] {
  const points: Point[] = [];
  for (const y of [180, 324, 468]) {
    let count = 0;
    for (const x of [900, 780, 660, 972, 852, 732, 612])
      if (
        game.canRecruit(kind, x, y) &&
        !game.units.some((u) => Math.hypot(u.x - x, u.y - y) < 52)
      ) {
        points.push({ x, y });
        if (++count === 2) break;
      }
  }
  return points;
}
