import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCareer } from '../src/progression.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { readFamilyBackup, salvageFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCapriceAlbums } from '../src/capriceAlbums.ts';
import { FAMILY_PREVIOUS_KEY, FAMILY_REFUSED_KEY, FAMILY_STORAGE_KEY } from '../src/storageKeys.ts';
import * as TEXT from '../src/texts/fr/family.ts';

// A family file was all or nothing: one wrong number in its camp refused the missions and
// the sticker books with it (22 November 2026). A file one of whose camps does not decode is
// now kept without that camp, wherever it is written: on top, as the camp of the adventure or
// of the mission, as the camp of a chapter. The camp it starts from comes from the same file,
// never from elsewhere on the device.

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
  assert.equal(kept.camp, null, 'this file holds its camp in one place only: none is left');
  assert.deepEqual(kept.career.bestStars, [3, 2, 1]);
  assert.equal(kept.missions!.bestStars.refuge, 2);
  assert.equal(
    (kept as { albums: { children: { name: string }[] } }).albums.children[0]!.name,
    'Carnet bleu',
  );
  assert.equal(family.status, TEXT.tesEtoilesTesMissionsEtTesCarnetsSontBienLa);
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
  assert.equal(family.status, TEXT.tesEtoilesTesMissionsEtTesCarnetsSontBienLa);
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

// --- The same camp is written in several places. The cases below start from the device of a
// tester of build 63, frozen as it was (`tests/fixtures/appareil-build-63.json`): a classic
// adventure under way, whose camp is on top and in `missions.classicCamp`, and a mission to
// try again in `missions.retryCamp`.

const DEVICE = JSON.parse(readFileSync('tests/fixtures/appareil-build-63.json', 'utf8')).storage;
const frozen = (): Record<string, any> => JSON.parse(DEVICE[FAMILY_STORAGE_KEY]);
/** One wrong number in a camp: it no longer decodes. */
const dead = (camp: string) => JSON.stringify({ ...JSON.parse(camp), gold: -5 });
/** A camp of a version this build does not know. */
const unknown = (camp: string) => JSON.stringify({ ...JSON.parse(camp), version: 9999 });
const stars = (backup: { missions?: { bestStars: Record<string, number> } }) =>
  Object.values(backup.missions!.bestStars).reduce((a, b) => a + b, 0);
/** The same device in the middle of its mission: the mission's camp is on top. */
function inMission() {
  const parts = frozen();
  parts.camp = parts.missions.retryCamp;
  parts.missions.activeMode = 'missions';
  return parts;
}
const salvaged = (parts: Record<string, any>) => {
  const raw = JSON.stringify(parts);
  assert.equal(readFamilyBackup(raw), null, 'the strict reader refuses it');
  return salvageFamilyBackup(raw);
};
const mission = (camp: string | null) => !!(camp && decodeCheckpoint(camp)?.mission);

test('the frozen device is what the cases below say it is', () => {
  const parts = frozen();
  assert.ok(readFamilyBackup(JSON.stringify(parts)));
  assert.equal(parts.missions.activeMode, 'classic');
  assert.equal(parts.camp, parts.missions.classicCamp);
  assert.equal(parts.camp, DEVICE['conquete-serpents:camp:v1']);
  assert.equal(mission(parts.missions.retryCamp), true);
  assert.equal(stars(parts as never), 3);
  assert.ok(readFamilyBackup(JSON.stringify(inMission())), 'the same device, in its mission');
});

test('the camp on top alone does not decode: it is taken from the same file, nothing is lost', () => {
  const parts = frozen();
  const whole = readFamilyBackup(JSON.stringify(parts))!;
  parts.camp = dead(parts.camp);
  assert.deepEqual(salvaged(parts), whole);
  // In a mission: the mission's camp, and the game stays in its mission.
  const playing = inMission();
  const wholeMission = readFamilyBackup(JSON.stringify(playing))!;
  playing.camp = dead(playing.camp);
  assert.deepEqual(salvaged(playing), wholeMission);
});

test('the same camp dead wherever it is written: the stars and the sticker books stay', () => {
  for (const kill of [dead, unknown]) {
    const parts = frozen();
    parts.camp = parts.missions.classicCamp = kill(parts.camp);
    const kept = salvaged(parts)!;
    assert.ok(kept, 'the file is kept');
    assert.equal(stars(kept), 3, 'the stars of the missions');
    assert.equal((kept as never as { albums: { children: unknown[] } }).albums.children.length, 1);
    // No classic camp is left: the game starts without one, and stays a classic adventure.
    assert.equal(kept.camp, null);
    assert.equal(kept.missions!.activeMode, 'classic');
    assert.equal(kept.missions!.classicCamp, null);
    // The mission to try again is still where the missions offer it.
    assert.equal(mission(kept.missions!.retryCamp), true);
  }
});

