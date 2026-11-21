import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import type { CareerState } from '../src/progression.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { Game } from '../src/game.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { FAMILY_STORAGE_KEY } from '../src/storageKeys.ts';
import { seededStream } from '../src/seededRandom.ts';
import * as TEXT from '../src/texts/fr/family.ts';

// The board asks for a save several times a second. Asked the same thing again, the family
// file is no longer built: these tests hold that nothing a player keeps depends on it.

function memory() {
  const values = new Map<string, string>();
  let blocked = false;
  let writes = 0;
  return {
    values,
    get writes() {
      return writes;
    },
    get blocked() {
      return blocked;
    },
    set blocked(value: boolean) {
      blocked = value;
    },
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (blocked) throw Error('quota');
      writes++;
      values.set(key, value);
    },
  };
}
function camp(seed: number, gold?: number): string {
  const game = new Game(seed);
  if (gold !== undefined) game.gold = gold;
  return encodeCheckpoint(game)!;
}
function career(change?: (state: CareerState) => void): CareerState {
  const state = createCareer().state;
  change?.(state);
  return state;
}

test('asked the same again, a sync builds nothing, writes nothing and answers the same', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  const saved = camp(1);
  const state = career();
  assert.equal(family.sync(saved, state), true);
  const status = family.status;
  const kept = storage.values.get(FAMILY_STORAGE_KEY);
  for (let i = 0; i < 50; i++) assert.equal(family.sync(saved, career()), true);
  assert.equal(storage.writes, 1);
  assert.equal(storage.values.get(FAMILY_STORAGE_KEY), kept);
  assert.equal(family.status, status);
});

test('the same object changed between two syncs is a new asking', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  const state = career();
  assert.equal(family.sync(null, state), true);
  state.bestStars = [3, 2, 0];
  assert.equal(family.sync(null, state), true);
  assert.equal(storage.writes, 2);
  assert.deepEqual(createFamilyPersistence(storage).load()!.career.bestStars, [3, 2, 0]);
});

test('a refused write is tried again by the very same asking', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  const state = career();
  assert.equal(family.sync(camp(1), state), true);
  storage.blocked = true;
  assert.equal(family.sync(camp(1, 123), state), false);
  assert.equal(family.sync(camp(1, 123), state), false);
  storage.blocked = false;
  assert.equal(family.sync(camp(1, 123), state), true);
  assert.equal(storage.writes, 2);
  assert.equal(readFamilyBackup(storage.values.get(FAMILY_STORAGE_KEY)!)!.camp, camp(1, 123));
});

test('an import or a read between two same askings is not forgotten', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  const state = career();
  assert.equal(family.sync(camp(1), state), true);
  const other = readFamilyBackup(
    writeFamilyBackup(
      null,
      career((s) => (s.bestStars = [1, 0, 0])),
    )!,
  )!;
  assert.equal(family.import(other), true);
  // The game on screen is asked again: it takes the file back, as it did before.
  assert.equal(family.sync(camp(1), state), true);
  assert.equal(storage.writes, 3);
  assert.equal(readFamilyBackup(storage.values.get(FAMILY_STORAGE_KEY)!)!.camp, camp(1));
  // Another tab wrote the file, and this one reads it: the same asking writes again.
  storage.values.set(FAMILY_STORAGE_KEY, JSON.stringify(other));
  assert.ok(family.load());
  assert.equal(family.sync(camp(1), state), true);
  assert.equal(storage.writes, 4);
});

test('what JSON would blur is never taken for the asking it looks like', () => {
  const storage = memory();
  const family = createFamilyPersistence(storage);
  assert.equal(family.sync(null, career()), true);
  for (const wrong of [NaN, Infinity, undefined]) {
    const twin = career((s) => ((s.chapterCamps as unknown[])[0] = wrong));
    assert.equal(family.sync(null, twin), false, String(wrong));
    assert.equal(family.status, TEXT.sauvegardeFamilialeInvalideAucune);
    assert.equal(family.sync(null, career()), true);
  }
  const holed = career();
  delete (holed.chapterCamps as unknown[])[1];
  assert.equal(family.sync(null, holed), false);
  assert.equal(storage.writes, 1);
});

test('a long run of askings stores what a file built each time would store', () => {
  const next = seededStream(20261121);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)]!;
  const camps = [null, camp(1), camp(1, 123), camp(2)];
  const careers = [
    () => career(),
    () => career((s) => (s.bestStars = [3, 2, 0])),
    () => career((s) => (s.activeRoster = 1)),
    () => career((s) => ((s.chapterCamps as unknown[])[0] = NaN)),
  ];
  const missions = [undefined, createMissionProgressController().state];
  const albums = [undefined, createCapriceAlbumsController().state];
  const imports = [
    readFamilyBackup(writeFamilyBackup(null, careers[1]!())!)!,
    readFamilyBackup(writeFamilyBackup(camp(2), careers[0]!(), missions[1], albums[1])!)!,
  ];
  const storage = memory();
  const family = createFamilyPersistence(storage);
  // What the family file remembers when an asking leaves expeditions or albums out.
  let heldMissions: (typeof missions)[number], heldAlbums: (typeof albums)[number];
  let status = family.status;
  let same = 0;
  let last = [pick(camps), pick(careers)(), pick(missions), pick(albums)] as const;
  for (let step = 0; step < 600; step++) {
    const roll = next();
    const before = storage.writes;
    if (roll < 0.08) storage.blocked = !storage.blocked;
    else if (roll < 0.14) {
      const file = pick(imports);
      assert.equal(family.import(file), !storage.blocked, `import ${step}`);
      assert.equal(storage.writes, before + (storage.blocked ? 0 : 1));
      if (!storage.blocked) [heldMissions, heldAlbums] = [file.missions, file.albums];
      status = family.status;
    } else if (roll < 0.18) {
      const file = family.load();
      assert.equal(storage.writes, before);
      if (file) [heldMissions, heldAlbums] = [file.missions, file.albums];
      status = family.status;
    } else {
      // Most askings repeat the one before, as the board does during a fight.
      if (roll > 0.6) last = [pick(camps), pick(careers)(), pick(missions), pick(albums)];
      const [raw, state, expeditions, stickers] = last;
      const built = writeFamilyBackup(
        raw,
        state,
        expeditions ?? heldMissions,
        stickers ?? heldAlbums,
      );
      const stored = storage.values.get(FAMILY_STORAGE_KEY);
      const answer = family.sync(raw, state, expeditions, stickers);
      if (!built) {
        assert.equal(answer, false, `invalid ${step}`);
        assert.equal(storage.writes, before);
        status = TEXT.sauvegardeFamilialeInvalideAucune;
      } else if (built === stored) {
        assert.equal(answer, true, `same ${step}`);
        assert.equal(storage.writes, before);
        same++;
      } else if (storage.blocked) {
        assert.equal(answer, false, `refused ${step}`);
        assert.equal(storage.writes, before);
        status = TEXT.sauvegardeFamilialeIndisponible;
      } else {
        assert.equal(answer, true, `written ${step}`);
        assert.equal(storage.writes, before + 1);
        assert.equal(storage.values.get(FAMILY_STORAGE_KEY), built);
        [heldMissions, heldAlbums] = [expeditions ?? heldMissions, stickers ?? heldAlbums];
        status = TEXT.aventureFamilialeEnregistreeSurCet;
      }
      assert.equal(family.status, status, `status ${step}`);
    }
  }
  // The run really repeats itself: the case this change is about is covered.
  assert.ok(same > 60, `${same} same askings`);
});
