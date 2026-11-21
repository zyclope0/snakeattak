// Sauvegarde familiale sur le paquet Android : export, restauration sur un appareil vide,
// et imports invalides qui ne doivent rien changer, à l'octet près.
//   node --experimental-strip-types scripts/hygiene/family-backup.mjs <stockage.json> [dossier]
// `stockage.json` est ce qu'un appareil garde (par exemple artifacts/hygiene/storage-63.json).
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { open, start, snapshot } from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';

const [storageFile, dir = 'dist-android'] = process.argv.slice(2);
assert.ok(storageFile, 'a storage file');
const device = JSON.parse(await readFile(storageFile, 'utf8'));
// The first player also has an expedition under way and a record of the endless adventure.
const X = await import('../../src/expedition.ts');
const { createExpeditionLog, logExpedition } = await import('../../src/expeditionStorage.ts');
const { writeRecords } = await import('../../src/endlessRecords.ts');
const KEYS = await import('../../src/storageKeys.ts');
device[KEYS.EXPEDITION_STORAGE_KEY] = JSON.stringify(
  logExpedition(createExpeditionLog(), X.startExpedition(4242)),
);
device[KEYS.ENDLESS_RECORDS_KEY] = writeRecords([{ wave: 17, kings: 1, rules: 1, run: 9 }]);
const EXTRA_KEYS = [KEYS.EXPEDITION_STORAGE_KEY, KEYS.VOYAGE_STORAGE_KEY, KEYS.ENDLESS_RECORDS_KEY];
await mkdir('artifacts/hygiene', { recursive: true });
const checks = [];

async function dialog(page) {
  await showHomePage(page, 'parents');
  await page.locator('#home-family').click();
  await page.locator('#family-dialog').waitFor({ state: 'visible' });
}
const give = (page, raw, name = 'notre-aventure.json') =>
  page.locator('#family-file').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.isBuffer(raw) ? raw : Buffer.from(raw),
  });

// 1. Export from the device as it is.
let exported;
{
  const { browser, page, report } = await open({ dir, storage: device });
  try {
    await start(page);
    const atStart = await snapshot(page);
    await dialog(page);
    const download = page.waitForEvent('download');
    await page.locator('#family-export').click();
    exported = await readFile(await (await download).path(), 'utf8');
    assert.deepEqual(await snapshot(page), atStart, 'exporting changes nothing on the device');
    const file = JSON.parse(exported);
    assert.equal(file.version, 6, 'the file carries what the player keeps beside the adventure');
    assert.deepEqual(Object.keys(file.extras).sort(), ['endless', 'expedition', 'voyage']);
    checks.push(
      `export: version ${file.version}, fields ${Object.keys(file).join(' ')}, extras ${Object.keys(file.extras).join(' ')}`,
    );

    // 2. Invalid files: each one is refused and the device keeps every byte.
    const valid = JSON.parse(exported);
    const invalid = {
      'empty file': '',
      'truncated JSON': exported.slice(0, Math.floor(exported.length / 2)),
      'not JSON': 'bonjour',
      'another game': JSON.stringify({ format: 'autre-jeu', version: 1, save: {} }),
      'future version': JSON.stringify({ ...valid, version: 99 }),
      'career out of range': JSON.stringify({
        ...valid,
        career: { ...valid.career, bestStars: [9, 0, 0] },
      }),
      'camp is not a save': JSON.stringify({ ...valid, camp: '{"version":7,"gold":1e99}' }),
      array: '[]',
      null: 'null',
      'too large': JSON.stringify({ ...valid, padding: 'x'.repeat(1_200_000) }),
      'damaged expedition': JSON.stringify({
        ...valid,
        extras: {
          ...valid.extras,
          expedition: valid.extras.expedition.replace('"seed":4242', '"seed":-1'),
        },
      }),
      'unknown extra': JSON.stringify({ ...valid, extras: { ...valid.extras, autre: '{}' } }),
      binary: Buffer.from([0xff, 0xfe, 0x00, 0x01, 0x02]),
    };
    for (const [name, raw] of Object.entries(invalid)) {
      await give(page, raw);
      await page.waitForFunction(
        () => document.getElementById('family-status').textContent.trim().length > 0,
      );
      const applyOff =
        (await page.locator('#family-apply').isHidden()) ||
        (await page.locator('#family-apply').isDisabled());
      assert.ok(applyOff, `${name}: nothing to apply`);
      assert.deepEqual(await snapshot(page), atStart, `${name}: the device keeps every byte`);
    }
    await page.screenshot({ path: 'artifacts/hygiene/family-invalide.png' });
    assert.deepEqual(report.errors, []);
    checks.push(`invalid imports refused, device unchanged: ${Object.keys(invalid).join(', ')}`);
  } finally {
    await browser.close();
  }
}

// 3. Restore on an empty device: what comes back, and what does not.
{
  const { browser, page, report } = await open({ dir });
  try {
    await start(page);
    await dialog(page);
    await give(page, exported);
    await page.waitForFunction(() => !document.getElementById('family-apply').disabled);
    await page.locator('#family-apply').click();
    // The page is read again once the file is applied: the home comes back.
    await page.waitForFunction(
      (key) => localStorage.getItem(key) !== null,
      KEYS.EXPEDITION_STORAGE_KEY,
    );
    await page.locator('#home-primary').waitFor({ state: 'visible' });
    const restored = await snapshot(page);
    const family = (s) => s['conquete-serpents:family:v1'];
    const { readFamilyBackup } = await import('../../src/familyBackup.ts');
    const { extras, ...adventure } = readFamilyBackup(exported);
    assert.deepEqual(
      { ...readFamilyBackup(family(restored)), version: 6 },
      adventure,
      'the adventure, the career, the missions and the albums come back exactly',
    );
    for (const key of EXTRA_KEYS)
      assert.equal(restored[key], device[key], `${key} comes back exactly`);
    assert.equal(Object.keys(extras).length, EXTRA_KEYS.length);
    // The door of the home knows the expedition that came back.
    assert.equal(
      await page.locator('#home-voyage .voyage-new').isVisible(),
      false,
      'the door no longer says « Nouveau »',
    );
    const absent = Object.keys(device).filter((key) => !(key in restored));
    checks.push(
      `restore on an empty device: adventure, expedition, voyage and records identical; not in the file: ${absent.join(', ') || 'nothing'}`,
    );
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}
const out = { recipe: 'family-backup', dir, checks };
await writeFile('artifacts/hygiene/family-backup.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
