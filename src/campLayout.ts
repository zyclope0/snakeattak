import { blocked, CELL } from './navigation.ts';
import type { Point } from './navigation.ts';
import type { Level } from './levels.ts';
import * as TEXT from './texts/fr/battle.ts';
import { CAMP_BOTTOM, CAMP_LEFT, CAMP_RIGHT, CAMP_TOP } from './boardLandmarks.ts';

type Resident = { id: number; homeX: number; homeY: number };

/** Last resort only: rebuild a dense camp after preserving existing homes failed. */
export function denseCampHomes(units: readonly Resident[], level: Level): Map<number, Point> {
  // Keep the mathematical 28px separation despite floating-point round-off between rows.
  const spacing = 28.000001;
  const rowHeight = (spacing * Math.sqrt(3)) / 2;
  const slots: (Point & { used: number })[] = [];
  for (let row = 0, y = CAMP_TOP; y <= CAMP_BOTTOM; row++, y = CAMP_TOP + row * rowHeight)
    for (let x = CAMP_LEFT + (row % 2 ? spacing / 2 : 0); x <= CAMP_RIGHT; x += spacing)
      if (
        !blocked(x, y, level) &&
        !blocked(
          Math.floor(x / CELL) * CELL + CELL / 2,
          Math.floor(y / CELL) * CELL + CELL / 2,
          level,
        )
      )
        slots.push({ x, y, used: 0 });
  if (!slots.length) throw new Error(TEXT.aucunDomicileNavigableDansLeCamp);
  const homes = new Map<number, Point>();
  // Stable IDs and row/column order settle ties without consuming game randomness.
  for (const unit of [...units].sort((a, b) => a.id - b.id)) {
    const slot = slots.reduce((best, candidate) =>
      candidate.used < best.used ||
      (candidate.used === best.used &&
        Math.hypot(candidate.x - unit.homeX, candidate.y - unit.homeY) <
          Math.hypot(best.x - unit.homeX, best.y - unit.homeY))
        ? candidate
        : best,
    );
    slot.used++;
    homes.set(unit.id, { x: slot.x, y: slot.y });
  }
  return homes;
}
