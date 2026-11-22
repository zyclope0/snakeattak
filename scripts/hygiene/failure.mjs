// Quand quelque chose casse. Trois pannes provoquées sur le vrai paquet :
//  1. une erreur dans une image du plateau, en pleine vague : le plateau s'arrête pour de bon ;
//     l'enfant doit le savoir, relancer le jeu et retrouver son camp ;
//  2. une erreur que le plateau traverse : rien ne doit s'afficher ;
//  3. un démarrage qui échoue : l'accueil ne vient pas ; les fichiers familiaux gardés par
//     l'appareil doivent pouvoir être enregistrés, tels quels. L'application ne sait pas
//     remettre un fichier : sur son paquet, aucun bouton, une phrase qui dit ce qui est
//     toujours là ; les fichiers sont alors essayés sur le paquet du site (`dist`).
//   node --experimental-strip-types scripts/hygiene/failure.mjs [dossier]
import assert from 'node:assert/strict';
import { access, mkdir, readFile } from 'node:fs/promises';
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
/** The only scripts the start-up rescue may need. */
const RESCUE_FILES = /\/assets\/(index|keys)-[\w-]+\.js$/;
/** The package that can hand a file over, when the one asked for is the application's. */
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
  // What the child needs is there at once, without scrolling inside the window: the title,
  // the sentence, the button. Only what is folded for a parent may need a scroll.
  for (const part of await page
    .locator(`${selector} > h2, ${selector} > p, ${selector} > button`)
    .all()) {
    const at = await part.boundingBox();
    assert.ok(
      at && at.y >= box.y - 1 && at.y + at.height <= box.y + box.height + 1,
      `${label}: ${await part.evaluate((node) => node.tagName)} is in view (${JSON.stringify(at)} in ${JSON.stringify(box)})`,
    );
  }
  for (const button of await page.locator(`${selector} button, ${selector} summary`).all()) {
    // What is folded away is not a target yet: it is measured once unfolded.
    if (!(await button.isVisible())) continue;
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
    assert.equal(await text(page, '#failure-button'), FR.relancerLeJeu);
    // One sentence, true in every mode: nothing is promised about what was kept.
    assert.equal(await text(page, '#failure-dialog > p'), FR.relanceLeJeuTuDevrasRefaire);
    assert.match(
      await page.locator('#failure-detail').textContent(),
      new RegExp(`^v\\d+\\.\\d+\\.\\d+ · RangeError: ${PROVOKED}$`),
    );
    await fits(page, '#failure-dialog', `${tag} failure window`);
    // It is the only way on: Escape leaves it open, and the page behind is out of reach.
    // A browser lets Escape close a window at the third press, whatever the page answers.
    for (let press = 0; press < 6; press++) await page.keyboard.press('Escape');
    assert.equal(await dialog.count(), 1, 'six presses of Escape do not close it');
    // Where a browser closes it all the same (one that does not know `closedby`), or anything
    // else does, it is open again at once, over the whole page.
    await page.evaluate(() => document.getElementById('failure-dialog').close());
    await dialog.waitFor({ state: 'visible', timeout: 500 });
    assert.ok(
      await page.evaluate(() => document.getElementById('failure-dialog').matches(':modal')),
      'closed by something else, it comes back as the only thing to act on',
    );
    // Enter and Space do nothing either: the focus is on the words, not on the button.
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(await dialog.count(), 1, 'a key pressed for something else does not reload');
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
    await page.locator('#failure-button').click();
    await page.locator('#home-primary').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#failure-dialog').count(), 0);
    await page.locator('#home-primary').click();
    await boardReady(page);
    assert.equal(await status(page), 'preparing');
    assert.deepEqual(await numbers(page), before, 'the camp of before the wave');
    await page.locator('#start').click();
    await page.waitForFunction(() => document.querySelector('#app')?.dataset.status === 'fighting');
    checks.push(`${tag} : « Relancer le jeu » rend le camp d'avant la vague, la vague repart`);
    // The same failure a second time in a row: the child is sent to a grown-up.
    await page.evaluate((words) => {
      Math.hypot = () => {
        throw new RangeError(words);
      };
    }, PROVOKED);
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await text(page, '#failure-dialog > p'), FR.caRecommenceVaChercherUnAdulte);
    await fits(page, '#failure-dialog', `${tag} failure window, second time`);
    checks.push(`${tag} : la panne revient, « Va chercher un adulte »`);
  } finally {
    await browser.close();
  }

  // 3. The game cannot start. Never the game, its rules nor the drawing engine: the rescue
  //    must need none of them. Every script is cut but the few small ones it is allowed
  //    (`scripts/check-dist.mjs`).
  const stopped = async (from) => {
    const failed = await open({
      dir: from,
      viewport,
      touch: viewport.width < 1000,
      storage: device,
    });
    // Until `cut` is lifted, to try « Réessayer » with the game's files back.
    failed.cut = true;
    await failed.context.route(/\/assets\/[\w.-]+\.js$/, (route) =>
      !failed.cut || RESCUE_FILES.test(route.request().url()) ? route.fallback() : route.abort(),
    );
    await failed.page.goto(`${ORIGIN}/`);
    const window = failed.page.locator('#start-dialog[open]');
    await window.waitFor({ state: 'visible' });
    assert.equal(await failed.page.locator('#home-screen:not([hidden])').count(), 0, 'no home');
    // The same window as for a board that stops: a title, one sentence, one button.
    assert.equal(await text(failed.page, '#start-title'), BOOT.oupsLeJeuNArrivePasADemarrer);
    assert.equal(await text(failed.page, '#start-dialog > p'), FR.appuieSurReessayer);
    assert.equal(await text(failed.page, '#start-button'), FR.reessayer);
    assert.equal(await failed.page.locator('.boot-loading').count(), 0, 'the bare message is gone');
    assert.equal(
      await failed.page.locator('#start-parents').getAttribute('open'),
      null,
      'what is for a parent is folded',
    );
    await fits(failed.page, '#start-dialog', `${tag} start-up window (${from})`);
    for (let press = 0; press < 6; press++) await failed.page.keyboard.press('Escape');
    assert.equal(await window.count(), 1, 'it cannot be closed');
    // Unfolded, it still fits.
    await failed.page.locator('#start-parents > summary').click();
    await fits(failed.page, '#start-dialog', `${tag} start-up window unfolded (${from})`);
    return failed;
  };
  const failed = await stopped(dir);
  try {
    assert.equal(
      await failed.page.locator('#rescue').count(),
      application ? 0 : 1,
      application ? 'the application offers no file' : 'the site offers the files',
    );
    if (application) {
      // The application cannot hand a file over: no button that does nothing; a parent is
      // told what is still there and what would lose it.
      assert.equal(await failed.page.locator('#start-dialog button').count(), 1);
      assert.equal(
        await text(failed.page, '#start-parents > p'),
        FR.desAventuresSontGardeesDansCetAppareil,
      );
      await failed.page.screenshot({ path: `artifacts/hygiene/rescue-application-${tag}.png` });
      checks.push(
        `${tag} : démarrage en échec dans l'application, la phrase, aucun bouton de fichier`,
      );
    }
  } finally {
    if (application) await failed.browser.close();
  }
  // The family files the device holds are handed over as they are, where a file can be.
  const files = application ? await stopped(SITE) : failed;
  try {
    assert.equal(
      await text(files.page, '#start-parents > p'),
      FR.lesAventuresGardeesSurCetAppareil,
    );
    const buttons = files.page.locator('#rescue button');
    assert.equal(await buttons.count(), 2, 'one button for each of the two players');
    assert.equal(
      await text(files.page, '#rescue button >> nth=1'),
      `${FR.garderLAventureDuJoueur} 2`,
    );
    for (const [index, key] of [
      KEYS.FAMILY_STORAGE_KEY,
      `${KEYS.FAMILY_STORAGE_KEY}:p2`,
    ].entries()) {
      const [download] = await Promise.all([
        files.page.waitForEvent('download'),
        buttons.nth(index).click(),
      ]);
      assert.equal(download.suggestedFilename(), `conquete-serpents-famille-${index + 1}.json`);
      const saved = await readFile(await download.path(), 'utf8');
      assert.equal(saved, device[key], `player ${index + 1}: the stored text, byte for byte`);
      assert.ok(readFamilyBackup(saved), `player ${index + 1}: a file the family import reads`);
    }
    await files.page.screenshot({ path: `artifacts/hygiene/rescue-${tag}.png` });
    checks.push(
      `${tag} : démarrage en échec, « Réessayer », deux fichiers familiaux rendus à l'octet et importables`,
    );
    // « Réessayer » asks for the game again: with its files back, the home comes.
    files.cut = false;
    await files.page.locator('#start-button').click();
    await files.page.locator('#home-primary').waitFor({ state: 'visible' });
    assert.equal(await files.page.locator('#start-dialog').count(), 0);
    checks.push(`${tag} : « Réessayer » relance le jeu`);
  } finally {
    await files.browser.close();
  }
}

