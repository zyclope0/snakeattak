import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { readFamilyBackup, salvageFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCapriceAlbums } from '../src/capriceAlbums.ts';
import { FAMILY_PREVIOUS_KEY, FAMILY_REFUSED_KEY, FAMILY_STORAGE_KEY } from '../src/storageKeys.ts';
import * as TEXT from '../src/texts/fr/family.ts';

// A family file was all or nothing: one wrong number in its camp refused the missions and
// the sticker books with it (22 November 2026). The camp has its own key on the device: a
// file whose camp does not read is now kept without it.

function memory(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}
/** A family file with stars, a mission won and a named sticker book. */
function file(): string {
  const career = createCareer().state;
  career.bestStars = [3, 2, 1];
  const missions = createMissionProgress();
  missions.bestStars.refuge = 2;
  const albums = createCapriceAlbums();
  albums.children[0]!.name = 'Carnet bleu';
  const game = new Game(4);
  game.gold = 321;
  return writeFamilyBackup(encodeCheckpoint(game), career, missions, albums)!;
}
/** The same file, one part changed after it was written. */
function damaged(change: (parts: Record<string, any>) => void): string {
  const parts = JSON.parse(file());
  change(parts);
  return JSON.stringify(parts);
}
/** One wrong number in the camp: coins below zero. */
const wrongCamp = () =>
  damaged((parts) => {
    parts.camp = JSON.stringify({ ...JSON.parse(parts.camp), gold: -5 });
  });

test('a file whose camp does not read keeps its stars, its missions and its sticker books', () => {
  const raw = wrongCamp();
  assert.equal(readFamilyBackup(raw), null, 'the strict reader still refuses it: no import');
  const storage = memory({ [FAMILY_STORAGE_KEY]: raw });
  const family = createFamilyPersistence(storage);
  const kept = family.load()!;
  assert.ok(kept, 'the rest of the file is read');
  assert.equal(family.salvaged, true);
  assert.equal(kept.camp, null, 'the camp is left to its own key');
  assert.deepEqual(kept.career.bestStars, [3, 2, 1]);
  assert.equal(kept.missions!.bestStars.refuge, 2);
  assert.equal(
    (kept as { albums: { children: { name: string }[] } }).albums.children[0]!.name,
    'Carnet bleu',
  );
  assert.equal(family.status, TEXT.leCampDeLaSauvegardeNAPasPuEtreLu);
  // The file as it was found is put aside, never destroyed, and can be exported.
  assert.equal(storage.values.get(FAMILY_REFUSED_KEY), raw);
  assert.equal(family.refused(), raw);
  // The next save replaces the damaged file by one that reads, with the same stars.
  assert.equal(family.sync(null, kept.career, kept.missions), true);
  const next = readFamilyBackup(storage.values.get(FAMILY_STORAGE_KEY)!)!;
  assert.deepEqual(next.career.bestStars, [3, 2, 1]);
  assert.equal(next.missions!.bestStars.refuge, 2);
  assert.equal(storage.values.get(FAMILY_REFUSED_KEY), raw);
  // The session goes on saying it, also after its saves: the first one comes at once.
  assert.equal(family.status, TEXT.leCampDeLaSauvegardeNAPasPuEtreLu);
  // A damaged file is not a save from before: it never becomes the second generation.
  assert.equal(storage.values.has(FAMILY_PREVIOUS_KEY), false);
});

test('anything else refused in the file still refuses it whole', () => {
  for (const [name, raw] of [
    ['a career out of range', damaged((p) => (p.career.bestStars = [9, 0, 0]))],
    ['a camp and a career', damaged((p) => ((p.camp = '{'), (p.career.bestStars = [9, 0, 0])))],
    ['missions that do not read', damaged((p) => (p.missions.bestStars.refuge = 7))],
    ['another format', damaged((p) => (p.format = 'other'))],
    ['a version to come', damaged((p) => (p.version = 99))],
    ['not a file', '{'],
  ] as const) {
    const storage = memory({ [FAMILY_STORAGE_KEY]: raw });
    const family = createFamilyPersistence(storage);
    assert.equal(family.load(), null, name);
    assert.equal(family.salvaged, false, name);
    assert.equal(family.status, TEXT.sauvegardeFamilialeIncompatible, name);
    assert.equal(storage.values.get(FAMILY_REFUSED_KEY), raw, `${name}: put aside as before`);
  }
});

test('a file that reads is never touched by the salvage', () => {
  const raw = file();
  const storage = memory({ [FAMILY_STORAGE_KEY]: raw });
  const family = createFamilyPersistence(storage);
  const loaded = family.load()!;
  assert.equal(family.salvaged, false);
  assert.ok(loaded.camp, 'its camp is read as before');
  assert.equal(storage.values.has(FAMILY_REFUSED_KEY), false);
  // A later load of a good file forgets an earlier salvage.
  storage.values.set(FAMILY_STORAGE_KEY, wrongCamp());
  assert.ok(family.load());
  assert.equal(family.salvaged, true);
  storage.values.set(FAMILY_STORAGE_KEY, raw);
  assert.ok(family.load());
  assert.equal(family.salvaged, false);
});

test('the salvage itself: the same file without its camp, or nothing', () => {
  const whole = readFamilyBackup(file())!;
  assert.deepEqual(salvageFamilyBackup(wrongCamp()), { ...whole, camp: null });
  // A file with no camp has nothing to set aside: the salvage adds no second chance.
  assert.equal(salvageFamilyBackup(damaged((p) => ((p.camp = null), (p.version = 99)))), null);
  assert.equal(salvageFamilyBackup(damaged((p) => (p.camp = 12))), null);
  assert.equal(salvageFamilyBackup('{'), null);
  assert.equal(salvageFamilyBackup('x'.repeat(600_000)), null);
  assert.equal(salvageFamilyBackup(undefined as never), null);
});
