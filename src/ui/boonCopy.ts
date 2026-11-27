import { REWARDS, type RewardId } from '../rewards.ts';
import { isLastingBoon, type BoonRules, type LastingBoon } from '../boons.ts';
import type { Game } from '../game.ts';
import * as TEXT from '../texts/fr/camp.ts';
import { fill } from '../texts/fill.ts';

/** The name of a lasting gift, and what it gives at a level, counted from nothing. */
type Steps = BoonRules['steps'];
const LASTING: Record<
  LastingBoon,
  { title: string; detail: (level: number, steps: Steps) => string }
> = {
  forge: {
    title: TEXT.laForge,
    detail: (level, steps) => fill(TEXT.tesAlliesFrappentPlusFortN, percent(steps.forge * level)),
  },
  armure: {
    title: TEXT.lArmure,
    detail: (level, steps) => fill(TEXT.tesAlliesOntPlusDeVieN, percent(steps.armure * level)),
  },
  marche: {
    title: TEXT.leMarche,
    detail: (level, steps) => fill(TEXT.recruterCouteNMoins, percent(steps.marche * level)),
  },
  rente: {
    title: TEXT.laRente,
    detail: (level, steps) => fill(TEXT.nPiecesAChaqueVague, steps.rente * level),
  },
  solide: {
    title: TEXT.leCristalSolide,
    detail: (level, steps) => fill(TEXT.leCristalSeRepareDeN, steps.solide * level),
  },
  vue: {
    title: TEXT.laLongueVue,
    detail: (level, steps) => fill(TEXT.tesTireursVoientNPlusLoin, percent(steps.vue * level)),
  },
  miel: {
    title: REWARDS.miel.title,
    detail: (level, steps) => fill(TEXT.nSecondesPourChaquePotDeMiel, steps.miel * level),
  },
};
const percent = (share: number) => Math.round(share * 100);
/**
 * What a lasting gift does, in a child's words (lot B, 27 November 2026): a gift counted in
 * « % » says it plainly, its stars tell how much; coins, seconds and crystal keep their number.
 */
const PLAIN: Partial<Record<LastingBoon, string>> = {
  forge: TEXT.tesAlliesFrappentPlusFort,
  armure: TEXT.tesAlliesOntPlusDeVie,
  marche: TEXT.lesAlliesCoutentMoinsCher,
  vue: TEXT.tesTireursVoientPlusLoin,
};
export const boonWords = (id: LastingBoon, level: number, steps: Steps): string =>
  PLAIN[id] ?? LASTING[id].detail(level, steps);
/** One star a level. */
export const stars = (level: number) => '★'.repeat(level);
/** A gift's stars, then what it does: « ★★ Tes alliés frappent plus fort. ». */
const starred = (id: LastingBoon, level: number, steps: Steps) =>
  fill(TEXT.nNiveauEtoiles, stars(level), boonWords(id, level, steps));

/** The name of a lasting gift, and what it gives at a level: for screens without a game. */
export const boonTitle = (id: LastingBoon): string => LASTING[id].title;
export const boonDetail = (id: LastingBoon, level: number, steps: Steps): string =>
  LASTING[id].detail(level, steps);

export type GiftCopy = { title: string; detail: string; action: string };

/**
 * What a card says: a card of the great adventure as it always has; a lasting gift of the
 * endless adventure with what it will give once taken, and « up to level N » when it is
 * already one of the child's.
 */
export function giftCopy(game: Game, id: string): GiftCopy {
  if (game.endless && isLastingBoon(id)) {
    const owned = game.boonLevel(id);
    const next = Math.min(game.boonRules.maxLevel, owned + 1);
    // One already taken shows its stars climbing: « ★★ → ★★★ ».
    return {
      title: LASTING[id].title,
      detail: starred(id, next, game.boonRules.steps),
      action: owned ? `${stars(owned)} → ${stars(next)}` : TEXT.choisirCeCadeau,
    };
  }
  const reward = REWARDS[id as RewardId];
  return {
    title: reward.title,
    detail: reward.detail,
    action: game.endless ? TEXT.choisirCeCadeau : TEXT.choisirCeBonus,
  };
}

/** A lasting gift the child holds, on the card that may give its place: stars, then what it gives. */
export const boonNow = (game: Game, id: LastingBoon) =>
  starred(id, game.boonLevel(id), game.boonRules.steps);

/** A lasting gift under the camp: its name and one star a level. */
export const boonBadge = (id: LastingBoon, level: number) =>
  fill(TEXT.nNiveauEtoiles, LASTING[id].title, stars(level));

/** The sign drawn on a lasting gift's card, in the colours of the coins and the crystal. */
export const BOON_SIGNS: Record<LastingBoon, string> = {
  forge: '⚔',
  armure: '♥',
  marche: '%',
  rente: '+',
  solide: '◆',
  vue: '↔',
  miel: '',
};
