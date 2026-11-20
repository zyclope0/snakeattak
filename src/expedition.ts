import { Game } from './game.ts';
import type { Entity } from './engine/state.ts';
import { MISSIONS, missionSetup, MISSION_SETUPS, readMissionRun } from './missions.ts';
import type { MissionId, MissionRun } from './missions.ts';
import { capricesForMission } from './caprices.ts';
import type { CapriceTier } from './caprices.ts';
import { REWARDS } from './rewards.ts';
import type { RewardId } from './rewards.ts';
import { seededStream, SEED_RANGE } from './seededRandom.ts';
import { BOON_RULES, boonLevel, boonOffer, isLastingBoon, takeBoon } from './boons.ts';
import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import type { BoonId, Boons, LastingBoon } from './boons.ts';
import { readUnit, saveUnit, UNIT_LIMIT } from './checkpointUnits.ts';
import { isArrayOfLength, isIntegerIn, isNumberIn, isOneOf, isRecord } from './plainData.ts';
import { readBoons } from './boons.ts';
import { isBonusCard, STAGE_BAG_LIMIT } from './voyageRules.ts';
import { isVoyageSeed } from './voyage.ts';
import type { StageRules } from './voyageRules.ts';
import { CRYSTAL_MAX, CRYSTAL_WARD, GOLD_LIMIT, REWARD_COINS } from './gameConstants.ts';

/**
 * « La Grande Expédition » (decisions of the parent, 20 November 2026): three tableaux of five
 * missions, a guardian at the fifth, King Snake at the end of the third. Between missions the
 * child picks a calm or a brave path, and stops at halts. Within a tableau the camp comes
 * along: the allies still standing, the coins, the crystal. The gifts of the endless
 * adventure come along all the way.
 *
 * Everything is drawn from the seed, apart from the fights: the map can be shown whole, and a
 * code shares it. The rules of a version never change once played: new values, new version.
 */
export type ExpeditionVersion = 1;
export const CURRENT_EXPEDITION_VERSION: ExpeditionVersion = 1;

type Draw = Readonly<{ missions: readonly MissionId[]; tiers: readonly CapriceTier[] }>;
export type TableauTuning = Readonly<{
  /** The first mission of the tableau, with a new camp. */
  first: Draw;
  /** The calm path: an easier draw, an ordinary gift after it. */
  calm: Draw;
  /** The brave path: a harder draw, a rare gift after it (it comes at level 2). */
  brave: Draw;
  /** The guardian's mission; the king closes it with this much life (6 to 10, as in a mission). */
  guardian: Draw & { kingHp: number; court: boolean };
}>;
export type ExpeditionTuning = Readonly<{
  tableaux: readonly TableauTuning[];
  /** Coins added to the camp's purse before every mission but the first of a tableau. */
  stipend: number;
  /**
   * The snakes grow stronger battle after battle, all expedition long: their life and their
   * bite are multiplied by 1 + this step at each battle won before (as in the endless
   * adventure, where it is at each king).
   */
  strength: Readonly<{ hpStep: number; biteStep: number }>;
  /** « Le Feu de Camp » : crystal mended, and the share of their lost life the allies get back. */
  campfire: Readonly<{ crystal: number; heal: number }>;
  /** « La Roulotte de Mamie Pistache » : what a gift costs, and what a level up costs. */
  roulotte: Readonly<{ gift: number; levelUp: number }>;
  /** « L'Œuf Mystère » : the coins of its gentlest surprise. */
  eggCoins: number;
  /** Caprices never drawn here: those that limit the kinds of allies (the camp is built). */
  excluded: readonly string[];
}>;

/**
 * Version 1. The missions climb in the order of the game; the brave path meets a stronger
 * caprice. The parent chose the snakes' strength on 20 November 2026 (« moyen ») after the
 * measures of docs/VOYAGE-LONG-PROPOSITION.md: life ×1.06 and bite ×1.03 a battle.
 */
