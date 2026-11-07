import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
const KEY = 'conquete-serpents:family:v1';
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

test('absent, invalid and blocked storage expose honest status without writes', () => {
  const storage = memory();
  const empty = createFamilyPersistence(storage);
  assert.equal(empty.load(), null);
  storage.values.set(KEY, '{');
  assert.equal(empty.load(), null);
  assert.match(empty.status, /incompatible|invalide/i);
  assert.equal(storage.writes.length, 0);
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
