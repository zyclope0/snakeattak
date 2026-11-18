import { MISSION_DONE_KEY } from './storageKeys.ts';

type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * A short mark of a camp: its length and a 32-bit FNV-1a sum of its text. Two camps a
 * child plays never share it in practice, and the device keeps a few characters instead
 * of a second copy of the camp.
 */
export function campMark(camp: string): string {
  let sum = 0x811c9dc5;
  for (let index = 0; index < camp.length; index++) {
    sum ^= camp.charCodeAt(index);
    sum = Math.imul(sum, 0x01000193);
  }
  return `${camp.length}:${(sum >>> 0).toString(36)}`;
}

/**
 * The mission the child has won, remembered on the device beside the family file (decision
 * of the parent, 18 November 2026). The family file keeps the last camp of a mission, won or
 * not; without this mark, the home would offer « Reprendre » for a mission already finished
 * once the game was closed. Nothing else reads it: storage refused, blocked or damaged only
 * brings back the old behaviour, never an error.
 */
export function createMissionDone(storage?: StoragePort) {
  const read = (): string | null => {
    try {
      const raw = storage?.getItem(MISSION_DONE_KEY);
      return typeof raw === 'string' && raw.length <= 32 ? raw : null;
    } catch {
      return null;
    }
  };
  return {
    /** True when `camp` is the camp of the mission last won. */
    finished: (camp: string | null | undefined): boolean => !!camp && read() === campMark(camp),
    /** The mission whose camp is `camp` has just been won. */
    mark(camp: string | null | undefined) {
      if (!camp) return;
      try {
        storage?.setItem(MISSION_DONE_KEY, campMark(camp));
      } catch {
        /* Without the mark, the home offers « Reprendre » as before. */
      }
    },
    /** The child goes back into that camp: it waits again to be continued. */
    clear() {
      try {
        storage?.removeItem(MISSION_DONE_KEY);
      } catch {
        /* Nothing to undo. */
      }
    },
  };
}
