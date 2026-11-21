import { readRecords, writeRecords } from './endlessRecords.ts';
import { EXPEDITION_LOG_LIMIT } from './expeditionLog.ts';
import { validateExpeditionLog } from './expeditionStorage.ts';
import { FAMILY_EXTRAS } from './familyBackup.ts';
import type { FamilyExtras } from './familyBackup.ts';
import { readBoundedJson } from './plainData.ts';
import { ENDLESS_RECORDS_KEY, EXPEDITION_STORAGE_KEY, VOYAGE_STORAGE_KEY } from './storageKeys.ts';
import { VOYAGE_LOG_LIMIT, validateVoyageLog } from './voyageStorage.ts';

/**
 * What a player keeps beside the adventure, for the family file (version 6): « La Grande
 * Expédition », the voyage to finish, the records of the endless adventure. Each one has its
 * own key and its own reader; this module is loaded apart, when a family file is made or
 * read, so that the rules of the expedition stay out of the first package.
 */
type Name = (typeof FAMILY_EXTRAS)[number];
type ReadPort = Pick<Storage, 'getItem'>;
type WritePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

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

/** What the device holds for this player, ready for a family file: only what reads back. */
export function collectExtras(storage?: ReadPort): FamilyExtras {
  const extras: Partial<Record<Name, string>> = {};
  for (const name of FAMILY_EXTRAS) {
    try {
      const raw = storage?.getItem(EXTRAS[name].key);
      const text = typeof raw === 'string' ? EXTRAS[name].read(raw) : null;
      if (text) extras[name] = text;
    } catch {
      /* A storage that refuses to be read has nothing to carry. */
    }
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
 * afterwards; null when the device refused a write, everything being as it was.
 */
export function writeExtras(
  storage: WritePort | undefined,
  extras: FamilyExtras,
): { undo: () => void } | null {
  if (!storage) return null;
  const before: [string, string | null][] = [];
  const undo = () => {
    for (const [key, raw] of before.reverse()) {
      try {
        if (raw === null) storage.removeItem(key);
        else storage.setItem(key, raw);
      } catch {
        /* Nothing more can be done on a device that refuses. */
      }
    }
  };
  try {
    for (const name of FAMILY_EXTRAS) {
      const text = extras[name];
      if (text === undefined) continue;
      const { key } = EXTRAS[name];
      const previous = storage.getItem(key);
      storage.setItem(key, text);
      before.push([key, previous]);
    }
    return { undo };
  } catch {
    undo();
    return null;
  }
}
