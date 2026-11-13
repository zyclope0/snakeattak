/**
 * Les petits « ? » : un écran qui reste flou reçoit un point d'aide. Ici seulement les
 * textes, en mots d'enfant ; `helpBubble.ts` dessine le bouton et sa bulle. L'anglais est
 * dans `i18n/dictionaries/supplement.en.ts`.
 */
export type HelpTopicId = 'caprices' | 'scouting' | 'departure' | 'family' | 'code';
export type HelpTopic = {
  /** Nom du bouton pour les lecteurs d'écran : « Aide : <sujet> ». */
  readonly label: string;
  readonly title: string;
  /** Un ou deux paragraphes courts. */
  readonly text: readonly string[];
};
export const HELP_TOPICS: Readonly<Record<HelpTopicId, HelpTopic>> = Object.freeze({
  caprices: {
    label: 'Aide : les caprices',
    title: 'C’est quoi, un caprice ?',
    text: [
      'Un caprice, c’est un défi des serpents. Tu rejoues la mission avec une règle qui change. Si tu gagnes, son autocollant va dans ton carnet.',
      // Suit CAPRICE_UNLOCK_STARS (caprices.ts) : une mission gagnée vaut au moins une étoile.
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
/** Le libellé du seul bouton de la bulle. */
export const HELP_CLOSE = 'J’ai compris';
