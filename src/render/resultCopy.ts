import type { Game } from '../game.ts';

/** Presentation only: describe the completed mode, never infer another mission's boss. */
export function victoryCopy(game: Pick<Game, 'mission' | 'totalWaves'>) {
  return game.mission
    ? {
        title: 'Bravo !',
        subtitle: `Tes alliés ont protégé le cristal pendant ${game.totalWaves} vagues.`,
      }
    : {
        title: 'Victoire !',
        subtitle: `Tes alliés ont tenu les ${game.totalWaves} vagues et repoussé le roi !`,
      };
}
