import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp') || url.includes('.mp3'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});
const { readFamilyBackup, writeFamilyBackup } = await import('../src/familyBackup.ts');
const { collectExtras, checkExtras, writeExtras } = await import('../src/familyExtras.ts');
const { createCareer } = await import('../src/progression.ts');
const { createMissionProgress } = await import('../src/missionProgress.ts');
const { createCapriceAlbums } = await import('../src/capriceAlbums.ts');
const { encodeCheckpoint } = await import('../src/checkpoints.ts');
const { Game } = await import('../src/game.ts');
const X = await import('../src/expedition.ts');
const { createExpeditionLog, logExpedition } = await import('../src/expeditionStorage.ts');
const { writeRecords } = await import('../src/endlessRecords.ts');
const KEYS = await import('../src/storageKeys.ts');

function memory(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  let refuseAfter = Infinity;
  return {
    values,
    /** The device takes this many writes more, then refuses. */
    set room(count: number) {
      refuseAfter = count;
    },
    getItem: (key: string) => values.get(key) ?? null,
    setItem(key: string, value: string) {
      if (refuseAfter-- <= 0) throw Error('quota');
      values.set(key, value);
    },
    removeItem: (key: string) => void values.delete(key),
  };
}
const expedition = JSON.stringify(logExpedition(createExpeditionLog(), X.startExpedition(4242)!));
const voyage = JSON.stringify({
  version: 1,
  best: 1,
  current: { version: 2, seed: 751673, won: 1, bag: ['cristal'], status: 'travelling' },
});
const endless = writeRecords([{ wave: 17, kings: 1, rules: 1, run: 9 }]);
const adventure = () =>
  [
    encodeCheckpoint(new Game(1)),
    createCareer().state,
    createMissionProgress(),
    createCapriceAlbums(),
  ] as const;

test('le fichier familial version 6 porte l’expédition, le voyage et les records', () => {
  const [camp, career, missions, albums] = adventure();
  const plain = writeFamilyBackup(camp, career, missions, albums)!;
  // Nothing beside the adventure: the file is the one written before, to the byte.
  assert.equal(writeFamilyBackup(camp, career, missions, albums, {}), plain);
  assert.ok(readFamilyBackup(plain)!.version < 6);
  const raw = writeFamilyBackup(camp, career, missions, albums, { expedition, voyage, endless })!;
  const read = readFamilyBackup(raw)!;
  assert.equal(read.version, 6);
  assert.deepEqual(read.version === 6 && read.extras, { expedition, voyage, endless });
  assert.equal(JSON.stringify(read), raw, 'read then written again: the same file');
  // The adventure of a version 6 file is exactly the adventure of the plain file.
  const { extras: _, ...rest } = JSON.parse(raw);
  assert.deepEqual({ ...rest, version: JSON.parse(plain).version }, JSON.parse(plain));
  // One of the three is enough.
  assert.equal(
    readFamilyBackup(writeFamilyBackup(camp, career, missions, albums, { endless })!)!.version,
    6,
  );
  // The extras only travel with the expeditions and the albums.
  assert.equal(writeFamilyBackup(camp, career, undefined, undefined, { endless }), null);
});

test('un fichier version 6 abîmé est refusé en entier', () => {
  const [camp, career, missions, albums] = adventure();
  const file = JSON.parse(writeFamilyBackup(camp, career, missions, albums, { expedition })!);
  const refused = (change: (f: Record<string, unknown>) => void, why: string) => {
    const copy = structuredClone(file);
    change(copy);
    assert.equal(readFamilyBackup(JSON.stringify(copy)), null, why);
  };
  refused((f) => (f.extras = {}), 'no extra at all');
  refused((f) => delete f.extras, 'version 6 without extras');
  refused((f) => (f.extras = { expedition, autre: '{}' }), 'an unknown extra');
  refused((f) => (f.extras = { expedition: 12 }), 'an extra that is not a text');
  refused((f) => (f.extras = { expedition: '{' }), 'an extra that is not JSON');
  refused((f) => (f.extras = { expedition: 'x'.repeat(100_001) }), 'an extra too long');
  refused((f) => (f.extras = [expedition]), 'extras as a list');
  refused((f) => (f.version = 5), 'extras in a version 5 file');
  refused((f) => (f.version = 7), 'a version of the future');
});

test('les extras de l’appareil : seul ce qui se relit part dans le fichier', () => {
  const device = memory({
    [KEYS.EXPEDITION_STORAGE_KEY]: expedition,
    [KEYS.VOYAGE_STORAGE_KEY]: voyage,
    [KEYS.ENDLESS_RECORDS_KEY]: endless,
  });
  assert.deepEqual(collectExtras(device), { expedition, voyage, endless });
  assert.deepEqual(checkExtras({ expedition, voyage, endless }), { expedition, voyage, endless });
  // Nothing set out, nothing recorded, damaged: nothing to carry.
  assert.deepEqual(collectExtras(memory()), {});
  assert.deepEqual(
    collectExtras(
      memory({
        [KEYS.EXPEDITION_STORAGE_KEY]: JSON.stringify(createExpeditionLog()),
        [KEYS.VOYAGE_STORAGE_KEY]: '{"version":1,"best":0,"current":null}',
        [KEYS.ENDLESS_RECORDS_KEY]: '{"version":1,"best":[{"wave":0}]}',
      }),
    ),
    {},
  );
  assert.deepEqual(
    collectExtras({
      getItem: () => {
        throw Error('blocked');
      },
    }),
    {},
  );
  // A file is accepted whole or not at all.
  const tampered = expedition.replace('"seed":4242', '"seed":-1');
  assert.notEqual(tampered, expedition);
  assert.equal(checkExtras({ expedition: tampered, endless }), null);
  assert.equal(checkExtras({ endless: '{"version":1,"best":[]}' }), null, 'an empty extra');
  assert.equal(checkExtras({}), null);
});

test('écrire les extras : ce que le fichier ne porte pas reste, un refus remet tout comme avant', () => {
  const old = writeRecords([{ wave: 5, kings: 0, rules: 1, run: 3 }]);
  const device = memory({ [KEYS.ENDLESS_RECORDS_KEY]: old, [KEYS.VOYAGE_STORAGE_KEY]: voyage });
  const done = writeExtras(device, { expedition, endless });
  assert.ok(done);
  assert.equal(device.values.get(KEYS.EXPEDITION_STORAGE_KEY), expedition);
  assert.equal(device.values.get(KEYS.ENDLESS_RECORDS_KEY), endless);
  assert.equal(
    device.values.get(KEYS.VOYAGE_STORAGE_KEY),
    voyage,
    'not in the file: left as it is',
  );
  // The adventure could not be written afterwards: the way back.
  done.undo();
  assert.equal(device.values.has(KEYS.EXPEDITION_STORAGE_KEY), false);
  assert.equal(device.values.get(KEYS.ENDLESS_RECORDS_KEY), old);
  // The device refuses the second write: the first one is taken back.
  const full = memory({ [KEYS.ENDLESS_RECORDS_KEY]: old });
  full.room = 1;
  assert.equal(writeExtras(full, { expedition, endless }), null);
  full.room = Infinity;
  assert.deepEqual([...full.values], [[KEYS.ENDLESS_RECORDS_KEY, old]]);
  assert.equal(writeExtras(undefined, { endless }), null);
});
