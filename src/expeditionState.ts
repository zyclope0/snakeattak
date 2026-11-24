import { Game } from './game.ts';
import type { Entity } from './engine/state.ts';
import type { RewardId } from './rewards.ts';
import { mixSeed, pickOne, questionStream, SEED_RANGE } from './seededRandom.ts';
import { armourFactor, boonLevel, boonOffer, isLastingBoon, takeBoon } from './boons.ts';
import type { BoonId, Boons, LastingBoon } from './boons.ts';
import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import { saveUnit } from './checkpointUnits.ts';
import { countCards, EXPEDITION_STAGE_VERSION, STAGE_BAG_LIMIT } from './voyageRules.ts';
import type { StageRules } from './voyageRules.ts';
import { CRYSTAL_MAX, CRYSTAL_WARD, GOLD_LIMIT, REWARD_COINS } from './gameConstants.ts';
import {
  CURRENT_EXPEDITION_VERSION,
  EXPEDITION_GIFT_RULES,
  EXPEDITION_TUNINGS,
} from './expeditionTuning.ts';
import type { ExpeditionVersion } from './expeditionTuning.ts';
import {
  BATTLES_PER_TABLEAU,
  battlesBeforeStep,
  CHOICES_PER_TABLEAU,
  choicesBefore,
  isChoice,
  planExpedition,
  SHAPE,
  STEPS_PER_TABLEAU,
} from './expeditionPlan.ts';
import type { Battle, ExpeditionPlan, Path, Step } from './expeditionPlan.ts';

/**
 * Where a child stands in an expedition, and every move from there. The state only keeps
 * what the child did: tableau, step, picks, camp carried, gifts, bag, purse, question
 * waiting. Each button asks for a transition; a transition refused gives null.
 */

/**
 * Where the questions asked of the seed start, beside the plan's own (a hundred times the
 * tableau, plus the step: expeditionPlan.ts). Each adds its place to its start: a gift adds a
 * thousand times the tableau counted from one, ten times the step, and one once drawn again
 * (8010 to 10051); the roulotte and the egg add ten times the tableau and the step (8003 to
 * 8026, 9002 to 9025). The ranges overlap and no number is shared, by their last digit alone:
 * before adding a question, list the numbers it would ask and check none is taken.
 */
const GIFT_QUESTION = 7000;
const ROULOTTE_QUESTION = 8000;
const EGG_QUESTION = 9000;
/** « L'Œuf Mystère » : one time in two a gift held climbs a level; otherwise it holds coins. */
const EGG_CLIMB_CHANCE = 0.5;

/** A saved ally, as the camp of the next mission receives it. */
export type CarriedUnit = NonNullable<ReturnType<typeof saveUnit>>;
export type Camp = Readonly<{ units: readonly CarriedUnit[]; gold: number; base: number }>;
/** What the child must answer before going on. */
export type Pending =
  Readonly<{ kind: 'gift'; rare: boolean; rerolled: boolean }> | Readonly<{ kind: 'roulotte' }>;
/** On the way, or arrived after King Snake. */
export const EXPEDITION_STATUSES = ['travelling', 'arrived'] as const;
export type ExpeditionState = Readonly<{
  version: ExpeditionVersion;
  seed: number;
  tableau: number;
  step: number;
  /** For every fork and halt passed: 0 (calm, first halt) or 1 (brave, second halt). */
  picks: readonly number[];
  /** The camp carried within the tableau; null at the start of a tableau. */
  camp: Camp | null;
  boons: Boons;
  /** Cards « once » for the next battle: allies to place, the crystal's ward. */
  bag: readonly RewardId[];
  /** Coins carried when the camp is new (gifts « pieces », eggs): added to its purse. */
  purse: number;
  pending: Pending | null;
  status: (typeof EXPEDITION_STATUSES)[number];
}>;

export function startExpedition(seed: number): ExpeditionState | null {
  if (!planExpedition(seed)) return null;
  return Object.freeze({
    version: CURRENT_EXPEDITION_VERSION,
    seed,
    tableau: 0,
    step: 0,
    picks: [],
    camp: null,
    boons: [],
    bag: [],
    purse: 0,
    pending: null,
    status: 'travelling',
  });
}

