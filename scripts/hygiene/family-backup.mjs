// Sauvegarde familiale sur le paquet Android : export, restauration sur un appareil vide,
// et imports invalides qui ne doivent rien changer, à l'octet près.
// L'application ne sait pas remettre un fichier (essai du parent sur le build 64) : sur son
// paquet, la recette vérifie qu'aucun bouton ne le promet, puis prend le fichier sur le paquet
// du site (`dist`, à construire aussi) et continue avec lui.
//   node --experimental-strip-types scripts/hygiene/family-backup.mjs [stockage.json] [dossier]
// `stockage.json` est ce qu'un appareil garde. Sans lui : l'appareil figé d'un testeur du
// build 63 (`tests/fixtures/appareil-build-63.json`), qui a un voyage à finir.
import assert from 'node:assert/strict';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
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
const FAMILY = await import('../../src/texts/fr/family.ts');
const HELP = await import('../../src/texts/fr/help.ts');
/** The package that hands the family file over: the one asked for, or the site's. */
const SITE = 'dist';
/**
 * True on the application's package, by what the build wrote in it: never by what the page
 * shows, which is the very thing to check.
 */
const application =
  JSON.parse(await readFile(`${dir}/build-info.json`, 'utf8')).target === 'android';
if (application)
  await access(`${SITE}/index.html`).catch(() => {
    throw new Error('Le paquet du site manque : lancer aussi « npm run build ».');
  });
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

/** The family file of the device, as the package `from` hands it over. */
async function exportFrom(from) {
  const { browser, page } = await open({ dir: from, storage: device });
  try {
    await start(page);
    const before = await snapshot(page);
    await dialog(page);
    const download = page.waitForEvent('download');
    await page.locator('#family-export').click();
    const raw = await readFile(await (await download).path(), 'utf8');
    assert.equal(
      (await page.locator('#family-export-status').textContent()).trim(),
      FAMILY.fichierPretConserveLePourReprendre,
      'a file handed over is said to be ready',
    );
    assert.deepEqual(await snapshot(page), before, 'exporting changes nothing on the device');
    return raw;
  } finally {
    await browser.close();
  }
}

