import { battlesWon, EXPEDITION_BATTLES, readExpeditionState } from './expedition.ts';
import type { ExpeditionState } from './expedition.ts';
import { isIntegerIn, isRecord, readBoundedJson } from './plainData.ts';
import { EXPEDITION_STORAGE_KEY } from './storageKeys.ts';

/**
 * What a player keeps of « La Grande Expédition » : the one under way, saved between two
 * battles, and a personal record. One key per player (`PLAYER_KEYS` in players.ts): deleting
 * a player removes it. Nothing leaves the device and nothing compares two children.
 */
// A camp carries a few dozen allies of about 150 characters each.
const LOG_LIMIT = 100_000;

export type ExpeditionLog = Readonly<{
  version: 1;
  /** « Ta plus longue expédition » : the most battles won in one expedition. */
  best: number;
  /** The expedition under way or the last one ended; null before the first one. */
  current: ExpeditionState | null;
}>;
type ReadPort = Pick<Storage, 'getItem'>;
type WritePort = Pick<Storage, 'setItem'>;

export function createExpeditionLog(): ExpeditionLog {
  return Object.freeze({ version: 1, best: 0, current: null });
}

/** Reconstruct bounded plain data; anything unexpected is refused as a whole. */
export function validateExpeditionLog(value: unknown): ExpeditionLog | null {
  if (!isRecord(value) || value.version !== 1 || !isIntegerIn(value.best, 0, EXPEDITION_BATTLES))
    return null;
  const current = value.current === null ? null : readExpeditionState(value.current);
  // The record counts the expedition under way: it can never be behind it.
  if ((value.current !== null && !current) || (current && battlesWon(current) > value.best))
    return null;
  return Object.freeze({ version: 1, best: value.best, current });
}

/** The log with this expedition as the current one; the record follows the battles won. */
export function logExpedition(log: ExpeditionLog, state: ExpeditionState): ExpeditionLog | null {
  const current = readExpeditionState(state);
  if (!current) return null;
  return validateExpeditionLog({
    version: 1,
    best: Math.max(log.best, battlesWon(current)),
    current,
  });
}

/** Missing, refused or damaged data is a player who has not set out yet. */
export function loadExpeditionLog(storage?: ReadPort): ExpeditionLog {
  try {
    const raw = storage?.getItem(EXPEDITION_STORAGE_KEY);
    return readBoundedJson(raw, LOG_LIMIT, validateExpeditionLog) ?? createExpeditionLog();
  } catch {
    return createExpeditionLog();
  }
}

/** False when the log is invalid or the device refuses the write: nothing was stored. */
export function saveExpeditionLog(storage: WritePort | undefined, log: ExpeditionLog): boolean {
  const valid = validateExpeditionLog(log);
  if (!storage || !valid) return false;
  try {
    storage.setItem(EXPEDITION_STORAGE_KEY, JSON.stringify(valid));
    return true;
  } catch {
    return false;
  }
}
