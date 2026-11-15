import type { Game } from './game.ts';
import { CAMP_CHARACTER_LIMIT, decodeCheckpoint, encodeCheckpoint } from './checkpoints.ts';
import type { StoragePort } from './checkpoints.ts';
import { freshRosters, isRoster } from './roster.ts';
import type { Roster } from './roster.ts';
import { isMilestone } from './rewards.ts';
import { isArrayOfLength, isRecord, isStarCount, readBoundedJson } from './plainData.ts';
import { CAREER_STORAGE_KEY } from './storageKeys.ts';
import * as TEXT from './texts/fr/adventure.ts';

export type CareerState = {
  version: 1;
  bestStars: [number, number, number];
  rosters: [Roster, Roster, Roster];
  activeRoster: 0 | 1 | 2;
  chapterCamps: [string | null, string | null];
};
const PROFILE_LIMIT = 250000;
const slotIndex = (slot: unknown): slot is 0 | 1 | 2 => slot === 0 || slot === 1 || slot === 2;
const freshState = (): CareerState => ({
  version: 1,
  bestStars: [0, 0, 0],
  rosters: freshRosters(),
  activeRoster: 0,
  chapterCamps: [null, null],
});
const copyState = (state: CareerState): CareerState => ({
  version: 1,
  activeRoster: state.activeRoster,
  bestStars: [...state.bestStars],
  rosters: [[...state.rosters[0]], [...state.rosters[1]], [...state.rosters[2]]],
  chapterCamps: [...state.chapterCamps],
});
/** A chapter camp is the camp of wave 4 (slot 0) or 8 (slot 1) with its reward still to choose. */
function readCamp(raw: unknown, slot: number): Game | null {
  if (typeof raw !== 'string' || raw.length > CAMP_CHARACTER_LIMIT) return null;
  const game = decodeCheckpoint(raw);
  const wave = slot === 0 ? 4 : 8;
  return game?.wave === wave && game.rewards.pending === wave ? game : null;
}
// The copy turns an empty slot of a live array into `undefined`, which `every` then sees.
const areStars = (value: unknown): value is unknown[] =>
  Array.isArray(value) && [...value].every(isStarCount);
const areRosters = (value: unknown): value is unknown[] =>
  Array.isArray(value) && [...value].every(isRoster);

/** Both chapter camps written again in the current format; null if one is not readable. */
function readChapterCamps(saved: unknown[]): CareerState['chapterCamps'] | null {
  const camps: (string | null)[] = [];
  for (const [slot, raw] of saved.entries()) {
    const game = raw === null ? null : readCamp(raw, slot);
    if (raw !== null && !game) return null;
    camps.push(game && encodeCheckpoint(game));
  }
  return camps as CareerState['chapterCamps'];
}

function readCareer(value: unknown): CareerState | null {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !areStars(value.bestStars) ||
    value.bestStars.length !== 3 ||
    !areRosters(value.rosters) ||
    value.rosters.length !== 3 ||
    !slotIndex(value.activeRoster) ||
    !isArrayOfLength(value.chapterCamps, 2, 2)
  )
    return null;
  const chapterCamps = readChapterCamps(value.chapterCamps);
  if (!chapterCamps) return null;
  const canonical = copyState(value as CareerState);
  canonical.chapterCamps = chapterCamps;
  return canonical;
}
export function readCareerState(raw: string): CareerState | null {
  return readBoundedJson(raw, PROFILE_LIMIT, readCareer);
}

/** Validate live objects before JSON can silently turn sparse chapter slots into null. */
export function validateCareerState(value: unknown): CareerState | null {
  if (
    !isRecord(value) ||
    !areStars(value.bestStars) ||
    !areRosters(value.rosters) ||
    !Array.isArray(value.chapterCamps) ||
    ![...value.chapterCamps].every((camp) => camp === null || typeof camp === 'string')
  )
    return null;
  try {
    return readCareerState(JSON.stringify(value));
  } catch {
    return null;
  }
}

