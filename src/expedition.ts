/**
 * « La Grande Expédition » (decisions of the parent, 20 November 2026): three tableaux of five
 * missions, a guardian at the fifth, King Snake at the end of the third. Between missions the
 * child picks a calm or a brave path, and stops at halts. Within a tableau the camp comes
 * along: the allies still standing, the coins, the crystal. The gifts of the endless
 * adventure come along all the way.
 *
 * Everything is drawn from the seed, apart from the fights: the map can be shown whole. The
 * rules of a version never change once played: new values, new version.
 *
 * This file is the public entry of the expedition's rules, which live in four modules:
 * - expeditionTuning.ts: the table of each version;
 * - expeditionPlan.ts: the map a seed draws (tableaux, forks, halts, battles);
 * - expeditionState.ts: where the child stands, and every move from there;
 * - expeditionRead.ts: a saved state read back, or refused.
 */
export {
  CURRENT_EXPEDITION_VERSION,
  EXPEDITION_GIFT_RULES,
  EXPEDITION_TUNINGS,
} from './expeditionTuning.ts';
export type { ExpeditionTuning, ExpeditionVersion, TableauTuning } from './expeditionTuning.ts';
export { BATTLES_PER_TABLEAU, planExpedition, STEPS_PER_TABLEAU } from './expeditionPlan.ts';
export type { Battle, ExpeditionPlan, HaltKind, Path, Step } from './expeditionPlan.ts';
export {
  battlesBefore,
  battlesWon,
  buyAtRoulotte,
  canPay,
  chooseGift,
  chooseHalt,
  coinsOf,
  countsTwice,
  createExpeditionGame,
  endsExpedition,
  EXPEDITION_BATTLES,
  expeditionPhase,
  expeditionPlanOf,
  giftCoins,
  giftOffer,
  leaveRoulotte,
  levelAfterGift,
  levelAfterPurchase,
  needsPlace,
  nextBattle,
  pickAt,
  rerollGifts,
  roulotteOffer,
  skipGift,
  snakesHaveGrown,
  startExpedition,
  tuningOf,
  underWay,
  winBattle,
} from './expeditionState.ts';
export type {
  Camp,
  CarriedUnit,
  ExpeditionPhase,
  ExpeditionState,
  Pending,
} from './expeditionState.ts';
export { readExpeditionState } from './expeditionRead.ts';
