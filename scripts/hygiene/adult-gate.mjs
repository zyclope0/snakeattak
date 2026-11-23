// La question pour adulte avant le partage d'Android (décision 3 du parent, 23 novembre 2026).
// Sur le vrai paquet de l'application, avec un faux côté Android : Chromium n'en a pas, il est
// remplacé par les deux modules qui répondent comme Android.
//  1. « Exporter mon aventure » ouvre d'abord la question, dans l'écran, aux trois tailles ;
//  2. « Annuler », une mauvaise réponse, Échap : rien n'est envoyé, et la famille le lit ;
//  3. deux appuis rapides n'ouvrent qu'une question ;
//  4. la bonne réponse ouvre le partage, et le jeu dit que le fichier est parti ;
//  5. sur le site, le fichier va au navigateur sans question ;
//  6. le clavier du téléphone (l'écran réduit de moitié) laisse la question, la case et
//     « Envoyer » visibles ;
//  7. une fenêtre qui ne s'ouvre pas ne laisse rien derrière elle, et l'appui suivant marche ;
//  8. quand le jeu ne démarre pas parce que les règles manquent, le secours pose la question
//     et ouvre le partage : la question n'a besoin ni des règles, ni du jeu, ni de Phaser.
//   node --experimental-strip-types scripts/hygiene/adult-gate.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { open, start, fits, ORIGIN } from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';

const FAMILY = await import('../../src/texts/fr/family.ts');
const device = JSON.parse(await readFile('tests/fixtures/appareil-build-63.json', 'utf8'));
const storage = device.storage ?? device;
const checks = [];
const SIZES = [
  { width: 780, height: 360 },
  { width: 812, height: 375 },
  { width: 1280, height: 800 },
];

/** Android's side, as the two plugins see it: the share names the app chosen. */
const ANDROID = () => {
  window.shares = 0;
  window.Capacitor = {
    PluginHeaders: [
      { name: 'Filesystem', methods: [{ name: 'writeFile', rtype: 'promise' }] },
      { name: 'Share', methods: [{ name: 'share', rtype: 'promise' }] },
    ],
    nativePromise: (plugin, method, options) => {
      if (plugin === 'Filesystem')
        return Promise.resolve({ uri: `file:///data/user/0/test/cache/${options.path}` });
      window.shares += 1;
      return Promise.resolve({ activityType: 'com.google.android.apps.docs' });
    },
  };
};
async function familyWindow(page) {
  await showHomePage(page, 'parents');
  await page.locator('#home-family').click();
  await page.locator('#family-dialog').waitFor({ state: 'visible' });
}
const status = async (page) => (await page.locator('#family-status').textContent()).trim();
const shares = (page) => page.evaluate(() => window.shares);
/** Asks for the file and waits for the question. */
async function ask(page) {
  await page.evaluate(() => (document.getElementById('family-status').textContent = ''));
  await page.locator('#family-export').click();
  await page.locator('#adult-gate[open]').waitFor({ state: 'visible' });
}
const said = (page) =>
  page.waitForFunction(() => document.getElementById('family-status').textContent.trim() !== '');
/**
 * The sentence is on the screen, not only in the page: on a phone the window is taller than
 * the screen, and the parent saw no message (test APK, 23 November 2026).
 */
async function seen(page, label) {
  const box = await page.locator('#family-status').boundingBox();
  const { height } = page.viewportSize();
  assert.ok(
    box && box.y >= 0 && box.y + box.height <= height,
    `${label}: the sentence is at ${box?.y}–${(box?.y ?? 0) + (box?.height ?? 0)} of ${height}`,
  );
}

