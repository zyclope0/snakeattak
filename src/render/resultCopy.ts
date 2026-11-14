import { capriceById } from '../caprices.ts';
import type { Game } from '../game.ts';

/** A voyage stage is neither a mission nor a caprice to the child: it names itself. */
const missionVictoryTitle = (game: Pick<Game, 'mission' | 'stage'>) =>
  game.stage ? 'Étape réussie !' : game.mission?.caprice ? 'Caprice réussi !' : 'Bravo !';

/** Presentation only: describe the completed mode, never infer another mission's boss. */
export function victoryCopy(game: Pick<Game, 'mission' | 'stage' | 'totalWaves'>) {
  return game.mission
    ? {
        title: missionVictoryTitle(game),
        subtitle: `Tes alliés ont protégé le cristal pendant ${game.totalWaves} vagues.`,
      }
    : {
        title: 'Victoire !',
        subtitle: `Tes alliés ont tenu les ${game.totalWaves} vagues et repoussé le roi !`,
      };
}

/** Describe the actions that actually exist; no promise of a saved battle. */
export function defeatCopy(game: Pick<Game, 'mission' | 'stage'>) {
  // A fallen camp ends the voyage: there is no same departure to retry, but the same voyage.
  if (game.stage)
    return {
      title: 'Le voyage s’arrête ici',
      subtitle: 'Tu peux refaire ce voyage ou en commencer un nouveau.',
    };
  return {
    title: 'On réessaie ?',
    subtitle:
      capriceById(game.mission?.caprice)?.announce ??
      (game.mission
        ? 'Réessaie ce même départ ou choisis une autre mission.'
        : 'Rejoue une aventure, puis essaie d’autres alliés.'),
  };
}

export function earnedStars(
  game: Pick<Game, 'status' | 'mission' | 'stage' | 'missionStars' | 'campaign'>,
) {
  // A voyage stage earns no star for the mission it borrows: none is shown.
  if (game.status !== 'won' || game.stage) return null;
  return game.mission
    ? { count: game.missionStars, maximum: 3 }
    : { count: game.campaign.chapterStars.reduce((sum, n) => sum + n, 0), maximum: 9 };
}
