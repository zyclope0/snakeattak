import { activeEnemyLanes } from './tutorial.ts';
import { waveStats } from './data.ts';
import { variantFor, waveBriefing } from './waves.ts';
import type { EnemyKind } from './enemies.ts';
import { flyingVariant } from './flying.ts';
import {
  CAPRICES,
  CREATOR_CHALLENGES,
  capriceById,
  capriceCount,
  capriceRules,
} from './caprices.ts';
import type { CapriceRules } from './caprices.ts';
import { isIntegerIn, isOneOf, isRecord, isUint32 } from './plainData.ts';
import * as TEXT from './texts/fr/adventure.ts';
import { nextSeed, seedShare } from './seededRandom.ts';
import { LANE_COUNT } from './gameConstants.ts';

export type MissionId =
  'refuge' | 'trois-ponts' | 'course' | 'coquilles' | 'sonnette' | 'carrefour';
export type MissionRun = Readonly<{
  missionId: MissionId;
  rules?: 2;
  balance?: 2;
  /**
   * The second path rules (`navigation.ts`): a walker never plans across a rock. Only with the
   * second balance revision; a run without it keeps the first rules, so that its departure
   * code plays the game it always played.
   */
  paths?: 2;
  seed: number;
  layout: 0 | 1 | 2;
  assault: 'balanced' | 'rush' | 'escort';
  nest: 'spread' | 'clustered';
  caprice?: string;
}>;
export type MissionDefinition = Readonly<{
  id: MissionId;
  name: string;
  objective: string;
  waves: readonly number[];
  budget: number;
  unlockRank: number;
}>;
export const MISSIONS: readonly MissionDefinition[] = Object.freeze(
  [
    {
      id: 'refuge',
      name: TEXT.leRefuge,
      objective: TEXT.protegeLeCristalPendantTroisVagues,
      waves: [1, 2, 3],
      budget: 450,
      unlockRank: 3,
    },
    {
      id: 'trois-ponts',
      name: TEXT.lesTroisPonts,
      objective: TEXT.gardeLesTroisPassagesOuvertsATes,
      waves: [2, 3, 4],
      budget: 550,
      unlockRank: 4,
    },
    {
      id: 'course',
      name: TEXT.laCourseDesVifs,
      objective: TEXT.intercepteLesRapidesAvantLeRefuge,
      waves: [3, 4, 5],
      budget: 700,
      unlockRank: 5,
    },
    {
      id: 'coquilles',
      name: TEXT.lesPremieresCoquilles,
      objective: TEXT.resisteAuxEclosionsEtAuxPremieres,
      waves: [4, 5, 6],
      budget: 850,
      unlockRank: 6,
    },
    {
      id: 'sonnette',
      name: TEXT.dragonEtSonnette,
      objective: TEXT.surmonteLesHesitationsEtProtegeTes,
      waves: [5, 6, 7],
      budget: 1050,
      unlockRank: 7,
    },
    {
      id: 'carrefour',
      name: TEXT.leCarrefourDesFougeres,
      objective: TEXT.tiensQuatreVaguesAuxDeuxJonctions,
      waves: [5, 6, 7, 8],
      budget: 1300,
      unlockRank: 8,
    },
  ].map((d) => Object.freeze({ ...d, waves: Object.freeze(d.waves) })) as MissionDefinition[],
);

export function missionById(id: unknown): MissionDefinition | null {
  return MISSIONS.find((mission) => mission.id === id) ?? null;
}
/**
 * The eighteen setups of a mission: three terrains, three assaults, two ways to lay the
 * eggs. Their order is written in the departure codes: never reorder them.
 */
