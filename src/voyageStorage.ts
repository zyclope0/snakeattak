import { isIntegerIn, isRecord, readBoundedJson } from './plainData.ts';
import { VOYAGE_STORAGE_KEY } from './storageKeys.ts';
import { readVoyageState } from './voyageState.ts';
import type { VoyageState } from './voyageState.ts';
import { VOYAGE_TUNINGS } from './voyageTuning.ts';

/**
 * What a player keeps of the voyages: the one under way, saved between two stages, and a
 * personal record. One key per player (`PLAYER_KEYS` in players.ts): the page hands over
 * the active player's storage, and deleting a player removes it. Nothing leaves the device
 * and nothing compares two children.
 */
// A log is a few dozen characters; anything much longer was not written by the game.
const LOG_LIMIT = 2000;
/** The longest voyage of any version of the rules: a record cannot be longer. */
const longestVoyage = () =>
  Math.max(...Object.values(VOYAGE_TUNINGS).map((rules) => rules.stages.length));

export type VoyageLog = Readonly<{
  version: 1;
  /** « Mon plus long voyage » : the most stages won in one voyage. */
  best: number;
  /** The voyage under way or the last one ended; null before the first voyage. */
  current: VoyageState | null;
}>;
type ReadPort = Pick<Storage, 'getItem'>;
type WritePort = Pick<Storage, 'setItem'>;

export function createVoyageLog(): VoyageLog {
  return Object.freeze({ version: 1, best: 0, current: null });
}

function readLog(value: unknown): VoyageLog | null {
  if (!isRecord(value) || value.version !== 1 || !isIntegerIn(value.best, 0, longestVoyage()))
    return null;
  const current = value.current === null ? null : readVoyageState(value.current);
  // The record counts the voyage under way: it can never be behind it.
  if ((value.current !== null && !current) || (current && current.won > value.best)) return null;
  return Object.freeze({ version: 1, best: value.best, current });
}

/** Reconstruct bounded plain data; anything unexpected is refused as a whole. */
export function validateVoyageLog(value: unknown): VoyageLog | null {
  try {
    return readLog(value);
  } catch {
    return null;
  }
}

/** The log with this voyage as the current one; the record follows the stages won. */
export function logVoyage(log: VoyageLog, state: VoyageState): VoyageLog | null {
  const current = readVoyageState(state);
  if (!current) return null;
  return validateVoyageLog({ version: 1, best: Math.max(log.best, current.won), current });
}

/** Missing, refused or damaged data is a player who has not travelled yet. */
export function loadVoyageLog(storage?: ReadPort): VoyageLog {
  try {
    const raw = storage?.getItem(VOYAGE_STORAGE_KEY);
    return readBoundedJson(raw, LOG_LIMIT, validateVoyageLog) ?? createVoyageLog();
  } catch {
    return createVoyageLog();
  }
}

/** False when the log is invalid or the device refuses the write: nothing was stored. */
export function saveVoyageLog(storage: WritePort | undefined, log: VoyageLog): boolean {
  const valid = validateVoyageLog(log);
  if (!storage || !valid) return false;
  try {
    storage.setItem(VOYAGE_STORAGE_KEY, JSON.stringify(valid));
    return true;
  } catch {
    return false;
  }
}
