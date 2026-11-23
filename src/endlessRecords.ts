import { isArrayOfLength, isIntegerIn, isRecord, isUint32, readBoundedJson } from './plainData.ts';
import { ENDLESS_RULES, KINGS_LIMIT } from './endless.ts';
import type { EndlessRules } from './endless.ts';
import { TOTAL_WAVES } from './gameConstants.ts';
import { ENDLESS_RECORDS_KEY } from './storageKeys.ts';
import type { StoragePort } from './checkpoints.ts';

/**
 * The records of the endless adventure (decision of the parent, 20 November 2026): each player
 * keeps their own best games on the device, the wave reached and the kings beaten. Nothing is
 * compared between players, nothing leaves the device.
 */
export const RECORDS_KEPT = 5;
/** A stored list is never longer: anything beyond was not written by the game. */
const RECORDS_CHARACTER_LIMIT = 2000;

/**
 * One game: the wave reached, counted from the first one, the kings beaten, the rules it was
 * played by, and its departure seed. A game is written again each time it goes further (after
 * each king, when it falls), and a wave tried again stays the same game: one line a game.
 */
export type EndlessRecord = Readonly<{
  wave: number;
  kings: number;
  rules: EndlessRules['version'];
  run: number;
}>;
export type EndlessRecords = readonly EndlessRecord[];

/** The best first: more waves, then more kings; for a tie, the earlier game stays first. */
const better = (a: EndlessRecord, b: EndlessRecord) => b.wave - a.wave || b.kings - a.kings;
const beats = (a: EndlessRecord, b: EndlessRecord | undefined) => !b || better(a, b) < 0;

function readRecord(raw: unknown): EndlessRecord | null {
  if (
    !isRecord(raw) ||
    !isIntegerIn(raw.rules, 1, 1) ||
    !Object.hasOwn(ENDLESS_RULES, raw.rules) ||
    !isUint32(raw.run) ||
    !isIntegerIn(raw.kings, 0, KINGS_LIMIT) ||
    // A game stopped after a king keeps the wave of that king; one that falls, the wave lost.
    !isIntegerIn(raw.wave, Math.max(1, raw.kings * TOTAL_WAVES), (raw.kings + 1) * TOTAL_WAVES)
  )
    return null;
  return Object.freeze({ wave: raw.wave, kings: raw.kings, rules: raw.rules as 1, run: raw.run });
}

/** The stored records, best first; an empty list for nothing stored or anything doubtful. */
export function readRecords(raw: string | null): EndlessRecords {
  if (!raw) return [];
  return (
    readBoundedJson(raw, RECORDS_CHARACTER_LIMIT, (data) => {
      if (!isRecord(data) || data.version !== 1 || !isArrayOfLength(data.best, 0, RECORDS_KEPT))
        return null;
      const best = data.best.map(readRecord);
      if (best.some((r) => r === null)) return null;
      const runs = new Set(best.map((r) => r!.run));
      return runs.size === best.length ? [...(best as EndlessRecord[])].sort(better) : null;
    }) ?? []
  );
}

export const writeRecords = (records: EndlessRecords): string =>
  JSON.stringify({ version: 1, best: records });

/**
 * Writes how far a game went: its line climbs, or a new line comes; the list keeps the five
 * best. `best` tells whether it now beats every other game of this player, and its own line
 * as it stood (the first game is a record too).
 */
export function addRecord(records: EndlessRecords, game: EndlessRecord) {
  const own = records.find((r) => r.run === game.run);
  if (own && !beats(game, own)) return { records, best: false };
  const others = records.filter((r) => r.run !== game.run);
  const best = beats(game, records[0]);
  return { records: [...others, game].sort(better).slice(0, RECORDS_KEPT), best };
}

/** The endless adventures, over, that set their player's new record: the result says so. */
export const newRecords = new WeakSet<object>();

/** The active player's records; a blocked storage reads nothing and writes nothing. */
export function createRecordBook(storage?: StoragePort) {
  const read = (): EndlessRecords => {
    try {
      return readRecords(storage?.getItem(ENDLESS_RECORDS_KEY) ?? null);
    } catch {
      return [];
    }
  };
  /** True while a record could not be written: the device refused it. */
  let unkept = false;
  /** The games whose record the device refused: written again at the next try. */
  let waiting: EndlessRecord[] = [];
  /** Writes these records over the ones kept; false when the device refuses. */
  const write = (records: EndlessRecords) => {
    try {
      storage?.setItem(ENDLESS_RECORDS_KEY, writeRecords(records));
      return true;
    } catch {
      return false;
    }
  };
  /** The records kept, with those still waiting to be written. */
  const withWaiting = () =>
    waiting.reduce((records, game) => addRecord(records, game).records, read());
  return {
    read,
    get unkept() {
      return unkept;
    },
    /** Writes how far a game went; returns whether it is now the player's record. */
    add(game: EndlessRecord): boolean {
      const before = withWaiting();
      const { records, best } = addRecord(before, game);
      if (records === before && !waiting.length) return false;
      // The game is played all the same; a record refused is kept here, tried again, and
      // the family is told until it is written.
      if (write(records)) [waiting, unkept] = [[], false];
      else [waiting, unkept] = [[...waiting, game], true];
      return best;
    },
    /** Tries again the records the device refused; true once nothing waits. */
    retry(): boolean {
      if (!waiting.length) return true;
      if (write(withWaiting())) [waiting, unkept] = [[], false];
      return !unkept;
    },
    /**
     * Forgets the records still waiting: an import has just written the records it brings
     * (or taken them away), and those of the adventure it replaced must not come back.
     */
    forget(): void {
      [waiting, unkept] = [[], false];
    },
  };
}
