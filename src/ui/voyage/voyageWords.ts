import { REWARDS } from '../../rewards.ts';
import type { RewardId } from '../../rewards.ts';
import { voyagePhase, voyagePlanOf } from '../../voyageState.ts';
import type { VoyageState } from '../../voyageState.ts';
import * as TEXT from '../../texts/fr/voyageScreens.ts';
import { fill } from '../../texts/fill.ts';

/**
 * What the voyage says, and when. Presentation only, without a page: every sentence is
 * chosen here from the state of the voyage, so that a test can read them all. Each one is a
 * single literal or a single template, which the translator needs to find it whole.
 */

const plural = (count: number) => (count > 1 ? 's' : '');
const stagesOf = (state: VoyageState) => voyagePlanOf(state).stages.length;

/** The name of the screen, and the stage it is about when there is one to play. */
export function voyageHeading(state: VoyageState): { title: string; step: string } {
  switch (voyagePhase(state)) {
    case 'stage':
      return { title: TEXT.leVoyage, step: fill(TEXT.etapeNSurN, state.won + 1, stagesOf(state)) };
    case 'bonus':
      return { title: fill(TEXT.etapeNReussie, state.won), step: '' };
    case 'arrived':
      return { title: TEXT.bravoTuAsFiniLeVoyage, step: '' };
    case 'fallen':
      return { title: fill(TEXT.tonVoyageSArreteALEtapeN, state.won + 1), step: '' };
  }
}

/** « Ton plus long voyage » : a personal record, never a ranking. Nothing before a stage won. */
export const recordLine = (best: number): string =>
  best > 0 ? fill(TEXT.tonPlusLongVoyageNEtapeN, best, plural(best)) : '';

/** What the map promises, for screens with room to spare. */
export const voyagePromise = (state: VoyageState): string =>
  fill(TEXT.nEtapesJusquAKingSnake, stagesOf(state));

export type StopState = 'done' | 'next' | 'ahead' | 'fallen';
/** Where each stop of the path stands: won, to play, still ahead, or where the camp fell. */
export function stopStates(state: VoyageState): StopState[] {
  return voyagePlanOf(state).stages.map((_, index) => {
    if (index < state.won) return 'done';
    if (index > state.won) return 'ahead';
    return state.status === 'fallen' ? 'fallen' : 'next';
  });
}
const STOP_WORDS: Record<StopState, string> = {
  done: TEXT.etapeReussie,
  next: TEXT.etapeAJouer,
  ahead: TEXT.etapeAVenir,
  fallen: TEXT.leCampEstTombeIci,
};
/** A stop told to someone who cannot see the path: its number, its mission, where it stands. */
export const stopWords = (index: number, mission: string, stop: StopState) => ({
  name: fill(TEXT.etapeNN, index + 1, mission),
  state: STOP_WORDS[stop],
});
export const terrainLine = (land: string): string => fill(TEXT.terrainN, land);
/** The lairs the first wave comes out of: one snake head for each on the stop. */
export const exitsLine = (lairs: number): string =>
  fill(TEXT.premiereVagueLesSerpentsSortentDeN, lairs, plural(lairs));
export const surpriseLabel = (caprice: string): string => fill(TEXT.capriceSurpriseN, caprice);
/** Before the king's stage: the purse is smaller there, and the child is told why. */
export const kingPurseLine = (taken: number): string => fill(TEXT.leRoiTAPrisNPieces, taken);

/**
 * The button of the stop to play. A stage left halfway is not kept: where the child comes
 * back to it, the button says that it starts again.
 */
export const startLabel = (leftHalfway: boolean): string =>
  leftHalfway ? TEXT.recommencerLEtape : TEXT.cEstParti;

/** Under the map: what is kept and what is not, or that this device keeps nothing. */
export const keepingNote = (saved: boolean): string =>
  saved ? TEXT.tonVoyageEstGardeSurCetAppareil : TEXT.cetAppareilNeGardePasTonVoyage;

export const bagLabel = (cards: number, places: number): string =>
  fill(TEXT.tonSacDeVoyageNBonusSurN, cards, places);

/**
 * A bonus card of the voyage: the title of the great adventure's card and, in a child's
 * words, what it gives at every stage that follows. `coins` is what the voyage's table
 * gives for the purse.
 */
const BONUS_DETAILS: Record<RewardId, (coins: number) => string> = {
  'renfort-bouclier': () => TEXT.unBouclierOffertAChaqueEtape,
  'renfort-ninja': () => TEXT.unNinjaOffertAChaqueEtape,
  'renfort-raptor': () => TEXT.unVelociraptorOffertAChaqueEtape,
  miel: () => TEXT.tonMielDurePlusLongtempsAChaque,
  cristal: () => TEXT.uneProtectionPourTonCristalAChaque,
  pieces: (coins) => fill(TEXT.nPiecesAChaqueEtape, coins),
};
export const bonusWords = (id: RewardId, coins: number) => ({
  title: REWARDS[id].title,
  detail: BONUS_DETAILS[id](coins),
});

/** Where the voyage stopped, said without a reproach, and that the expedition waits. */
export const fallenSentence = (state: VoyageState): string =>
  state.won > 0
    ? fill(
        TEXT.tuAsReussiNEtapeNSurNNTAttend,
        state.won,
        plural(state.won),
        stagesOf(state),
        TEXT.laGrandeExpedition,
      )
    : fill(TEXT.leCampEstTombeALaPremiereEtapeNTAttend, TEXT.laGrandeExpedition);

/** The small mark on the board: the child is on a voyage, at this stage. */
export const battleMark = (stage: number, stages: number): string =>
  fill(TEXT.leVoyageEtapeNSurN, stage, stages);

/**
 * The end of a stage, on the board. `after` is the voyage once the stage is recorded, and
 * `stage` the number of the stage that has just been fought. One way on, whatever happened.
 */
export function stageOutcome(after: VoyageState, stage: number): { note: string; button: string } {
  switch (voyagePhase(after)) {
    case 'fallen':
      return {
        // The board's own line says that « La Grande Expédition » waits.
        note: fill(TEXT.leCampEstTombeALEtapeN, stage),
        button: TEXT.voirMonVoyage,
      };
    case 'arrived':
      return {
        note: TEXT.kingSnakeEstBattuTuAsFiniLeVoyage,
        button: TEXT.continuerLeVoyage,
      };
    default:
      return {
        note: fill(TEXT.etapeNSurNReussieChoisisMaintenant, stage, stagesOf(after)),
        button: TEXT.continuerLeVoyage,
      };
  }
}
