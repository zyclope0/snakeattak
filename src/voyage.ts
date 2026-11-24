import { Game } from './game.ts';
import { MISSIONS, MISSION_SETUPS, missionSetup, readMissionRun } from './missions.ts';
import type { MissionId, MissionRun } from './missions.ts';
import { capriceDefinitionForRun, capricesForMission } from './caprices.ts';
import type { CapriceDefinition } from './caprices.ts';
import { REWARDS, rewardOffer } from './rewards.ts';
import type { RewardId } from './rewards.ts';
import { isIntegerIn } from './plainData.ts';
import { BAG_MILESTONE, countCards, STAGE_BAG_LIMIT } from './voyageRules.ts';
import type { StageRules } from './voyageRules.ts';
import { CURRENT_VOYAGE_VERSION, VOYAGE_TUNINGS, isVoyageVersion } from './voyageTuning.ts';
import type { StageTuning, VoyageTuning, VoyageVersion } from './voyageTuning.ts';
import { mixSeed, pickOne, questionStream, SEED_RANGE, shuffle } from './seededRandom.ts';

/**
 * « Le voyage » : five stages drawn from a seed, like a world of a block game. A stage is
 * an expedition of the game with its own terrain, assault and nests; from the third stage
 * on a caprice surprises it, and the three-headed king closes the last one. Between two
 * stages the child keeps one bonus card out of three for the rest of the voyage.
 *
 * Everything here is computed from the seed alone, before the first fight: the map can
 * show the whole voyage. No browser object, no clock, no draw from the random source of a
 * fight. No new voyage starts since 21 November 2026 (La Grande Expédition took its place):
 * what stays here lets a child finish a voyage begun before.
 */

/** Twenty bits: a million voyages. The expedition draws its seeds in the same range. */
export const VOYAGE_SEED_LIMIT = 0xfffff;
export const isVoyageSeed = (value: unknown): value is number =>
  isIntegerIn(value, 0, VOYAGE_SEED_LIMIT);
/** A voyage seed out of 32 random bits. The page draws them; the rules never do. */
export const voyageSeedFrom = (entropy: number): number => (entropy >>> 0) >>> 12;

export type VoyageStage = Readonly<{
  /** The expedition played here: mission, seed, terrain, assault, nests and caprice. */
  run: MissionRun;
  /** The three-headed king closes this stage. */
  king: boolean;
  /** Coins this stage adds to the purse of its mission; negative, coins it takes away. */
  coins: number;
  /** The three cards offered once the stage is won; none after the last stage. */
  offer: readonly RewardId[];
}>;
export type VoyagePlan = Readonly<{
  version: VoyageVersion;
  seed: number;
  stages: readonly VoyageStage[];
  /** The table this plan was drawn with: it also prices the cards of the bag. */
  tuning: VoyageTuning;
}>;

// What each question asked of the seed is called. A new question takes a new number: the
// existing ones then keep their answers, and so do the voyages already begun.
const ROUTE = 1;
const STAGE = 16;
const OFFER = 64;

const missionOrder = (id: MissionId) => MISSIONS.findIndex((mission) => mission.id === id);

/** Every way through the stages that never repeats a mission nor goes back to an easier one. */
export function voyageRoutes(tuning: VoyageTuning): MissionId[][] {
  let routes: MissionId[][] = [[]];
  for (const stage of tuning.stages)
    routes = routes.flatMap((route) =>
      stage.missions
        .filter((id) => !route.length || missionOrder(id) > missionOrder(route.at(-1)!))
        .map((id) => [...route, id]),
    );
  return routes;
}

/**
 * The caprices that may surprise a stage. The king only comes to close the voyage, and a
 * voyage does not meet the same caprice twice when it can avoid it: « La tirelire » has the
 * same name on every mission.
 */
function surprises(
  missionId: MissionId,
  stage: StageTuning,
  tuning: VoyageTuning,
  last: boolean,
  met: readonly string[],
): readonly CapriceDefinition[] {
  const allowed = capricesForMission(missionId).filter(
    (caprice) =>
      stage.tiers.includes(caprice.tier) &&
      !tuning.excluded.includes(caprice.id) &&
      (last || !caprice.rules.king),
  );
  const unseen = allowed.filter((caprice) => !met.includes(caprice.name));
  return unseen.length ? unseen : allowed;
}

const PLAIN_CARDS = (Object.keys(REWARDS) as RewardId[]).filter((id) => !REWARDS[id].kind);

/**
 * The three cards offered after a stage. With an ally they are drawn like the cards of the
 * great adventure: an ally and two of the three others. Without one, the three others are
 * offered, in an order of their own.
 */