/** The settings an expedition is played with: those of its version, for good. */
export const tuningOf = (state: ExpeditionState) => EXPEDITION_TUNINGS[state.version];
const stepOf = (plan: ExpeditionPlan, state: ExpeditionState): Step | undefined =>
  plan.tableaux[state.tableau]?.[state.step];

/** The battle the child plays now; `path` chooses at a fork. Null where no battle waits. */
export function nextBattle(
  plan: ExpeditionPlan,
  state: ExpeditionState,
  path?: Path,
): Battle | null {
  if (state.status !== 'travelling' || state.pending) return null;
  const step = stepOf(plan, state);
  if (!step || step.kind === 'halt') return null;
  if (step.kind === 'battle') return step.battle;
  return path === 'calm' ? step.calm : path === 'brave' ? step.brave : null;
}

/**
 * The game of the battle that waits. The camp of the tableau comes along, with the gifts;
 * the cards of the bag are unpacked for this battle only.
 */
export function createExpeditionGame(
  plan: ExpeditionPlan,
  state: ExpeditionState,
  path?: Path,
): Game | null {
  const battle = nextBattle(plan, state, path);
  if (!battle) return null;
  const before = battlesBefore(state);
  const { hpStep, biteStep } = tuningOf(state).strength;
  const rules: StageRules = {
    version: EXPEDITION_STAGE_VERSION,
    king: battle.king,
    court: battle.court,
    ...(before ? { strength: { hp: (1 + hpStep) ** before, bite: (1 + biteStep) ** before } } : {}),
    coins: 0,
    ward: countCards(state.bag, 'cristal') * CRYSTAL_WARD,
    bag: state.bag.filter((card) => card !== 'cristal'),
  };
  try {
    const game = new Game(
      battle.run.seed,
      battle.king ? { bossHpMultiplier: battle.kingHp } : undefined,
      battle.run,
      2,
      rules,
    );
    const camp = state.camp;
    const received = camp
      ? game.receiveCamp({
          units: camp.units,
          gold: Math.min(GOLD_LIMIT, camp.gold + tuningOf(state).stipend),
          base: camp.base,
          boons: state.boons,
        })
      : game.receiveCamp({ units: null, gold: null, base: null, boons: state.boons });
    if (!received) return null;
    if (!camp) game.gold = Math.min(GOLD_LIMIT, game.gold + state.purse);
    return game;
  } catch {
    return null;
  }
}

/** The battles won before the one that waits: five a tableau. */
export function battlesBefore(state: ExpeditionState): number {
  return state.tableau * BATTLES_PER_TABLEAU + battlesBeforeStep(state.step);
}

/** Allies as the next camp receives them; null when one of them cannot be carried. */
export function carryUnits(units: readonly Entity[]): CarriedUnit[] | null {
  const carried: CarriedUnit[] = [];
  for (const unit of units) {
    const saved = saveUnit(unit, true);
    if (!saved) return null;
    carried.push(saved);
  }
  return carried;
}

/** The camp a battle won leaves: the allies standing, the coins, the crystal. */
function campAfter(game: Game): Camp | null {
  const units = carryUnits(game.units.filter((u: Entity) => u.hp > 0));
  if (!units) return null;
  // A camp may win with no ally left standing: the next mission starts by recruiting.
  return Object.freeze({ units, gold: Math.floor(game.gold), base: Math.max(1, game.base) });
}

/**
 * A battle won: the camp comes along to the next step (or a new one waits at the next
 * tableau), and a gift is offered — a rare one after the brave path. After the last
 * guardian, the expedition has arrived. A battle lost changes nothing: it is tried again.
 */
