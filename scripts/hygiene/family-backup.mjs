// Sauvegarde familiale sur le paquet Android : export, restauration sur un appareil vide,
// et imports invalides qui ne doivent rien changer, à l'octet près.
//   node --experimental-strip-types scripts/hygiene/family-backup.mjs [stockage.json] [dossier]
// `stockage.json` est ce qu'un appareil garde. Sans lui : l'appareil figé d'un testeur du
// build 63 (`tests/fixtures/appareil-build-63.json`), qui a un voyage à finir.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { open, start, snapshot } from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';

const FROZEN = 'tests/fixtures/appareil-build-63.json';
const [storageFile = FROZEN, dir = 'dist-android'] = process.argv.slice(2);
const read = JSON.parse(await readFile(storageFile, 'utf8'));
// The frozen device holds its storage beside what its player saw.
const device = read.storage ?? read;
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
// 4. The copies the game keeps beside the save. A game opened and closed adds nothing; once
//    the session has saved, the file it found is offered to a parent, byte for byte; a file
//    this version cannot read, put aside, is offered too.
{
  const { readFamilyBackup } = await import('../../src/familyBackup.ts');
  const found = device[KEYS.FAMILY_STORAGE_KEY];
  const { browser, page, report } = await open({ dir, storage: device });
  try {
    await start(page);
    assert.equal(
      (await snapshot(page))[KEYS.FAMILY_PREVIOUS_KEY],
      undefined,
      'reading adds nothing',
    );
    await dialog(page);
    assert.equal(await page.locator('#family-export-previous').isVisible(), false);
    assert.equal(await page.locator('#family-export-refused').isVisible(), false);
    await page.locator('#family-close').click();
    // The player starts a mission: the save is written, and what it replaces is kept.
    await showHomePage(page, 'home');
    await page.locator('#home-primary').click();
    await page.locator('#app').waitFor({ state: 'visible' });
    await page.waitForFunction(
      (key) => localStorage.getItem(key) !== null,
      KEYS.FAMILY_PREVIOUS_KEY,
    );
    const kept = (await snapshot(page))[KEYS.FAMILY_PREVIOUS_KEY];
    assert.equal(kept, found, 'the copy is the file the session found');
    checks.push('kept copy: nothing added by reading; the file found is kept at the first save');
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
  // The next start offers that copy, and a file put aside, in the family window.
  const next = await open({
    dir,
    storage: {
      ...device,
      [KEYS.FAMILY_PREVIOUS_KEY]: found,
      [KEYS.FAMILY_REFUSED_KEY]: '{"version":99}',
    },
  });
  try {
    await start(next.page);
    await dialog(next.page);
    for (const [id, expected, name] of [
      ['#family-export-previous', found, 'conquete-serpents-famille-avant.json'],
      ['#family-export-refused', '{"version":99}', 'conquete-serpents-famille-mis-de-cote.json'],
    ]) {
      const button = next.page.locator(id);
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      assert.ok(
        box.width >= 48 && box.height >= 48,
        `${id}: a target of ${box.width}×${box.height}`,
      );
      const [download] = await Promise.all([next.page.waitForEvent('download'), button.click()]);
      assert.equal(download.suggestedFilename(), name);
      assert.equal(await readFile(await download.path(), 'utf8'), expected, `${id}: byte for byte`);
    }
    assert.ok(readFamilyBackup(found), 'the copy from before is a file the import reads');
    // Brought back the usual way: exported, then chosen like any other file.
    await give(next.page, found, 'conquete-serpents-famille-avant.json');
    await next.page.locator('#family-apply:not([disabled])').waitFor({ state: 'visible' });
    await next.page.screenshot({ path: 'artifacts/hygiene/family-copies.png' });
    checks.push(
      'kept copies: both exported byte for byte from the family window; the copy from before is accepted by the import',
    );
    assert.deepEqual(next.report.errors, []);
  } finally {
    await next.browser.close();
  }
}
// 5. One wrong number in the camp of the stored file. The game starts as it would have: same
//    stars on the home, same button, the camp taken from its own key; the file as it was
//    found is put aside.
{
  const TEXT = await import('../../src/texts/fr/family.ts');
  const home = async (storage) => {
    const { browser, page, report } = await open({ dir, storage });
    try {
      await start(page);
      const seen = {
        stars: (await page.locator('#home-stars').textContent()).trim(),
        play: (await page.locator('#home-primary').textContent()).trim(),
        status: (await page.locator('#career-status').textContent()).trim(),
        kept: await snapshot(page),
      };
      // The stars of the missions live in the family file alone: they are the ones at stake.
      await showHomePage(page, 'missions');
      const words = await page.locator('#home-screen').innerText();
      seen.missions = (words.match(/\d+ \/ \d+ étoiles/g) ?? []).join(', ');
      seen.filled = (words.match(/★/g) ?? []).length;
      assert.deepEqual(report.errors, []);
      return seen;
    } finally {
      await browser.close();
    }
  };
  const whole = await home(device);
  const parts = JSON.parse(device[KEYS.FAMILY_STORAGE_KEY]);
  assert.equal(typeof parts.camp, 'string', 'the frozen device holds a camp in its family file');
  parts.camp = JSON.stringify({ ...JSON.parse(parts.camp), gold: -5 });
  const wrong = JSON.stringify(parts);
  const hurt = await home({ ...device, [KEYS.FAMILY_STORAGE_KEY]: wrong });
  assert.equal(hurt.stars, whole.stars, 'the stars of the home are those of the whole file');
  assert.ok(whole.filled > 0, 'the frozen device has mission stars to lose');
  assert.equal(hurt.missions, whole.missions, 'the stars of the missions are kept');
  assert.equal(hurt.filled, whole.filled, 'star for star');
  assert.equal(hurt.play, whole.play, 'the same game waits behind the button');
  assert.equal(hurt.status, TEXT.leCampDeLaSauvegardeNAPasPuEtreLu);
  assert.equal(hurt.kept[KEYS.FAMILY_REFUSED_KEY], wrong, 'the file as found is put aside');
  checks.push(
    `camp damaged in the stored file: missions ${hurt.missions} as with the whole file, « ${whole.play} », file put aside`,
  );
}
const out = { recipe: 'family-backup', dir, checks };
await writeFile('artifacts/hygiene/family-backup.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
