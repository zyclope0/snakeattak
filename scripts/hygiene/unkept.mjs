// Quand ce qui est joué n'est pas gardé. Sur le vrai paquet :
//  1. l'appareil se met à refuser les écritures juste avant une vague : rien ne s'affiche
//     pendant le combat ; à la fin de la vague, la fenêtre « Ta partie n'est pas gardée » ;
//     sur l'accueil, une marque qui la rouvre ; quand l'appareil garde de nouveau, l'accueil
//     le dit ; un second refus est redit ;
//  2. un appareil qui n'a jamais rien gardé (stockage illisible) : pas de fenêtre à l'arrivée,
//     la marque seule ; la fenêtre après la première vague gagnée, avec sa propre phrase.
//   node --experimental-strip-types scripts/hygiene/unkept.mjs [dossier]
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { open, start, status, boardReady, text, fits } from './harness.mjs';
import { leaveBattle } from '../../tests/browser-entry.mjs';

const [dir = 'dist-android'] = process.argv.slice(2);
await mkdir('artifacts/hygiene', { recursive: true });
const checks = [];
const FR = await import('../../src/texts/fr/failure.ts');
const SIZES = [
  { width: 780, height: 360 },
  { width: 812, height: 375 },
  { width: 1280, height: 800 },
];

/** From now on the device refuses every write, or accepts them again. */
const refuse = (page, on) =>
  page.evaluate((refused) => {
    window.refused = refused;
    if (window.patched) return;
    window.patched = true;
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.refused) throw new DOMException('full', 'QuotaExceededError');
      return write.call(this, key, value);
    };
  }, on);
/** Lets the wave under way end, taking the gift it may offer. */
async function endWave(page) {
  for (let step = 0; step < 400 && (await status(page)) === 'fighting'; step++)
    await page.clock.runFor(1000);
  await page.clock.runFor(400);
  const gift = page.locator('#reward-cards [data-reward]').first();
  if (await gift.isVisible()) await gift.click();
  await page.clock.runFor(400);
}
/** Starts the next wave, taking first the gift that may still wait to be chosen. */
async function startWave(page) {
  const gift = page.locator('#reward-cards [data-reward]').first();
  if (await gift.isVisible()) await gift.click();
  // A battle left through the pause panel is still paused when the player comes back.
  const resume = page.locator('#resume-game');
  if (await resume.isVisible()) await resume.click();
  await page.locator('#start:not([disabled])').click();
  await page.waitForFunction(() => document.querySelector('#app')?.dataset.status === 'fighting');
}
const home = async (page) => {
  await leaveBattle(page);
  await page.locator('#home-primary').waitFor({ state: 'visible' });
};
/** The window, as it must be: its words, folded for the parent, inside the screen. */
async function shown(page, parents, label) {
  const window = page.locator('#unkept-dialog[open]');
  await window.waitFor({ state: 'visible' });
  assert.equal(await text(page, '#unkept-title'), FR.taPartieNEstPasGardee);
  assert.equal(await text(page, '#unkept-dialog > p'), FR.tuPeuxContinuerAJouerSiTuFermes);
  assert.equal(await text(page, '#unkept-button'), FR.jAiCompris);
  assert.equal(await page.locator('#unkept-parents').getAttribute('open'), null, 'folded');
  await fits(page, '#unkept-dialog', label);
  await page.locator('#unkept-parents > summary').click();
  assert.equal(await text(page, '#unkept-parents > p'), parents);
  await fits(page, '#unkept-dialog', `${label}, unfolded`);
  return window;
}

