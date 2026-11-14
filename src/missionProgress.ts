import { MISSIONS, missionById, readMissionRun, isPersistableMissionRun } from './missions.ts';
import type { MissionId, MissionRun } from './missions.ts';
import type { Game } from './game.ts';
import { decodeCheckpoint, encodeCheckpoint } from './checkpoints.ts';
import { capriceById, capriceUnlocked } from './caprices.ts';
import { isOneOf, isRecord, isStarCount, readBoundedJson } from './plainData.ts';

export type MissionProgress = {
  version: 1 | 2;
  bestStars: Record<MissionId, number>;
  lastRuns: Partial<Record<MissionId, MissionRun>>;
  retryCamp: string | null;
  classicCamp: string | null;
  activeMode: 'classic' | 'missions';
};
const LIMIT = 250000;
const sameRun = (a: MissionRun | null | undefined, b: MissionRun | null | undefined) =>
  !!a &&
  !!b &&
  a.missionId === b.missionId &&
  a.seed === b.seed &&
  a.layout === b.layout &&
  a.assault === b.assault &&
  a.nest === b.nest &&
  a.rules === b.rules &&
  a.caprice === b.caprice &&
  a.balance === b.balance;

export function createMissionProgress(): MissionProgress {
  return {
    version: 1,
    bestStars: { refuge: 0, 'trois-ponts': 0, course: 0, coquilles: 0, sonnette: 0, carrefour: 0 },
    lastRuns: {},
    retryCamp: null,
    classicCamp: null,
    activeMode: 'classic',
  };
}
function copyState(state: MissionProgress): MissionProgress {
  const lastRuns: MissionProgress['lastRuns'] = {};
  for (const { id } of MISSIONS) if (state.lastRuns[id]) lastRuns[id] = { ...state.lastRuns[id]! };
  return { ...state, bestStars: { ...state.bestStars }, lastRuns };
}
const VERSIONS = [1, 2] as const;
const MODES = ['classic', 'missions'] as const;
type CampField = 'classicCamp' | 'retryCamp';

/** Best stars of the six missions, no more and no less. */
function readBestStars(saved: unknown): MissionProgress['bestStars'] | null {
  if (
    !isRecord(saved) ||
    Object.keys(saved).length !== MISSIONS.length ||
    !Object.keys(saved).every((id) => missionById(id))
  )
    return null;
  const bestStars = createMissionProgress().bestStars;
  for (const { id } of MISSIONS) {
    if (!Object.hasOwn(saved, id) || !isStarCount(saved[id])) return null;
    bestStars[id] = saved[id];
  }
  return bestStars;
}

/** The last departure of each mission played, kept in the order of the missions. */
function readLastRuns(
  saved: unknown,
  version: MissionProgress['version'],
): MissionProgress['lastRuns'] | null {
  if (!isRecord(saved) || !Object.keys(saved).every((id) => missionById(id))) return null;
  const lastRuns: MissionProgress['lastRuns'] = {};
  for (const { id } of MISSIONS) {
    if (!Object.hasOwn(saved, id)) continue;
    const run = readMissionRun(saved[id]);
    if (
      !run ||
      !isPersistableMissionRun(run) ||
      run.missionId !== id ||
      (version === 1 && run.balance === 2)
    )
      return null;
    lastRuns[id] = run;
  }
  return lastRuns;
}

/**
 * The camp kept for one mode, written again in the current format. The classic camp has no
 * expedition; the retry camp continues the last departure of its mission, nothing else.
 */
function readModeCamp(
  raw: unknown,
  field: CampField,
  version: MissionProgress['version'],
  lastRuns: MissionProgress['lastRuns'],
): string | null {
  if (typeof raw !== 'string') return null;
  const game = decodeCheckpoint(raw);
  if (!game || (version === 1 && game.balanceRevision === 2)) return null;
  if (field === 'classicCamp' ? !!game.mission : !game.mission) return null;
  if (game.mission && !sameRun(game.mission, lastRuns[game.mission.missionId])) return null;
  return encodeCheckpoint(game);
}

