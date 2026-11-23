// La question pour adulte avant le partage d'Android (décision 3 du parent, 23 novembre 2026).
// Sur le vrai paquet de l'application, avec un faux côté Android : Chromium n'en a pas, il est
// remplacé par les deux modules qui répondent comme Android.
//  1. « Exporter mon aventure » ouvre d'abord la question, dans l'écran, aux trois tailles ;
//  2. « Annuler », une mauvaise réponse, Échap : rien n'est envoyé, et la famille le lit ;
//  3. deux appuis rapides n'ouvrent qu'une question ;
//  4. la bonne réponse ouvre le partage, et le jeu dit que le fichier est parti ;
//  5. sur le site, le fichier va au navigateur sans question.
//   node --experimental-strip-types scripts/hygiene/adult-gate.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { open, start, fits } from './harness.mjs';
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
    await page.locator('#adult-gate-cancel').click();
    await said(page);
    assert.equal(await status(page), FAMILY.rienNAEteEnvoyeIlFautLaBonneReponse);
    assert.equal(await page.locator('#adult-gate').count(), 0, 'the question is gone');
    assert.equal(await shares(page), 0, '« Annuler » sends nothing');
    checks.push(`${tag} : la question avant le partage, dans l'écran ; « Annuler » n'envoie rien`);
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
    assert.deepEqual(report.errors, []);
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
