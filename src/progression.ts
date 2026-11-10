import type { Game } from './game.ts';
import { decodeCheckpoint, encodeCheckpoint } from './checkpoints.ts';
import { freshRosters, isRoster } from './roster.ts';
import type { Roster } from './roster.ts';

export type CareerState = {
  version: 1;
  bestStars: [number, number, number];
  rosters: [Roster, Roster, Roster];
  activeRoster: 0 | 1 | 2;
  chapterCamps: [string | null, string | null];
};
const KEY = 'conquete-serpents:progress:v1';
const PROFILE_LIMIT = 250000;
const CAMP_LIMIT = 100000;
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const slotIndex = (slot: unknown): slot is 0 | 1 | 2 => slot === 0 || slot === 1 || slot === 2;
const stars = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 3;
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
function readCamp(raw: unknown, slot: number): Game | null {
  if (typeof raw !== 'string' || raw.length > CAMP_LIMIT) return null;
  const game = decodeCheckpoint(raw);
  const wave = slot === 0 ? 4 : 8;
  return game?.wave === wave && game.rewards.pending === wave ? game : null;
}
export function readCareerState(raw: string): CareerState | null {
  if (typeof raw !== 'string' || raw.length > PROFILE_LIMIT) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !object(value) ||
      value.version !== 1 ||
      !Array.isArray(value.bestStars) ||
      value.bestStars.length !== 3 ||
      ![...value.bestStars].every(stars) ||
      !Array.isArray(value.rosters) ||
      value.rosters.length !== 3 ||
      ![...value.rosters].every(isRoster) ||
      !slotIndex(value.activeRoster) ||
      !Array.isArray(value.chapterCamps) ||
      value.chapterCamps.length !== 2 ||
      ![...value.chapterCamps].every((camp, slot) => camp === null || readCamp(camp, slot) !== null)
    )
      return null;
    const canonical = copyState(value as CareerState);
    canonical.chapterCamps = canonical.chapterCamps.map((raw, slot) =>
      raw === null ? null : encodeCheckpoint(readCamp(raw, slot)!),
    ) as CareerState['chapterCamps'];
    return canonical;
  } catch {
    return null;
  }
}

/** Validate live objects before JSON can silently turn sparse chapter slots into null. */
export function validateCareerState(value: unknown): CareerState | null {
  if (
    !object(value) ||
    !Array.isArray(value.bestStars) ||
    ![...value.bestStars].every(stars) ||
    !Array.isArray(value.rosters) ||
    ![...value.rosters].every(isRoster) ||
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

/** Local career data is separate from the current camp; loading never grants rewards. */
export function createCareer(
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
  initialState?: CareerState,
) {
  let state = freshState();
  let last = '';
  let status = storage
    ? 'Progression enregistrée sur cet appareil'
    : 'Progression locale indisponible';
  if (initialState !== undefined) {
    const loaded = validateCareerState(initialState);
    if (loaded) state = loaded;
    else status = 'Profil initial incompatible : nouvelle progression';
  } else if (storage) {
    try {
      const raw = storage.getItem(KEY);
      if (raw !== null) {
        const loaded = readCareerState(raw);
        if (loaded) {
          state = loaded;
          last = JSON.stringify(state);
        } else status = 'Profil local incompatible : nouvelle progression';
      }
    } catch {
      status = 'Progression locale indisponible';
    }
  }
  function persist() {
    if (!storage) return;
    const raw = JSON.stringify(state);
    if (raw === last) return;
    if (raw.length > PROFILE_LIMIT) {
      status = 'Progression locale indisponible : profil trop volumineux';
      return;
    }
    try {
      storage.setItem(KEY, raw);
      last = raw;
      status = 'Progression enregistrée sur cet appareil';
    } catch {
      status = 'Progression locale indisponible : stockage bloqué ou plein';
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
      const earned = game.campaign.chapterStars;
      for (const index of [0, 1, 2] as const) {
        if (stars(earned[index]))
          state.bestStars[index] = Math.max(state.bestStars[index], earned[index]);
      }
      if (
        game.status === 'preparing' &&
        (game.wave === 4 || game.wave === 8) &&
        game.rewards.pending === game.wave
      ) {
        const slot = game.wave === 4 ? 0 : 1;
        const previous = readCamp(state.chapterCamps[slot], slot);
        // Keep the original pre-choice camp through repeated syncs and reloads.
        if (
          !previous ||
          previous.rewards.seed !== game.rewards.seed ||
          previous.balanceRevision !== game.balanceRevision
        ) {
          const raw = encodeCheckpoint(game);
          if (raw && readCamp(raw, slot)) state.chapterCamps[slot] = raw;
        }
      }
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
