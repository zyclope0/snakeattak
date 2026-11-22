import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createPersistence, decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { PLAYER_KEYS, clearPlayerData, playerKey } from '../src/players.ts';
import { writeExtras } from '../src/familyExtras.ts';
import { ENTITY_ID_LIMIT } from '../src/gameConstants.ts';
import * as CAMP from '../src/texts/fr/saves.ts';

// What the stores do when the device says no. Each test here was written for a defect that
// passed every other test on 22 November 2026 (docs/analyse-2026-11-22/D-audit.md, 2.2).
// Left out on purpose: a career longer than its limit (src/progression.ts, `persist`). Its two
// chapter camps are written again in the current format when they are read, so no career that
// reads can be that long: the branch is a guard nothing reaches.

test('a camp that could not be read is never written over in the session', () => {
  let writes = 0;
  const storage = {
    getItem(): string | null {
      throw Error('blocked');
    },
    setItem() {
      writes++;
    },
  };
  const persistence = createPersistence(storage);
  assert.equal(persistence.load(), null);
  assert.equal(persistence.status, CAMP.sauvegardeLocaleIndisponible);
  const game = new Game(5);
  for (let i = 0; i < 3; i++) {
    game.gold += 10;
    persistence.sync(game);
  }
  assert.equal(writes, 0, 'what the device holds may be a camp: it stays');
  assert.equal(persistence.status, CAMP.sauvegardeLocaleIndisponible);
});

test('deleting a player says yes only when every one of its keys is gone', () => {
  const stored = new Map<string, string>();
  for (const key of PLAYER_KEYS) stored.set(playerKey(key, 'p2'), 'x');
  const stubborn = playerKey(PLAYER_KEYS.at(-1)!, 'p2');
  const device = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => void stored.set(key, value),
    removeItem: (key: string) => void (key === stubborn ? null : stored.delete(key)),
  };
  assert.equal(clearPlayerData(device, 'p2'), false, 'one key stayed');
  assert.equal(stored.size, 1);
  stored.delete(stubborn);
  assert.equal(clearPlayerData(device, 'p2'), true);
});

test('a saved camp whose counter of fighters is out of bounds is refused', () => {
  const save = JSON.parse(encodeCheckpoint(new Game(5))!);
  assert.ok(decodeCheckpoint(JSON.stringify({ ...save, nextId: ENTITY_ID_LIMIT })));
  for (const nextId of [ENTITY_ID_LIMIT + 1, -1, 1.5, '7'])
    assert.equal(decodeCheckpoint(JSON.stringify({ ...save, nextId })), null, String(nextId));
});

test('an import the device refused half-way says whether the way back was whole', () => {
  const extras = { expedition: 'E', voyage: 'V', endless: 'R' };
  const keys: string[] = [];
  const make = (undoWorks: boolean) => {
    const stored = new Map<string, string>([['other', 'kept']]);
    let refused = false;
    return {
      stored,
      getItem: (key: string) => stored.get(key) ?? null,
      setItem(key: string, value: string) {
        if (!keys.includes(key)) keys.push(key);
        // The second key written is refused; after that the device refuses, or not, the undo.
        if (key === keys[1] && !refused) {
          refused = true;
          throw Error('quota');
        }
        if (refused && !undoWorks) throw Error('quota');
        stored.set(key, value);
      },
      removeItem(key: string) {
        if (refused && !undoWorks) throw Error('quota');
        stored.delete(key);
      },
    };
  };
  const mended = make(true);
  assert.equal(writeExtras(mended, extras), null);
  assert.equal(writeExtras.partial, false, 'the first key was taken back');
  assert.deepEqual([...mended.stored], [['other', 'kept']]);
  const stuck = make(false);
  assert.equal(writeExtras(stuck, extras), null);
  assert.equal(writeExtras.partial, true, 'the device kept a part of the file');
  assert.equal(stuck.stored.get(keys[0]!), 'E');
});