// A device that holds nothing: the window without anything for a parent, no file button.
const empty = await open({ dir });
try {
  await empty.context.route('**/assets/bootstrap-*.js', (route) => route.abort());
  await empty.page.goto(`${ORIGIN}/`);
  await empty.page.locator('#start-dialog[open]').waitFor({ state: 'visible' });
  assert.equal(await empty.page.locator('#start-parents').count(), 0);
  assert.equal(await empty.page.locator('#start-dialog button').count(), 1);
  checks.push('appareil vide : la fenêtre, « Réessayer », rien pour les parents');
} finally {
  await empty.browser.close();
}
// Not in a fight, nothing is to be played again, and the window does not say so. And a
// failure long after the game was started again is not « the same thing again ».
{
  const { browser, page } = await open({ dir });
  try {
    const fail = () =>
      page.evaluate(() => {
        // The board draws nothing more, and says why once.
        const game = document.querySelector('#game canvas');
        Math.hypot = () => {
          throw new RangeError('recette');
        };
        return !!game;
      });
    await start(page);
    await page.locator('#home-primary').click();
    await boardReady(page);
    assert.equal(await status(page), 'preparing');
    await fail();
    // The camp is drawn with distances too: the board stops before any wave.
    await page.locator('#failure-dialog[open]').waitFor({ state: 'visible' });
    assert.equal(await text(page, '#failure-dialog > p'), FR.relanceLeJeuPourContinuerAJouer);
    checks.push('panne hors d’un combat : « Relance le jeu pour continuer à jouer. »');
    await page.locator('#failure-button').click();
    await page.locator('#home-primary').waitFor({ state: 'visible' });
    // Six minutes later, another failure: the first words again.
    await page.locator('#home-primary').click();
    await boardReady(page);
    await page.evaluate(() => {
      const now = Date.now;
      Date.now = () => now() + 6 * 60_000;
    });
    await fail();
    await page.locator('#failure-dialog[open]').waitFor({ state: 'visible' });
    assert.equal(await text(page, '#failure-dialog > p'), FR.relanceLeJeuPourContinuerAJouer);
    checks.push('panne six minutes après une relance : ce n’est plus « Ça recommence »');
  } finally {
    await browser.close();
  }
}
console.log(JSON.stringify({ ok: true, checks }, null, 2));