const VERSION_1: ExpeditionTuning = {
  tableaux: [
    {
      first: { missions: ['refuge'], tiers: [] },
      calm: { missions: ['refuge', 'trois-ponts'], tiers: [] },
      brave: { missions: ['trois-ponts', 'course'], tiers: ['petit'] },
      guardian: { missions: ['course'], tiers: [], kingHp: 6, court: false },
    },
    {
      first: { missions: ['trois-ponts'], tiers: ['petit'] },
      calm: { missions: ['course', 'coquilles'], tiers: ['petit'] },
      brave: { missions: ['coquilles', 'sonnette'], tiers: ['moyen'] },
      guardian: { missions: ['sonnette'], tiers: [], kingHp: 6, court: false },
    },
    {
      first: { missions: ['coquilles'], tiers: ['petit'] },
      calm: { missions: ['sonnette', 'coquilles'], tiers: ['moyen'] },
      brave: { missions: ['sonnette', 'carrefour'], tiers: ['grand'] },
      guardian: { missions: ['carrefour'], tiers: [], kingHp: 6.5, court: true },
    },
  ],
  stipend: 120,
  strength: { hpStep: 0.06, biteStep: 0.03 },
  campfire: { crystal: 40, heal: 0.5 },
  roulotte: { gift: 200, levelUp: 150 },
  eggCoins: 150,
  excluded: ['sonnette-petit', 'carrefour-moyen'],
};
export const EXPEDITION_TUNINGS: Readonly<Record<ExpeditionVersion, ExpeditionTuning>> = {
  1: VERSION_1,
};

export type Path = 'calm' | 'brave';
export type HaltKind = 'feu' | 'roulotte' | 'oeuf';
export type Battle = Readonly<{
  run: MissionRun;
  path: Path | 'first' | 'guardian';
  king: boolean;
  court: boolean;
  kingHp: number;
}>;
/** One step of a tableau: a battle, a choice of two battles, or a choice of two halts. */
export type Step =
  | Readonly<{ kind: 'battle'; battle: Battle }>
  | Readonly<{ kind: 'fork'; calm: Battle; brave: Battle }>
  | Readonly<{ kind: 'halt'; halts: readonly [HaltKind, HaltKind] }>;
export type ExpeditionPlan = Readonly<{
  version: ExpeditionVersion;
  seed: number;
  tableaux: readonly (readonly Step[])[];
}>;

/** The shape of every tableau: five battles, two of them after a choice of halts. */
const SHAPE = ['first', 'fork', 'halt', 'fork', 'fork', 'halt', 'guardian'] as const;
export const STEPS_PER_TABLEAU = SHAPE.length;
const HALTS: readonly HaltKind[] = ['feu', 'roulotte', 'oeuf'];

function mix(seed: number, salt: number): number {
  let hash = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}
const stream = (seed: number, salt: number) => seededStream(mix(seed, salt));
const pick = <T>(random: () => number, list: readonly T[]): T =>
  list[Math.floor(random() * list.length)];

function drawBattle(
  random: () => number,
  draw: Draw,
  path: Battle['path'],
  tuning: ExpeditionTuning,
  guardian?: TableauTuning['guardian'],
): Battle {
  const missionId = pick(random, draw.missions);
  const setup = missionSetup(Math.floor(random() * MISSION_SETUPS));
  const fightSeed = Math.floor(random() * SEED_RANGE);
  const caprices = capricesForMission(missionId).filter(
    (c) => draw.tiers.includes(c.tier) && !tuning.excluded.includes(c.id) && !c.rules.king,
  );
  const caprice = caprices.length ? pick(random, caprices) : null;
  const run = readMissionRun({
    missionId,
    balance: 2,
    ...(missionId === 'refuge' ? { rules: 2 } : {}),
    seed: fightSeed,
    ...setup,
    ...(caprice ? { caprice: caprice.id } : {}),
  })!;
  return Object.freeze({
    run,
    path,
    king: !!guardian,
    court: guardian?.court ?? false,
    kingHp: guardian?.kingHp ?? 1,
  });
}

/** The whole expedition of a seed. Null for a seed or a version that does not exist. */
export function planExpedition(
  seed: number,
  version: ExpeditionVersion = CURRENT_EXPEDITION_VERSION,
  tuning: ExpeditionTuning = EXPEDITION_TUNINGS[version],
): ExpeditionPlan | null {
  // The seeds of the voyage: twenty bits, a code short enough for a child to copy.
  if (!isVoyageSeed(seed) || !tuning) return null;
  const tableaux = tuning.tableaux.map((table, t) =>
    Object.freeze(
      SHAPE.map((shape, s): Step => {
        const random = stream(seed, 100 * (t + 1) + s);
        if (shape === 'halt') {
          const first = pick(random, HALTS);
          const second = pick(
            random,
            HALTS.filter((h) => h !== first),
          );
          return Object.freeze({ kind: 'halt', halts: Object.freeze([first, second]) as never });
        }
        if (shape === 'fork')
          return Object.freeze({
            kind: 'fork',
            calm: drawBattle(random, table.calm, 'calm', tuning),
            brave: drawBattle(random, table.brave, 'brave', tuning),
          });
        const battle =
          shape === 'first'
            ? drawBattle(random, table.first, 'first', tuning)
            : drawBattle(random, table.guardian, 'guardian', tuning, table.guardian);
        return Object.freeze({ kind: 'battle', battle });
      }),
    ),
  );
  return Object.freeze({ version, seed, tableaux: Object.freeze(tableaux) });
}