// 1. Export from the device as it is.
let exported;
{
  const { browser, page, report } = await open({ dir, storage: device });
  try {
    await start(page);
    const atStart = await snapshot(page);
    await dialog(page);
    assert.equal(
      await page.locator('#family-export').count(),
      application ? 0 : 1,
      application ? 'the application offers no export' : 'the site offers the export',
    );
    if (application) {
      // No button that would do nothing, no word that a file is ready: one true sentence,
      // and no help beside the window that tells the family to keep a file.
      assert.equal(
        await page.locator(`[aria-label="${HELP.aideLaSauvegardeFamiliale}"]`).count(),
        0,
      );
      assert.equal(
        (await page.locator('#family-export-none').textContent()).trim(),
        FAMILY.dansLApplicationLAventureNePeutPas,
      );
      const words = await page.locator('#family-dialog').innerText();
      assert.ok(!words.includes('Fichier prêt'), 'nothing says a file is ready');
      await page.screenshot({ path: 'artifacts/hygiene/family-application.png' });
      checks.push('application: no export button, the sentence instead, no « Fichier prêt »');
      exported = await exportFrom(SITE);
    } else exported = await exportFrom(dir);
    assert.deepEqual(await snapshot(page), atStart, 'opening the window changes nothing');
    const file = JSON.parse(exported);
    assert.equal(file.version, 6, 'the file carries what the player keeps beside the adventure');
    assert.deepEqual(Object.keys(file.extras).sort(), ['endless', 'expedition', 'voyage']);
    checks.push(
      `export: version ${file.version}, fields ${Object.keys(file).join(' ')}, extras ${Object.keys(file.extras).join(' ')}`,
    );
    // On a phone, a file chosen shows what it holds and « Remplacer » on the screen: the
    // window is taller than the screen, and the parent saw no sentence under it.
    for (const viewport of [
      { width: 780, height: 360 },
      { width: 812, height: 375 },
    ]) {
      const phone = await open({ dir, storage: device, viewport, touch: true });
      try {
        await start(phone.page);
        await dialog(phone.page);
        await give(phone.page, exported);
        await phone.page.locator('#family-apply:not([disabled])').waitFor();
        for (const target of ['#family-preview-summary', '#family-apply']) {
          const box = await phone.page.locator(target).boundingBox();
          assert.ok(
            box && box.y >= 0 && box.y + box.height <= viewport.height,
            `${viewport.width}x${viewport.height} ${target} at ${box?.y} of ${viewport.height}`,
          );
        }
      } finally {
        await phone.browser.close();
      }
    }
    checks.push('phone: what a chosen file holds and « Remplacer » are on the screen');

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
// 4. The copies the game keeps beside the save, on the device. A game opened and closed adds
//    nothing. The file a session finds is kept once the session has saved. An import keeps
//    the adventure it replaces, with what the player keeps beside it, and that copy is
//    brought back from the family window with one button and the usual confirmation: no file
//    leaves the device, so this works in the application too.
{
  const { readFamilyBackup } = await import('../../src/familyBackup.ts');
  const HOME = await import('../../src/texts/fr/home.ts');
  const found = device[KEYS.FAMILY_STORAGE_KEY];
  const missionStars = (raw) =>
    Object.values(JSON.parse(raw).missions.bestStars).reduce((a, b) => a + b, 0);
  /** Chooses what the preview shows, and waits for the adventure to be replaced. */
  const apply = async (page) => {
    const before = await page.evaluate((key) => localStorage.getItem(key), KEYS.FAMILY_STORAGE_KEY);
    await page.locator('#family-apply:not([disabled])').click();
    await page.waitForFunction(
      ([key, was]) => localStorage.getItem(key) !== was,
      [KEYS.FAMILY_STORAGE_KEY, before],
    );
    await page.locator('#home-primary').waitFor({ state: 'visible' });
  };
  const { browser, page, report } = await open({ dir, storage: device });
  try {
    await start(page);
    const read = await snapshot(page);
    assert.equal(read[KEYS.FAMILY_PREVIOUS_KEY], undefined, 'reading adds nothing');
    assert.equal(read[KEYS.FAMILY_BEFORE_IMPORT_KEY], undefined, 'reading adds nothing');
    await dialog(page);
    // The window opens on its title, and its first way out of the device is the export.
    const frame = await page.locator('#family-dialog').boundingBox();
    for (const top of ['#family-title', application ? '#family-export-none' : '#family-export']) {
      const at = await page.locator(top).boundingBox();
      assert.ok(
        at && at.y >= frame.y && at.y + at.height <= frame.y + frame.height,
        `${top} is in view when the window opens`,
      );
    }
    assert.equal(await page.locator('#family-copies').isVisible(), false, 'no copy, no section');
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

  // A file imported by mistake, with more stars than the child's own (a sibling's).
  const other = JSON.parse(found);
  for (const mission of Object.keys(other.missions.bestStars))
    other.missions.bestStars[mission] = 3;
  const sibling = JSON.stringify(other);
  assert.ok(readFamilyBackup(sibling), 'the other file is one the import reads');
  assert.ok(missionStars(sibling) > missionStars(found));
  let afterMistake;
  const mistake = await open({ dir, storage: device });
  try {
    await start(mistake.page);
    await dialog(mistake.page);
    await give(mistake.page, sibling);
    await apply(mistake.page);
    afterMistake = await snapshot(mistake.page);
    assert.equal(missionStars(afterMistake[KEYS.FAMILY_STORAGE_KEY]), missionStars(sibling));
    // The adventure it replaced is kept as the export would have given it: with the
    // expedition, the voyage and the records.
    const replaced = readFamilyBackup(afterMistake[KEYS.FAMILY_BEFORE_IMPORT_KEY]);
    assert.ok(replaced, 'the adventure replaced is kept, as a file the import reads');
    assert.equal(replaced.version, 6);
    assert.equal(missionStars(afterMistake[KEYS.FAMILY_BEFORE_IMPORT_KEY]), missionStars(found));
    for (const [name, key] of [
      ['expedition', KEYS.EXPEDITION_STORAGE_KEY],
      ['voyage', KEYS.VOYAGE_STORAGE_KEY],
      ['endless', KEYS.ENDLESS_RECORDS_KEY],
    ])
      assert.equal(replaced.extras[name], device[key], `${name} is in the copy`);
    assert.deepEqual(mistake.report.errors, []);
  } finally {
    await mistake.browser.close();
  }

  // At a later launch, the parent brings it back: one button, the usual preview, no file.
  const undo = await open({ dir, storage: afterMistake });
  try {
    await start(undo.page);
    await dialog(undo.page);
    const section = undo.page.locator('#family-copies');
    await section.waitFor({ state: 'visible' });
    assert.equal(await section.getAttribute('open'), null, 'the copies are folded');
    await section.locator('summary').click();
    const look = undo.page.locator('#family-copy-before-import');
    await look.scrollIntoViewIfNeeded();
    const size = await look.boundingBox();
    assert.ok(size.width >= 48 && size.height >= 48, `a target of ${size.width}×${size.height}`);
    await undo.page.screenshot({ path: 'artifacts/hygiene/family-copies.png' });
    await look.click();
    await undo.page.locator('#family-preview').waitFor({ state: 'visible' });
    await apply(undo.page);
    // The page is read again after an import that brings the expedition back.
    await undo.page.waitForFunction(
      (key) => localStorage.getItem(key) !== null,
      KEYS.EXPEDITION_STORAGE_KEY,
    );
    await undo.page.locator('#home-primary').waitFor({ state: 'visible' });
    const back = await snapshot(undo.page);
    assert.equal(missionStars(back[KEYS.FAMILY_STORAGE_KEY]), missionStars(found), 'the stars');
    for (const key of EXTRA_KEYS) assert.equal(back[key], device[key], `${key} is back`);
    // And what that replaced is kept in turn: the way back can itself be undone.
    assert.equal(
      missionStars(back[KEYS.FAMILY_BEFORE_IMPORT_KEY]),
      missionStars(sibling),
      'the adventure just replaced is the new copy',
    );
    checks.push(
      `import by mistake of a file with more stars: the adventure replaced is kept with its expedition, voyage and records; brought back by « Regarder cette copie » (${missionStars(found)} stars again), and that can be undone too`,
    );
    assert.deepEqual(undo.report.errors, []);
  } finally {
    await undo.browser.close();
  }

  // The same adventure kept twice (the copy of the import and the copy of the launch, both
  // the child's) is offered once: the copy of the import, which carries the expedition.
  {
    const twice = await open({
      dir,
      storage: { ...afterMistake, [KEYS.FAMILY_PREVIOUS_KEY]: found },
    });
    try {
      await start(twice.page);
      await dialog(twice.page);
      await twice.page.locator('#family-copies > summary').click();
      assert.equal(await twice.page.locator('#family-copy-before-import').count(), 1);
      assert.equal(await twice.page.locator('#family-copy-previous').count(), 0, 'offered once');
      checks.push(
        'the same adventure in both copies is offered once, by the copy that carries the most',
      );
    } finally {
      await twice.browser.close();
    }
  }

  // The same file imported again changes nothing, and leaves the child's copy alone.
  {
    const again = await open({ dir, storage: afterMistake });
    try {
      await start(again.page);
      await dialog(again.page);
      await give(again.page, sibling);
      await again.page.locator('#family-apply:not([disabled])').click();
      await again.page.locator('#home-primary').waitFor({ state: 'visible' });
      const after = await snapshot(again.page);
      assert.equal(
        after[KEYS.FAMILY_BEFORE_IMPORT_KEY],
        afterMistake[KEYS.FAMILY_BEFORE_IMPORT_KEY],
        'the copy of the child’s adventure is untouched',
      );
      checks.push('the same file imported again: the copy of the child’s adventure is untouched');
    } finally {
      await again.browser.close();
    }
  }

  // A file that brought an expedition, a voyage and records to a device that had none: the
  // way back takes them away again.
  {
    const bare = { ...device };
    for (const key of EXTRA_KEYS) delete bare[key];
    const brought = JSON.stringify({ ...JSON.parse(exported), missions: other.missions });
    assert.ok(readFamilyBackup(brought) && JSON.parse(brought).version === 6);
    let mistaken;
    const first = await open({ dir, storage: bare });
    try {
      await start(first.page);
      await dialog(first.page);
      await give(first.page, brought);
      await apply(first.page);
      await first.page.waitForFunction(
        (key) => localStorage.getItem(key) !== null,
        KEYS.EXPEDITION_STORAGE_KEY,
      );
      mistaken = await snapshot(first.page);
      for (const key of EXTRA_KEYS) assert.ok(mistaken[key], `${key} brought by the file`);
    } finally {
      await first.browser.close();
    }
    const back = await open({ dir, storage: mistaken });
    try {
      await start(back.page);
      await dialog(back.page);
      await back.page.locator('#family-copies > summary').click();
      await back.page.locator('#family-copy-before-import').click();
      await apply(back.page);
      await back.page.locator('#home-primary').waitFor({ state: 'visible' });
      const now = await snapshot(back.page);
      for (const key of EXTRA_KEYS) assert.equal(now[key], undefined, `${key} taken away again`);
      // And that too can be undone: the copy now holds what the file had brought.
      assert.equal(JSON.parse(now[KEYS.FAMILY_BEFORE_IMPORT_KEY]).version, 6);
      checks.push(
        'the way back takes away the expedition, voyage and records a mistaken file brought',
      );
    } finally {
      await back.browser.close();
    }
  }

  // A file older than the sticker books (version 4), imported by mistake, played over two
  // launches, then imported again: the game fills in what that file lacked and writes again
  // what its camp decides, and the same file is still the same adventure. The child's copy
  // stays (second attack, C1).
  {
    const legacy = JSON.parse(await readFile('tests/fixtures/balance-0362-legacy.json', 'utf8'));
    const old = JSON.parse(
      Object.values(legacy.family).map((t) => (typeof t === 'string' ? t : JSON.stringify(t)))[3],
    );
    for (const mission of Object.keys(old.missions.bestStars)) old.missions.bestStars[mission] = 3;
    const v4 = JSON.stringify(old);
    assert.equal(readFamilyBackup(v4)?.version, 4, 'a version 4 file the import reads');
    const first = await open({ dir, storage: device });
    let played;
    try {
      await start(first.page);
      await dialog(first.page);
      await give(first.page, v4);
      await apply(first.page);
      await start(first.page);
      await start(first.page);
      played = await snapshot(first.page);
      assert.equal(
        missionStars(played[KEYS.FAMILY_BEFORE_IMPORT_KEY]),
        missionStars(found),
        'the child’s adventure is the copy',
      );
    } finally {
      await first.browser.close();
    }
    const again = await open({ dir, storage: played });
    try {
      await start(again.page);
      await dialog(again.page);
      await give(again.page, v4);
      await again.page.locator('#family-apply:not([disabled])').click();
      await again.page.locator('#home-primary').waitFor({ state: 'visible' });
      const after = await snapshot(again.page);
      assert.equal(
        after[KEYS.FAMILY_BEFORE_IMPORT_KEY],
        played[KEYS.FAMILY_BEFORE_IMPORT_KEY],
        'the copy of the child’s adventure is untouched',
      );
      checks.push(
        'a version 4 file imported again after two launches: the copy of the child’s adventure is untouched',
      );
      assert.deepEqual(again.report.errors, []);
    } finally {
      await again.browser.close();
    }
  }

  // The copy of a launch is brought back as an adventure only: the expedition, the voyage and
  // the records on the device stay as they are.
  {
    const launchCopy = await open({
      dir,
      storage: { ...device, [KEYS.FAMILY_PREVIOUS_KEY]: sibling },
    });
    try {
      await start(launchCopy.page);
      await dialog(launchCopy.page);
      await launchCopy.page.locator('#family-copies > summary').click();
      await launchCopy.page.locator('#family-copy-previous').click();
      await launchCopy.page.locator('#family-preview').waitFor({ state: 'visible' });
      await apply(launchCopy.page);
      const now = await snapshot(launchCopy.page);
      assert.equal(missionStars(now[KEYS.FAMILY_STORAGE_KEY]), missionStars(sibling));
      for (const key of EXTRA_KEYS) assert.equal(now[key], device[key], `${key} untouched`);
      checks.push(
        'the copy of a launch brought back: the expedition, the voyage and the records stay',
      );
    } finally {
      await launchCopy.browser.close();
    }
  }

  // A voyage this version cannot read (written by a later one) is in no copy: the import
  // leaves it alone, and so does the way back (second attack, C2).
  {
    const { checkExtras } = await import('../../src/familyExtras.ts');
    const later = JSON.stringify({ ...JSON.parse(device[KEYS.VOYAGE_STORAGE_KEY]), version: 99 });
    assert.equal(checkExtras({ voyage: later }), null, 'a voyage this version does not read');
    const holding = { ...device, [KEYS.VOYAGE_STORAGE_KEY]: later };
    let imported;
    const first = await open({ dir, storage: holding });
    try {
      await start(first.page);
      await dialog(first.page);
      await give(first.page, sibling);
      await apply(first.page);
      imported = await snapshot(first.page);
      assert.equal(imported[KEYS.VOYAGE_STORAGE_KEY], later, 'the import leaves it alone');
    } finally {
      await first.browser.close();
    }
    const back = await open({ dir, storage: imported });
    try {
      await start(back.page);
      await dialog(back.page);
      await back.page.locator('#family-copies > summary').click();
      await back.page.locator('#family-copy-before-import').click();
      await apply(back.page);
      await back.page.locator('#home-primary').waitFor({ state: 'visible' });
      const now = await snapshot(back.page);
      assert.equal(missionStars(now[KEYS.FAMILY_STORAGE_KEY]), missionStars(found));
      assert.equal(now[KEYS.VOYAGE_STORAGE_KEY], later, 'and so does the way back');
      checks.push('a voyage this version cannot read: kept by the import and by the way back');
    } finally {
      await back.browser.close();
    }
  }

  // A device that refuses the copy refuses the import: nothing has changed.
  const full = await open({ dir, storage: device });
  try {
    await start(full.page);
    const before = await snapshot(full.page);
    await full.page.evaluate((key) => {
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('full', 'QuotaExceededError');
        return write.call(this, name, value);
      };
    }, KEYS.FAMILY_BEFORE_IMPORT_KEY);
    await dialog(full.page);
    await give(full.page, sibling);
    await full.page.locator('#family-apply:not([disabled])').click();
    await full.page.waitForFunction(
      (words) => document.getElementById('family-status').textContent.trim() === words,
      HOME.impossibleDeConserverCeFichierSur,
    );
    assert.deepEqual(await snapshot(full.page), before, 'the device keeps every byte');
    checks.push('the copy refused by the device: the import is refused, nothing has changed');
  } finally {
    await full.browser.close();
  }

  // A text this version cannot read, put aside: said in the section; handed over as a file
  // on the site only, with words of its own.
  const aside = await open({
    dir,
    storage: { ...device, [KEYS.FAMILY_REFUSED_KEY]: '{"version":99}' },
  });
  try {
    await start(aside.page);
    await dialog(aside.page);
    await aside.page.locator('#family-copies > summary').click();
    const words = await aside.page.locator('#family-copies').innerText();
    assert.ok(words.includes(FAMILY.unFichierQueCetteVersionNeSaitPasLire));
    const button = aside.page.locator('#family-copy-refused-export');
    if (application) assert.equal(await button.count(), 0, 'no file button in the application');
    else {
      await button.scrollIntoViewIfNeeded();
      const [download] = await Promise.all([aside.page.waitForEvent('download'), button.click()]);
      assert.equal(download.suggestedFilename(), 'conquete-serpents-famille-mis-de-cote.json');
      assert.equal(await readFile(await download.path(), 'utf8'), '{"version":99}');
      assert.equal(
        (await aside.page.locator('#family-status').textContent()).trim(),
        FAMILY.fichierRemisCetteVersionNeSaitPasLeRelire,
        'never « ready to resume »: this version cannot read it back',
      );
    }
    checks.push(
      application
        ? 'a text put aside that does not read: said, no file button in the application'
        : 'a text put aside that does not read: said, handed over byte for byte with words of its own',
    );
    assert.deepEqual(aside.report.errors, []);
  } finally {
    await aside.browser.close();
  }
}
// 5. A camp of the stored file no longer decodes. The same camp is written in several
//    places: whatever the places, the stars of the missions and the sticker books stay, the
//    camp comes from the same file or not at all, never from the camp kept under its own
//    key, and the file as it was found is put aside.
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
      // The way back to a mission under way, where the missions offer it.
      seen.mission = await page.locator('#mission-continue').isVisible();
      assert.deepEqual(report.errors, []);
      return seen;
    } finally {
      await browser.close();
    }
  };
  const CAMP_KEY = KEYS.CAMP_STORAGE_KEY;
  const dead = (camp) => JSON.stringify({ ...JSON.parse(camp), gold: -5 });
  const parts = () => JSON.parse(device[KEYS.FAMILY_STORAGE_KEY]);
  /** The device with its family file changed, and what its camp key then holds. */
  const withFile = (change, campKey) => {
    const file = parts();
    change(file);
    const storage = { ...device, [KEYS.FAMILY_STORAGE_KEY]: JSON.stringify(file) };
    if (campKey !== undefined) storage[CAMP_KEY] = campKey;
    return storage;
  };
  /** What the child sees and keeps is the same as on `healthy`, and the file is put aside. */
  const same = (hurt, healthy, storage, name) => {
    assert.equal(hurt.stars, healthy.stars, `${name}: the stars of the home`);
    assert.equal(hurt.missions, healthy.missions, `${name}: the stars of the missions`);
    assert.equal(hurt.filled, healthy.filled, `${name}: star for star`);
    assert.equal(hurt.play, healthy.play, `${name}: the same game behind the button`);
    assert.equal(hurt.mission, healthy.mission, `${name}: the same way back to a mission`);
    assert.equal(hurt.status, TEXT.tesEtoilesTesMissionsEtTesCarnetsSontBienLa, name);
    assert.equal(
      hurt.kept[KEYS.FAMILY_REFUSED_KEY],
      storage[KEYS.FAMILY_STORAGE_KEY],
      `${name}: the file as found is put aside`,
    );
  };
  const whole = await home(device);
  assert.equal(typeof parts().camp, 'string', 'the frozen device holds a camp in its family file');
  assert.equal(parts().camp, parts().missions.classicCamp, 'written twice in the file');
  assert.equal(parts().camp, device[CAMP_KEY], 'and once more under its own key');
  assert.ok(whole.filled > 0, 'the frozen device has mission stars to lose');

  // Device 1: the camp on top alone. Everything is as with the whole file.
  const top = withFile((file) => (file.camp = dead(file.camp)));
  same(await home(top), whole, top, 'camp on top');

  // Device 2: the same camp dead everywhere it is written, its own key included (the real
  // case). The child sees what a device without a classic camp shows, with all the stars.
  const without = await home(
    withFile((file) => (file.camp = file.missions.classicCamp = null), ''),
  );
  assert.equal(without.missions, whole.missions);
  assert.notEqual(without.play, whole.play, 'no camp: the button no longer says to resume');
  const everywhere = withFile(
    (file) => (file.camp = file.missions.classicCamp = dead(file.camp)),
    dead(device[CAMP_KEY]),
  );
  same(await home(everywhere), without, everywhere, 'camp dead everywhere');

  // Device 3: in the middle of a mission, the camp on top dead: the mission comes back.
  const playing = (file) => {
    file.camp = file.missions.retryCamp;
    file.missions.activeMode = 'missions';
  };
  // The frozen device has won that mission since: without the mark of it, the mission is
  // still to be played, and the home offers to go back to it.
  const unwon = (storage) => {
    const { [KEYS.MISSION_DONE_KEY]: _won, ...rest } = storage;
    return rest;
  };
  const mission = await home(unwon(withFile(playing)));
  assert.equal(mission.mission, true, 'the missions offer to go back to the one under way');
  const hurtMission = unwon(
    withFile((file) => {
      playing(file);
      file.camp = dead(file.camp);
    }),
  );
  same(await home(hurtMission), mission, hurtMission, 'in a mission, camp on top');
  // The mission's camp dead everywhere: the classic adventure is offered, not lost unseen.
  const noMission = unwon(
    withFile((file) => {
      playing(file);
      file.camp = file.missions.retryCamp = dead(file.camp);
    }),
  );
  const back = await home(noMission);
  assert.equal(back.missions, whole.missions);
  assert.equal(back.play, whole.play, 'the classic adventure is behind the button');
  assert.equal(back.mission, false, 'the mission whose camp died is no longer offered');

  // Device 4: the camp key holds another adventure, one that reads. It is never taken: the
  // child sees his own stars and no camp, as on device 2.
  const { Game } = await import('../../src/game.ts');
  const { decodeCheckpoint, encodeCheckpoint } = await import('../../src/checkpoints.ts');
  const stranger = new Game(99);
  stranger.gold = 777;
  const other = encodeCheckpoint(stranger);
  assert.ok(decodeCheckpoint(other), 'the other adventure is a camp the game reads');
  const foreign = withFile(
    (file) => (file.camp = file.missions.classicCamp = dead(file.camp)),
    other,
  );
  same(await home(foreign), without, foreign, 'camp key of another adventure');

  // Device 5: a text already put aside, of which nothing reads, is not pushed out.
  const older = JSON.stringify({ ...parts(), version: 99 });
  const held = { ...everywhere, [KEYS.FAMILY_REFUSED_KEY]: older };
  const kept = await home(held);
  assert.equal(kept.kept[KEYS.FAMILY_REFUSED_KEY], older, 'the older text stays put aside');
  assert.equal(kept.missions, whole.missions);

  checks.push(
    `a camp that no longer decodes, five devices: missions ${whole.missions} kept on each; camp on top alone « ${whole.play} »; dead everywhere « ${without.play} », also with another adventure under the camp key; in a mission the way back to it stays, or « ${back.play} » for the classic adventure when the mission's camp is dead everywhere; an older text put aside stays`,
  );
}
const out = { recipe: 'family-backup', dir, checks };
await writeFile('artifacts/hygiene/family-backup.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
