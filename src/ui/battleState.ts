import type { Game } from '../game.ts';
import { availableGold } from './capriceBudget.ts';
import * as TEXT from '../texts/fr/battleScreens.ts';
import { fill } from '../texts/fill.ts';

/** Won or lost: nothing more can be played in this battle (the rule lives in game.ts). */
export { battleOver } from '../game.ts';

/** The wave the screen talks about: the next one in camp, the current one in a fight. */
export const announcedWave = (game: Pick<Game, 'status' | 'wave' | 'totalWaves'>): number =>
  Math.min(game.totalWaves, game.wave + (game.status === 'preparing' ? 1 : 0));

/** What a caprice keeps at the bank, and what is left to spend. */
export const bankSummary = (game: Pick<Game, 'gold' | 'caprice'>): string =>
  fill(TEXT.nALaBanqueNDisponibles, game.caprice.reserve, availableGold(game));