/** A saved ally, as the camp of the next mission receives it. */
export type CarriedUnit = NonNullable<ReturnType<typeof saveUnit>>;
export type Camp = Readonly<{ units: readonly CarriedUnit[]; gold: number; base: number }>;
/** What the child must answer before going on. */
export type Pending =
  Readonly<{ kind: 'gift'; rare: boolean; rerolled: boolean }> | Readonly<{ kind: 'roulotte' }>;
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
  status: 'travelling' | 'arrived';
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

const tuningOf = (state: ExpeditionState) => EXPEDITION_TUNINGS[state.version];
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
  const count = (id: RewardId) => state.bag.filter((card) => card === id).length;
  const before = battlesBefore(state);
  const { hpStep, biteStep } = tuningOf(state).strength;
  const rules: StageRules = {
    version: 3,
    king: battle.king,
    court: battle.court,
    ...(before ? { strength: { hp: (1 + hpStep) ** before, bite: (1 + biteStep) ** before } } : {}),
    coins: 0,
    ward: count('cristal') * CRYSTAL_WARD,
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
  const inTableau = SHAPE.slice(0, state.step).filter((shape) => shape !== 'halt').length;
  return state.tableau * BATTLES_PER_TABLEAU + inTableau;
}
const BATTLES_PER_TABLEAU = SHAPE.filter((shape) => shape !== 'halt').length;

/** The camp a battle won leaves: the allies standing, the coins, the crystal. */
function campAfter(game: Game): Camp | null {
  const units: CarriedUnit[] = [];
  for (const unit of game.units.filter((u: Entity) => u.hp > 0)) {
    const saved = saveUnit(unit, true);
    if (!saved) return null;
    units.push(saved);
  }
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
  const rules = BOON_RULES[1];
  const offer = boonOffer(mix(state.seed, 7000 + salt), state.tableau, salt, state.boons, rules);
  // A full bag takes no more cards « once » for the battle.
  return state.bag.length >= STAGE_BAG_LIMIT
    ? offer.map((id) => (isLastingBoon(id) || id === 'pieces' ? id : 'pieces'))
    : offer;
}

export function rerollGifts(state: ExpeditionState): ExpeditionState | null {
  if (state.pending?.kind !== 'gift' || state.pending.rerolled) return null;
  return Object.freeze({ ...state, pending: Object.freeze({ ...state.pending, rerolled: true }) });
}

/** Adds a gift (a lasting one climbs, takes a place or the place given); a rare one climbs twice. */
function gain(
  state: ExpeditionState,
  id: BoonId,
  replace: LastingBoon | undefined,
  rare: boolean,
): Partial<ExpeditionState> | null {
  if (isLastingBoon(id)) {
    let boons = takeBoon(state.boons, id, replace, BOON_RULES[1]);
    if (!boons) return null;
    if (rare) boons = takeBoon(boons, id, undefined, BOON_RULES[1]) ?? boons;
    return withBoons(state, boons);
  }
  if (id === 'pieces') {
    const coins = REWARD_COINS * (rare ? 2 : 1);
    return state.camp
      ? {
          camp: Object.freeze({
            ...state.camp,
            gold: Math.min(GOLD_LIMIT, state.camp.gold + coins),
          }),
        }
      : { purse: state.purse + coins };
  }
  if (state.bag.length >= STAGE_BAG_LIMIT) return null;
  return { bag: [...state.bag, id as RewardId] };
}

export function chooseGift(
  state: ExpeditionState,
  id: string,
  replace?: string,
): ExpeditionState | null {
  if (state.pending?.kind !== 'gift' || !giftOffer(state).includes(id as BoonId)) return null;
  const won = gain(
    state,
    id as BoonId,
    isLastingBoon(replace) ? replace : undefined,
    state.pending.rare,
  );
  return won ? Object.freeze({ ...state, ...won, pending: null }) : null;
}