test('in a mission whose camp is dead everywhere, the game goes back to its classic adventure', () => {
  const parts = inMission();
  parts.camp = parts.missions.retryCamp = dead(parts.camp);
  const kept = salvaged(parts)!;
  assert.equal(kept.missions!.activeMode, 'classic');
  assert.equal(kept.missions!.retryCamp, null);
  assert.equal(kept.camp, kept.missions!.classicCamp);
  assert.equal(mission(kept.camp), false);
  assert.equal(stars(kept), 3);
  // Both camps dead: nothing to start from, and the stars stay.
  const none = inMission();
  none.camp = none.missions.retryCamp = dead(none.camp);
  none.missions.classicCamp = dead(none.missions.classicCamp);
  const bare = salvaged(none)!;
  assert.equal(bare.camp, null);
  assert.equal(bare.missions!.classicCamp, null);
  assert.equal(bare.missions!.retryCamp, null);
  assert.equal(stars(bare), 3);
});

test('a camp dead in one place only, the one on top alive: the file is kept with the rest', () => {
  // The classic camp of the missions alone (before: the whole file was refused).
  const classic = frozen();
  classic.missions.classicCamp = dead(classic.missions.classicCamp);
  const first = salvaged(classic)!;
  assert.equal(
    first.camp,
    readFamilyBackup(DEVICE[FAMILY_STORAGE_KEY])!.camp,
    'the camp on top stays',
  );
  assert.equal(first.missions!.classicCamp, null);
  assert.equal(stars(first), 3);
  // The mission to try again alone.
  const retry = frozen();
  retry.missions.retryCamp = dead(retry.missions.retryCamp);
  const second = salvaged(retry)!;
  assert.equal(second.missions!.retryCamp, null);
  assert.ok(second.camp);
  // The camp of a chapter alone.
  const chapter = frozen();
  chapter.career.chapterCamps = ['{', null];
  const third = salvaged(chapter)!;
  assert.deepEqual(third.career.chapterCamps, [null, null]);
  assert.ok(third.camp);
  assert.equal(stars(third), 3);
});

test('a camp that decodes but breaks a rule of the file is still a refusal of the whole file', () => {
  // The mission's camp where the classic one belongs: it decodes, the file's rule refuses it.
  const swapped = frozen();
  swapped.missions.classicCamp = swapped.missions.retryCamp;
  assert.equal(salvaged(swapped), null);
  // A dead camp beside it changes nothing: what else is refused refuses the file.
  swapped.camp = dead(swapped.camp);
  assert.equal(salvaged(swapped), null);
  // Not a text at all.
  const number = frozen();
  number.missions.classicCamp = 12;
  assert.equal(salvaged(number), null);
});

test('a file with extras is never salvaged: the game does not store one', () => {
  const parts = frozen();
  parts.version = 6;
  parts.extras = { voyage: DEVICE['conquete-serpents:voyage:v1'] };
  assert.ok(readFamilyBackup(JSON.stringify(parts)), 'a version 6 file reads');
  parts.camp = parts.missions.classicCamp = dead(parts.camp);
  const raw = JSON.stringify(parts);
  const storage = memory({ [FAMILY_STORAGE_KEY]: raw });
  const family = createFamilyPersistence(storage);
  assert.equal(family.load(), null);
  assert.equal(family.salvaged, false);
  assert.equal(family.status, TEXT.sauvegardeFamilialeIncompatible);
  assert.equal(storage.values.get(FAMILY_REFUSED_KEY), raw);
  assert.equal(salvageFamilyBackup(raw), null);
});

test('one place for a text put aside: a file kept but for a camp never pushes out a whole refusal', () => {
  const lost = JSON.stringify({ ...frozen(), version: 99 });
  const hurt = frozen();
  hurt.camp = hurt.missions.classicCamp = dead(hurt.camp);
  const raw = JSON.stringify(hurt);
  // A text of which nothing reads may be a whole adventure: it stays.
  const held = memory({ [FAMILY_STORAGE_KEY]: raw, [FAMILY_REFUSED_KEY]: lost });
  assert.ok(createFamilyPersistence(held).load());
  assert.equal(held.values.get(FAMILY_REFUSED_KEY), lost);
  // A text that reads, or that was itself kept but for a camp, lives on in the save: replaced.
  for (const older of [DEVICE[FAMILY_STORAGE_KEY], JSON.stringify({ ...frozen(), camp: '{' })]) {
    const storage = memory({ [FAMILY_STORAGE_KEY]: raw, [FAMILY_REFUSED_KEY]: older });
    assert.ok(createFamilyPersistence(storage).load());
    assert.equal(storage.values.get(FAMILY_REFUSED_KEY), raw);
  }
  // A file refused whole takes the place, as before: the last one is kept.
  const again = memory({ [FAMILY_STORAGE_KEY]: lost, [FAMILY_REFUSED_KEY]: '{"version":98}' });
  assert.equal(createFamilyPersistence(again).load(), null);
  assert.equal(again.values.get(FAMILY_REFUSED_KEY), lost);
});

