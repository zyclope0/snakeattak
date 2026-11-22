// Quand quelque chose casse. Trois pannes provoquées sur le vrai paquet :
//  1. une erreur dans une image du plateau, en pleine vague : le plateau s'arrête pour de bon ;
//     l'enfant doit le savoir, relancer le jeu et retrouver son camp ;
//  2. une erreur que le plateau traverse : rien ne doit s'afficher ;
//  3. un démarrage qui échoue : l'accueil ne vient pas ; les fichiers familiaux gardés par
//     l'appareil doivent pouvoir être enregistrés, tels quels.
//   node --experimental-strip-types scripts/hygiene/failure.mjs [dossier]
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { open, start, status, boardReady, text, numbers, ORIGIN } from './harness.mjs';

const [dir = 'dist-android'] = process.argv.slice(2);
await mkdir('artifacts/hygiene', { recursive: true });
const checks = [];
const { readFamilyBackup } = await import('../../src/familyBackup.ts');
const KEYS = await import('../../src/storageKeys.ts');
const FR = await import('../../src/texts/fr/failure.ts');
const BOOT = await import('../../src/texts/fr/boot.ts');
const device = JSON.parse(await readFile('tests/fixtures/appareil-build-63.json', 'utf8')).storage;
const SIZES = [
  { width: 780, height: 360 },
  { width: 812, height: 375 },
  { width: 1280, height: 800 },
];
const PROVOKED = 'recette : panne provoquée';

/** Every button of `selector` is a fair target, and the block stays inside the screen. */
async function fits(page, selector, label) {
  const view = page.viewportSize();
  const box = await page.locator(selector).boundingBox();
  assert.ok(box, `${label}: shown`);
  assert.ok(
    box.x >= 0 &&
      box.y >= 0 &&
      box.x + box.width <= view.width &&
      box.y + box.height <= view.height,
    `${label}: inside ${view.width}×${view.height} (${JSON.stringify(box)})`,
  );
  for (const button of await page.locator(`${selector} button, ${selector} summary`).all()) {
    const size = await button.boundingBox();
    assert.ok(
      size.width >= 48 && size.height >= 48,
      `${label}: a target of ${size.width}×${size.height}`,
    );
  }
}

for (const viewport of SIZES) {
  const tag = `${viewport.width}x${viewport.height}`;
  // 1. The board stops in the middle of a wave.
  const { browser, page, report } = await open({ dir, viewport, touch: viewport.width < 1000 });
  try {
    await start(page);
    await page.locator('#home-primary').click();
    await boardReady(page);
    const before = await numbers(page);
    await page.locator('#start').click();
    await page.waitForFunction(() => document.querySelector('#app')?.dataset.status === 'fighting');
    // 2. First an error the board survives: it keeps drawing, nothing is shown.
    await page.evaluate(() =>
      window.dispatchEvent(new ErrorEvent('error', { error: new Error('survived') })),
    );
    await page.waitForTimeout(400);
    assert.equal(await page.locator('#failure-dialog').count(), 0, 'no window for a passing error');
    checks.push(`${tag} : une erreur que le plateau traverse n'affiche rien`);
    // The rules measure distances at every step: the next frame of the board throws.
    await page.evaluate((words) => {
      Math.hypot = () => {
        throw new RangeError(words);
      };
    }, PROVOKED);
    const dialog = page.locator('#failure-dialog[open]');
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await text(page, '#failure-title'), FR.oupsLeJeuSEstEmmele);
    assert.equal(await text(page, '#failure-reload'), FR.relancerLeJeu);
    assert.match(
      await page.locator('#failure-detail').textContent(),
      new RegExp(`^v\\d+\\.\\d+\\.\\d+ · RangeError: ${PROVOKED}$`),
    );
    await fits(page, '#failure-dialog', `${tag} failure window`);
    // It is the only way on: Escape leaves it open, and the page behind is out of reach.
    await page.keyboard.press('Escape');
    assert.equal(await dialog.count(), 1, 'Escape does not close it');
    assert.equal(
      await page.locator('#failure-parents').getAttribute('open'),
      null,
      'the detail is folded',
    );
    await page.screenshot({ path: `artifacts/hygiene/failure-${tag}.png` });
    assert.ok(
      report.errors.some((line) => line.includes(PROVOKED)),
      'the provoked error was thrown',
    );
    checks.push(`${tag} : plateau arrêté en pleine vague, fenêtre affichée, Échap sans effet`);
    // Starting again brings the camp back as it was before the wave.
    await page.locator('#failure-reload').click();
    await page.locator('#home-primary').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#failure-dialog').count(), 0);
    await page.locator('#home-primary').click();
    await boardReady(page);
    assert.equal(await status(page), 'preparing');
    assert.deepEqual(await numbers(page), before, 'the camp of before the wave');
    await page.locator('#start').click();
    await page.waitForFunction(() => document.querySelector('#app')?.dataset.status === 'fighting');
    checks.push(`${tag} : « Relancer le jeu » rend le camp d'avant la vague, la vague repart`);
  } finally {
    await browser.close();
  }

  // 3. The game cannot start: the family files the device holds are handed over as they are.
  const failed = await open({ dir, viewport, touch: viewport.width < 1000, storage: device });
  try {
    await failed.context.route('**/assets/bootstrap-*.js', (route) => route.abort());
    await failed.page.goto(`${ORIGIN}/`);
    const rescue = failed.page.locator('#rescue');
    await rescue.waitFor({ state: 'visible' });
    assert.equal(await failed.page.locator('#home-screen:not([hidden])').count(), 0, 'no home');
    assert.ok(
      (await text(failed.page, '.boot-loading')).startsWith(BOOT.impossibleDeDemarrerLeJeuRecharge),
    );
    const buttons = rescue.locator('button');
    assert.equal(await buttons.count(), 2, 'one button for each of the two players');
    await fits(failed.page, '.boot-loading', `${tag} rescue`);
    for (const [index, key] of [
      KEYS.FAMILY_STORAGE_KEY,
      `${KEYS.FAMILY_STORAGE_KEY}:p2`,
    ].entries()) {
      const [download] = await Promise.all([
        failed.page.waitForEvent('download'),
        buttons.nth(index).click(),
      ]);
      assert.equal(download.suggestedFilename(), `conquete-serpents-famille-${index + 1}.json`);
      const saved = await readFile(await download.path(), 'utf8');
      assert.equal(saved, device[key], `player ${index + 1}: the stored text, byte for byte`);
      assert.ok(readFamilyBackup(saved), `player ${index + 1}: a file the family import reads`);
    }
    await failed.page.screenshot({ path: `artifacts/hygiene/rescue-${tag}.png` });
    checks.push(
      `${tag} : démarrage en échec, deux fichiers familiaux rendus à l'octet et importables`,
    );
  } finally {
    await failed.browser.close();
  }
}

// A device that holds nothing: the message alone, no button that would give an empty file.
const empty = await open({ dir });
try {
  await empty.context.route('**/assets/bootstrap-*.js', (route) => route.abort());
  await empty.page.goto(`${ORIGIN}/`);
  await empty.page.getByText(BOOT.impossibleDeDemarrerLeJeuRecharge).waitFor({ state: 'visible' });
  await empty.page.waitForTimeout(500);
  assert.equal(await empty.page.locator('#rescue').count(), 0);
  checks.push('appareil vide : le message seul, aucun bouton');
} finally {
  await empty.browser.close();
}
console.log(JSON.stringify({ ok: true, checks }, null, 2));