export const MISSION_SETUPS = 18;
/** The path rules of every new departure: a game begun before keeps its own. */
export const CURRENT_MISSION_PATHS = 2;
const layouts = [0, 1, 2] as const;
const assaults = ['balanced', 'rush', 'escort'] as const;
const nests = ['spread', 'clustered'] as const;
type MissionSetup = Pick<MissionRun, 'layout' | 'assault' | 'nest'>;
export function missionSetup(index: number): MissionSetup {
  return {
    layout: (index % 3) as 0 | 1 | 2,
    assault: assaults[Math.floor(index / 3) % 3],
    nest: nests[Math.floor(index / 9)],
  };
}
export function missionSetupIndex(setup: MissionSetup): number {
  return setup.layout + assaults.indexOf(setup.assault) * 3 + nests.indexOf(setup.nest) * 9;
}
/** Canonical copy: callers cannot mutate an active expedition through their input object. */
export function readMissionRun(raw: unknown): MissionRun | null {
  if (
    !isRecord(raw) ||
    !missionById(raw.missionId) ||
    !isUint32(raw.seed) ||
    !isOneOf(raw.layout, layouts) ||
    !isOneOf(raw.assault, assaults) ||
    !isOneOf(raw.nest, nests)
  )
    return null;
  // The three optional fields are either absent or exactly what their rule allows.
  if (Object.hasOwn(raw, 'balance') && raw.balance !== 2) return null;
  if (Object.hasOwn(raw, 'rules') && (raw.rules !== 2 || raw.missionId !== 'refuge')) return null;
  if (Object.hasOwn(raw, 'paths') && (raw.paths !== 2 || raw.balance !== 2)) return null;
  if (Object.hasOwn(raw, 'caprice') && capriceById(raw.caprice)?.missionId !== raw.missionId)
    return null;
  return Object.freeze({
    missionId: raw.missionId as MissionId,
    ...(raw.balance === 2 ? { balance: 2 as const } : {}),
    ...(raw.rules === 2 ? { rules: 2 as const } : {}),
    ...(raw.paths === 2 ? { paths: 2 as const } : {}),
    seed: raw.seed,
    layout: raw.layout,
    assault: raw.assault,
    nest: raw.nest,
    ...(Object.hasOwn(raw, 'caprice') ? { caprice: raw.caprice as string } : {}),
  });
}
/** Revision 2 persists only immutable catalogue identities; Game/lab may use aliases. */
export function isPersistableMissionRun(run: MissionRun): boolean {
  return (
    run.balance !== 2 ||
    run.caprice === undefined ||
    CAPRICES.some((caprice) => caprice.id === run.caprice) ||
    CREATOR_CHALLENGES.some((caprice) => caprice.id === run.caprice)
  );
}
export function createMissionRun(
  id: MissionId,
  seed: number,
  previous?: MissionRun | null,
  balance?: 2,
  paths?: 2,
): MissionRun {
  if (balance !== undefined && balance !== 2) throw new RangeError(TEXT.revisionInvalide);
  // The second path rules came after the second balance revision, and only with it.
  if (paths !== undefined && (paths !== 2 || balance !== 2))
    throw new RangeError(TEXT.revisionInvalide);
  if (!missionById(id) || !isUint32(seed)) throw new RangeError(TEXT.expeditionInvalide);
  // Eighteen bounded configurations. Incrementing the slot does not change the retry seed.
  let slot = nextSeed(seed);
  slot %= MISSION_SETUPS;
  const prior = readMissionRun(previous);
  const configAt = (index: number) => ({
    missionId: id,
    ...(balance === 2 ? { balance: 2 as const } : {}),
    ...(id === 'refuge' ? { rules: 2 as const } : {}),
    ...(paths === 2 ? { paths: 2 as const } : {}),
    seed,
    ...missionSetup(index),
  });
  let config = configAt(slot);
  // A visible new departure always changes the terrain. Retry and saved runs
  // are restored through readMissionRun, without passing through this draw.
  if (prior && config.layout === prior.layout) config = configAt((slot + 1) % MISSION_SETUPS);
  return Object.freeze(config);
}
export type MissionWave = Readonly<{
  rank: number;
  stats: Readonly<ReturnType<typeof waveStats>>;
  composition: readonly EnemyKind[];
  cadence: readonly number[];
  eggs: readonly Readonly<{ lane: 0 | 1 | 2; x: number; hatchIn: number; count: number }>[];
  pattern: Readonly<{ title: string; tip: string }>;
}>;
/** The serpent of one slot once the assault has reshaped the usual line-up of the rank. */
function assaultVariant(
  assault: MissionRun['assault'],
  rank: number,
  index: number,
  usual: EnemyKind,
): EnemyKind {
  if (assault === 'rush') {
    const light = usual === 'normal' || usual === 'runner' || usual === 'armored';
    return rank >= 3 && index % 3 !== 2 && light ? 'runner' : usual;
  }
  if (assault !== 'escort') return usual;
  if (rank >= 5 && index % 4 === 0) return rank >= 6 ? 'umbrella' : 'armored';
  if (rank >= 7 && index % 4 === 1) return 'spitter';
  return usual;
}
/** Seconds between two serpents, repeated in a loop: small packs, escorts or a steady line. */
function assaultCadence(assault: MissionRun['assault']): number[] {
  return assault === 'rush' ? [0.4, 0.4, 2] : assault === 'escort' ? [0.65, 0.65, 1.55] : [0.95];
}
/** Up to three seconds of delay per egg, drawn from the seed alone: a retry hatches alike. */
function incubationJitter(seed: number, local: number, index: number): number {
  return (
    seedShare(
      nextSeed((seed ^ Math.imul(local, 2654435761) ^ Math.imul(index + 1, 2246822519)) >>> 0),
    ) * 3
  );
}
/** Where and when the eggs of one wave hatch. An egg never lies on a lane closed to serpents. */
function missionEggs(run: MissionRun, local: number, rank: number, caprice: CapriceRules) {
  const clustered = run.nest === 'clustered';
  const nestLane = (run.seed + local) % LANE_COUNT;
  const lanes = activeEnemyLanes(run, local);
  const count = Math.min(3, (rank >= 8 ? 3 : rank >= 4 ? 2 : 1) + caprice.eggs);
  return Array.from({ length: count }, (_, index) => {
    const wanted = clustered ? nestLane : (nestLane + index) % LANE_COUNT;
    const lane = lanes.includes(wanted) ? wanted : lanes[(run.seed + local + index) % lanes.length];
    return Object.freeze({
      lane: lane as 0 | 1 | 2,
      x: 252 + index * (clustered ? 24 : 48),
      hatchIn:
        ((clustered ? 10 + index * 0.8 : 7 + index * 6) +
          incubationJitter(run.seed, local, index)) *
        caprice.hatch,
      count: 2,
    });
  });
}
/** The advice shown before the wave: the assault, the nests, then the flying serpents. */
function patternTip(run: MissionRun, rank: number, tacticalRulesEnabled: boolean): string {
  const assaultTip =
    run.assault === 'rush'
      ? TEXT.petitsGroupesRapidesGardeDesAllies
      : run.assault === 'escort'
        ? TEXT.lesEscortesArriventEnsembleCombine
        : TEXT.lesArriveesSontRegulieresRepartis;
  const nestTip =
    run.nest === 'clustered'
      ? TEXT.laCouveeEstConcentreeSurUneVoie
      : TEXT.lesEclosionsSontRepartiesEt;
  const flyingTip = tacticalRulesEnabled && rank >= 6 ? TEXT.desSerpentsVolantsArriventArchers : '';
  return `${assaultTip} ${nestTip}${flyingTip}`;
}
/** Local waves are one-based. No boss or species from a later rank can enter this plan. */
export function missionWave(
  run: MissionRun,
  local: number,
  tacticalRulesEnabled = true,
): MissionWave {
  const valid = readMissionRun(run);
  const definition = valid && missionById(valid.missionId);
  if (!valid || !definition || !isIntegerIn(local, 1, definition.waves.length))
    throw new RangeError(TEXT.vagueDeMissionInvalide);
  const rank = definition.waves[local - 1];
  const caprice = capriceRules(valid);
  const rankStats = waveStats(rank);
  const stats = Object.freeze({ ...rankStats, count: capriceCount(rankStats.count, caprice) });
  const composition = Array.from({ length: stats.count }, (_, index): EnemyKind => {
    // The usual line-up is numbered by serpents still to come: the first one has the most.
    const remaining = stats.count - index;
    const kind = assaultVariant(valid.assault, rank, index, variantFor(rank, remaining));
    return tacticalRulesEnabled ? flyingVariant(kind, rank, remaining) : kind;
  });
  return Object.freeze({
    rank,
    stats,
    composition: Object.freeze(composition),
    cadence: Object.freeze(assaultCadence(valid.assault)),
    eggs: Object.freeze(missionEggs(valid, local, rank, caprice)),
    pattern: Object.freeze({
      title: waveBriefing(rank).title,
      tip: patternTip(valid, rank, tacticalRulesEnabled),
    }),
  });
}
