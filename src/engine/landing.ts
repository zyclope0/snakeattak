import type { Game } from '../game.ts';
import type { Entity } from './state.ts';
import { forgetPath } from './state.ts';
import { routeStages } from './field.ts';

/**
 * Puts a snake down at a new place of its road, ahead of where it was: a ninja snake that
 * comes back behind an ally, a grasshopper snake at the end of its leap. Sent ahead, it must
 * not walk back to the stage it had left behind: its next stage is the first one ahead of it.
 */
export function landAt(game: Game, snake: Entity, x: number, y: number) {
  snake.x = x;
  snake.y = y;
  forgetPath(snake);
  const stages = routeStages(game.level);
  const next = stages.findIndex((stage) => stage > x);
  snake.stage = next === -1 ? stages.length - 1 : next;
  snake.turnY = null;
}
