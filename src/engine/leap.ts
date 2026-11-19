import { diving } from './swim.ts';
import { grasshopperLeap } from '../balanceRevision.ts';
import { CRYSTAL_X } from '../boardLandmarks.ts';
import type { Game } from '../game.ts';
import type { Entity } from './state.ts';
import { addEffect } from './state.ts';
import { standable } from './field.ts';
import { landAt } from './landing.ts';
import { TELEPORT_CRYSTAL_GAP } from './damage.ts';

/**
 * The grasshopper snake leaps over the line of allies, once (sixth revision). It leaps when an
 * ally of its road stands within reach ahead of it, and lands past the ally of that line
 * nearest the crystal: always past it, never on the crystal, a rock or the river. Nearer
 * places past that ally are tried; when none is free, it keeps its leap and walks on (a line
 * standing by the crystal leaves it no place: it walks into that line). True when it leapt.
 */
export function leapOverLine(game: Game, snake: Entity): boolean {
  const rule = grasshopperLeap(game.balanceRevision);
  if (!rule || !snake.leaps || snake.boss) return false;
  // A spinosaurus away in the river is not part of the line (seventh revision).
  const road = game.units.filter(
    (u) =>
      u.hp > 0 &&
      !diving(u) &&
      u.x >= snake.x &&
      u.x - snake.x <= rule.depth &&
      Math.abs(u.y - snake.y) <= rule.band,
  );
  if (!road.some((u) => u.x - snake.x <= rule.reach)) return false;
  const line = Math.max(...road.map((u) => u.x));
  for (const share of [1, 0.75, 0.5])
    for (const lift of [0, -12, 12]) {
      const x = line + rule.behind * share;
      const y = snake.y + lift;
      if (x > CRYSTAL_X - TELEPORT_CRYSTAL_GAP || !standable(x, y, game.level)) continue;
      addEffect(game, snake, { x, y }, 'leap');
      landAt(game, snake, x, y);
      snake.leaps = 0;
      return true;
    }
  return false;
}
