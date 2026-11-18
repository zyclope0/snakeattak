import { isMilestone, readRewards } from './rewards.ts';
import { freshCampaign, readCampaign, chapterIndex } from './campaignRules.ts';
import type { CampaignState } from './campaignRules.ts';
import { Game } from './game.ts';
import { isClassicRevision } from './balanceRevision.ts';
import type { ClassicRevision } from './balanceRevision.ts';
import { CRYSTAL_MAX, GOLD_LIMIT, TOTAL_WAVES, WAVES_PER_CHAPTER } from './gameConstants.ts';
import type { Kind } from './data.ts';
import { missionById, readMissionRun, isPersistableMissionRun } from './missions.ts';
import type { MissionRun } from './missions.ts';
import { UNIT_LIMIT, isKind, readUnit, saveUnit } from './checkpointUnits.ts';
import {
  isRecord,
  isNumberIn,
  isIntegerIn,
  isUint32,
  isArrayOfLength,
  readBoundedJson,
} from './plainData.ts';
import { CAMP_STORAGE_KEY } from './storageKeys.ts';
import * as TEXT from './texts/fr/saves.ts';

/** A saved camp is never longer: anything beyond was not written by the game. */
export const CAMP_CHARACTER_LIMIT = 100000;
/** What the persistence needs from the browser storage; tests pass a double. */
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Format versions of a saved camp. Every one of them stays readable.
 *   1  allies without a home
 *   2  homes
 *   3  rewards
 *   4  campaign; a classic game without the tactical rules still writes this one
 *   5  an expedition without the tactical rules
 *   6  tactical rules: healers' supplies, departure seed, optional expedition
 *   7  the tutorial refuge (rules 2)
 *   8  an expedition with a challenge
 *   9  the second balance revision
 *  10  the third balance revision, in the great adventure only
 *  11  the fourth balance revision, in the great adventure only
 *  12  the fifth balance revision, in the great adventure only
 */
const savesHomes = (version: number) => version !== 1;
const savesRewards = (version: number) => version >= 3;
const savesCampaign = (version: number) => version >= 4;
const isModern = (version: number) => version >= 6;
/** The allies chosen for a « copains » challenge are saved with the challenge only. */
const savesCapriceKinds = (version: number, mission: MissionRun | null) =>
  version === 8 || (version === 9 && !!mission?.caprice);

/** Nothing is saved during a fight, nor once the last wave is over. */
const isFightingOrOver = (game: Game) =>
  game.status !== 'preparing' ||
  !!game.enemies.length ||
  !!game.eggs.length ||
  game.wave >= game.totalWaves;

/** The tutorial refuge and the later balance revisions only exist with the tactical rules. */
const needsTacticalRules = (game: Game) => game.mission?.rules === 2 || game.balanceRevision >= 2;

/** A second-revision camp can give its departure code back: a seed, the expedition's own. */
function hasKnownDeparture(game: Game): boolean {
  if (!isUint32(game.initialSeed)) return false;
  return !game.mission || (game.mission.balance === 2 && game.initialSeed === game.mission.seed);
}

/** The save version of each revision that exists in the great adventure only. */
const CLASSIC_VERSION: Readonly<Record<ClassicRevision, number>> = { 3: 10, 4: 11, 5: 12, 6: 13 };
const LATEST_VERSION = 13;
/** The revision a version 10 or later was written for; null for an older version. */
const classicRevisionOf = (version: number): ClassicRevision | null =>
  version === 13 ? 6 : version === 12 ? 5 : version === 11 ? 4 : version === 10 ? 3 : null;

function saveVersion(game: Game): number {
  if (isClassicRevision(game.balanceRevision)) return CLASSIC_VERSION[game.balanceRevision];
  if (game.balanceRevision === 2) return 9;
  if (game.mission?.caprice) return 8;
  if (game.mission?.rules === 2) return 7;
  if (game.tuning.tacticalRulesEnabled === false) return game.mission ? 5 : 4;
  return 6;
}