export function skipGift(state: ExpeditionState): ExpeditionState | null {
  return state.pending?.kind === 'gift' ? Object.freeze({ ...state, pending: null }) : null;
}

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
  const random = stream(state.seed, 9000 + state.tableau * 10 + state.step);
  const climbable = state.boons.filter((b) => b.level < BOON_RULES[1].maxLevel);
  if (climbable.length && random() < 0.5) {
    const boons = takeBoon(state.boons, pick(random, climbable).id, undefined, BOON_RULES[1])!;
    return Object.freeze({ ...state, ...moved, ...withBoons(state, boons) });
  }
  const coins = tuning.eggCoins;
  return Object.freeze({
    ...state,
    ...moved,
    ...(state.camp
      ? {
          camp: Object.freeze({
            ...state.camp,
            gold: Math.min(GOLD_LIMIT, state.camp.gold + coins),
          }),
        }
      : { purse: state.purse + coins }),
  });
}

/**
 * New gifts for the expedition. When the armour changes (taken, climbed or replaced), the
 * allies of the carried camp keep the same share of their life, under their new maximum.
 */
function withBoons(state: ExpeditionState, boons: Boons): Partial<ExpeditionState> {
  const armour = (list: Boons) => 1 + boonLevel(list, 'armure') * BOON_RULES[1].steps.armure;
  const ratio = armour(boons) / armour(state.boons);
  if (!state.camp || ratio === 1) return { boons };
  const units = state.camp.units.map((u) => ({
    ...u,
    hp: Math.min(fullLife(u, boons), u.hp * ratio),
  }));
  return { boons, camp: Object.freeze({ ...state.camp, units }) };
}

/** An ally's full life, armour included, as the next camp will rebuild it. */
function fullLife(unit: CarriedUnit, boons: Boons): number {
  const armour = 1 + boonLevel(boons, 'armure') * BOON_RULES[1].steps.armure;
  return kinds[unit.kind as Kind].hp * armour;
}

/** What the roulotte offers: gifts to buy and gifts to climb, with their price. */
export function roulotteOffer(state: ExpeditionState) {
  const tuning = tuningOf(state);
  const random = stream(state.seed, 8000 + state.tableau * 10 + state.step);
  const fresh = boonOffer(Math.floor(random() * SEED_RANGE), 0, 0, state.boons, BOON_RULES[1]);
  return {
    // A gift already held is only offered to climb, at the price of a level.
    buy: fresh
      .filter((id): id is LastingBoon => isLastingBoon(id) && !boonLevel(state.boons, id))
      .map((id) => ({ id, price: tuning.roulotte.gift })),
    climb: state.boons
      .filter((b) => b.level < BOON_RULES[1].maxLevel)
      .map((b) => ({ id: b.id, price: tuning.roulotte.levelUp })),
  };
}

const coinsOf = (state: ExpeditionState) => state.camp?.gold ?? state.purse;
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
  if (!item || coinsOf(state) < item.price) return null;
  const boons = takeBoon(
    state.boons,
    id,
    isLastingBoon(replace) ? replace : undefined,
    BOON_RULES[1],
  );
  if (!boons) return null;
  const paid = { ...state, ...pay(state, item.price) };
  return Object.freeze({ ...paid, ...withBoons(paid, boons) });
}

export function leaveRoulotte(state: ExpeditionState): ExpeditionState | null {
  return state.pending?.kind === 'roulotte' ? Object.freeze({ ...state, pending: null }) : null;
}

/** The kinds of the plain cards, for the screens that draw them. */
export const isAllyCard = (id: string) =>
  Object.hasOwn(REWARDS, id) && !!REWARDS[id as RewardId].kind;
/** The missions of the game, in order: the map draws one sign per mission. */
export const missionNumber = (id: MissionId) => MISSIONS.findIndex((m) => m.id === id) + 1;

/** The battles of a whole expedition: five a tableau. */
export const EXPEDITION_BATTLES = EXPEDITION_TUNINGS[1].tableaux.length * BATTLES_PER_TABLEAU;
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

/** The forks and halts of a tableau before a step: one pick each. */
const choicesBefore = (step: number) =>
  SHAPE.slice(0, step).filter((shape) => shape === 'fork' || shape === 'halt').length;
const CHOICES_PER_TABLEAU = choicesBefore(STEPS_PER_TABLEAU);

