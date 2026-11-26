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
const { writeApples } = await import('../src/appleBook.ts');
const { importWritesApples, replacesNothing } = await import('../src/familyExtras.ts');
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
const apples = writeApples(['33:3', '2026:6']);
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
  // A text that IS JSON, one sign over the limit: refused for its length and nothing else.
  const long = (characters: number) => JSON.stringify('x'.repeat(characters - 2));
  refused((f) => (f.extras = { expedition: long(100_001) }), 'an extra too long');
  const atLimit = { ...structuredClone(file), extras: { expedition: long(100_000) } };
  assert.ok(readFamilyBackup(JSON.stringify(atLimit)), 'an extra at the limit is read');
  refused((f) => (f.extras = [expedition]), 'extras as a list');
  refused((f) => (f.version = 5), 'extras in a version 5 file');
  refused((f) => (f.version = 7), 'a version 7 file without apples');
  refused((f) => (f.version = 8), 'a version of the future');
  refused((f) => (f.extras = { expedition, apples }), 'apples in a version 6 file');
});

test('le fichier familial version 7 porte aussi les pommes trouvées', () => {
  const [camp, career, missions, albums] = adventure();
  const raw = writeFamilyBackup(camp, career, missions, albums, { endless, apples })!;
  const read = readFamilyBackup(raw)!;
  assert.equal(read.version, 7);
  assert.deepEqual(read.version === 7 && read.extras, { endless, apples });
  assert.equal(JSON.stringify(read), raw, 'read then written again: the same file');
  // The apples alone are enough; without them, the file stays the one it was before.
  assert.equal(
    readFamilyBackup(writeFamilyBackup(camp, career, missions, albums, { apples })!)!.version,
    7,
  );
  const six = writeFamilyBackup(camp, career, missions, albums, { endless })!;
  assert.equal(readFamilyBackup(six)!.version, 6);
  assert.deepEqual(
    { ...JSON.parse(raw), version: 6, extras: { endless } },
    JSON.parse(six),
    'the adventure of a version 7 file is that of the version 6 file',
  );
  assert.ok(readFamilyBackup(writeFamilyBackup(camp, career, missions, albums)!)!.version < 6);
  // They travel with the expeditions and the albums, as the other extras.
  assert.equal(writeFamilyBackup(camp, career, undefined, undefined, { apples }), null);
  // A version 7 file is accepted whole or not at all.
  const file = JSON.parse(raw);
  const refused = (change: (f: Record<string, unknown>) => void, why: string) => {
    const copy = structuredClone(file);
    change(copy);
    assert.equal(readFamilyBackup(JSON.stringify(copy)), null, why);
  };
  refused((f) => (f.extras = { endless }), 'version 7 without apples');
  refused((f) => (f.version = 6), 'apples in a version 6 file');
  refused((f) => (f.extras = { apples: 3 }), 'apples that are not a text');
  refused((f) => delete f.extras, 'version 7 without extras');
  // Their own reader decides: a damaged book is refused by the import.
  assert.equal(checkExtras({ apples: '{"version":1,"found":["33:4"]}' }), null);
  assert.equal(checkExtras({ apples: writeApples([]) }), null, 'an empty book carries nothing');
  assert.deepEqual(checkExtras({ apples }), { apples });
  // A file of a version 7 build without apples is a version 6 file: an older build reads it.
  const sixOnly = readFamilyBackup(six)!;
  assert.equal(importWritesApples(sixOnly, false), false, 'the apples of the device stay');
  assert.equal(importWritesApples(read, false), true);
  assert.equal(importWritesApples(sixOnly, true), true, 'a whole state takes them away');
  // The same adventure with the same apples replaces nothing; other apples do.
  assert.equal(replacesNothing(read, read, false), true);
  const others = readFamilyBackup(
    writeFamilyBackup(camp, career, missions, albums, {
      endless,
      apples: writeApples(['33:3']),
    })!,
  )!;
  assert.equal(replacesNothing(read, others, false), false);
});

test('les pommes de l’appareil partent dans le fichier et en reviennent', () => {
  const device = memory({ [KEYS.APPLES_STORAGE_KEY]: apples, [KEYS.ENDLESS_RECORDS_KEY]: endless });
  assert.deepEqual(collectExtras(device), { endless, apples });
  // An empty or damaged book carries nothing.
  assert.deepEqual(collectExtras(memory({ [KEYS.APPLES_STORAGE_KEY]: writeApples([]) })), {});
  assert.deepEqual(collectExtras(memory({ [KEYS.APPLES_STORAGE_KEY]: '{"version":9}' })), {});
  // An import writes them under their key; a whole restore without them takes them away.
  const other = memory();
  assert.ok(writeExtras(other, { apples }));
  assert.equal(other.values.get(KEYS.APPLES_STORAGE_KEY), apples);
  assert.ok(writeExtras(other, { endless }));
  assert.equal(other.values.get(KEYS.APPLES_STORAGE_KEY), apples, 'not in the file: kept');
  assert.ok(writeExtras(other, { endless }, true));
  assert.equal(other.values.has(KEYS.APPLES_STORAGE_KEY), false, 'a whole state without them');
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
  // The adventure could not be written afterwards: the way back, whole.
  assert.equal(done.undo(), true);
  assert.equal(device.values.has(KEYS.EXPEDITION_STORAGE_KEY), false);
  assert.equal(device.values.get(KEYS.ENDLESS_RECORDS_KEY), old);
  // The device refuses the second write: the first one is taken back.
  const full = memory({ [KEYS.ENDLESS_RECORDS_KEY]: old });
  full.room = 1;
  assert.equal(writeExtras(full, { expedition, endless }), null);
  full.room = Infinity;
  assert.deepEqual([...full.values], [[KEYS.ENDLESS_RECORDS_KEY, old]]);
  assert.equal(writeExtras.partial, false, 'the device is as it was');
  assert.equal(writeExtras(undefined, { endless }), null);
  // A device that dies along the way refuses the way back too: it says so.
  const dying = memory({ [KEYS.ENDLESS_RECORDS_KEY]: old });
  const kept = writeExtras(dying, { expedition, endless })!;
  dying.room = 0;
  assert.equal(kept.undo(), false, 'the old record could not be put back');
});

test('une expédition illisible ne part pas, son record si, comme le jeu le relit', () => {
  const damaged = expedition.replace('"seed":4242', '"seed":-1').replace('"best":0', '"best":7');
  const carried = collectExtras(memory({ [KEYS.EXPEDITION_STORAGE_KEY]: damaged }));
  assert.equal(carried.expedition, '{"version":1,"best":7,"current":null}');
  // In a file, the same damaged text is refused: a file is accepted whole or not at all.
  assert.equal(checkExtras({ expedition: damaged }), null);
});

test('la clé vivante ne garde jamais un fichier version 6', async () => {
  const { createFamilyPersistence } = await import('../src/familyPersistence.ts');
  const [camp, career, missions, albums] = adventure();
  const six = writeFamilyBackup(camp, career, missions, albums, { endless })!;
  const device = memory();
  assert.equal(createFamilyPersistence(device).import(readFamilyBackup(six)!), false);
  assert.equal(device.values.size, 0, 'nothing is written');
  // If one came there all the same, its text is put aside before the next save drops it.
  device.values.set(KEYS.FAMILY_STORAGE_KEY, six);
  const persistence = createFamilyPersistence(device);
  assert.ok(persistence.load());
  assert.equal(device.values.get(KEYS.FAMILY_REFUSED_KEY), six);
});
