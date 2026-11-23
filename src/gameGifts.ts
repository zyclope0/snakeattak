import { armourAtLevel, isLastingBoon, readBoons, takeBoon } from './boons.ts';
import type { BoonId, Boons } from './boons.ts';
import { REWARDS } from './rewards.ts';
import type { Milestone, RewardId } from './rewards.ts';
import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import {
  CRYSTAL_WARD,
  GOLD_LIMIT,
  REWARD_COINS,
  REWARD_WAVES,
  TOTAL_WAVES,
} from './gameConstants.ts';
import type { Game } from './game.ts';

/**
 * The gifts of a game that `Game` keeps out of sight: the lasting gifts with their level, and,
 * in the endless adventure, the camps whose card is answered (`round:milestone`). Held in a
 * private field of the game: nothing of it is part of the state other games are
 * fingerprinted by, and a camp saves the gifts on its own (`restoreGifts` reads them back).
 */
export type GiftLedger = { boons: Boons; readonly answered: Set<string> };
export const emptyLedger = (): GiftLedger => ({ boons: [], answered: new Set() });

/** The camp of a round of the endless adventure: the kings beaten before it, its milestone. */
export const campKey = (round: number, milestone: number | null) => `${round}:${milestone}`;

/** The round a choice belongs to: only the endless adventure has more than one. */
const roundOf = (game: Pick<Game, 'kings'>): { round?: number } =>
  game.kings > 0 ? { round: game.kings } : {};

/** A card spent at once: written in the choices, then its coins or its ward. */
export function takeCard(game: Game, milestone: Milestone, card: RewardId) {
  game.rewards.choices.push({
    milestone,
    id: card,
    used: !REWARDS[card].kind,
    ...roundOf(game),
  });
  if (card === 'pieces') game.gold = Math.min(GOLD_LIMIT, game.gold + REWARD_COINS);
  if (card === 'cristal') game.rewards.ward += CRYSTAL_WARD;
}

/** The camp's card is left: the endless adventure only marks the camp answered. */
export function skipCard(game: Game, ledger: GiftLedger, milestone: Milestone) {
  if (game.endless) ledger.answered.add(campKey(game.kings, milestone));
  else game.rewards.choices.push({ milestone, id: 'skip', used: true, ...roundOf(game) });
}

/**
 * Takes the gift `id` of the endless adventure among those offered (`Game.chooseReward`):
 * `replace` names the lasting gift it takes the place of when the places are full.
 */
export function chooseBoon(game: Game, ledger: GiftLedger, id: string, replace?: string): boolean {
  const milestone = game.rewards.pending;
  if (
    game.paused ||
    game.status !== 'preparing' ||
    milestone === null ||
    !game.boonOffer.includes(id as BoonId)
  )
    return false;
  if (isLastingBoon(id)) {
    const taken = takeBoon(
      ledger.boons,
      id,
      isLastingBoon(replace) ? replace : undefined,
      game.boonRules,
    );
    if (!taken) return false;
    const armour = (level: number) => armourAtLevel(level, game.boonRules);
    const before = armour(game.boonLevel('armure'));
    ledger.boons = taken;
    const after = armour(game.boonLevel('armure'));
    // The armour takes the allies already in the camp, wounds kept in proportion.
    if (after !== before)
      for (const u of game.units) {
        // Written as a save reads it back: the kind's life times the armour.
        u.maxHp = kinds[u.kind as Kind].hp * after;
        u.hp = Math.min(u.maxHp, (u.hp * after) / before);
      }
  } else takeCard(game, milestone, id as RewardId);
  ledger.answered.add(campKey(game.kings, milestone));
  game.rewards.pending = null;
  return true;
}

/**
 * Puts back the gifts of a saved endless camp, once its wave, kings and pending offer are
 * back, and rebuilds which camps were answered: every camp of the earlier rounds, and of
 * this one up to the wave, but the one still pending. False on any doubt.
 */
export function restoreGifts(game: Game, ledger: GiftLedger, raw: unknown): boolean {
  const boons = readBoons(raw, game.boonRules);
  if (!boons) return false;
  const answered = new Set<string>();
  for (let round = 0; round <= game.kings; round++)
    for (const milestone of [...REWARD_WAVES, TOTAL_WAVES]) {
      const reached =
        milestone === TOTAL_WAVES ? round > 0 : round < game.kings || milestone <= game.wave;
      const key = campKey(round, milestone);
      if (reached && key !== campKey(game.kings, game.rewards.pending)) answered.add(key);
    }
  // One level a gift, one gift an answered camp: more levels were never offered.
  if (boons.reduce((sum, b) => sum + b.level, 0) > answered.size) return false;
  ledger.boons = boons;
  ledger.answered.clear();
  for (const key of answered) ledger.answered.add(key);
  return true;
}