type Start = { state: CareerState; last: string; status: string };

/**
 * What a session starts from: the given career, else the stored one, else a fresh one.
 * `last` is the text already in storage, so that an unchanged career is not written again.
 */
function startCareer(storage?: StoragePort, initialState?: CareerState): Start {
  const fresh: Start = {
    state: freshState(),
    last: '',
    status: storage ? TEXT.progressionEnregistreeSurCet : TEXT.progressionLocaleIndisponible,
  };
  if (initialState !== undefined) {
    const state = validateCareerState(initialState);
    if (state) return { ...fresh, state };
    return { ...fresh, status: TEXT.profilInitialIncompatibleNouvelle };
  }
  if (!storage) return fresh;
  try {
    const raw = storage.getItem(CAREER_STORAGE_KEY);
    if (raw === null) return fresh;
    const state = readCareerState(raw);
    if (state) return { ...fresh, state, last: JSON.stringify(state) };
    return { ...fresh, status: TEXT.profilLocalIncompatibleNouvelle };
  } catch {
    return { ...fresh, status: TEXT.progressionLocaleIndisponible };
  }
}

/** Best stars only grow: a weaker replay never lowers them. */
function recordChapterStars(state: CareerState, game: Game): void {
  const earned = game.campaign.chapterStars;
  for (const index of [0, 1, 2] as const) {
    if (isStarCount(earned[index]))
      state.bestStars[index] = Math.max(state.bestStars[index], earned[index]);
  }
}

/** Keep the camp of a chapter's end as it stood before its reward was chosen. */
function rememberChapterCamp(state: CareerState, game: Game): void {
  if (game.status !== 'preparing' || !isMilestone(game.wave) || game.rewards.pending !== game.wave)
    return;
  const slot = game.wave === 4 ? 0 : 1;
  const previous = readCamp(state.chapterCamps[slot], slot);
  // Keep the original pre-choice camp through repeated syncs and reloads.
  if (
    previous &&
    previous.rewards.seed === game.rewards.seed &&
    previous.balanceRevision === game.balanceRevision
  )
    return;
  const raw = encodeCheckpoint(game);
  if (raw && readCamp(raw, slot)) state.chapterCamps[slot] = raw;
}

/** Local career data is separate from the current camp; loading never grants rewards. */
export function createCareer(storage?: StoragePort, initialState?: CareerState) {
  let { state, last, status } = startCareer(storage, initialState);
  function persist() {
    if (!storage) return;
    const raw = JSON.stringify(state);
    if (raw === last) return;
    if (raw.length > PROFILE_LIMIT) {
      status = TEXT.progressionLocaleIndisponible2;
      return;
    }
    try {
      storage.setItem(CAREER_STORAGE_KEY, raw);
      last = raw;
      status = TEXT.progressionEnregistreeSurCet;
    } catch {
      status = TEXT.progressionLocaleIndisponible3;
    }
  }
  return {
    get state(): CareerState {
      return copyState(state);
    },
    get status() {
      return status;
    },
    /** Import coordination persists the authoritative envelope before this memory-only commit. */
    replaceState(next: CareerState): boolean {
      const replacement = validateCareerState(next);
      if (!replacement) return false;
      state = replacement;
      return true;
    },
    sync(game: Game) {
      recordChapterStars(state, game);
      rememberChapterCamp(state, game);
      persist();
    },
    setRoster(slot: number, roster: Roster): boolean {
      if (!slotIndex(slot) || !isRoster(roster)) return false;
      state.rosters[slot] = [...roster];
      persist();
      return true;
    },
    activateRoster(slot: number): boolean {
      if (!slotIndex(slot)) return false;
      state.activeRoster = slot;
      persist();
      return true;
    },
    chapterGame(chapter: 1 | 2): Game | null {
      if (chapter !== 1 && chapter !== 2) return null;
      const slot = chapter === 1 ? 0 : 1;
      return readCamp(state.chapterCamps[slot], slot);
    },
  };
}
