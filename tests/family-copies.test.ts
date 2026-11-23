import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import type { CareerState } from '../src/progression.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { familyStickers, readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { writeRecords } from '../src/endlessRecords.ts';
import { createCapriceAlbums } from '../src/capriceAlbums.ts';
import { CAPRICES } from '../src/caprices.ts';
import {
  FAMILY_BEFORE_IMPORT_KEY,
  FAMILY_PREVIOUS_KEY,
  FAMILY_STORAGE_KEY,
  ENDLESS_RECORDS_KEY,
  EXPEDITION_STORAGE_KEY,
  VOYAGE_STORAGE_KEY,
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

test('the same adventure whatever the version, and what a launch writes again from the camp', async () => {
  const { sameAdventure } = await import('../src/familyBackup.ts');
  const modern = readFamilyBackup(file([3, 2, 0]))!;
  const { format, camp, career: held } = modern;
  const { missions, albums } = modern as unknown as {
    missions: ReturnType<typeof createMissionProgress>;
    albums: ReturnType<typeof createCapriceAlbums>;
  };
  for (const old of [
    { format, version: 1, camp: null, career: held },
    { format, version: 2, camp, career: held, missions },
    { format, version: 3, camp, career: held, missions },
  ]) {
    const legacy = readFamilyBackup(JSON.stringify(old));
    assert.ok(legacy, `version ${old.version} is read`);
    // What the export gives once that file is imported: fresh missions and sticker books
    // where the file had none (src/bootstrap.ts, `applyFamily`).
    const imported = readFamilyBackup(
      writeFamilyBackup(
        legacy.camp,
        legacy.career,
        'missions' in legacy ? legacy.missions : createMissionProgress(),
        createCapriceAlbums(),
      )!,
    )!;
    assert.equal(sameAdventure(imported, legacy), true, `version ${old.version}`);
    assert.equal(sameAdventure(legacy, imported), true, `version ${old.version}, either way`);
  }
  // A launch writes the classic camp of a classic game again: a file that left it empty
  // is the adventure the export gives afterwards (second attack, C1).
  assert.equal(missions.classicCamp, null);
  const launched = readFamilyBackup(
    writeFamilyBackup(camp, held, { ...missions, classicCamp: camp }, albums)!,
  )!;
  assert.equal(sameAdventure(modern, launched), true, 'the classic camp, written from the camp');
  // The file is compared, never changed.
  const text = JSON.stringify(modern);
  sameAdventure(modern, launched);
  assert.equal(JSON.stringify(modern), text);
});

test('another book or another career is another adventure, never merged', async () => {
  const { sameAdventure } = await import('../src/familyBackup.ts');
  const base = readFamilyBackup(file([3, 2, 0]))!;
  assert.equal(sameAdventure(base, readFamilyBackup(file([3, 2, 0]))!), true);
  assert.equal(sameAdventure(base, readFamilyBackup(file([3, 2, 0], 450, 1))!), false, 'a sticker');
  assert.equal(sameAdventure(base, readFamilyBackup(file([3, 3, 0]))!), false, 'a star');
  assert.equal(sameAdventure(base, readFamilyBackup(file([3, 2, 0], 451))!), false, 'the camp');
  const renamed = createCapriceAlbums();
  renamed.children[0]!.name = 'Autre';
  const named = readFamilyBackup(
    writeFamilyBackup(base.camp, base.career, base.missions, renamed)!,
  )!;
  assert.equal(sameAdventure(base, named), false, 'the name of a book');
});

test('an import destroys nothing only when the adventure and what lies beside it are the same', async () => {
  const { replacesNothing } = await import('../src/familyExtras.ts');
  const adventure = JSON.parse(file([3, 2, 0]));
  const withExtras = (extras: Record<string, string>) =>
    readFamilyBackup(JSON.stringify({ ...adventure, version: 6, extras }));
  const records = writeRecords([{ wave: 17, kings: 1, rules: 1, run: 9 }]);
  const more = writeRecords([{ wave: 18, kings: 1, rules: 1, run: 9 }]);
  const device = withExtras({ endless: records })!;
  const plain = readFamilyBackup(file([3, 2, 0]))!;
  assert.ok(device);
  assert.equal(replacesNothing(null, plain, false), false, 'nothing in place: nothing to keep');
  assert.equal(replacesNothing(device, plain, false), true, 'nothing carried, nothing changed');
  assert.equal(replacesNothing(device, withExtras({ endless: records })!, false), true);
  // A file with the same adventure and other records would replace them (A02).
  assert.equal(replacesNothing(device, withExtras({ endless: more })!, false), false);
  // A whole restore takes away what it does not carry.
  assert.equal(replacesNothing(device, plain, true), false, 'the records would go');
  assert.equal(replacesNothing(plain, plain, true), true);
  assert.equal(replacesNothing(device, readFamilyBackup(file([3, 3, 0]))!, false), false);
});

test('a whole restore takes away only what a copy could have carried', async () => {
  const { writeExtras } = await import('../src/familyExtras.ts');
  const later = '{"version":99}';
  const storage = memory({
    [ENDLESS_RECORDS_KEY]: writeRecords([{ wave: 17, kings: 1, rules: 1, run: 9 }]),
    [VOYAGE_STORAGE_KEY]: later,
  });
  assert.ok(writeExtras(storage, {}, true));
  assert.equal(storage.values.get(ENDLESS_RECORDS_KEY), undefined, 'a record it reads: taken');
  assert.equal(storage.values.get(VOYAGE_STORAGE_KEY), later, 'a voyage it cannot read: stays');
});

test('what a launch writes from the camp: the chapter camp of the career, the book of a challenge waiting', async () => {
  const { sameAdventure } = await import('../src/familyBackup.ts');
  const { REWARD_WAVES } = await import('../src/gameConstants.ts');
  const base = JSON.parse(file([2, 0, 0]));
  // A camp at the end of a chapter: a launch writes it as the chapter camp of the career.
  const chapter = new Game(12, undefined, undefined, 1);
  chapter.wave = REWARD_WAVES[0]!;
  // Its reward still to choose, as the game leaves it at the end of the wave.
  chapter.rewards.pending = REWARD_WAVES[0]!;
  const top = encodeCheckpoint(chapter)!;
  const kept = decodeCheckpoint(top)!;
  const unsynced = { ...base, camp: top };
  const synced = createCareer(undefined, unsynced.career);
  synced.sync(kept);
  assert.notDeepEqual(synced.state.chapterCamps, unsynced.career.chapterCamps, 'a real write');
  assert.equal(
    sameAdventure(
      readFamilyBackup(JSON.stringify(unsynced))!,
      readFamilyBackup(JSON.stringify({ ...unsynced, career: synced.state }))!,
    ),
    true,
    'the chapter camp a launch writes',
  );
  // A challenge waiting in the retry camp: a launch opens its sticker book.
  const run = {
    missionId: 'sonnette',
    seed: 77,
    layout: 0,
    assault: 'balanced',
    nest: 'spread',
    caprice: 'sonnette-petit',
  };
  const retry = encodeCheckpoint(new Game(77, undefined, run as never))!;
  const missions = { ...base.missions, retryCamp: retry, lastRuns: { sonnette: run } };
  for (const mission of Object.keys(missions.bestStars)) missions.bestStars[mission] = 3;
  const waiting = { ...base, missions };
  const opened = { ...waiting, albums: { ...base.albums, campProfileId: 'child-1' } };
  assert.equal(waiting.albums.campProfileId, null);
  const [a, b] = [
    readFamilyBackup(JSON.stringify(waiting)),
    readFamilyBackup(JSON.stringify(opened)),
  ];
  assert.ok(a && b, 'both files are read');
  assert.equal(sameAdventure(a, b), true, 'the book a launch opens');
});

test('extras written another way are the same extras; a whole restore leaves a text it cannot read', async () => {
  const { replacesNothing, writeExtras, collectExtras } = await import('../src/familyExtras.ts');
  const adventure = JSON.parse(file([3, 2, 0]));
  const records = writeRecords([{ wave: 17, kings: 1, rules: 1, run: 9 }]);
  const device = readFamilyBackup(
    JSON.stringify({ ...adventure, version: 6, extras: { endless: records } }),
  )!;
  // The same records, with a space more: an earlier build, or a hand, wrote them so.
  const spaced = readFamilyBackup(
    JSON.stringify({ ...adventure, version: 6, extras: { endless: records.replace(':', ': ') } }),
  )!;
  assert.notEqual(spaced.version === 6 && spaced.extras.endless, records);
  assert.equal(replacesNothing(device, spaced, false), true, 'the same records, read back');
  // An expedition of a later build: its record reads, the rest does not. A copy carries the
  // record only; bringing that copy back must not put it in place of the whole text.
  const later = JSON.stringify({ version: 1, best: 5, current: { version: 99 } });
  const storage = memory({ [EXPEDITION_STORAGE_KEY]: later });
  const carried = collectExtras(storage);
  assert.ok(carried.expedition && carried.expedition !== later, 'the copy holds the record only');
  assert.ok(writeExtras(storage, carried, true));
  assert.equal(storage.values.get(EXPEDITION_STORAGE_KEY), later, 'the whole text stays');
  // A file imported on purpose, though, brings its own expedition in its place.
  assert.ok(writeExtras(storage, carried, false));
  assert.equal(storage.values.get(EXPEDITION_STORAGE_KEY), carried.expedition);
});

test('a whole restore writes a copy taken before a text went bad, and adds what the device lacks', async () => {
  const { writeExtras, collectExtras } = await import('../src/familyExtras.ts');
  const records = writeRecords([{ wave: 17, kings: 1, rules: 1, run: 9 }]);
  // A readable expedition is copied; then its text goes bad on the device (a damaged value,
  // an older tab, a rollback). Bringing the copy back puts the whole expedition back.
  const device = memory({
    [EXPEDITION_STORAGE_KEY]: JSON.stringify({ version: 1, best: 5, current: null }),
  });
  const copy = collectExtras(device);
  assert.ok(copy.expedition, 'the copy holds the expedition');
  device.values.set(EXPEDITION_STORAGE_KEY, '{damaged');
  assert.ok(writeExtras(device, copy, true));
  assert.equal(device.values.get(EXPEDITION_STORAGE_KEY), copy.expedition, 'written back');
  // The way back of a way back: what the device lacks, the copy brings (K05).
  const bare = memory();
  assert.ok(writeExtras(bare, { endless: records }, true));
  assert.equal(bare.values.get(ENDLESS_RECORDS_KEY), records);
});
