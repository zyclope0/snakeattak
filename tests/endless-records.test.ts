import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RECORDS_KEPT,
  addRecord,
  createRecordBook,
  readRecords,
  writeRecords,
} from '../src/endlessRecords.ts';
import { ENDLESS_RECORDS_KEY } from '../src/storageKeys.ts';
import { playerKey } from '../src/players.ts';

let runs = 0;
/** A game of its own: another departure seed each time unless `run` is given. */
const game = (wave: number, kings = Math.floor((wave - 1) / 12), run = ++runs) => ({
  wave,
  kings,
  rules: 1 as const,
  run,
});

test('les records gardent les cinq meilleures parties, la meilleure d’abord', () => {
  let records = readRecords(null);
  const best: boolean[] = [];
  for (const wave of [9, 30, 14, 30, 7, 41, 12]) {
    const added = addRecord(records, game(wave));
    records = added.records;
    best.push(added.best);
  }
  assert.deepEqual(
    records.map((r) => r.wave),
    [41, 30, 30, 14, 12],
  );
  assert.equal(records.length, RECORDS_KEPT);
  assert.deepEqual(best, [true, true, false, false, false, true, false]);
  assert.deepEqual(readRecords(writeRecords(records)), records);
});

test('un record douteux n’est pas lu', () => {
  const bad = (best: unknown) => readRecords(JSON.stringify({ version: 1, best }));
  assert.deepEqual(bad([{ wave: 40, kings: 1, rules: 1, run: 1 }]), [], 'wave beyond its kings');
  assert.deepEqual(bad([{ wave: 5, kings: 0, rules: 3, run: 1 }]), [], 'unknown rules');
  // The rules of version 2 are known: a game played by them keeps its line.
  assert.deepEqual(bad([{ wave: 5, kings: 0, rules: 2, run: 1 }]), [
    { wave: 5, kings: 0, rules: 2, run: 1 },
  ]);
  assert.deepEqual(bad([game(5, 0, 7), game(9, 0, 7)]), [], 'one line a game');
  assert.deepEqual(bad(Array(6).fill(game(5))), [], 'more than five');
  assert.deepEqual(readRecords('{'), []);
  // Stopping after the second king keeps wave 24 with two kings.
  assert.deepEqual(bad([{ wave: 24, kings: 2, rules: 1, run: 3 }]), [
    { wave: 24, kings: 2, rules: 1, run: 3 },
  ]);
});

test('chaque joueur a ses propres records sur l’appareil', () => {
  const device = new Map<string, string>();
  const storage = (id: 'p1' | 'p2') => ({
    getItem: (key: string) => device.get(playerKey(key, id)) ?? null,
    setItem: (key: string, value: string) => void device.set(playerKey(key, id), value),
  });
  assert.equal(createRecordBook(storage('p1')).add(game(20)), true);
  assert.equal(createRecordBook(storage('p2')).add(game(8)), true, 'p2 compares with p2 only');
  assert.deepEqual(
    createRecordBook(storage('p2'))
      .read()
      .map((r) => r.wave),
    [8],
  );
  assert.ok(device.has(`${ENDLESS_RECORDS_KEY}:p2`));
  // A blocked storage reads nothing and does not stop the game.
  const blocked = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
  assert.equal(createRecordBook(blocked).add(game(3)), true);
});

test('une même partie n’a qu’une ligne : elle monte, un essai de plus ne l’ajoute pas', () => {
  let { records } = addRecord([], game(12, 1, 99));
  ({ records } = addRecord(records, game(9, 0, 50)));
  // The same game (same seed) falls further on: its line climbs.
  let added = addRecord(records, game(19, 1, 99));
  assert.equal(added.best, true);
  records = added.records;
  // The same wave tried again and lost earlier: nothing changes.
  added = addRecord(records, game(15, 1, 99));
  assert.equal(added.records, records);
  assert.equal(added.best, false);
  assert.deepEqual(
    records.map((r) => [r.run, r.wave]),
    [
      [99, 19],
      [50, 9],
    ],
  );
  // For as many waves, more kings first: stopping after the king beats falling to him.
  const fell = game(12, 0, 7),
    beat = game(12, 1, 8);
  assert.deepEqual(addRecord([fell], beat).records[0], beat);
  assert.equal(addRecord([fell], beat).best, true);
});