export function winBattle(
  plan: ExpeditionPlan,
  state: ExpeditionState,
  game: Game,
  path?: Path,
): ExpeditionState | null {
  const battle = nextBattle(plan, state, path);
  if (!battle || game.status !== 'won') return null;
  const step = stepOf(plan, state)!;
  const picks = step.kind === 'fork' ? [...state.picks, path === 'brave' ? 1 : 0] : state.picks;
  const lastStep = state.step === STEPS_PER_TABLEAU - 1;
  const lastTableau = state.tableau === plan.tableaux.length - 1;
  const camp = lastStep ? null : campAfter(game);
  if (!lastStep && !camp) return null;
  if (lastStep && lastTableau)
    return Object.freeze({ ...state, picks, camp: null, bag: [], status: 'arrived' });
  return Object.freeze({
    ...state,
    picks,
    camp,
    bag: [],
    purse: 0,
    tableau: lastStep ? state.tableau + 1 : state.tableau,
    step: lastStep ? 0 : state.step + 1,
    pending: Object.freeze({ kind: 'gift', rare: battle.path === 'brave', rerolled: false }),
  });
}

/** The three gifts offered now; a reroll draws three others, once. */
export function giftOffer(state: ExpeditionState): BoonId[] {
  if (state.pending?.kind !== 'gift') return [];
  const salt = (state.tableau + 1) * 1000 + state.step * 10 + (state.pending.rerolled ? 1 : 0);
  const rules = EXPEDITION_GIFT_RULES;
  const offer = boonOffer(
    mixSeed(state.seed, GIFT_QUESTION + salt),
    state.tableau,
    salt,
    state.boons,
    rules,
  );
  // A full bag takes no more cards « once » for the battle.
  return state.bag.length >= STAGE_BAG_LIMIT
    ? offer.map((id) => (isLastingBoon(id) || id === 'pieces' ? id : 'pieces'))
    : offer;
}

export function rerollGifts(state: ExpeditionState): ExpeditionState | null {
  if (state.pending?.kind !== 'gift' || state.pending.rerolled) return null;
  return Object.freeze({ ...state, pending: Object.freeze({ ...state.pending, rerolled: true }) });
}

/** A rare gift counts twice: a lasting one climbs two levels, the purse holds twice the coins. */
const RARE_TIMES = 2;
/** How many times a gift counts, rare or not. */
const giftTimes = (rare: boolean) => (rare ? RARE_TIMES : 1);
/** The coins of the purse « pieces », rare or not. */
export const giftCoins = (rare: boolean) => REWARD_COINS * giftTimes(rare);
/** The level a lasting gift reaches once taken now, rare or not. */
export const levelAfterGift = (state: ExpeditionState, id: LastingBoon, rare: boolean) =>
  Math.min(EXPEDITION_GIFT_RULES.maxLevel, boonLevel(state.boons, id) + giftTimes(rare));
/** A rare offer counts twice for a lasting gift and for the purse; a card of the bag is one card. */
export const countsTwice = (id: BoonId): boolean => isLastingBoon(id) || id === 'pieces';
/** A lasting gift not held yet, when every place is taken: one must be given up for it. */
export const needsPlace = (state: ExpeditionState, id: BoonId): boolean =>
  isLastingBoon(id) &&
  state.boons.length >= EXPEDITION_GIFT_RULES.places &&
  !boonLevel(state.boons, id);
/** The lasting gift the child gives up for a new one, if one was named. */
const givenUp = (replace: string | undefined): LastingBoon | undefined =>
  isLastingBoon(replace) ? replace : undefined;

/** Coins won: into the camp's purse, or kept for the camp still to come. */
const earn = (state: ExpeditionState, coins: number): Partial<ExpeditionState> =>
  state.camp
    ? {
        camp: Object.freeze({
          ...state.camp,
          gold: Math.min(GOLD_LIMIT, state.camp.gold + coins),
        }),
      }
    : { purse: state.purse + coins };

/** Adds a gift (a lasting one climbs, takes a place or the place given); a rare one climbs twice. */
function gain(
  state: ExpeditionState,
  id: BoonId,
  replace: LastingBoon | undefined,
  rare: boolean,
): Partial<ExpeditionState> | null {
  if (isLastingBoon(id)) {
    let boons = takeBoon(state.boons, id, replace, EXPEDITION_GIFT_RULES);
    if (!boons) return null;
    for (let extra = 1; extra < giftTimes(rare); extra++)
      boons = takeBoon(boons, id, undefined, EXPEDITION_GIFT_RULES) ?? boons;
    return withBoons(state, boons);
  }
  if (id === 'pieces') return earn(state, giftCoins(rare));
  if (state.bag.length >= STAGE_BAG_LIMIT) return null;
  return { bag: [...state.bag, id as RewardId] };
}