function drawOffer(seed: number, index: number, withAlly: boolean): RewardId[] {
  if (withAlly) return rewardOffer(mixSeed(seed, OFFER + index), BAG_MILESTONE);
  const random = questionStream(seed, OFFER + index);
  return shuffle(random, [...PLAIN_CARDS]);
}

/** One stage. The order of its draws is part of the rules: setup, seed, caprice. */
function drawStage(
  seed: number,
  index: number,
  missionId: MissionId,
  tuning: VoyageTuning,
  met: readonly string[],
): VoyageStage {
  const random = questionStream(seed, STAGE + index);
  const last = index === tuning.stages.length - 1;
  const setup = missionSetup(Math.floor(random() * MISSION_SETUPS));
  const fightSeed = Math.floor(random() * SEED_RANGE);
  const candidates = surprises(missionId, tuning.stages[index], tuning, last, met);
  const caprice = candidates.length ? pickOne(random, candidates) : null;
  const run = readMissionRun({
    missionId,
    balance: 2,
    // The refuge keeps its gentle opening: one lane, then two, then three.
    ...(missionId === 'refuge' ? { rules: 2 } : {}),
    seed: fightSeed,
    ...setup,
    ...(caprice ? { caprice: caprice.id } : {}),
  })!;
  return Object.freeze({
    run,
    king: last,
    coins: tuning.stages[index].coins,
    offer: Object.freeze(last ? [] : drawOffer(seed, index, tuning.stages[index].ally)),
  });
}

/** The whole voyage of a seed under a given table. The balance lab tries other tables. */
export function drawVoyage(
  seed: number,
  tuning: VoyageTuning,
  version: VoyageVersion = CURRENT_VOYAGE_VERSION,
): VoyagePlan | null {
  const routes = voyageRoutes(tuning);
  if (!isVoyageSeed(seed) || !routes.length) return null;
  const route = pickOne(questionStream(seed, ROUTE), routes);
  const stages: VoyageStage[] = [];
  const met: string[] = [];
  for (const [index, missionId] of route.entries()) {
    const stage = drawStage(seed, index, missionId, tuning, met);
    const caprice = stageCaprice(stage);
    if (caprice) met.push(caprice.name);
    stages.push(stage);
  }
  return Object.freeze({ version, seed, stages: Object.freeze(stages), tuning });
}

/** The voyage of a seed: same seed and same version, same voyage, on every device. */
export function planVoyage(
  seed: number,
  version: VoyageVersion = CURRENT_VOYAGE_VERSION,
): VoyagePlan | null {
  return isVoyageVersion(version) ? drawVoyage(seed, VOYAGE_TUNINGS[version], version) : null;
}

/** The caprice that surprises a stage, with the rules it really plays; null without one. */
export const stageCaprice = (stage: VoyageStage): CapriceDefinition | null =>
  capriceDefinitionForRun(stage.run);

/**
 * What the engine adds to the expedition of a stage. Every card of the bag counts again at
 * every stage: coins and ward are added up here, allies and honey are unpacked by the engine.
 */
export function stageRulesFor(
  plan: VoyagePlan,
  index: number,
  bag: readonly RewardId[],
): StageRules | null {
  const stage = plan.stages[index];
  if (!stage || !Array.isArray(bag) || bag.length > STAGE_BAG_LIMIT) return null;
  const court = plan.tuning.kingCourt === true;
  // The same keys in the same order as `readStageRules`: the voyage compares them as text.
  // A voyage of version 1 keeps the rules it was played with, byte for byte.
  return {
    version: court ? 2 : 1,
    king: stage.king,
    ...(court ? { court: stage.king } : {}),
    coins: stage.coins + countCards(bag, 'pieces') * plan.tuning.bonusCoins,
    ward: countCards(bag, 'cristal') * plan.tuning.bonusWard,
    bag: [...bag],
  };
}

/**
 * A new camp for a stage: the purse of its mission, the bag unpacked, the king at the end
 * of the last one. Null when the stage or the bag does not exist. The game is never saved
 * as a camp: a stage left halfway starts again from its beginning.
 */
export function createStageGame(
  plan: VoyagePlan,
  index: number,
  bag: readonly RewardId[],
): Game | null {
  const rules = stageRulesFor(plan, index, bag);
  if (!rules) return null;
  try {
    const { run } = plan.stages[index];
    return new Game(run.seed, { bossHpMultiplier: plan.tuning.kingHp }, run, 2, rules);
  } catch {
    return null;
  }
}
