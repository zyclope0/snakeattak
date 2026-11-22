import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import type { CareerState } from '../src/progression.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { familyStars, readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { clearPlayerData, playerStorage } from '../src/players.ts';
import { FAMILY_PREVIOUS_KEY, FAMILY_REFUSED_KEY, FAMILY_STORAGE_KEY } from '../src/storageKeys.ts';

// The second generation of the family save (22 November 2026). The file found when the game
// starts is kept beside the one the session writes, at the moment the session first replaces
// it: a save that is valid but wrong no longer replaces the only copy. Reading alone adds
// nothing to the device. A copy with more stars is never given up for a file with fewer.

function memory(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  const refuse = new Set<string>();
  return {
    values,
    refuse,
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (refuse.has(key)) throw Error('quota');
      values.set(key, value);
    },
    removeItem: (key: string) => void values.delete(key),
  };
}
function career(stars: CareerState['bestStars'] = [0, 0, 0]): CareerState {
  const state = createCareer().state;
  state.bestStars = stars;
  return state;
}
function missionsWith(refuge: number) {
  const state = createMissionProgress();
  state.bestStars.refuge = refuge;
  return state;
}
/** One session of play on this device: the game starts, then saves something new. */
function session(
  storage: ReturnType<typeof memory>,
  stars: CareerState['bestStars'],
  gold: number,
) {
  const family = createFamilyPersistence(storage);
  const found = family.load();
  const game = new Game(1);
  game.gold = gold;
  assert.equal(family.sync(encodeCheckpoint(game), career(stars)), true);
  return { family, found };
}
/** A family file as the game stores it, with these stars and this many coins in the camp. */
function file(stars: CareerState['bestStars'], gold = 450, refuge = 0): string {
  const game = new Game(1);
  game.gold = gold;
  return writeFamilyBackup(encodeCheckpoint(game), career(stars), missionsWith(refuge))!;
}

test('the file found at start-up is kept when the session first replaces it, and stays', () => {
  const found = file([2, 1, 0]);
  const storage = memory({ [FAMILY_STORAGE_KEY]: found });
  const family = createFamilyPersistence(storage);
  assert.ok(family.load());
  // Reading adds nothing: a game opened and closed leaves the device as it was.
  assert.deepEqual([...storage.values.keys()], [FAMILY_STORAGE_KEY]);
  assert.equal(family.previous(), null);
  // The session plays on: the save changes, and what it replaces is kept.
  const game = new Game(1);
  for (const gold of [999, 998, 997]) {
    game.gold = gold;
    assert.equal(family.sync(encodeCheckpoint(game), career([3, 1, 0])), true);
    assert.notEqual(storage.values.get(FAMILY_STORAGE_KEY), found);
    assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), found, 'the start, not the last save');
  }
  // A later read in the same session is not a start: nothing moves.
  assert.ok(family.load());
  game.gold = 1;
  assert.equal(family.sync(encodeCheckpoint(game), career([3, 1, 0])), true);
  assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), found);
  // What is handed to a parent is a file the family import reads.
  assert.equal(family.previous(), found);
  assert.ok(readFamilyBackup(family.previous()!));
});

test('an import replaces the save, and the save from before the import is kept', () => {
  const mine = file([3, 2, 0], 450, 2);
  const storage = memory({ [FAMILY_STORAGE_KEY]: mine });
  const family = createFamilyPersistence(storage);
  assert.ok(family.load());
  // A parent imports an older file by mistake, as the first thing of the session.
  const older = readFamilyBackup(file([1, 0, 0]))!;
  assert.equal(family.import(older), true);
  assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), mine);
  assert.equal(familyStars(readFamilyBackup(storage.values.get(FAMILY_STORAGE_KEY)!)!), 1);
  // The next sessions play on the older file: the copy still holds the three-star save.
  session(storage, [1, 1, 0], 300);
  session(storage, [2, 1, 0], 300);
  assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), mine);
});

test('a new start moves the copy forward when no star was lost', () => {
  const storage = memory({ [FAMILY_STORAGE_KEY]: file([1, 0, 0]) });
  // Three sessions, each ending with more or as many stars: the copy is always the file the
  // session found, that is, the end of the session before.
  for (const [stars, gold] of [
    [[1, 0, 0], 800],
    [[3, 2, 0], 200],
    [[3, 2, 1], 50],
  ] as const) {
    const found = storage.values.get(FAMILY_STORAGE_KEY)!;
    session(storage, [...stars], gold);
    assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), found);
    assert.notEqual(storage.values.get(FAMILY_STORAGE_KEY), found);
  }
});

