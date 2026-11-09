import type { Game } from '../game.ts';
/** Read the engine's protected bank without changing the displayed total. */
export const availableGold = (game: Pick<Game, 'gold' | 'caprice'>) =>
  game.gold - game.caprice.reserve;
export const canSpend = (game: Pick<Game, 'gold' | 'caprice'>, cost: number) =>
  availableGold(game) >= cost;
