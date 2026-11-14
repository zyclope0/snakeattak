import { REWARDS } from './rewards.ts';
import type { RewardId } from './rewards.ts';
import { isArrayOfLength, isIntegerIn, isRecord } from './plainData.ts';
import type { Game } from './game.ts';

/**
 * What a stage of « Le voyage » adds to an expedition. A stage is an ordinary mission of the
 * second balance revision, with or without a caprice; these rules are the only things the
 * voyage asks of the engine, and a game without them plays exactly as before.
 *
 * Versioned like a balance revision: version 1 never changes once children have played it.
 * A new way to open a stage is a new version next to this one.
 */
export type StageRules = Readonly<{
  version: 1;
  /** The three-headed king closes the last wave, whatever the caprice says. */
  king: boolean;
  /** Coins added to the purse of the mission: the bag's coins and the stage's allowance,
   *  which may take coins away. The purse never goes below zero. */
  coins: number;
  /** Damage the crystal ward absorbs from the first wave on. */
  ward: number;
  /** The bonus cards kept from the earlier stages: free allies to place, longer honey. */
  bag: readonly RewardId[];
}>;

/** One card after each stage but the last: a voyage of five stages fills four places. */
export const STAGE_BAG_LIMIT = 4;
const COINS_LIMIT = 5000;
const WARD_LIMIT = 500;
/**
 * The bag reuses the rewards of the great adventure, which are drawn for, and filed under,
 * the wave that offers them. A voyage has no such wave: its cards borrow the first one.
 */
export const BAG_MILESTONE = 4;

/** One of the six bonus cards; « skip » is not a card. */
export const isBonusCard = (value: unknown): value is RewardId =>
  typeof value === 'string' && Object.hasOwn(REWARDS, value);

/** Canonical frozen copy, or null: the engine never trusts the object it was handed. */
export function readStageRules(raw: unknown): StageRules | null {
  if (
    !isRecord(raw) ||
    raw.version !== 1 ||
    typeof raw.king !== 'boolean' ||
    !isIntegerIn(raw.coins, -COINS_LIMIT, COINS_LIMIT) ||
    !isIntegerIn(raw.ward, 0, WARD_LIMIT) ||
    !isArrayOfLength(raw.bag, 0, STAGE_BAG_LIMIT) ||
    !raw.bag.every(isBonusCard)
  )
    return null;
  return Object.freeze({
    version: 1,
    king: raw.king,
    coins: raw.coins,
    ward: raw.ward,
    bag: Object.freeze([...raw.bag]),
  });
}

/**
 * Unpacks the bag in a camp that has just been built. A free ally waits as an unused
 * voucher, exactly like the one of the great adventure: the child places it.
 */
export function openStage(game: Game, stage: StageRules) {
  game.gold = Math.max(0, game.gold + stage.coins);
  game.rewards.ward += stage.ward;
  for (const id of stage.bag)
    game.rewards.choices.push({ milestone: BAG_MILESTONE, id, used: !REWARDS[id].kind });
}