export function chooseGift(
  state: ExpeditionState,
  id: string,
  replace?: string,
): ExpeditionState | null {
  if (state.pending?.kind !== 'gift' || !giftOffer(state).includes(id as BoonId)) return null;
  const won = gain(state, id as BoonId, givenUp(replace), state.pending.rare);
  return won ? Object.freeze({ ...state, ...won, pending: null }) : null;
}

export function skipGift(state: ExpeditionState): ExpeditionState | null {
  return state.pending?.kind === 'gift' ? Object.freeze({ ...state, pending: null }) : null;
}

/** The gifts held that can still climb a level. */
const climbable = (boons: Boons) => boons.filter((b) => b.level < EXPEDITION_GIFT_RULES.maxLevel);

/** The halt chosen at a halt step: 0 or 1. The campfire and the egg act at once. */
export function chooseHalt(
  plan: ExpeditionPlan,
  state: ExpeditionState,
  choice: 0 | 1,
): ExpeditionState | null {
  const step = stepOf(plan, state);
  if (state.pending || state.status !== 'travelling' || step?.kind !== 'halt') return null;
  const halt = step.halts[choice];
  const tuning = tuningOf(state);
  const moved = { picks: [...state.picks, choice], step: state.step + 1 };
  if (halt === 'roulotte')
    return Object.freeze({ ...state, ...moved, pending: Object.freeze({ kind: 'roulotte' }) });
  if (halt === 'feu') {
    const camp = state.camp && {
      ...state.camp,
      base: Math.min(CRYSTAL_MAX, state.camp.base + tuning.campfire.crystal),
      units: state.camp.units.map((u) => ({
        ...u,
        hp: u.hp + (fullLife(u, state.boons) - u.hp) * tuning.campfire.heal,
      })),
    };
    return Object.freeze({ ...state, ...moved, camp: camp && Object.freeze(camp) });
  }
  // « L'Œuf Mystère » : a gentle surprise drawn from the seed — coins, or a gift that climbs.
  const random = questionStream(state.seed, EGG_QUESTION + state.tableau * 10 + state.step);
  const climbing = climbable(state.boons);
  if (climbing.length && random() < EGG_CLIMB_CHANCE) {
    const boons = takeBoon(
      state.boons,
      pickOne(random, climbing).id,
      undefined,
      EXPEDITION_GIFT_RULES,
    )!;
    return Object.freeze({ ...state, ...moved, ...withBoons(state, boons) });
  }
  return Object.freeze({ ...state, ...moved, ...earn(state, tuning.eggCoins) });
}

/** The armour of these gifts, under the expedition's table of gifts. */
export const armourOf = (boons: Boons) => armourFactor(boons, EXPEDITION_GIFT_RULES);

/**
 * New gifts for the expedition. When the armour changes (taken, climbed or replaced), the
 * allies of the carried camp keep the same share of their life, under their new maximum.
 */
function withBoons(state: ExpeditionState, boons: Boons): Partial<ExpeditionState> {
  const ratio = armourOf(boons) / armourOf(state.boons);
  if (!state.camp || ratio === 1) return { boons };
  const units = state.camp.units.map((u) => ({
    ...u,
    hp: Math.min(fullLife(u, boons), u.hp * ratio),
  }));
  return { boons, camp: Object.freeze({ ...state.camp, units }) };
}

/** An ally's full life, armour included, as the next camp will rebuild it. */
function fullLife(unit: CarriedUnit, boons: Boons): number {
  return kinds[unit.kind as Kind].hp * armourOf(boons);
}

/** What the roulotte offers: gifts to buy and gifts to climb, with their price. */
export function roulotteOffer(state: ExpeditionState) {
  const tuning = tuningOf(state);
  const random = questionStream(state.seed, ROULOTTE_QUESTION + state.tableau * 10 + state.step);
  // The stock is drawn from every gift, whatever the child holds: it stays the same while the
  // child buys, and a gift bought simply leaves it.
  const fresh = boonOffer(Math.floor(random() * SEED_RANGE), 0, 0, [], EXPEDITION_GIFT_RULES);
  return {
    // A gift already held is only offered to climb, at the price of a level.
    buy: fresh
      .filter((id): id is LastingBoon => isLastingBoon(id) && !boonLevel(state.boons, id))
      .map((id) => ({ id, price: tuning.roulotte.gift })),
    climb: climbable(state.boons).map((b) => ({ id: b.id, price: tuning.roulotte.levelUp })),
  };
}