/**
 * The rewards as saved. A classic camp standing at a milestone without an answer yet is
 * written with its offer pending, so that the reader opens it.
 */
function savedRewards(game: Game) {
  const due =
    !game.mission &&
    isMilestone(game.wave) &&
    !game.rewards.choices.some((c) => c.milestone === game.wave);
  return { ...game.rewards, pending: due ? game.wave : game.rewards.pending };
}

/** The saved document. The order of its fields is part of the format: saves compare as text. */
function saveDocument(game: Game, version: number, units: unknown[]) {
  return {
    version,
    ...(classicRevisionOf(version)
      ? { balance: classicRevisionOf(version) }
      : version === 9
        ? { balance: 2 }
        : {}),
    ...(isModern(version) && game.initialSeed !== null ? { initialSeed: game.initialSeed } : {}),
    ...(game.mission
      ? { mission: game.mission, missionMinBase: Math.min(game.missionMinBase, game.base) }
      : {}),
    ...(savesCapriceKinds(version, game.mission)
      ? { capriceKindsChosen: game.capriceKindsChosen }
      : {}),
    campaign: game.campaign,
    rewards: savedRewards(game),
    wave: game.wave,
    gold: game.gold,
    base: game.base,
    rng: game.rng,
    nextId: game.nextId,
    kills: game.kills,
    hatched: game.hatched,
    units,
  };
}

export function encodeCheckpoint(game: Game): string | null {
  if (isFightingOrOver(game)) return null;
  // A camp has no place for the rules of a voyage stage: read back, it would be a plain
  // expedition. A voyage is saved between two stages instead (voyageStorage.ts).
  if (game.stage) return null;
  if (game.mission && !isPersistableMissionRun(game.mission)) return null;
  const survivors = game.units.filter((u) => u.hp > 0);
  if (survivors.length > UNIT_LIMIT) return null;
  // Keep the frozen classic witness byte-compatible with the pre-tactical camp.
  if (needsTacticalRules(game) && !game.tuning.tacticalRulesEnabled) return null;
  if (game.balanceRevision >= 2 && !hasKnownDeparture(game)) return null;
  // The third revision and the later ones are a great adventure: what cannot be read back
  // is not written.
  if (isClassicRevision(game.balanceRevision) && game.mission) return null;
  const version = saveVersion(game);
  const units = [];
  for (const unit of survivors) {
    const saved = saveUnit(unit, isModern(version));
    if (!saved) return null;
    units.push(saved);
  }
  const raw = JSON.stringify(saveDocument(game, version, units));
  return raw.length <= CAMP_CHARACTER_LIMIT ? raw : null;
}

/** A parsed save whose own counters are within bounds; the rest is still unknown. */
type Save = Record<string, unknown> & {
  version: number;
  wave: number;
  gold: number;
  base: number;
  rng: number;
  nextId: number;
  kills: number;
  hatched: number;
  units: unknown[];
};

function isSaveHeader(data: unknown): data is Save {
  return (
    isRecord(data) &&
    isIntegerIn(data.version, 1, LATEST_VERSION) &&
    isIntegerIn(data.wave, 0, TOTAL_WAVES - 1) &&
    isIntegerIn(data.gold, 0, GOLD_LIMIT) &&
    isNumberIn(data.base, 1, CRYSTAL_MAX) &&
    isUint32(data.rng) &&
    isIntegerIn(data.nextId, 0, 10000000) &&
    isIntegerIn(data.kills, 0, 1000000) &&
    isIntegerIn(data.hatched, 0, 1000000) &&
    isArrayOfLength(data.units, 0, UNIT_LIMIT)
  );
}

/**
 * Only versions 9 and later name a balance revision, and then everything in them does. From
 * the third revision on a camp is a great adventure: version 10, 11 or 12 never holds an
 * expedition.
 */
