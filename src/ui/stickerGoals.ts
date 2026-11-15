import { CAPRICE_UNLOCK_STARS, capricesForMission, capriceUnlocked } from '../caprices.ts';
import type { CapriceDefinition } from '../caprices.ts';
import { MISSIONS } from '../missions.ts';
import type { MissionId } from '../missions.ts';
import * as TEXT from '../texts/fr/capriceScreens.ts';
import { fill } from '../texts/fill.ts';

/** Tells whether the sticker of a caprice is already in the book that is looked at. */
export type StickerEarned = (capriceId: string) => boolean;

/**
 * Presentation only: what a mission still has to offer once it is won. It reads the stars
 * and the sticker book; the caprices, their unlocking and the book stay where they are.
 */
export type StickerTally = {
  /** The six caprices of the mission, in the order of the book's page. */
  slots: readonly { caprice: CapriceDefinition; earned: boolean }[];
  earned: number;
  left: number;
  /** Stickers still to earn whose caprice is open with the stars won. */
  playable: number;
  /** Stars that open the first caprice still closed among those to earn; 0 when none is. */
  starsToOpen: number;
};

export function missionStickers(
  missionId: MissionId,
  stars: number,
  earned: StickerEarned,
): StickerTally {
  const slots = capricesForMission(missionId).map((caprice) => ({
    caprice,
    earned: earned(caprice.id),
  }));
  const waiting = slots.filter((slot) => !slot.earned).map((slot) => slot.caprice.tier);
  const closed = waiting.filter((tier) => !capriceUnlocked(tier, stars));
  return {
    slots,
    earned: slots.length - waiting.length,
    left: waiting.length,
    playable: waiting.length - closed.length,
    starsToOpen: closed.length ? Math.min(...closed.map((tier) => CAPRICE_UNLOCK_STARS[tier])) : 0,
  };
}

/** What a mission card says of its stickers to someone who cannot see the six slots. */
export const stickerCountLabel = (tally: StickerTally): string =>
  fill(TEXT.autocollantsNSur6, tally.earned);

/**
 * After a mission is won, with or without a caprice: what is left to earn in it, and the
 * button that replays it with a caprice. No button when no caprice with a sticker to earn
 * is open: the sentence then says what opens the next ones, or that the page is full.
 */
export function replayOffer(
  tally: StickerTally,
  afterCaprice: boolean,
): { sentence: string; button: string | null } {
  if (!tally.left) return { sentence: TEXT.tuAsGagneLes6AutocollantsDeCette, button: null };
  if (!tally.playable)
    return {
      sentence: fill(TEXT.gagneNEtoilesIciPourOuvrirDAutres, tally.starsToOpen),
      button: null,
    };
  return {
    sentence:
      tally.left > 1
        ? fill(TEXT.ilTeResteNAutocollantsAGagnerIci, tally.left)
        : TEXT.ilTeReste1AutocollantAGagnerIci,
    button: afterCaprice ? TEXT.unAutreCaprice : TEXT.rejouerAvecUnCaprice,
  };
}

/**
 * Once the six missions are won, where the home's main button leads: the first mission of
 * the map with an open caprice whose sticker is still to earn, and the sentence that counts
 * the stickers left in the whole book. Nothing when no such caprice is open.
 */
export function capriceToPlay(
  bestStars: Readonly<Record<MissionId, number>>,
  earned: StickerEarned,
): { missionId: MissionId; sentence: string } | null {
  if (MISSIONS.some(({ id }) => !bestStars[id])) return null;
  const tallies = MISSIONS.map(({ id }) => ({
    id,
    tally: missionStickers(id, bestStars[id], earned),
  }));
  const open = tallies.find(({ tally }) => tally.playable > 0);
  if (!open) return null;
  const left = tallies.reduce((sum, { tally }) => sum + tally.left, 0);
  return {
    missionId: open.id,
    sentence:
      left > 1 ? fill(TEXT.ilTeResteNAutocollantsAGagner, left) : TEXT.ilTeReste1AutocollantAGagner,
  };
}