/** The coins the child can spend now: the camp's, or the purse of a camp still to come. */
export const coinsOf = (state: ExpeditionState) => state.camp?.gold ?? state.purse;
/** Whether these coins pay a price of the roulotte. */
export const canPay = (state: ExpeditionState, price: number): boolean => coinsOf(state) >= price;
/** The level a gift held reaches with one level bought at the roulotte. */
export const levelAfterPurchase = (state: ExpeditionState, id: LastingBoon): number =>
  boonLevel(state.boons, id) + 1;
const pay = (state: ExpeditionState, price: number): Partial<ExpeditionState> =>
  state.camp
    ? { camp: Object.freeze({ ...state.camp, gold: state.camp.gold - price }) }
    : { purse: state.purse - price };

/** Buys at the roulotte: a gift, or a level for a gift; the roulotte stays open. */
export function buyAtRoulotte(
  state: ExpeditionState,
  id: string,
  replace?: string,
): ExpeditionState | null {
  if (state.pending?.kind !== 'roulotte' || !isLastingBoon(id)) return null;
  const offer = roulotteOffer(state);
  const item = [...offer.buy, ...offer.climb].find((o) => o.id === id);
  if (!item || !canPay(state, item.price)) return null;
  const boons = takeBoon(state.boons, id, givenUp(replace), EXPEDITION_GIFT_RULES);
  if (!boons) return null;
  const paid = { ...state, ...pay(state, item.price) };
  return Object.freeze({ ...paid, ...withBoons(paid, boons) });
}

export function leaveRoulotte(state: ExpeditionState): ExpeditionState | null {
  return state.pending?.kind === 'roulotte' ? Object.freeze({ ...state, pending: null }) : null;
}

/** The battles of a whole expedition: five a tableau. */
export const EXPEDITION_BATTLES =
  EXPEDITION_TUNINGS[CURRENT_EXPEDITION_VERSION].tableaux.length * BATTLES_PER_TABLEAU;
/** An expedition with something to lose: a battle won, and more to play. */
export const underWay = (state: ExpeditionState | null): state is ExpeditionState =>
  !!state && state.status === 'travelling' && battlesWon(state) > 0;
/** The snakes have grown since the first battle: said from the second battle on. */
export const snakesHaveGrown = (state: ExpeditionState): boolean =>
  state.tableau > 0 || state.step > 0;
/** King Snake, the guardian of the last tableau, ends the expedition: no gift waits after him. */
export const endsExpedition = (state: ExpeditionState, battle: Battle): boolean =>
  battle.king && state.tableau === expeditionPlanOf(state).tableaux.length - 1;

/** The battles won so far: the record of a player counts them. */
export const battlesWon = (state: ExpeditionState): number =>
  state.status === 'arrived' ? EXPEDITION_BATTLES : battlesBefore(state);

/** The plan of a state; a valid state always has one. */
export const expeditionPlanOf = (state: ExpeditionState): ExpeditionPlan =>
  planExpedition(state.seed, state.version)!;

/** What the child is asked now: a gift, the roulotte, a halt, a battle, a path, or nothing. */
export type ExpeditionPhase = 'gift' | 'roulotte' | 'halt' | 'battle' | 'fork' | 'arrived';
export function expeditionPhase(state: ExpeditionState): ExpeditionPhase {
  if (state.status === 'arrived') return 'arrived';
  if (state.pending) return state.pending.kind;
  return stepOf(expeditionPlanOf(state), state)!.kind;
}

/** The choice made at a fork or a halt of the tableau under way, once passed: 0 or 1. */
export function pickAt(state: ExpeditionState, step: number): number | undefined {
  if (!isChoice(SHAPE[step])) return undefined;
  return state.picks[state.tableau * CHOICES_PER_TABLEAU + choicesBefore(step)];
}
