import { ADS_OFF_KEY } from '../../storageKeys.ts';

/**
 * Advertising is off on this device when a parent said so. A browser that cannot remember
 * the choice gets no ad either: the choice must be able to hold.
 */
export function adsSwitchedOff(storage: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return !storage || storage.getItem(ADS_OFF_KEY) !== null;
  } catch {
    return true;
  }
}