for (const viewport of SIZES) {
  const tag = `${viewport.width}x${viewport.height}`;
  const { browser, page, report } = await open({ dir, viewport, touch: viewport.width < 1000 });
  try {
    await start(page);
    assert.equal(await page.locator('#unkept-mark').count(), 0, 'a device that keeps: no mark');
    await page.locator('#home-primary').click();
    await boardReady(page);
    await refuse(page, true);
    await startWave(page);
    await page.clock.runFor(3000);
    assert.equal(await status(page), 'fighting');
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'never over a fight');
    await endWave(page);
    const window = await shown(page, FR.lAppareilNASansDoutePlusAssezDePlace, `${tag} window`);
    await page.screenshot({ path: `artifacts/hygiene/unkept-${tag}.png` });
    await page.locator('#unkept-button').click();
    // The button closes it, and the game goes on.
    await page.locator('#unkept-dialog').waitFor({ state: 'detached' });
    checks.push(
      `${tag} : écriture refusée, rien pendant le combat, la fenêtre à la fin de la vague`,
    );

    // Once told, it is not told again for the same refusal; the home keeps a mark.
    await home(page);
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'told once');
    const mark = page.locator('button#unkept-mark');
    await mark.waitFor({ state: 'visible' });
    assert.equal(await text(page, '#unkept-mark'), FR.partieNonGardee);
    const size = await mark.boundingBox();
    assert.ok(size.height >= 48 && size.width >= 48, `a mark of ${size.width}×${size.height}`);
    const view = page.viewportSize();
    assert.ok(size.x >= 0 && size.x + size.width <= view.width, 'the mark is inside the screen');
    await page.screenshot({ path: `artifacts/hygiene/unkept-mark-${tag}.png` });
    await mark.click();
    await window.waitFor({ state: 'visible' });
    // Escape closes it too: the game behind it works.
    await page.keyboard.press('Escape');
    await page.locator('#unkept-dialog').waitFor({ state: 'detached' });
    checks.push(`${tag} : sur l'accueil, la marque « Partie non gardée » rouvre la fenêtre`);

    // The device keeps the game again: the home says so, until the player has seen it.
    await refuse(page, false);
    await page.locator('#home-primary').click();
    await boardReady(page);
    await home(page);
    const healed = page.locator('span#unkept-mark');
    await healed.waitFor({ state: 'visible' });
    assert.equal(await text(page, '#unkept-mark'), FR.cEstRepareTaPartieEstDeNouveauGardee);
    assert.equal(await page.locator('#unkept-dialog').count(), 0);
    await page.screenshot({ path: `artifacts/hygiene/unkept-healed-${tag}.png` });
    await page.locator('#home-primary').click();
    await boardReady(page);
    await home(page);
    assert.equal(await page.locator('#unkept-mark').count(), 0, 'seen once, the sentence goes');
    checks.push(`${tag} : l'appareil garde de nouveau, l'accueil le dit, puis la phrase s'en va`);

    // A second refusal is a second time: it is told again.
    await page.locator('#home-primary').click();
    await boardReady(page);
    await refuse(page, true);
    await startWave(page);
    await endWave(page);
    await page.locator('#unkept-dialog[open]').waitFor({ state: 'visible' });
    checks.push(`${tag} : un second refus est redit`);
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}

// A device that never let the game keep anything: its storage cannot even be read.
{
  const { browser, page } = await open({ dir });
  try {
    await page.addInitScript(() => {
      const refuse = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
      Storage.prototype.getItem = refuse;
      Storage.prototype.setItem = refuse;
    });
    await start(page);
    // Nothing stops a child who has just arrived; the home carries the mark.
    await page.locator('button#unkept-mark').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'no window at the door');
    await page.locator('#home-primary').click();
    await boardReady(page);
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'nor before a wave is won');
    await startWave(page);
    await endWave(page);
    await shown(page, FR.cetAppareilNeLaissePasLeJeuGarder, 'blocked storage');
    checks.push(
      'stockage illisible : pas de fenêtre à l’arrivée, la marque seule ; la fenêtre après la première vague gagnée',
    );
  } finally {
    await browser.close();
  }
}
console.log(JSON.stringify({ ok: true, checks }, null, 2));