test('an import ends the sentence: it speaks of the adventure that was on the device', () => {
  const hurt = frozen();
  hurt.camp = hurt.missions.classicCamp = dead(hurt.camp);
  const storage = memory({ [FAMILY_STORAGE_KEY]: JSON.stringify(hurt) });
  const family = createFamilyPersistence(storage);
  const kept = family.load()!;
  assert.equal(family.sync(null, kept.career, kept.missions), true);
  assert.equal(family.status, TEXT.tesEtoilesTesMissionsEtTesCarnetsSontBienLa);
  // A parent brings a healthy file back: nothing is left to say about a camp.
  assert.equal(family.import(readFamilyBackup(DEVICE[FAMILY_STORAGE_KEY])!), true);
  assert.equal(family.salvaged, false);
  assert.equal(family.status, TEXT.aventureFamilialeEnregistreeSurCet);
  // And the saves that follow do not bring the sentence back.
  const now = readFamilyBackup(storage.values.get(FAMILY_STORAGE_KEY)!)!;
  assert.equal(family.sync(null, now.career, now.missions), true);
  assert.equal(family.status, TEXT.aventureFamilialeEnregistreeSurCet);
});

test('a file from before the missions is kept too: its stars, without the camp that died', () => {
  const career = createCareer().state;
  career.bestStars = [3, 2, 0];
  const game = new Game(4);
  const old = JSON.parse(writeFamilyBackup(encodeCheckpoint(game), career)!);
  assert.equal(old.version, 1);
  assert.equal(Object.hasOwn(old, 'missions'), false);
  // The camp on top.
  const top = salvageFamilyBackup(JSON.stringify({ ...old, camp: dead(old.camp) }))!;
  assert.deepEqual(top.career.bestStars, [3, 2, 0]);
  assert.equal(top.camp, null);
  assert.equal(top.version, 1);
  // The camp of a chapter, the first and the second: the stars stay, the camp on top too.
  for (const slot of [0, 1]) {
    const camps = [null, null] as (string | null)[];
    camps[slot] = '{';
    const chapter = salvageFamilyBackup(
      JSON.stringify({ ...old, career: { ...old.career, chapterCamps: camps } }),
    )!;
    assert.deepEqual(chapter.career.bestStars, [3, 2, 0], `chapter camp ${slot}`);
    assert.deepEqual(chapter.career.chapterCamps, [null, null]);
    assert.equal(chapter.camp, readFamilyBackup(JSON.stringify(old))!.camp);
  }
  // The second chapter camp of a recent file as well.
  const recent = frozen();
  recent.career.chapterCamps = [null, '{'];
  assert.deepEqual(salvaged(recent)!.career.chapterCamps, [null, null]);
});

test('what still reads is left where it is: nothing is moved that did not have to be', () => {
  // In a mission, its camp on top alive and the copy of it in the missions dead: the game
  // stays in its mission, on that camp.
  const playing = inMission();
  const top = readFamilyBackup(JSON.stringify(playing))!.camp;
  playing.missions.retryCamp = dead(playing.missions.retryCamp);
  const kept = salvaged(playing)!;
  assert.equal(kept.camp, top);
  assert.equal(kept.missions!.activeMode, 'missions');
  assert.equal(kept.missions!.retryCamp, null);
  // A file with no camp on top is not given one because another camp was set aside.
  const none = frozen();
  none.camp = null;
  none.missions.retryCamp = dead(none.missions.retryCamp);
  const bare = salvaged(none)!;
  assert.equal(bare.camp, null);
  assert.ok(bare.missions!.classicCamp, 'the classic camp stays where the missions keep it');
});

test('the list of players shows the stars the game will keep', async () => {
  const { playerStars } = await import('../src/players.ts');
  const hurt = frozen();
  hurt.camp = hurt.missions.classicCamp = dead(hurt.camp);
  const device = (raw: string) => ({
    getItem: (key: string) => (key === FAMILY_STORAGE_KEY ? raw : null),
  });
  assert.equal(playerStars(device(DEVICE[FAMILY_STORAGE_KEY]), 'p1'), 3);
  assert.equal(playerStars(device(JSON.stringify(hurt)), 'p1'), 3, 'a camp that died');
  assert.equal(playerStars(device(JSON.stringify({ ...frozen(), version: 99 })), 'p1'), 0);
});

test('a file with extras refused whole and put aside is not pushed out by a later salvage', () => {
  const six = frozen();
  six.version = 6;
  six.extras = { voyage: DEVICE['conquete-serpents:voyage:v1'] };
  six.camp = six.missions.classicCamp = dead(six.camp);
  const held = JSON.stringify(six);
  const hurt = frozen();
  hurt.camp = dead(hurt.camp);
  const storage = memory({
    [FAMILY_STORAGE_KEY]: JSON.stringify(hurt),
    [FAMILY_REFUSED_KEY]: held,
  });
  assert.ok(createFamilyPersistence(storage).load());
  assert.equal(storage.values.get(FAMILY_REFUSED_KEY), held);
});
