import { capriceById } from '../caprices.ts';
import type { Game } from '../game.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
import { endlessWave } from '../endless.ts';
import { EXPEDITION_STAGE_VERSION } from '../voyageRules.ts';
import { CHAPTER_COUNT, STARS_MAX } from '../gameConstants.ts';

/**
 * A voyage stage is neither a mission nor a caprice to the child: it names itself. A battle of
 * « La Grande Expédition » is a step (« étape ») of the expedition.
 */
const expedition = (game: Pick<Game, 'stage'>) => game.stage?.version === EXPEDITION_STAGE_VERSION;
const missionVictoryTitle = (game: Pick<Game, 'mission' | 'stage'>) => {
  if (game.stage) return expedition(game) ? TEXT.etapeGagnee : TEXT.etapeReussie;
  return game.mission?.caprice ? TEXT.capriceReussi : TEXT.bravo;
};

type EndlessGame = Pick<Game, 'endless' | 'kings' | 'wave' | 'status'>;
/**
 * The end of an endless adventure, when the camp falls: how far it went, never « try again »,
 * since there is no end to reach. (Going home after a king is no end: the game waits.)
 */
export function endlessCopy(game: EndlessGame) {
  return {
    title: TEXT.quelleAventure,
    subtitle: fill(
      TEXT.tuAsTenuJusquALaVagueNAvecNRois,
      Math.max(1, endlessWave(game.kings, game.wave)),
      game.kings,
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
  // A battle of the expedition is tried again from the camp it started with.
  if (expedition(game))
    return { title: TEXT.onReessaie, subtitle: TEXT.tonCampRevientCommeAvantLEtape };
  // A fallen camp ends the voyage: « La Grande Expédition » took its place.
  if (game.stage)
    return {
      title: TEXT.leVoyageSArreteIci,
      subtitle: TEXT.laGrandeExpeditionTAttend,
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
    ? { count: game.missionStars, maximum: STARS_MAX }
    : {
        count: game.campaign.chapterStars.reduce((sum, n) => sum + n, 0),
        maximum: STARS_MAX * CHAPTER_COUNT,
      };
}
