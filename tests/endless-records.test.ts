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

const game = (wave: number, kings = Math.floor((wave - 1) / 12)) => ({
  wave,
  kings,
  rules: 1 as const,
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
  assert.deepEqual(bad([{ wave: 40, kings: 1, rules: 1 }]), [], 'wave beyond its kings');
  assert.deepEqual(bad([{ wave: 5, kings: 0, rules: 2 }]), [], 'unknown rules');
  assert.deepEqual(bad(Array(6).fill(game(5))), [], 'more than five');
  assert.deepEqual(readRecords('{'), []);
  // Stopping after the second king keeps wave 24 with two kings.
  assert.deepEqual(bad([{ wave: 24, kings: 2, rules: 1 }]), [{ wave: 24, kings: 2, rules: 1 }]);
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
