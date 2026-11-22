import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import type { CareerState } from '../src/progression.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { familyStickers, readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCapriceAlbums } from '../src/capriceAlbums.ts';
import { CAPRICES } from '../src/caprices.ts';
import {
  FAMILY_BEFORE_IMPORT_KEY,
  FAMILY_PREVIOUS_KEY,
  FAMILY_STORAGE_KEY,
} from '../src/storageKeys.ts';

// Two copies beside the save, two roles (council of 22 November 2026). One slot guarded by the
// stars left three holes: a loss with equal stars, a file with more stars imported by mistake,
// a copy frozen after an import with fewer stars. « family-previous » keeps the save of an
// earlier launch, or the one that had the most stars and stickers while some are missing;
// « family-before-import » keeps the adventure each import replaces.

function memory(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  const refuse = new Set<string>();
  const written: string[] = [];
  return {
    values,
    refuse,
    written,
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (refuse.has(key)) throw Error('quota');
      written.push(key);
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
/** A family file with these stars, these coins and this many stickers in its book. */
function file(stars: CareerState['bestStars'], gold = 450, stickers = 0): string {
  const game = new Game(1);
  game.gold = gold;
  const albums = createCapriceAlbums();
  albums.children[0]!.completed = CAPRICES.slice(0, stickers).map((caprice) => caprice.id);
  return writeFamilyBackup(encodeCheckpoint(game), career(stars), createMissionProgress(), albums)!;
}
/** A launch: the game reads the file, then saves it with other coins. */
function launch(storage: ReturnType<typeof memory>, gold: number) {
  const family = createFamilyPersistence(storage);
  const found = family.load()!;
  const game = new Game(1);
  game.gold = gold;
  assert.equal(
    family.sync(encodeCheckpoint(game), found.career, found.missions, (found as never)['albums']),
    true,
  );
  return family;
}

test('the save is written first, the copy after', () => {
  const found = file([1, 0, 0]);
  const storage = memory({ [FAMILY_STORAGE_KEY]: found });
  launch(storage, 451);
  assert.deepEqual(storage.written, [FAMILY_STORAGE_KEY, FAMILY_PREVIOUS_KEY]);
  assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), found);
  // A device with no room for the copy keeps the save: what the child did never waits.
  const full = memory({ [FAMILY_STORAGE_KEY]: found });
  full.refuse.add(FAMILY_PREVIOUS_KEY);
  launch(full, 451);
  assert.deepEqual(full.written, [FAMILY_STORAGE_KEY]);
  assert.notEqual(full.values.get(FAMILY_STORAGE_KEY), found);
  // And when the save itself is refused, no copy is written in its place.
  const blocked = memory({ [FAMILY_STORAGE_KEY]: found });
  blocked.refuse.add(FAMILY_STORAGE_KEY);
  const family = createFamilyPersistence(blocked);
  const read = family.load()!;
  assert.equal(family.sync(null, read.career, read.missions), false);
  assert.deepEqual(blocked.written, []);
});

test('stars first, then stickers: the copy gives way to an adventure with more stars', () => {
  assert.equal(familyStickers(readFamilyBackup(file([0, 0, 0], 450, 3))!), 3);
  // Same stars, the sticker book emptied: the copy with the stickers stays.
  const rich = file([1, 0, 0], 450, 3);
  const storage = memory({
    [FAMILY_STORAGE_KEY]: file([1, 0, 0], 460, 0),
    [FAMILY_PREVIOUS_KEY]: rich,
  });
  launch(storage, 461);
  launch(storage, 462);
  assert.equal(
    storage.values.get(FAMILY_PREVIOUS_KEY),
    rich,
    'for as long as stickers are missing',
  );
  // Once nothing is missing any more, the copy moves on to the last launch.
  const whole = file([1, 0, 0], 470, 3);
  storage.values.set(FAMILY_STORAGE_KEY, whole);
  launch(storage, 471);
  assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), whole);
  // More stars but fewer stickers in play: the adventure in play has its own copy (a family
  // that took over another device's adventure on purpose must not stay without one).
  const starred = file([3, 3, 0], 450, 0);
  const mixed = memory({
    [FAMILY_STORAGE_KEY]: starred,
    [FAMILY_PREVIOUS_KEY]: file([1, 0, 0], 450, 5),
  });
  launch(mixed, 451);
  assert.equal(mixed.values.get(FAMILY_PREVIOUS_KEY), starred);
  // And the other way round: more stars in the copy, even with fewer stickers, stay.
  const held = file([3, 0, 0], 450, 0);
  const lost = memory({
    [FAMILY_STORAGE_KEY]: file([1, 0, 0], 450, 5),
    [FAMILY_PREVIOUS_KEY]: held,
  });
  launch(lost, 451);
  assert.equal(lost.values.get(FAMILY_PREVIOUS_KEY), held);
});

test('a copy one of whose camps no longer decodes is weighed as the game would read it', () => {
  const parts = JSON.parse(file([3, 0, 0], 450));
  parts.camp = JSON.stringify({ ...JSON.parse(parts.camp), gold: -5 });
  const damaged = JSON.stringify(parts);
  // It has more stars than the file found: it stays.
  const storage = memory({ [FAMILY_STORAGE_KEY]: file([1, 0, 0]), [FAMILY_PREVIOUS_KEY]: damaged });
  launch(storage, 451);
  assert.equal(storage.values.get(FAMILY_PREVIOUS_KEY), damaged);
  // Fewer stars than the file found: it gives way, nothing of value is lost.
  const better = memory({ [FAMILY_STORAGE_KEY]: file([3, 3, 0]), [FAMILY_PREVIOUS_KEY]: damaged });
  launch(better, 451);
  assert.notEqual(better.values.get(FAMILY_PREVIOUS_KEY), damaged);
});

