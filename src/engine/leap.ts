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
 * ally of its road stands within reach ahead of it, and lands past the ally of that road
 * nearest the crystal, never on the crystal, a rock or the river: nearer places are tried,
 * and when none is free it walks on and tries again. True when it leapt.
 */
export function leapOverLine(game: Game, snake: Entity): boolean {
  const rule = grasshopperLeap(game.balanceRevision);
  if (!rule || !snake.leaps || snake.boss) return false;
  const road = game.units.filter(
    (u) => u.hp > 0 && u.x >= snake.x && Math.abs(u.y - snake.y) <= rule.band,
  );
  if (!road.some((u) => u.x - snake.x <= rule.reach)) return false;
  const line = Math.max(...road.map((u) => u.x));
  const farthest = Math.min(line + rule.behind, CRYSTAL_X - TELEPORT_CRYSTAL_GAP);
  for (const share of [1, 0.75, 0.5])
    for (const lift of [0, -12, 12]) {
      const x = snake.x + (farthest - snake.x) * share;
      const y = snake.y + lift;
      if (x <= snake.x || !standable(x, y, game.level)) continue;
      addEffect(game, snake, { x, y }, 'leap');
      landAt(game, snake, x, y);
      snake.leaps = 0;
      return true;
    }
  return false;
}