function revisionMatchesVersion(
  save: Save,
  hasMission: boolean,
  mission: MissionRun | null,
): boolean {
  const classic = classicRevisionOf(save.version);
  if (classic) return save.balance === classic && isUint32(save.initialSeed) && !hasMission;
  if (save.version === 9)
    return (
      save.balance === 2 && isUint32(save.initialSeed) && (!hasMission || mission?.balance === 2)
    );
  return (
    !Object.hasOwn(save, 'balance') &&
    !(isRecord(save.mission) && Object.hasOwn(save.mission, 'balance'))
  );
}

/** Versions 7 and 8 each exist for one kind of expedition; the older ones know neither. */
function missionMatchesVersion(version: number, mission: MissionRun | null): boolean {
  if (classicRevisionOf(version)) return mission === null;
  if (version === 9) return true;
  if (version === 8) return !!mission?.caprice;
  if (version === 7) return mission?.rules === 2;
  return mission?.rules === undefined;
}

/** An expedition camp: a readable run, a wave of that mission, its lowest crystal so far. */
function isMissionCamp(save: Save, mission: MissionRun | null): boolean {
  return (
    !!mission &&
    save.wave < missionById(mission.missionId)!.waves.length &&
    isNumberIn(save.missionMinBase, 1, save.base)
  );
}

/** The allies chosen for a « copains » challenge, through the same door as the player. */
function restoreCapriceKinds(game: Game, chosen: unknown): boolean {
  if (!isArrayOfLength(chosen, 0, game.caprice.kinds) || chosen.some((kind) => !isKind(kind)))
    return false;
  return !chosen.length || game.chooseCapriceKinds(chosen as Kind[]);
}

/** The seed of the departure code; an expedition always has its own. */
function restoreDepartureSeed(game: Game, save: Save, mission: MissionRun | null): boolean {
  const saved = isModern(save.version) && Object.hasOwn(save, 'initialSeed');
  if (saved && (!isUint32(save.initialSeed) || (mission && save.initialSeed !== mission.seed)))
    return false;
  game.initialSeed = mission?.seed ?? (saved ? (save.initialSeed as number) : null);
  return true;
}

/** The living allies, each with its own identifier, and at most one hero. */
function restoreUnits(game: Game, save: Save): boolean {
  const format = {
    homes: savesHomes(save.version),
    supplies: isModern(save.version),
    nextId: save.nextId,
  };
  const ids = new Set<number>();
  let heroes = 0;
  game.units = [];
  for (const saved of save.units) {
    const unit = readUnit(saved, format, ids);
    if (!unit || (unit.kind === 'hero' && ++heroes > 1)) return false;
    ids.add(unit.id);
    game.units.push(unit);
  }
  return true;
}

/** Rewards belong to the great adventure: an expedition camp must carry none. */
function restoreRewards(game: Game, save: Save, mission: MissionRun | null): boolean {
  if (!savesRewards(save.version)) {
    // A camp older than the rewards gets its offer at the exact milestone, never afterwards.
    if (isMilestone(save.wave)) game.rewards.pending = save.wave;
    return true;
  }
  const rewards = readRewards(save.rewards, mission ? 0 : save.wave);
  if (!rewards) return false;
  if (mission && (rewards.pending !== null || rewards.choices.length || rewards.ward)) return false;
  Object.assign(game.rewards, rewards);
  return true;
}

/** An expedition has no chapter score, and its hero trains from the second mission on. */
function exceedsMission(campaign: CampaignState, mission: MissionRun): boolean {
  return (
    campaign.chapterStars.some((stars) => stars !== 0) ||
    campaign.chapterMin.some((hp) => hp !== CRYSTAL_MAX) ||
    (campaign.training !== 'none' && missionById(mission.missionId)!.unlockRank < 4)
  );
}

/** A camp older than the campaign: one star per finished chapter, the crystal as it stands. */
function legacyCampaign(wave: number, base: number): CampaignState {
  const campaign = freshCampaign();
  for (let i = 0; i < Math.floor(wave / WAVES_PER_CHAPTER); i++) campaign.chapterStars[i] = 1;
  campaign.chapterMin[chapterIndex(wave + 1)] = base;
  return campaign;
}

