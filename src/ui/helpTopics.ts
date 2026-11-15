import * as TEXT from '../texts/fr/help.ts';
/**
 * The small "?": a screen that stays unclear gets a help point. Only the texts are here, in
 * a child's words; `helpBubble.ts` draws the button and its bubble. The English is in
 * `i18n/dictionaries/supplement.en.ts`.
 */
export type HelpTopicId = 'caprices' | 'scouting' | 'departure' | 'family' | 'code';
export type HelpTopic = {
  /** The button's name for screen readers: "Aide : <topic>". */
  readonly label: string;
  readonly title: string;
  /** One or two short paragraphs. */
  readonly text: readonly string[];
};
export const HELP_TOPICS: Readonly<Record<HelpTopicId, HelpTopic>> = Object.freeze({
  caprices: {
    label: TEXT.aideLesCaprices,
    title: TEXT.cEstQuoiUnCaprice,
    text: [
      TEXT.unCapriceCEstUnDefiDesSerpentsTu,
      // Follows CAPRICE_UNLOCK_STARS (caprices.ts): a mission won is worth at least one star.
      TEXT.lePetitSOuvreQuandTuGagnesLa,
    ],
  },
  scouting: {
    label: TEXT.aideLeReperage,
    title: TEXT.aQuoiSertLeReperage,
    text: [TEXT.leReperageTeMontreLesSerpentsDe],
  },
  departure: {
    label: TEXT.aideAutreDepart,
    title: TEXT.autreDepart,
    text: [TEXT.chaqueDepartChangeUnPeuLaMissionLe],
  },
  family: {
    label: TEXT.aideLaSauvegardeFamiliale,
    title: TEXT.laSauvegardeFamiliale,
    text: [TEXT.elleRangeTouteLAventureDansUn],
  },
  code: {
    label: TEXT.aideLeCodeDeDepart,
    title: TEXT.leCodeDeDepart,
    text: [TEXT.unCodeRejoueLaMemeMissionDepuisLe],
  },
});
/** The label of the bubble's only button. */
export const HELP_CLOSE = TEXT.jAiCompris;
