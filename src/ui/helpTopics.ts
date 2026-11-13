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
    label: 'Aide : les caprices',
    title: 'C’est quoi, un caprice ?',
    text: [
      'Un caprice, c’est un défi des serpents. Tu rejoues la mission avec une règle qui change. Si tu gagnes, son autocollant va dans ton carnet.',
      // Follows CAPRICE_UNLOCK_STARS (caprices.ts): a mission won is worth at least one star.
      'Le petit s’ouvre quand tu gagnes la mission. Le moyen avec 2 étoiles. Le grand avec 3 étoiles.',
    ],
  },
  scouting: {
    label: 'Aide : le repérage',
    title: 'À quoi sert le repérage ?',
    text: [
      'Le repérage te montre les serpents de cette mission et par où ils passent. Regarde-le avant de placer tes alliés.',
    ],
  },
  departure: {
    label: 'Aide : autre départ',
    title: 'Autre départ',
    text: [
      'Chaque départ change un peu la mission : le chemin, la façon d’attaquer des serpents et la place des œufs. Touche « Autre départ » pour en essayer un nouveau.',
    ],
  },
  family: {
    label: 'Aide : la sauvegarde familiale',
    title: 'La sauvegarde familiale',
    text: [
      'Elle range toute l’aventure dans un fichier : les étoiles, le carnet, les favoris. Garde ce fichier pour retrouver l’aventure sur un autre appareil.',
    ],
  },
  code: {
    label: 'Aide : le code de départ',
    title: 'Le code de départ',
    text: [
      'Un code rejoue la même mission depuis le début : même chemin, mêmes vagues. Il ne garde pas une partie en cours.',
    ],
  },
});
/** The label of the bubble's only button. */
export const HELP_CLOSE = 'J’ai compris';