function restoreCampaign(game: Game, save: Save, mission: MissionRun | null): boolean {
  if (!savesCampaign(save.version)) {
    Object.assign(game.campaign, legacyCampaign(save.wave, save.base));
    return true;
  }
  const campaign = readCampaign(save.campaign, mission ? TOTAL_WAVES : save.wave);
  if (!campaign || (mission && exceedsMission(campaign, mission))) return false;
  Object.assign(game.campaign, campaign);
  return true;
}

/**
 * The counters, last. The camp is put back on the map of its wave before the random state
 * is restored: the order of these lines decides how the restored game plays.
 */
function restoreCounters(game: Game, save: Save, mission: MissionRun | null): void {
  game.wave = save.wave;
  game.normalizeCamp();
  game.gold = save.gold;
  game.base = save.base;
  if (mission) game.missionMinBase = save.missionMinBase as number;
  game.rng = save.rng;
  game.nextId = save.nextId;
  game.kills = save.kills;
  game.hatched = save.hatched;
  game.message = save.wave ? TEXT.campRetrouvePrepareLaProchaine : TEXT.tonCampEstPret;
}

/** Rebuild a game from parsed data, one checked step after the other; null on any doubt. */
function readCheckpoint(data: unknown): Game | null {
  if (!isSaveHeader(data)) return null;
  const hasMission =
    data.version === 5 || (isModern(data.version) && Object.hasOwn(data, 'mission'));
  const mission = hasMission ? readMissionRun(data.mission) : null;
  if (mission && !isPersistableMissionRun(mission)) return null;
  if (!revisionMatchesVersion(data, hasMission, mission)) return null;
  if (!missionMatchesVersion(data.version, mission)) return null;
  if (hasMission && !isMissionCamp(data, mission)) return null;
  const revision = classicRevisionOf(data.version) ?? (data.version === 9 ? 2 : 1);
  const game = new Game(data.rng, undefined, mission ?? undefined, revision);
  const kindsSaved = savesCapriceKinds(data.version, mission);
  if (kindsSaved && !restoreCapriceKinds(game, data.capriceKindsChosen)) return null;
  if (!restoreDepartureSeed(game, data, mission)) return null;
  if (!restoreUnits(game, data)) return null;
  if (!restoreRewards(game, data, mission)) return null;
  if (!restoreCampaign(game, data, mission)) return null;
  restoreCounters(game, data, mission);
  return game;
}

export function decodeCheckpoint(raw: string): Game | null {
  return readBoundedJson(raw, CAMP_CHARACTER_LIMIT, readCheckpoint);
}

/** Storage failures are local UX failures, never simulation failures. No network involved. */
export function createPersistence(storage?: StoragePort) {
  let disabled = false;
  let last = '',
    status = storage ? TEXT.sauvegardeLocaleEntreLesVagues : TEXT.sauvegardeLocaleIndisponible;
  return {
    get status() {
      return status;
    },
    load(): Game | null {
      if (!storage) return null;
      try {
        const raw = storage.getItem(CAMP_STORAGE_KEY);
        if (!raw) return null;
        const game = decodeCheckpoint(raw);
        if (game) {
          last = raw;
          status = TEXT.campSauvegardeSurCetAppareil;
        } else status = TEXT.ancienneSauvegardeIncompatible;
        return game;
      } catch {
        disabled = true;
        status = TEXT.sauvegardeLocaleIndisponible;
        return null;
      }
    },
    sync(game: Game) {
      if (!storage || disabled) return;
      const raw = encodeCheckpoint(game);
      if (!raw || raw === last) return;
      try {
        storage.setItem(CAMP_STORAGE_KEY, raw);
        last = raw;
        status = TEXT.campSauvegardeSurCetAppareil;
      } catch {
        disabled = true;
        status = TEXT.sauvegardeLocaleIndisponible;
      }
    },
  };
}