test('before an import, the adventure about to be replaced is kept as it is given', () => {
  const mine = file([1, 0, 0]);
  const storage = memory({ [FAMILY_STORAGE_KEY]: mine });
  const family = createFamilyPersistence(storage);
  family.load();
  assert.equal(family.beforeImport(), null);
  // The text the export would give is kept, whatever it is.
  const exported = file([1, 0, 0], 999);
  assert.equal(typeof family.keepBeforeImport(exported), 'function');
  assert.equal(storage.values.get(FAMILY_BEFORE_IMPORT_KEY), exported);
  assert.equal(family.beforeImport(), exported);
  // The same adventure again needs no write.
  storage.written.length = 0;
  assert.equal(typeof family.keepBeforeImport(exported), 'function');
  assert.deepEqual(storage.written, []);
  // Without an export to keep, the text the device holds stands for it.
  family.keepBeforeImport(null);
  assert.equal(storage.values.get(FAMILY_BEFORE_IMPORT_KEY), mine);
  // A device that holds no adventure has nothing an import could destroy: no copy, no refusal.
  const empty = memory();
  assert.equal(typeof createFamilyPersistence(empty).keepBeforeImport(file([0, 0, 0])), 'function');
  assert.deepEqual(empty.written, []);
});

test('an import that fails puts the copy back as it was', () => {
  const kept = file([1, 0, 0], 300);
  const storage = memory({
    [FAMILY_STORAGE_KEY]: file([3, 3, 3], 800),
    [FAMILY_BEFORE_IMPORT_KEY]: kept,
  });
  const family = createFamilyPersistence(storage);
  family.load();
  const putBack = family.keepBeforeImport(storage.values.get(FAMILY_STORAGE_KEY)!)!;
  assert.notEqual(storage.values.get(FAMILY_BEFORE_IMPORT_KEY), kept);
  putBack();
  assert.equal(storage.values.get(FAMILY_BEFORE_IMPORT_KEY), kept, 'the earlier copy is back');
  // A first copy, taken back, leaves no copy at all.
  const first = memory({ [FAMILY_STORAGE_KEY]: file([1, 0, 0]) });
  const once = createFamilyPersistence(first);
  once.load();
  once.keepBeforeImport(null)!();
  assert.equal(first.values.has(FAMILY_BEFORE_IMPORT_KEY), false);
});

test('a device that refuses the copy refuses the import; one that keeps nothing imports nothing', () => {
  const mine = file([1, 0, 0]);
  const storage = memory({ [FAMILY_STORAGE_KEY]: mine });
  storage.refuse.add(FAMILY_BEFORE_IMPORT_KEY);
  const family = createFamilyPersistence(storage);
  family.load();
  assert.equal(family.keepBeforeImport(file([1, 0, 0], 999)), null);
  assert.equal(storage.values.get(FAMILY_STORAGE_KEY), mine, 'nothing has changed');
  assert.equal(createFamilyPersistence().keepBeforeImport(mine), null, 'no storage at all');
});

test('a copy the import cannot read is not offered', () => {
  const storage = memory({ [FAMILY_BEFORE_IMPORT_KEY]: '{"version":99}' });
  assert.equal(createFamilyPersistence(storage).beforeImport(), null);
});

test('the three holes of the single copy are closed', () => {
  // A. A file with more stars imported by mistake: the child's adventure is in the copy of the
  //    import, whatever the launches that follow.
  const mine = file([1, 0, 0], 450, 2);
  const sibling = readFamilyBackup(file([3, 3, 3], 800))!;
  const storage = memory({ [FAMILY_STORAGE_KEY]: mine });
  const family = createFamilyPersistence(storage);
  family.load();
  assert.ok(family.keepBeforeImport(mine));
  assert.equal(family.import(sibling), true);
  launch(storage, 801);
  launch(storage, 802);
  assert.equal(storage.values.get(FAMILY_BEFORE_IMPORT_KEY), mine);
  // B. After an import with fewer stars, the older copy stays for its stars, and the current
  //    adventure is still kept at the next import.
  const small = readFamilyBackup(file([0, 0, 0], 100))!;
  const now = storage.values.get(FAMILY_STORAGE_KEY)!;
  const again = createFamilyPersistence(storage);
  again.load();
  assert.ok(again.keepBeforeImport(now));
  assert.equal(again.import(small), true);
  assert.equal(storage.values.get(FAMILY_BEFORE_IMPORT_KEY), now, 'the adventure just replaced');
  launch(storage, 101);
  assert.equal(storage.values.get(FAMILY_BEFORE_IMPORT_KEY), now, 'only an import changes it');
  // C. An import in the middle of a session keeps the save it replaces, not the one the
  //    session started from.
  const middle = memory({ [FAMILY_STORAGE_KEY]: file([1, 0, 0], 450) });
  const playing = launch(middle, 500);
  const played = middle.values.get(FAMILY_STORAGE_KEY)!;
  assert.ok(playing.keepBeforeImport(played));
  assert.equal(playing.import(small), true);
  assert.equal(middle.values.get(FAMILY_BEFORE_IMPORT_KEY), played);
});