for (const viewport of SIZES) {
  const tag = `${viewport.width}x${viewport.height}`;
  const { browser, page, report } = await open({
    viewport,
    touch: viewport.width < 1000,
    storage,
  });
  try {
    await page.context().addInitScript(ANDROID);
    await start(page);
    await familyWindow(page);
    await ask(page);
    await fits(page, '#adult-gate', `${tag} question`);
    for (const target of ['#adult-gate-answer', '#adult-gate-send', '#adult-gate-cancel']) {
      const box = await page.locator(target).boundingBox();
      assert.ok(box.height >= 48, `${tag} ${target}: ${box.height} px high`);
    }
    await page.screenshot({ path: `artifacts/hygiene/adult-gate-${tag}.png` });
    if (viewport.height < 400) {
      // The phone's keyboard takes about half the screen: the page gets that much shorter.
      const short = { width: viewport.width, height: Math.round(viewport.height / 2) };
      await page.setViewportSize(short);
      await page.locator('#adult-gate-answer').scrollIntoViewIfNeeded();
      for (const target of [
        '#adult-gate label',
        '#adult-gate-answer',
        '#adult-gate-send',
        '#adult-gate-cancel',
      ]) {
        const box = await page.locator(target).boundingBox();
        assert.ok(
          box.y >= 0 && box.y + box.height <= short.height,
          `${tag}, keyboard open: ${target} at ${box.y}–${box.y + box.height} of ${short.height}`,
        );
      }
      await page.screenshot({ path: `artifacts/hygiene/adult-gate-${tag}-clavier.png` });
      await page.setViewportSize(viewport);
    }
    await page.locator('#adult-gate-cancel').click();
    await said(page);
    assert.equal(await status(page), FAMILY.rienNAEteEnvoyeIlFautLaBonneReponse);
    await seen(page, `${tag} refused`);
    assert.equal(await page.locator('#adult-gate').count(), 0, 'the question is gone');
    assert.equal(await shares(page), 0, '« Annuler » sends nothing');
    // The right answer: the share opens once, and the sentence that says so is seen.
    await ask(page);
    const [a, b] = (await page.locator('#adult-gate label').textContent())
      .match(/\d+/g)
      .map(Number);
    await page.locator('#adult-gate-answer').fill(String(a * b));
    await page.locator('#adult-gate-send').click();
    await said(page);
    assert.equal(await status(page), FAMILY.leFichierEstPartiVerifieQuIlEstBienArrive);
    await seen(page, `${tag} shared`);
    assert.equal(await shares(page), 1);
    checks.push(`${tag} : la phrase se voit sans défiler, après un refus comme après un partage`);
    checks.push(
      `${tag} : la question avant le partage, dans l'écran${viewport.height < 400 ? ', et avec le clavier' : ''} ; « Annuler » n'envoie rien`,
    );
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}

{
  const { browser, page, report } = await open({ storage });
  try {
    await page.context().addInitScript(ANDROID);
    await start(page);
    await familyWindow(page);
    // A wrong answer.
    await ask(page);
    await page.locator('#adult-gate-answer').fill('7');
    await page.locator('#adult-gate-send').click();
    await said(page);
    assert.equal(await status(page), FAMILY.rienNAEteEnvoyeIlFautLaBonneReponse);
    assert.equal(await shares(page), 0, 'a wrong answer sends nothing');
    // Escape, as Android's back gesture.
    await ask(page);
    await page.keyboard.press('Escape');
    await said(page);
    assert.equal(await status(page), FAMILY.rienNAEteEnvoyeIlFautLaBonneReponse);
    assert.equal(await shares(page), 0, 'Escape sends nothing');
    checks.push('une mauvaise réponse, Échap : rien n’est envoyé');
    // A window that cannot open: nothing left behind, nothing sent, the next tap asks.
    await page.evaluate(() => {
      const real = HTMLDialogElement.prototype.showModal;
      HTMLDialogElement.prototype.showModal = function () {
        HTMLDialogElement.prototype.showModal = real;
        throw new Error('recette : la fenêtre ne s’ouvre pas');
      };
      document.getElementById('family-status').textContent = '';
    });
    await page.locator('#family-export').click();
    await said(page);
    assert.equal(await status(page), FAMILY.impossibleDePreparerLeFichierDe);
    await seen(page, 'the window could not open');
    assert.equal(await page.locator('#adult-gate').count(), 0, 'nothing left behind');
    assert.equal(await shares(page), 0);
    await ask(page);
    await page.locator('#adult-gate-cancel').click();
    await said(page);
    checks.push(
      'une fenêtre qui ne s’ouvre pas : rien d’envoyé, rien laissé, l’appui suivant marche',
    );
    // Two quick taps: one question.
    await page.evaluate(() => (document.getElementById('family-status').textContent = ''));
    await page.locator('#family-export').dblclick();
    await page.locator('#adult-gate[open]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#adult-gate').count(), 1, 'one question');
    checks.push('deux appuis rapides : une seule question');
    // The right answer, read from the question.
    const [a, b] = (await page.locator('#adult-gate label').textContent())
      .match(/\d+/g)
      .map(Number);
    await page.locator('#adult-gate-answer').fill(String(a * b));
    await page.locator('#adult-gate-send').click();
    await said(page);
    assert.equal(await status(page), FAMILY.leFichierEstPartiVerifieQuIlEstBienArrive);
    assert.equal(await shares(page), 1, 'the share opens once');
    checks.push(`la bonne réponse (${a} × ${b}) : le partage s’ouvre, le fichier est parti`);
    assert.deepEqual(
      report.errors.filter((e) => !String(e).includes('recette : la fenêtre')),
      [],
    );
  } finally {
    await browser.close();
  }
}

// The game cannot start because its rules, its start-up code and Phaser never arrive: the
// rescue still asks the question and opens the share.
{
  const { browser, page, context } = await open({ storage });
  try {
    await context.addInitScript(ANDROID);
    await context.route(/\/assets\/(rules|bootstrap|phaser)-[\w-]+\.js$/, (route) => route.abort());
    await page.goto(`${ORIGIN}/`);
    await page.locator('#start-dialog[open]').waitFor({ state: 'visible' });
    await page.locator('#start-parents > summary').click();
    const buttons = page.locator('#rescue button');
    assert.ok((await buttons.count()) >= 1, 'the rescue offers the files');
    await buttons.first().click();
    await page.locator('#adult-gate[open]').waitFor({ state: 'visible' });
    const [a, b] = (await page.locator('#adult-gate label').textContent())
      .match(/\d+/g)
      .map(Number);
    await page.locator('#adult-gate-answer').fill(String(a * b));
    await page.locator('#adult-gate-send').click();
    await page.waitForFunction(() => window.shares === 1);
    checks.push('le jeu ne démarre pas, sans ses règles : le secours pose la question et partage');
  } finally {
    await browser.close();
  }
}

// The website: the browser takes the file, no question.
{
  const { browser, page, report } = await open({ dir: 'dist', storage });
  try {
    await start(page);
    await familyWindow(page);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#family-export').click(),
    ]);
    assert.ok(download.suggestedFilename().endsWith('.json'));
    assert.equal(await page.locator('#adult-gate').count(), 0, 'no question on the website');
    checks.push('sur le site : le fichier va au navigateur, sans question');
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}
console.log(JSON.stringify({ ok: true, checks }, null, 2));