test('a file with fewer stars never takes the place of the copy from before', () => {
  const full = file([3, 3, 2], 450, 3);
  const storage = memory({ [FAMILY_STORAGE_KEY]: full });
  session(storage, [3, 3, 2], 451);
  assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), full);
  // Stars gone, by a defect or by an older file imported: the copy holds through every start.
  for (const lesser of [file([0, 0, 0]), file([3, 3, 2], 450, 2), file([3, 3, 1], 450, 3)]) {
    storage.values.set(FAMILY_STORAGE_KEY, lesser);
    const { family, found } = session(storage, [0, 0, 0], 7);
    assert.ok(found, 'the game still starts on the file it found');
    assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), full);
    assert.equal(family.previous(), full);
  }
  // Once the stars are back, or passed, the copy moves again.
  const caught = file([3, 3, 3], 10, 3);
  storage.values.set(FAMILY_STORAGE_KEY, caught);
  session(storage, [3, 3, 3], 11);
  assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), caught);
});

test('the stars counted are the great adventure’s and the missions’', () => {
  assert.equal(familyStars(readFamilyBackup(file([3, 2, 1], 450, 2))!), 8);
  assert.equal(familyStars(readFamilyBackup(file([0, 0, 0]))!), 0);
  // A file from before the missions has none to count.
  const old = readFamilyBackup(writeFamilyBackup(null, career([1, 1, 0]))!)!;
  assert.equal(familyStars({ ...old, missions: undefined } as never), 2);
});

test('a copy that cannot be read is replaced; a device that refuses it changes nothing else', () => {
  const found = file([1, 0, 0]);
  const damaged = memory({ [FAMILY_STORAGE_KEY]: found, [FAMILY_PREVIOUS_KEY]: '{damaged' });
  const family = createFamilyPersistence(damaged);
  assert.equal(family.previous(), null, 'nothing a parent could import');
  assert.ok(family.load());
  assert.equal(family.sync(null, career([1, 0, 0])), true);
  assert.equal(damaged.values.get(FAMILY_PREVIOUS_KEY), found);

  const full = memory({ [FAMILY_STORAGE_KEY]: found });
  full.refuse.add(FAMILY_PREVIOUS_KEY);
  const blocked = createFamilyPersistence(full);
  assert.ok(blocked.load(), 'no room for the copy: the game is played all the same');
  assert.equal(full.values.has(FAMILY_PREVIOUS_KEY), false);
  assert.equal(blocked.previous(), null);
  assert.equal(blocked.sync(null, career([1, 0, 0])), true, 'the save itself is still written');
});

test('nothing is kept when the device holds no file, or one this version cannot read', () => {
  const empty = memory();
  const fresh = createFamilyPersistence(empty);
  assert.equal(fresh.load(), null);
  assert.equal(empty.values.size, 0);
  assert.equal(fresh.previous(), null);
  assert.equal(fresh.refused(), null);

  // An unreadable file is put aside, as before; it never becomes the copy from before.
  const strange = memory({ [FAMILY_STORAGE_KEY]: '{"format":"other"}' });
  const family = createFamilyPersistence(strange);
  assert.equal(family.load(), null);
  assert.equal(strange.values.has(FAMILY_PREVIOUS_KEY), false);
  assert.equal(family.refused(), '{"format":"other"}');
  assert.equal(strange.values.get(FAMILY_REFUSED_KEY), '{"format":"other"}');
  // Without a storage, or with one that throws, there is nothing to hand over.
  assert.equal(createFamilyPersistence(undefined).previous(), null);
  const thrower = {
    getItem(): string | null {
      throw Error('blocked');
    },
    setItem() {},
  };
  assert.equal(createFamilyPersistence(thrower).previous(), null);
  assert.equal(createFamilyPersistence(thrower).refused(), null);
});

test('each player has its own copy, and deleting a player deletes it', () => {
  const device = memory({ [FAMILY_STORAGE_KEY]: file([3, 0, 0]) });
  const second = file([1, 0, 0]);
  device.values.set(`${FAMILY_STORAGE_KEY}:p2`, second);
  const family = createFamilyPersistence(playerStorage(device, 'p2'));
  assert.ok(family.load());
  assert.equal(family.sync(null, career([2, 0, 0])), true);
  assert.equal(device.values.get(`${FAMILY_PREVIOUS_KEY}:p2`), second);
  assert.equal(device.values.has(FAMILY_PREVIOUS_KEY), false, 'player 1 is not touched');
  assert.equal(clearPlayerData(device, 'p2'), true);
  assert.equal(device.values.has(`${FAMILY_PREVIOUS_KEY}:p2`), false);
  assert.equal(device.values.has(FAMILY_STORAGE_KEY), true);
});
