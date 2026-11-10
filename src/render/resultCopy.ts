import { capriceById } from '../caprices.ts';
import type { Game } from '../game.ts';

/** Presentation only: describe the completed mode, never infer another mission's boss. */
export function victoryCopy(game: Pick<Game, 'mission' | 'totalWaves'>) {
  return game.mission
    ? {
        title: game.mission.caprice ? 'Caprice réussi !' : 'Bravo !',
        subtitle: `Tes alliés ont protégé le cristal pendant ${game.totalWaves} vagues.`,
      }
    : {
        title: 'Victoire !',
        subtitle: `Tes alliés ont tenu les ${game.totalWaves} vagues et repoussé le roi !`,
      };
}

/** Describe the actions that actually exist; no promise of a saved battle. */
export function defeatCopy(game: Pick<Game, 'mission'>) {
  return {
    title: 'On réessaie ?',
    subtitle:
      capriceById(game.mission?.caprice)?.announce ??
      (game.mission
        ? 'Réessaie ce même départ ou choisis une autre mission.'
        : 'Rejoue une aventure, puis essaie d’autres alliés.'),
  };
}

export function earnedStars(game: Pick<Game, 'status' | 'mission' | 'missionStars' | 'campaign'>) {
  if (game.status !== 'won') return null;
  return game.mission
    ? { count: game.missionStars, maximum: 3 }
    : { count: game.campaign.chapterStars.reduce((sum, n) => sum + n, 0), maximum: 9 };
}
