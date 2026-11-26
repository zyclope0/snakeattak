import { APPLES_TO_UNLOCK, appleId, waveHasApple } from './apples.ts';
import { KINGS_LIMIT } from './endless.ts';
import { TOTAL_WAVES } from './gameConstants.ts';
import { isArrayOfLength, isRecord, readBoundedJson } from './plainData.ts';
import { APPLES_STORAGE_KEY } from './storageKeys.ts';
import type { StoragePort } from './checkpoints.ts';

/**
 * The apples a player has found (decision of the parent, 26 November 2026): their names only,
 * kept on the device with the player's other things, never compared with another player's.
 * Twelve open the hidden boss; the book keeps no more than that.
 */
export type ApplesFound = readonly string[];
/** A stored book is never longer: anything beyond was not written by the game. */
const APPLES_CHARACTER_LIMIT = 600;
/** No game reaches a later wave: the endless adventure stops counting its kings there. */
const LAST_WAVE = (KINGS_LIMIT + 1) * TOTAL_WAVES;
const ID = /^(\d{1,10}):(\d{1,6})$/;

/** True for the name of an apple the game could have shown, written as the game writes it. */
function validId(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false;
  const parts = ID.exec(raw);
  if (!parts) return false;
  const [seed, wave] = [Number(parts[1]), Number(parts[2])];
  return (
    seed <= 0xffffffff && waveHasApple(wave) && wave <= LAST_WAVE && appleId(seed, wave) === raw
  );
}

/** The stored book, in the order the apples were found; empty for nothing or anything doubtful. */
export function readApples(raw: string | null): ApplesFound {
  if (!raw) return [];
  return (
    readBoundedJson(raw, APPLES_CHARACTER_LIMIT, (data) => {
      if (
        !isRecord(data) ||
        data.version !== 1 ||
        !isArrayOfLength(data.found, 0, APPLES_TO_UNLOCK)
      )
        return null;
      const found = data.found;
      if (!found.every(validId) || new Set(found).size !== found.length) return null;
      return Object.freeze([...found]);
    }) ?? []
  );
}

export const writeApples = (found: ApplesFound): string => JSON.stringify({ version: 1, found });

/**
 * The book with one more apple. The same apple never counts twice, and the book stops at the
 * number that opens the boss: an apple found after that is a joy, not a line. `added` says
 * whether the book changed.
 */
export function addApple(found: ApplesFound, id: string) {
  if (!validId(id) || found.includes(id) || found.length >= APPLES_TO_UNLOCK)
    return { found, added: false };
  return { found: Object.freeze([...found, id]), added: true };
}

/** The active player's apples; a blocked storage reads nothing and writes nothing. */
export function createAppleBook(storage?: StoragePort) {
  const stored = (): ApplesFound => {
    try {
      return readApples(storage?.getItem(APPLES_STORAGE_KEY) ?? null);
    } catch {
      return [];
    }
  };
  /** True while an apple could not be written: the device refused it. */
  let unkept = false;
  /** The apples the device refused: written again at the next try. */
  let waiting: string[] = [];
  const write = (found: ApplesFound) => {
    try {
      storage?.setItem(APPLES_STORAGE_KEY, writeApples(found));
      return true;
    } catch {
      return false;
    }
  };
  /** The apples kept, with those still waiting to be written. */
  const read = () => waiting.reduce((found, id) => addApple(found, id).found, stored());
  return {
    read,
    get unkept() {
      return unkept;
    },
    /** True for an apple this player already has. */
    has: (id: string) => read().includes(id),
    /** Keeps an apple; returns how many the player has now, and whether this one is new. */
    add(id: string): { count: number; added: boolean } {
      const { found, added } = addApple(read(), id);
      if (!added) return { count: found.length, added };
      // The apple is the child's all the same; one refused is kept here and tried again.
      if (write(found)) [waiting, unkept] = [[], false];
      else [waiting, unkept] = [[...waiting, id], true];
      return { count: found.length, added };
    },
    /** Tries again the apples the device refused; true once nothing waits. */
    retry(): boolean {
      if (!waiting.length) return true;
      if (write(read())) [waiting, unkept] = [[], false];
      return !unkept;
    },
    /** Forgets the apples still waiting: an import has just written the book it brings. */
    forget(): void {
      [waiting, unkept] = [[], false];
    },
  };
}
