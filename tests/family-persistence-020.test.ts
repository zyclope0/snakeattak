import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
const KEY = 'conquete-serpents:family:v1';
const REFUSED = 'conquete-serpents:family-refused:v1';
function memory() {
  const values = new Map<string, string>();
  const writes: string[] = [];
  let blocked = false;
  return {
    values,
    writes,
    set blocked(value: boolean) {
      blocked = value;
    },
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (blocked) throw Error('quota');
      writes.push(key);
      values.set(key, value);
    },
  };
}

test('one authoritative write imports a profile-only save and takes precedence over legacy armies', () => {
  const storage = memory();
  storage.values.set('conquete-serpents:camp:v1', encodeCheckpoint(new Game(1))!);
  storage.values.set('conquete-serpents:progress:v1', 'old-profile');
  const persistence = createFamilyPersistence(storage);
  const profile = createCareer().state;
  profile.bestStars = [3, 3, 2];
  const backup = readFamilyBackup(writeFamilyBackup(null, profile)!)!;
  assert.equal(persistence.import(backup), true);
  assert.deepEqual(storage.writes, [KEY]);
  assert.equal(storage.values.get('conquete-serpents:progress:v1'), 'old-profile');
  const loaded = createFamilyPersistence(storage).load()!;
  assert.equal(loaded.camp, null);
  assert.deepEqual(loaded.career.bestStars, [3, 3, 2]);
  assert.match(persistence.status, /enregistr|sauvegard/i);
});

test('sync deduplicates canonical JSON and rejected imports cannot alter persistent state', () => {
  const storage = memory();
  const persistence = createFamilyPersistence(storage);
  const career = createCareer().state;
  const camp = encodeCheckpoint(new Game(1));
  assert.equal(persistence.sync(camp, career), true);
  const before = storage.values.get(KEY);
  assert.equal(persistence.sync(camp, career), true);
  assert.equal(storage.writes.length, 1);
  assert.equal(persistence.import({ format: 'other' } as never), false);
  assert.equal(storage.values.get(KEY), before);
  assert.equal(storage.writes.length, 1);
  const reloaded = createFamilyPersistence(storage);
  assert.ok(reloaded.load());
  assert.equal(reloaded.sync(camp, career), true);
  assert.equal(storage.writes.length, 1);
});

test('quota failures retain every old key and explicit import can retry after recovery', () => {
  const storage = memory();
  const persistence = createFamilyPersistence(storage);
  const old = writeFamilyBackup(encodeCheckpoint(new Game(1)), createCareer().state)!;
  storage.values.set(KEY, old);
  const backup = readFamilyBackup(writeFamilyBackup(null, createCareer().state)!)!;
  storage.blocked = true;
  assert.equal(persistence.import(backup), false);
  assert.equal(storage.values.get(KEY), old);
  assert.equal(storage.writes.length, 0);
  assert.match(persistence.status, /indisponible|bloqué|plein/i);
  storage.blocked = false;
  assert.equal(persistence.import(backup), true);
  assert.equal(createFamilyPersistence(storage).load()!.camp, null);
});

test('a storage that refused one write is tried again: the games that follow are kept', () => {
  const storage = memory();
  const persistence = createFamilyPersistence(storage);
  const career = createCareer().state;
  assert.equal(persistence.sync(encodeCheckpoint(new Game(1)), career), true);
  const kept = storage.values.get(KEY);
  // Full for a moment: the write is refused, what was stored stays as it was.
  storage.blocked = true;
  const later = new Game(1);
  later.gold = 123;
  assert.equal(persistence.sync(encodeCheckpoint(later), career), false);
  assert.equal(storage.values.get(KEY), kept);
  assert.match(persistence.status, /indisponible/i);
  // Room again: the very next change is written, with no import and no restart.
  storage.blocked = false;
  career.bestStars = [3, 2, 0];
  assert.equal(persistence.sync(encodeCheckpoint(later), career), true);
  const reloaded = createFamilyPersistence(storage).load()!;
  assert.deepEqual(reloaded.career.bestStars, [3, 2, 0]);
  assert.match(persistence.status, /enregistr|sauvegard/i);
});

test('a family save this version cannot read is put aside before a new game replaces it', () => {
  const storage = memory();
  const unreadable = JSON.stringify({
    format: 'conquete-serpents-family',
    version: 99,
    camp: null,
  });
  storage.values.set(KEY, unreadable);
  const persistence = createFamilyPersistence(storage);
  assert.equal(persistence.load(), null);
  assert.match(persistence.status, /incompatible|invalide/i);
  assert.equal(storage.values.get(KEY), unreadable, 'reading replaces nothing');
  assert.equal(storage.values.get(REFUSED), unreadable, 'the refused text is put aside');
  // The new game is then saved over the file: the copy still holds the old adventure.
  assert.equal(persistence.sync(null, createCareer().state), true);
  assert.notEqual(storage.values.get(KEY), unreadable);
  assert.equal(storage.values.get(REFUSED), unreadable);
  // A readable save is never copied, and a full storage does not stop the game.
  const fine = memory();
  fine.values.set(KEY, writeFamilyBackup(null, createCareer().state)!);
  assert.ok(createFamilyPersistence(fine).load());
  assert.equal(fine.values.has(REFUSED), false);
  const full = memory();
  full.values.set(KEY, unreadable);
  full.blocked = true;
  assert.equal(createFamilyPersistence(full).load(), null);
  assert.equal(full.values.get(KEY), unreadable);
});

test('absent, invalid and blocked storage expose honest status without writes', () => {
  const storage = memory();
  const empty = createFamilyPersistence(storage);
  assert.equal(empty.load(), null);
  assert.equal(storage.writes.length, 0);
  storage.values.set(KEY, '{');
  assert.equal(empty.load(), null);
  assert.match(empty.status, /incompatible|invalide/i);
  // The only write is the copy of the refused text: the file itself is untouched.
  assert.deepEqual(storage.writes, [REFUSED]);
  assert.equal(storage.values.get(KEY), '{');
  const blocked = createFamilyPersistence({
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('blocked');
    },
  });
  assert.equal(blocked.load(), null);
  assert.equal(blocked.sync(null, createCareer().state), false);
  assert.match(blocked.status, /indisponible/i);
  const unavailable = createFamilyPersistence();
  assert.equal(
    unavailable.import(readFamilyBackup(writeFamilyBackup(null, createCareer().state)!)!),
    false,
  );
  assert.match(unavailable.status, /indisponible/i);
});

test('a sparse chapter tuple passed directly to import is rejected before serialization can clear it', () => {
  const storage = memory();
  const persistence = createFamilyPersistence(storage);
  const backup = readFamilyBackup(writeFamilyBackup(null, createCareer().state)!)!;
  assert.equal(persistence.import(backup), true);
  const old = storage.values.get(KEY);
  Reflect.deleteProperty(backup.career.chapterCamps, '0');
  assert.equal(persistence.import(backup), false);
  assert.equal(storage.values.get(KEY), old);
  assert.equal(storage.writes.length, 1);
});
