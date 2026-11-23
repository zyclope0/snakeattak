import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import type { CareerState } from '../src/progression.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { createRecordBook } from '../src/endlessRecords.ts';
import { ENDLESS_RECORDS_KEY, FAMILY_STORAGE_KEY } from '../src/storageKeys.ts';

// The family is told when what is played is not on the device (council of 22 November 2026).
// What it is told rests on one answer of the save code, `unkept`: null exactly when the file
// the game would store now is the one the device holds; otherwise why not.

function memory(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  const state = { full: false, unreadable: false };
  return {
    values,
    state,
    getItem(key: string) {
      if (state.unreadable) throw Error('blocked');
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (state.full) throw Error('quota');
      values.set(key, value);
    },
  };
}
function career(stars: CareerState['bestStars'] = [0, 0, 0]): CareerState {
  const state = createCareer().state;
  state.bestStars = stars;
  return state;
}
const camp = (gold: number) => {
  const game = new Game(1);
  game.gold = gold;
  return encodeCheckpoint(game);
};

test('a device that keeps the game: nothing to tell, before and after a save', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  assert.equal(family.unkept, null);
  assert.equal(family.load(), null);
  assert.equal(family.unkept, null, 'an empty device is not a device that refuses');
  assert.equal(family.sync(camp(450), career()), true);
  assert.equal(family.unkept, null);
});

test('a write the device refuses is told, and the next write that passes ends it', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  family.load();
  assert.equal(family.sync(camp(450), career()), true);
  storage.state.full = true;
  assert.equal(family.sync(camp(460), career()), false);
  assert.equal(family.unkept, 'full');
  // Asked the same again and again, as the board does: still not kept.
  assert.equal(family.sync(camp(460), career()), false);
  assert.equal(family.unkept, 'full');
  storage.state.full = false;
  assert.equal(family.sync(camp(470), career()), true);
  assert.equal(family.unkept, null);
  // A second refusal is a second time.
  storage.state.full = true;
  assert.equal(family.sync(camp(480), career()), false);
  assert.equal(family.unkept, 'full');
});

test('when what would be stored is what is stored, nothing is missing from the device', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  family.load();
  assert.equal(family.sync(camp(450), career()), true);
  storage.state.full = true;
  assert.equal(family.sync(camp(460), career()), false);
  assert.equal(family.unkept, 'full');
  // The child goes back to exactly what the device holds: nothing would be lost at closing.
  assert.equal(family.sync(camp(450), career()), true);
  assert.equal(family.unkept, null);
  assert.equal(readFamilyBackup(storage.values.get(FAMILY_STORAGE_KEY)!)!.camp, camp(450));
});

test('no storage, or a storage that cannot be read: nothing is ever kept', () => {
  const none = createFamilyPersistence();
  assert.equal(none.unkept, 'blocked');
  assert.equal(none.sync(camp(450), career()), false);
  assert.equal(none.unkept, 'blocked');
  const storage = memory({ [FAMILY_STORAGE_KEY]: writeFamilyBackup(camp(450), career())! });
  storage.state.unreadable = true;
  const family = createFamilyPersistence(storage);
  assert.equal(family.load(), null);
  assert.equal(family.unkept, 'blocked');
  // Nothing is written over what could not be read: it stays blocked for the session.
  storage.state.unreadable = false;
  assert.equal(family.sync(camp(460), career()), false);
  assert.equal(family.unkept, 'blocked');
});

test('a file the game itself cannot build is told too, with its own reason', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  family.load();
  assert.equal(family.sync(camp(450), career()), true);
  // A career no file accepts: nothing of what is played reaches the device.
  assert.equal(family.sync(camp(460), career([9, 0, 0] as never)), false);
  assert.equal(family.unkept, 'broken');
  assert.equal(family.sync(camp(470), career()), true);
  assert.equal(family.unkept, null);
});

test('an import that passes ends it; one the device refuses does not', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  family.load();
  storage.state.full = true;
  assert.equal(family.sync(camp(450), career()), false);
  const file = readFamilyBackup(writeFamilyBackup(camp(999), career([1, 0, 0]))!)!;
  assert.equal(family.import(file), false);
  assert.equal(family.unkept, 'full');
  storage.state.full = false;
  assert.equal(family.import(file), true);
  assert.equal(family.unkept, null);
});

test('a record of the endless adventure the device refuses is told as well', () => {
  const values = new Map<string, string>();
  let full = false;
  const book = createRecordBook({
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (full) throw Error('quota');
      values.set(key, value);
    },
  });
  assert.equal(book.unkept, false);
  book.add({ wave: 5, kings: 0, rules: 1, run: 1 });
  assert.equal(book.unkept, false);
  full = true;
  book.add({ wave: 9, kings: 0, rules: 1, run: 2 });
  assert.equal(book.unkept, true);
  full = false;
  book.add({ wave: 12, kings: 1, rules: 1, run: 3 });
  assert.equal(book.unkept, false);
});

test('a refused record is written again at the next try, and only then is the family told it is kept', async () => {
  const { readRecords } = await import('../src/endlessRecords.ts');
  const values = new Map<string, string>();
  let full = false;
  const book = createRecordBook({
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (full) throw Error('quota');
      values.set(key, value);
    },
  });
  const stored = () => readRecords(values.get(ENDLESS_RECORDS_KEY) ?? null).map((r) => r.run);
  assert.equal(book.retry(), true, 'nothing waits');
  book.add({ wave: 5, kings: 0, rules: 1, run: 1 });
  full = true;
  // The child goes home with a record after a king: the device refuses it (second attack).
  book.add({ wave: 12, kings: 1, rules: 1, run: 2 });
  assert.equal(book.unkept, true);
  // Nothing more is played: tried again, refused again, still told.
  assert.equal(book.retry(), false);
  assert.equal(book.unkept, true);
  assert.deepEqual(stored(), [1]);
  // The parent frees space: the next save writes it, and the family is told it is kept.
  full = false;
  assert.equal(book.retry(), true);
  assert.equal(book.unkept, false);
  assert.deepEqual(stored().sort(), [1, 2]);
  // A record refused, then another game that is no record at all: both tries keep the first.
  full = true;
  book.add({ wave: 20, kings: 1, rules: 1, run: 3 });
  full = false;
  book.add({ wave: 1, kings: 0, rules: 1, run: 4 });
  assert.equal(book.unkept, false);
  assert.ok(stored().includes(3), 'the refused record is written with the next game');
});