/** A carried camp read back: its allies as the next camp will receive them, its coins, its crystal. */
function readCamp(raw: unknown, boons: Boons): Camp | null {
  if (
    !isRecord(raw) ||
    !isIntegerIn(raw.gold, 0, GOLD_LIMIT) ||
    !isNumberIn(raw.base, 1, CRYSTAL_MAX) ||
    !isArrayOfLength(raw.units, 0, UNIT_LIMIT)
  )
    return null;
  const lifeFactor = 1 + boonLevel(boons, 'armure') * BOON_RULES[1].steps.armure;
  const ids = (raw.units as unknown[]).map((u) =>
    isRecord(u) && isIntegerIn(u.id, 1, 1e7) ? u.id : 0,
  );
  const nextId = Math.max(0, ...ids);
  const taken = new Set<number>();
  const units: CarriedUnit[] = [];
  for (const saved of raw.units) {
    const unit = readUnit(saved, { homes: true, supplies: true, nextId, lifeFactor }, taken);
    const copy = unit && saveUnit(unit, true);
    if (!copy) return null;
    taken.add(copy.id);
    units.push(copy);
  }
  if (units.filter((u) => u.kind === 'hero').length > 1) return null;
  return Object.freeze({ units: Object.freeze(units), gold: raw.gold, base: raw.base });
}

function readPending(raw: unknown): Pending | null | undefined {
  if (raw === null) return null;
  if (!isRecord(raw)) return undefined;
  if (raw.kind === 'roulotte') return Object.freeze({ kind: 'roulotte' });
  if (raw.kind === 'gift' && typeof raw.rare === 'boolean' && typeof raw.rerolled === 'boolean')
    return Object.freeze({ kind: 'gift', rare: raw.rare, rerolled: raw.rerolled });
  return undefined;
}

/**
 * Canonical frozen copy of a state that a real expedition can reach; null for anything else.
 * The plan is never stored: it is drawn again from the seed.
 */
export function readExpeditionState(raw: unknown): ExpeditionState | null {
  try {
    if (!isRecord(raw) || raw.version !== 1 || !isVoyageSeed(raw.seed)) return null;
    const plan = planExpedition(raw.seed, raw.version);
    if (
      !plan ||
      !isIntegerIn(raw.tableau, 0, plan.tableaux.length - 1) ||
      !isIntegerIn(raw.step, 0, STEPS_PER_TABLEAU - 1) ||
      !isOneOf(raw.status, ['travelling', 'arrived'] as const) ||
      !isIntegerIn(raw.purse, 0, GOLD_LIMIT) ||
      !isArrayOfLength(raw.bag, 0, STAGE_BAG_LIMIT) ||
      !raw.bag.every(isBonusCard)
    )
      return null;
    const { tableau, step, status } = raw;
    const passed = tableau * CHOICES_PER_TABLEAU + choicesBefore(step);
    if (!isArrayOfLength(raw.picks, passed, passed) || !raw.picks.every((p) => p === 0 || p === 1))
      return null;
    const picks = raw.picks as (0 | 1)[];
    const boons = readBoons(raw.boons, BOON_RULES[1]);
    const pending = readPending(raw.pending);
    if (!boons || pending === undefined) return null;
    const camp = raw.camp === null ? null : readCamp(raw.camp, boons);
    if (raw.camp !== null && !camp) return null;
    const before = SHAPE[step - 1];
    if (status === 'arrived') {
      const last = tableau === plan.tableaux.length - 1 && step === STEPS_PER_TABLEAU - 1;
      if (!last || pending || camp) return null;
    } else {
      // The camp travels within a tableau: none at its first step, always one after.
      if ((step === 0) !== (camp === null)) return null;
      if (pending?.kind === 'gift') {
        const afterBattle = step === 0 ? tableau > 0 : before !== 'halt';
        const brave = before === 'fork' && picks.at(-1) === 1;
        if (!afterBattle || (pending.rare && !brave)) return null;
      }
      if (pending?.kind === 'roulotte') {
        const halt = plan.tableaux[tableau][step - 1];
        if (halt?.kind !== 'halt' || halt.halts[picks.at(-1)!] !== 'roulotte') return null;
      }
    }
    return Object.freeze({
      version: 1,
      seed: raw.seed,
      tableau,
      step,
      picks: Object.freeze([...picks]),
      camp,
      boons,
      bag: Object.freeze([...(raw.bag as RewardId[])]),
      purse: raw.purse,
      pending,
      status,
    });
  } catch {
    return null;
  }
}
