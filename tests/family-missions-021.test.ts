import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer } from '../src/progression.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createFamilyPersistence } from '../src/familyPersistence.ts';
import { FAMILY_STORAGE_KEY } from '../src/storageKeys.ts';

const progress = () => ({
  version: 1 as const,
  bestStars: { refuge: 2, 'trois-ponts': 0, course: 0, coquilles: 0, sonnette: 0, carrefour: 0 },
  lastRuns: {
    refuge: {
      missionId: 'refuge' as const,
      seed: 19,
      layout: 0 as const,
      assault: 'balanced' as const,
      nest: 'spread' as const,
    },
  },
  retryCamp: null,
  classicCamp: null,
  activeMode: 'missions' as const,
});

test('family v2 retains expedition progress while the two-argument export remains v1', () => {
  const career = createCareer().state;
  const legacy = readFamilyBackup(writeFamilyBackup(null, career)!)!;
  assert.equal(legacy.version, 1);
  assert.equal(Object.hasOwn(legacy, 'missions'), false);
  const raw = writeFamilyBackup(null, career, progress());
  assert.ok(raw);
  const backup = readFamilyBackup(raw)!;
  assert.equal(backup.version, 2);
  assert.deepEqual(backup.missions, progress());
});

test('invalid expedition input cannot be exported or silently demoted to a legacy envelope', () => {
  const career = createCareer().state;
  const invalid = progress();
  invalid.bestStars.refuge = 4;
  assert.equal(writeFamilyBackup(null, career, invalid), null);
  const raw = JSON.stringify({
    format: 'conquete-serpents-family',
    version: 2,
    camp: null,
    career,
    missions: invalid,
  });
  assert.equal(readFamilyBackup(raw), null);
  assert.equal(readFamilyBackup(JSON.stringify({ ...JSON.parse(raw), missions: undefined })), null);
});

test('family persistence atomically stores v2 and rejects invalid imports and quota failures', () => {
  const values = new Map<string, string>();
  let blocked = false;
  let writes = 0;
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, raw: string) {
      if (blocked) throw Error('quota');
      writes++;
      values.set(key, raw);
    },
  };
  const persistence = createFamilyPersistence(storage);
  const career = createCareer().state;
  assert.equal(persistence.sync(null, career, progress()), true);
  const old = values.get(FAMILY_STORAGE_KEY);
  assert.equal(persistence.sync(null, career, null as never), false);
  assert.equal(values.get(FAMILY_STORAGE_KEY), old);
  assert.equal(persistence.sync(null, career, progress()), true);
  assert.equal(writes, 1);
  assert.equal(JSON.parse(old!).version, 2);
  const invalid = JSON.parse(old!);
  invalid.missions.lastRuns.refuge.seed = Infinity;
  assert.equal(persistence.import(invalid), false);
  assert.equal(values.get(FAMILY_STORAGE_KEY), old);
  blocked = true;
  const next = JSON.parse(old!);
  next.missions.bestStars.refuge = 3;
  assert.equal(persistence.import(next), false);
  assert.equal(values.get(FAMILY_STORAGE_KEY), old);
  blocked = false;
  assert.equal(persistence.import(next), true);
  const loaded = createFamilyPersistence(storage).load()!;
  assert.equal(loaded.version, 2);
  assert.equal(loaded.missions!.bestStars.refuge, 3);
});

test('a legacy caller syncing a loaded v2 keeps its expeditions until an explicit v1 import', () => {
  let stored = writeFamilyBackup(null, createCareer().state, progress())!;
  const storage = {
    getItem: () => stored,
    setItem(_key: string, raw: string) {
      stored = raw;
    },
  };
  const persistence = createFamilyPersistence(storage);
  assert.equal(persistence.load()!.version, 2);
  assert.equal(persistence.sync(null, createCareer().state), true);
  assert.equal(JSON.parse(stored).version, 2);
  assert.deepEqual(JSON.parse(stored).missions, progress());
  const legacy = readFamilyBackup(writeFamilyBackup(null, createCareer().state)!)!;
  assert.equal(persistence.import(legacy), true);
  assert.equal(persistence.sync(null, createCareer().state), true);
  assert.equal(JSON.parse(stored).version, 1);
});
