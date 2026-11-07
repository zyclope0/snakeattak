import { MISSIONS, missionById, readMissionRun } from './missions.ts';
import type { MissionId, MissionRun } from './missions.ts';
import type { Game } from './game.ts';
import { decodeCheckpoint, encodeCheckpoint } from './checkpoints.ts';

export type MissionProgress = {
  version: 1;
  bestStars: Record<MissionId, number>;
  lastRuns: Partial<Record<MissionId, MissionRun>>;
  retryCamp: string | null;
  classicCamp: string | null;
  activeMode: 'classic' | 'missions';
};
const LIMIT = 250000;
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const stars = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;
const sameRun = (a: MissionRun | null | undefined, b: MissionRun | null | undefined) =>
  !!a &&
  !!b &&
  a.missionId === b.missionId &&
  a.seed === b.seed &&
  a.layout === b.layout &&
  a.assault === b.assault &&
  a.nest === b.nest;

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
function canonical(value: unknown): MissionProgress | null {
  if (
    !object(value) ||
    value.version !== 1 ||
    !object(value.bestStars) ||
    !object(value.lastRuns) ||
    (value.activeMode !== 'classic' && value.activeMode !== 'missions')
  )
    return null;
  if (
    Object.keys(value.bestStars).length !== MISSIONS.length ||
    !Object.keys(value.bestStars).every((id) => missionById(id)) ||
    !Object.keys(value.lastRuns).every((id) => missionById(id))
  )
    return null;
  const state = createMissionProgress();
  state.activeMode = value.activeMode;
  for (const { id } of MISSIONS) {
    if (!Object.hasOwn(value.bestStars, id) || !stars(value.bestStars[id])) return null;
    state.bestStars[id] = value.bestStars[id];
    if (Object.hasOwn(value.lastRuns, id)) {
      const run = readMissionRun(value.lastRuns[id]);
      if (!run || run.missionId !== id) return null;
      state.lastRuns[id] = run;
    }
  }
  for (const field of ['classicCamp', 'retryCamp'] as const) {
    const raw = value[field];
    if (raw === null) continue;
    if (typeof raw !== 'string') return null;
    const game = decodeCheckpoint(raw);
    if (!game || (field === 'classicCamp' ? !!game.mission : !game.mission)) return null;
    if (field === 'retryCamp' && !sameRun(game.mission, state.lastRuns[game.mission!.missionId]))
      return null;
    const camp = encodeCheckpoint(game);
    if (!camp) return null;
    state[field] = camp;
  }
  return state;
}
export function readMissionProgress(raw: string): MissionProgress | null {
  if (typeof raw !== 'string' || raw.length > LIMIT) return null;
  try {
    return canonical(JSON.parse(raw));
  } catch {
    return null;
  }
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

/** Memory only: the family envelope remains the single authoritative storage write. */
export function createMissionProgressController(initial?: MissionProgress) {
  let state = validateMissionProgress(initial) ?? createMissionProgress();
  function unlocked(id: MissionId): boolean {
    const index = MISSIONS.findIndex((mission) => mission.id === id);
    return index === 0 || (index > 0 && state.bestStars[MISSIONS[index - 1].id] > 0);
  }
  function record(game: Game): boolean {
    const run = readMissionRun(game.mission);
    const earned = game.missionStars;
    if (
      !run ||
      !unlocked(run.missionId) ||
      game.status !== 'won' ||
      game.wave !== game.totalWaves ||
      game.base <= 0 ||
      game.enemies.length ||
      game.eggs.length ||
      !stars(earned) ||
      earned === 0
    )
      return false;
    const changed =
      earned > state.bestStars[run.missionId] || !sameRun(run, state.lastRuns[run.missionId]);
    state.bestStars[run.missionId] = Math.max(state.bestStars[run.missionId], earned);
    state.lastRuns[run.missionId] = run;
    return changed;
  }
  function rememberCamp(game: Game): boolean {
    const run = game.mission && readMissionRun(game.mission);
    if (game.mission && (!run || !unlocked(run.missionId))) return false;
    const raw = encodeCheckpoint(game);
    if (!raw) return false;
    const field = run ? 'retryCamp' : 'classicCamp';
    const changed = state[field] !== raw || (!!run && !sameRun(run, state.lastRuns[run.missionId]));
    state[field] = raw;
    if (run) state.lastRuns[run.missionId] = run;
    return changed;
  }
  return {
    get state(): MissionProgress {
      return copyState(state);
    },
    unlocked,
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
    started(raw: MissionRun): boolean {
      const run = readMissionRun(raw);
      if (!run || !unlocked(run.missionId)) return false;
      state.lastRuns[run.missionId] = run;
      state.retryCamp = null;
      state.activeMode = 'missions';
      return true;
    },
    record,
    rememberCamp,
    sync(game: Game): boolean {
      const recorded = record(game);
      return rememberCamp(game) || recorded;
    },
    switchMode(mode: 'classic' | 'missions'): string | null {
      if (mode !== 'classic' && mode !== 'missions') return null;
      state.activeMode = mode;
      return mode === 'classic' ? state.classicCamp : state.retryCamp;
    },
  };
}
