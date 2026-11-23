import { readRecords, writeRecords } from './endlessRecords.ts';
import { EXPEDITION_LOG_LIMIT } from './expeditionLog.ts';
import { loadExpeditionLog, validateExpeditionLog } from './expeditionStorage.ts';
import { FAMILY_EXTRAS, FAMILY_EXTRAS_VERSION, sameAdventure } from './familyBackup.ts';
import type { FamilyBackup, FamilyExtras } from './familyBackup.ts';
import { readBoundedJson } from './plainData.ts';
import { ENDLESS_RECORDS_KEY, EXPEDITION_STORAGE_KEY, VOYAGE_STORAGE_KEY } from './storageKeys.ts';
import { VOYAGE_LOG_LIMIT, validateVoyageLog } from './voyageStorage.ts';

/**
 * What a player keeps beside the adventure, for the family file (version 6): « La Grande
 * Expédition », the voyage to finish, the records of the endless adventure. Each one has its
 * own key and its own reader: this module is where the family file meets them.
 */
type Name = (typeof FAMILY_EXTRAS)[number];
type ReadPort = Pick<Storage, 'getItem'>;
type WritePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** True for an expedition log that holds only a record, no expedition under way. */
const recordOnly = (text: string) => {
  try {
    return (JSON.parse(text) as { current?: unknown }).current === null;
  } catch {
    return false;
  }
};
/** A log that holds something: an adventure under way, or a record. */
const kept = (log: { best: number; current: unknown } | null) =>
  log && (log.best > 0 || log.current !== null) ? JSON.stringify(log) : null;
/**
 * Where each text lives, and its reader: the text written again by its own rules, or null
 * for a text that cannot be read or holds nothing worth carrying.
 */
const EXTRAS: Readonly<Record<Name, { key: string; read: (text: string) => string | null }>> = {
  expedition: {
    key: EXPEDITION_STORAGE_KEY,
    read: (text) => kept(readBoundedJson(text, EXPEDITION_LOG_LIMIT, validateExpeditionLog)),
  },
  voyage: {
    key: VOYAGE_STORAGE_KEY,
    read: (text) => kept(readBoundedJson(text, VOYAGE_LOG_LIMIT, validateVoyageLog)),
  },
  endless: {
    key: ENDLESS_RECORDS_KEY,
    read: (text) => {
      const records = readRecords(text);
      return records.length ? writeRecords(records) : null;
    },
  },
};

/** What a copy taken now would carry of one extra: its text as the game reads it, or none. */
function collectOne(name: Name, storage?: ReadPort): string | null {
  try {
    const raw = storage?.getItem(EXTRAS[name].key);
    const text = typeof raw === 'string' ? EXTRAS[name].read(raw) : null;
    // An expedition that cannot be read is lost, its record is not: as the game reads it.
    if (!text && name === 'expedition' && storage) return kept(loadExpeditionLog(storage));
    return text;
  } catch {
    /* A storage that refuses to be read has nothing to carry. */
    return null;
  }
}
/** What the device holds for this player, ready for a family file: only what reads back. */
export function collectExtras(storage?: ReadPort): FamilyExtras {
  const extras: Partial<Record<Name, string>> = {};
  for (const name of FAMILY_EXTRAS) {
    const text = collectOne(name, storage);
    if (text) extras[name] = text;
  }
  return Object.freeze(extras);
}

/**
 * The extras of a family file, each one read by its own rules; null as soon as one is
 * refused: a file is accepted whole or not at all.
 */
export function checkExtras(extras: FamilyExtras): FamilyExtras | null {
  const checked: Partial<Record<Name, string>> = {};
  for (const name of FAMILY_EXTRAS) {
    const text = extras[name];
    if (text === undefined) continue;
    const read = typeof text === 'string' ? EXTRAS[name].read(text) : null;
    if (!read) return null;
    checked[name] = read;
  }
  return Object.keys(checked).length ? Object.freeze(checked) : null;
}

/**
 * Writes the extras of a file under their keys. What the file does not hold is left as it is
 * on the device. Returns the way back, to be used if the adventure itself cannot be written
 * afterwards; null when the device refused a write (it is then as it was, unless it also
 * refused the way back: `writeExtras.partial` says so).
 */
export function writeExtras(
  storage: WritePort | undefined,
  extras: FamilyExtras,
  /** True to take away, too, what the file does not carry: the file is the whole state. */
  whole = false,
): { undo: () => boolean } | null {
  writeExtras.partial = false;
  if (!storage) return null;
  const before: [string, string | null][] = [];
  /** False when the device also refused the way back: it then holds a part of the file. */
  const undo = () => {
    let whole = true;
    for (const [key, raw] of before.reverse()) {
      try {
        if (raw === null) storage.removeItem(key);
        else storage.setItem(key, raw);
      } catch {
        whole = false;
      }
    }
    return whole;
  };
  try {
    for (const name of FAMILY_EXTRAS) {
      const text = extras[name];
      if (text === undefined && !whole) continue;
      const { key } = EXTRAS[name];
      const previous = storage.getItem(key);
      // A whole restore does not take away a text this version cannot read (written by a
      // later one, or damaged) for less than it holds: when the copy carries nothing for it,
      // or only the record of an expedition while that text still gives one (the copy was
      // taken from it, or it went on since). A copy that carries more (an expedition under
      // way, taken before the text went bad) is written.
      if (
        whole &&
        previous !== null &&
        !EXTRAS[name].read(previous) &&
        (text === undefined ||
          (name === 'expedition' && recordOnly(text) && collectOne(name, storage) !== null))
      )
        continue;
      if (text === undefined) {
        if (previous === null) continue;
        storage.removeItem(key);
      } else storage.setItem(key, text);
      before.push([key, previous]);
    }
    return { undo };
  } catch {
    writeExtras.partial = !undo();
    return null;
  }
}
/** True when the last refused write could not be taken back whole. */
writeExtras.partial = false;

/**
 * True when importing `file` over the adventure in place (`now`, as the export gives it)
 * destroys nothing: the same adventure, and nothing beside it that the device would lose. A
 * normal import writes only the extras the file carries, so those must be the device's
 * already; a whole restore (`whole`) also takes away what the file does not carry, so it
 * must carry exactly the device's.
 */
export function replacesNothing(
  now: FamilyBackup | null,
  file: FamilyBackup,
  whole: boolean,
): boolean {
  if (!now || !sameAdventure(now, file)) return false;
  // Read back as the game reads them: a file whose texts are written another way (by hand,
  // or by an earlier build) carries the same extras if they read the same.
  const carried: Partial<Record<string, string>> =
    file.version === FAMILY_EXTRAS_VERSION ? (checkExtras(file.extras) ?? {}) : {};
  const held: Partial<Record<string, string>> =
    now.version === FAMILY_EXTRAS_VERSION ? now.extras : {};
  const names = new Set([...Object.keys(carried), ...(whole ? Object.keys(held) : [])]);
  return [...names].every((name) => carried[name] === held[name]);
}

/**
 * True when an import writes the endless records: a file that carries them, or a whole state
 * (which takes them away when it does not carry them). Records still waiting to be written
 * are then forgotten: those of the adventure replaced must not come back.
 */
export function importWritesRecords(file: FamilyBackup, whole: boolean): boolean {
  return whole || (file.version === FAMILY_EXTRAS_VERSION && file.extras.endless !== undefined);
}
