import { capriceById } from '../caprices.ts';
import type { Game } from '../game.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
import { endlessWave } from '../endless.ts';

/** A voyage stage is neither a mission nor a caprice to the child: it names itself. */
const missionVictoryTitle = (game: Pick<Game, 'mission' | 'stage'>) =>
  game.stage ? TEXT.etapeReussie : game.mission?.caprice ? TEXT.capriceReussi : TEXT.bravo;

type EndlessGame = Pick<Game, 'endless' | 'kings' | 'wave' | 'status'>;
/**
 * The end of an endless adventure, won (home with the record) or lost: how far it went, never
 * « try again », since there is no end to reach.
 */
export function endlessCopy(game: EndlessGame) {
  const home = game.status === 'won';
  const wave = endlessWave(game.kings, home ? 0 : game.wave);
  return {
    title: home ? TEXT.bienJoue : TEXT.quelleAventure,
    subtitle: fill(
      TEXT.tuAsTenuJusquALaVagueNAvecNRois,
      Math.max(1, wave),
      game.kings,
      game.kings > 1 ? 's' : '',
    ),
  };
}

/** Presentation only: describe the completed mode, never infer another mission's boss. */
export function victoryCopy(
  game: Pick<Game, 'mission' | 'stage' | 'totalWaves'> & Partial<EndlessGame>,
) {
  if (game.endless) return endlessCopy(game as EndlessGame);
  return game.mission
    ? {
        title: missionVictoryTitle(game),
        subtitle: fill(TEXT.tesAlliesOntProtegeLeCristal, game.totalWaves),
      }
    : {
        title: TEXT.victoire,
        subtitle: fill(TEXT.tesAlliesOntTenuLesNVaguesEt, game.totalWaves),
      };
}

/** Describe the actions that actually exist; no promise of a saved battle. */
export function defeatCopy(game: Pick<Game, 'mission' | 'stage'> & Partial<EndlessGame>) {
  if (game.endless) return endlessCopy(game as EndlessGame);
  // A fallen camp ends the voyage: there is no same departure to retry, but the same voyage.
  if (game.stage)
    return {
      title: TEXT.leVoyageSArreteIci,
      subtitle: TEXT.tuPeuxRefaireCeVoyageOuEnCommencer,
    };
  return {
    title: TEXT.onReessaie,
    subtitle:
      capriceById(game.mission?.caprice)?.announce ??
      (game.mission
        ? TEXT.reessaieCeMemeDepartOuChoisisUne
        : TEXT.rejoueUneAventurePuisEssaieDAutres),
  };
}

export function earnedStars(
  game: Pick<Game, 'status' | 'mission' | 'stage' | 'missionStars' | 'campaign'> &
    Partial<Pick<Game, 'endless'>>,
) {
  // A voyage stage earns no star for the mission it borrows: none is shown; the endless
  // adventure counts its waves and its kings instead.
  if (game.status !== 'won' || game.stage || game.endless) return null;
  return game.mission
    ? { count: game.missionStars, maximum: 3 }
    : { count: game.campaign.chapterStars.reduce((sum, n) => sum + n, 0), maximum: 9 };
}
