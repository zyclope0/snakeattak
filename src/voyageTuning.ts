import type { CapriceTier } from './caprices.ts';
import type { MissionId } from './missions.ts';

/** How one stage of the voyage is drawn. */
export type StageTuning = Readonly<{
  /** Missions that may be drawn here. A voyage never plays a mission twice and follows
   *  the order of the game, so each stage is harder than the one before. */
  missions: readonly MissionId[];
  /** Levels of caprice that may surprise this stage; an empty list means no caprice. */
  tiers: readonly CapriceTier[];
  /** Coins added to the mission's purse at this stage, before the bag's own coins; a
   *  negative number takes coins away. */
  coins: number;
  /** One of the three cards offered after this stage is a free ally. Without it the
   *  three other cards are offered. The last stage offers nothing. */
  ally: boolean;
}>;

/** Every number the voyage owns. Missions, caprices, allies and serpents keep theirs. */
export type VoyageTuning = Readonly<{
  /** The stages in order; the king closes the last one. */
  stages: readonly StageTuning[];
  /** Caprices never drawn in a voyage, by identifier. */
  excluded: readonly string[];
  /** Coins that one « pieces » card of the bag adds to every later stage. */
  bonusCoins: number;
  /** Crystal ward that one « cristal » card of the bag gives to every later stage. */
  bonusWard: number;
  /** Health of the king, as a multiple of a serpent of its wave (6 to 10). */
  kingHp: number;
}>;

export type VoyageVersion = 1;
export const CURRENT_VOYAGE_VERSION: VoyageVersion = 1;

/** A table nobody can change afterwards, down to its lists. */
export function freezeTuning(tuning: VoyageTuning): VoyageTuning {
  return Object.freeze({
    ...tuning,
    stages: Object.freeze(
      tuning.stages.map((stage) =>
        Object.freeze({
          ...stage,
          missions: Object.freeze([...stage.missions]),
          tiers: Object.freeze([...stage.tiers]),
        }),
      ),
    ),
    excluded: Object.freeze([...tuning.excluded]),
  });
}

/**
 * The rules of the voyage, one frozen table per version. A voyage code names its version:
 * changing a value here changes what an old code plays, so a new value is a new version
 * added next to the others, after a measure (npm run balance:voyage) and the parent's
 * agreement. The measures behind version 1 are in docs/VOYAGE.md.
 */
export const VOYAGE_TUNINGS: Readonly<Record<VoyageVersion, VoyageTuning>> = Object.freeze({
  // Version 1, proposed on 14 November 2026 and adjusted the same day after the parent asked
  // for a voyage « harder for the average player »; the parent agreed to it that day. Not
  // published yet. The figures are those of the automatic players over 300 seeds
  // (docs/VOYAGE.md).
  1: freezeTuning({
    stages: [
      // Stages 1 and 2: the first missions as they are. Every automatic player wins them
      // every time; they teach the voyage before anything surprises it.
      { missions: ['refuge', 'trois-ponts'], tiers: [], coins: 0, ally: true },
      { missions: ['trois-ponts', 'course'], tiers: [], coins: 0, ally: true },
      // Stage 3: the first surprise is a small caprice. With any caprice of the mission
      // the great caprice of the shells stopped the expert one time in four; with a small
      // one every player passes, the beginner too.
      { missions: ['course', 'coquilles'], tiers: ['petit'], coins: 0, ally: true },
      // Stage 4: a small or a medium caprice. Expert and average players still pass, the
      // apprentice wins 96 times in 100, the beginner 62. Medium and great caprices one
      // stage earlier changed nothing for the expert nor the average player.
      { missions: ['coquilles', 'sonnette'], tiers: ['petit', 'moyen'], coins: 0, ally: true },
      // Stage 5: a medium or a great caprice, the king, and 300 coins less in the purse.
      // The smaller purse is what the second pass added. It stops the player who spends
      // everything without care far more than the expert: voyages finished went from 67
      // to 53 in 100 for the average player, from 83 to 81 for the expert, and did not
      // move for the players who leave coins unspent. 200 coins less left the average
      // player at 59, 400 took the expert down to 78. The last stage offers no card.
      {
        missions: ['sonnette', 'carrefour'],
        tiers: ['moyen', 'grand'],
        coins: -300,
        ally: false,
      },
    ],
    // The two caprices that limit the kinds of allies. The free allies of the bag take the
    // places of the friends the child would choose: carrying allies, the expert won the
    // caprice of the two friends 68 times in 100 instead of 95, and the caprice of the
    // single friend, with the king, 35 times.
    excluded: ['sonnette-petit', 'carrefour-moyen'],
    // The values written on the cards of the great adventure: +100 coins, 18 damage.
    bonusCoins: 100,
    bonusWard: 18,
    // The king as it comes in a mission. A sturdier king (8, then 10) took the expert from
    // 83 voyages finished in 100 to 81, then 77, and the average player from 67 to 68, then
    // 65: it stops the best players first, so the king stays as it is.
    kingHp: 6.5,
  }),
});

/** A version that has a table: the only versions a code or a saved voyage may name. */
export const isVoyageVersion = (value: unknown): value is VoyageVersion =>
  typeof value === 'number' && Object.hasOwn(VOYAGE_TUNINGS, value);
