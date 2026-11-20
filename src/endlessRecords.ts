import { isArrayOfLength, isIntegerIn, isRecord, readBoundedJson } from './plainData.ts';
import { ENDLESS_RULES, KINGS_LIMIT } from './endless.ts';
import type { EndlessRules } from './endless.ts';
import { TOTAL_WAVES } from './gameConstants.ts';
import { ENDLESS_RECORDS_KEY } from './storageKeys.ts';

/**
 * The records of the endless adventure (decision of the parent, 20 November 2026): each player
 * keeps their own best games on the device, the wave reached and the kings beaten. Nothing is
 * compared between players, nothing leaves the device.
 */
export const RECORDS_KEPT = 5;
/** A stored list is never longer: anything beyond was not written by the game. */
const RECORDS_CHARACTER_LIMIT = 2000;

/** One game: the wave reached, counted from the first one, and the rules it was played by. */
export type EndlessRecord = Readonly<{
  wave: number;
  kings: number;
  rules: EndlessRules['version'];
}>;
export type EndlessRecords = readonly EndlessRecord[];

/** The best first: more waves; for as many waves, the newer game stays behind. */
const better = (a: EndlessRecord, b: EndlessRecord) => b.wave - a.wave;

function readRecord(raw: unknown): EndlessRecord | null {
  if (
    !isRecord(raw) ||
    !isIntegerIn(raw.rules, 1, 1) ||
    !Object.hasOwn(ENDLESS_RULES, raw.rules) ||
    !isIntegerIn(raw.kings, 0, KINGS_LIMIT) ||
    // A child who stops after a king keeps the wave of that king; one who falls, the wave lost.
    !isIntegerIn(raw.wave, Math.max(1, raw.kings * TOTAL_WAVES), (raw.kings + 1) * TOTAL_WAVES)
  )
    return null;
  return Object.freeze({ wave: raw.wave, kings: raw.kings, rules: raw.rules as 1 });
}

/** The stored records, best first; an empty list for nothing stored or anything doubtful. */
export function readRecords(raw: string | null): EndlessRecords {
  if (!raw) return [];
  return (
    readBoundedJson(raw, RECORDS_CHARACTER_LIMIT, (data) => {
      if (!isRecord(data) || data.version !== 1 || !isArrayOfLength(data.best, 0, RECORDS_KEPT))
        return null;
      const best = data.best.map(readRecord);
      return best.every((r) => r !== null) ? [...(best as EndlessRecord[])].sort(better) : null;
    }) ?? []
  );
}

export const writeRecords = (records: EndlessRecords): string =>
  JSON.stringify({ version: 1, best: records });

/**
 * Adds a finished game: the list keeps the five best. `best` tells whether it beats every
 * earlier game of this player (the first game is a record too).
 */
export function addRecord(records: EndlessRecords, game: EndlessRecord) {
  const best = !records.length || game.wave > records[0].wave;
  return { records: [...records, game].sort(better).slice(0, RECORDS_KEPT), best };
}

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

/** The active player's records; a blocked storage reads nothing and writes nothing. */
export function createRecordBook(storage?: StoragePort) {
  const read = (): EndlessRecords => {
    try {
      return readRecords(storage?.getItem(ENDLESS_RECORDS_KEY) ?? null);
    } catch {
      return [];
    }
  };
  return {
    read,
    /** Writes a finished game; returns whether it is the player's new record. */
    add(game: EndlessRecord): boolean {
      const { records, best } = addRecord(read(), game);
      try {
        storage?.setItem(ENDLESS_RECORDS_KEY, writeRecords(records));
      } catch {
        /* The game is played all the same; the record is simply not kept. */
      }
      return best;
    },
  };
}
