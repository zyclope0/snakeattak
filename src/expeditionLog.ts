import { isIntegerIn, isRecord, readBoundedJson } from './plainData.ts';
import { EXPEDITION_STORAGE_KEY } from './storageKeys.ts';

/**
 * The little the home needs to know of a player's « Grande Expédition », without loading its
 * rules: whether one was ever opened, and whether one is under way. The screens read the log
 * whole (expeditionStorage.ts); a damaged log reads here as « none ».
 */
// A camp carries a few dozen allies of about 150 characters each.
export const EXPEDITION_LOG_LIMIT = 100_000;

export type ExpeditionDoor = 'none' | 'opened' | 'under-way';

export function expeditionDoorState(storage?: Pick<Storage, 'getItem'>): ExpeditionDoor {
  try {
    const current = readBoundedJson(
      storage?.getItem(EXPEDITION_STORAGE_KEY),
      EXPEDITION_LOG_LIMIT,
      (v) => (isRecord(v) && v.version === 1 && isRecord(v.current) ? v.current : null),
    );
    if (!current) return 'none';
    // A battle won: past the first step of the first tableau.
    const won =
      (isIntegerIn(current.tableau, 1, 99) || isIntegerIn(current.step, 1, 99)) &&
      current.status === 'travelling';
    return won ? 'under-way' : 'opened';
  } catch {
    return 'none';
  }
}