function canonical(value: unknown): MissionProgress | null {
  if (!isRecord(value) || !isOneOf(value.version, VERSIONS) || !isOneOf(value.activeMode, MODES))
    return null;
  const bestStars = readBestStars(value.bestStars);
  const lastRuns = readLastRuns(value.lastRuns, value.version);
  if (!bestStars || !lastRuns) return null;
  const state = createMissionProgress();
  state.version = value.version;
  state.activeMode = value.activeMode;
  state.bestStars = bestStars;
  state.lastRuns = lastRuns;
  for (const field of ['classicCamp', 'retryCamp'] as const) {
    const raw = value[field];
    if (raw === null) continue;
    const camp = readModeCamp(raw, field, value.version, lastRuns);
    if (!camp) return null;
    state[field] = camp;
  }
  return state;
}
export function readMissionProgress(raw: string): MissionProgress | null {
  return readBoundedJson(raw, LIMIT, canonical);
}
/** Validate live objects before serialization can hide missing or nonfinite fields. */
export function validateMissionProgress(value: unknown): MissionProgress | null {
  try {
    const state = canonical(value);
    if (!state || JSON.stringify(value).length > LIMIT) return null;
    return state;
  } catch {
    return null;
  }
}

/** The first mission is always open; each next one opens once the one before is won. */
function isUnlocked(state: MissionProgress, id: MissionId): boolean {
  const index = MISSIONS.findIndex((mission) => mission.id === id);
  return index === 0 || (index > 0 && state.bestStars[MISSIONS[index - 1].id] > 0);
}

/** A won expedition: its stars if they are the best so far, and its departure. */
function recordWin(state: MissionProgress, game: Game): boolean {
  const run = readMissionRun(game.mission);
  const earned = game.missionStars;
  if (
    !run ||
    !isPersistableMissionRun(run) ||
    // A voyage stage is won with the bag's help: no star for the mission it borrows.
    game.stage ||
    !isUnlocked(state, run.missionId) ||
    game.status !== 'won' ||
    game.wave !== game.totalWaves ||
    game.base <= 0 ||
    game.enemies.length ||
    game.eggs.length ||
    !isStarCount(earned) ||
    earned === 0
  )
    return false;
  const changed =
    earned > state.bestStars[run.missionId] || !sameRun(run, state.lastRuns[run.missionId]);
  state.bestStars[run.missionId] = Math.max(state.bestStars[run.missionId], earned);
  if (run.balance === 2) state.version = 2;
  state.lastRuns[run.missionId] = run;
  return changed;
}

/** The camp between two waves, kept for its own mode: the great adventure or the retry. */
function rememberCamp(state: MissionProgress, game: Game): boolean {
  const run = game.mission && readMissionRun(game.mission);
  if (game.mission && (!run || !isUnlocked(state, run.missionId))) return false;
  const raw = encodeCheckpoint(game);
  if (!raw) return false;
  const field = run ? 'retryCamp' : 'classicCamp';
  const changed = state[field] !== raw || (!!run && !sameRun(run, state.lastRuns[run.missionId]));
  if (game.balanceRevision === 2) state.version = 2;
  state[field] = raw;
  if (run) state.lastRuns[run.missionId] = run;
  return changed;
}

/** A new departure replaces the retry camp; a challenge needs its stars on that mission. */
function startRun(state: MissionProgress, raw: MissionRun): boolean {
  const run = readMissionRun(raw);
  if (!run || !isPersistableMissionRun(run) || !isUnlocked(state, run.missionId)) return false;
  if (
    run.caprice &&
    !capriceUnlocked(capriceById(run.caprice)!.tier, state.bestStars[run.missionId])
  )
    return false;
  if (run.balance === 2) state.version = 2;
  state.lastRuns[run.missionId] = run;
  state.retryCamp = null;
  state.activeMode = 'missions';
  return true;
}

/** Memory only: the family envelope remains the single authoritative storage write. */
export function createMissionProgressController(initial?: MissionProgress) {
  let state = validateMissionProgress(initial) ?? createMissionProgress();
  return {
    get state(): MissionProgress {
      return copyState(state);
    },
    unlocked: (id: MissionId): boolean => isUnlocked(state, id),
    replaceState(next: MissionProgress): boolean {
      const replacement = validateMissionProgress(next);
      if (!replacement) return false;
      state = replacement;
      return true;
    },
    lastRun(id: MissionId): MissionRun | null {
      const run = missionById(id) && state.lastRuns[id];
      return run ? { ...run } : null;
    },
    started: (raw: MissionRun): boolean => startRun(state, raw),
    record: (game: Game): boolean => recordWin(state, game),
    rememberCamp: (game: Game): boolean => rememberCamp(state, game),
    sync(game: Game): boolean {
      const recorded = recordWin(state, game);
      return rememberCamp(state, game) || recorded;
    },
    switchMode(mode: 'classic' | 'missions'): string | null {
      if (!isOneOf(mode, MODES)) return null;
      state.activeMode = mode;
      return mode === 'classic' ? state.classicCamp : state.retryCamp;
    },
  };
}
