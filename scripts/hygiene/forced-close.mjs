// Fermeture forcée : l'application est tuée sans prévenir (aucun « pagehide », aucun clic).
// On photographie ce que l'appareil garde à cet instant, puis on rouvre le jeu sur un
// appareil qui garde exactement cela. Rien de gagné ne doit manquer ; une dépense et son
// allié vont ensemble.
//   node --experimental-strip-types scripts/hygiene/forced-close.mjs [dossier]
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import {
  open,
  start,
  status,
  boardReady,
  text,
  tapBoard,
  playOut,
  numbers,
  snapshot,
} from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';
import { revealControl } from '../../tests/reveal-controls.mjs';

const [dir = 'dist-android'] = process.argv.slice(2);
await mkdir('artifacts/hygiene', { recursive: true });
const checks = [];
const KEYS = await import('../../src/storageKeys.ts');

/** Plays `scenario` on a new device, kills it, and gives a new page on what the device kept. */
async function killed(name, scenario) {
  const first = await open({ dir });
  let kept, told;
  try {
    await first.page.clock.install();
    await start(first.page);
    told = await scenario(first.page);
    kept = await snapshot(first.page);
    await first.page.screenshot({ path: `artifacts/hygiene/kill-${name}-avant.png` });
    assert.deepEqual(first.report.errors, [], `${name}: no error before the kill`);
  } finally {
    // No unload handler runs: the process is gone.
    await first.browser.close();
  }
  const second = await open({ dir, storage: kept });
  await second.page.clock.install();
  await start(second.page);
  return { ...second, kept, told };
}
async function buy(page, kind, spots) {
  const before = await text(page, '#gold');
  await revealControl(page, `[data-kind="${kind}"]`);
  await page.locator(`[data-kind="${kind}"]`).click();
  await page.clock.runFor(400);
  for (const [x, y] of spots) {
    await tapBoard(page, x, y);
    await page.clock.runFor(300);
    if ((await text(page, '#gold')) !== before) return;
  }
  throw new Error(`no free spot for ${kind}`);
}
const SPOTS = [
  [930, 520],
  [930, 110],
  [700, 520],
  [1000, 300],
];
async function refuge(page) {
  await showHomePage(page, 'parents');
  await page.locator('#departure-input').fill('REFUGE-2-0000-7X86-R0');
  await page.locator('#departure-form button[type=submit]').click();
  await page.locator('#mission-launch').click();
  await boardReady(page);
}

// A. A mission is won; the application dies on the result, before any button.
{
  const { browser, page, report, told } = await killed('mission-gagnee', async (page) => {
    await refuge(page);
    assert.equal(await playOut(page), 'won');
    return { result: await text(page, '#mission-result') };
  });
  try {
    await showHomePage(page, 'home');
    const stars = await text(page, '#mission-total');
    await page.screenshot({ path: 'artifacts/hygiene/kill-mission-gagnee-apres.png' });
    assert.match(stars, /^[1-3] /, `the stars of the mission won are kept: « ${stars} »`);
    await showHomePage(page, 'missions');
    assert.equal(
      await page.locator('#mission-continue').isVisible(),
      false,
      'a mission won is not offered to resume',
    );
    assert.deepEqual(report.errors, []);
    checks.push(
      `mission won then killed: stars kept (« ${stars} »), nothing to resume; ${told.result}`,
    );
  } finally {
    await browser.close();
  }
}

// B. Great adventure: an ally bought during the preparation, killed before the wave starts.
{
  const { browser, page, report, told } = await killed('achat', async (page) => {
    await showHomePage(page, 'classic');
    await page.locator('#home-new').click();
    await boardReady(page);
    await buy(page, 'club', SPOTS);
    return numbers(page);
  });
  try {
    await showHomePage(page, 'classic');
    await page.locator('#home-continue').click();
    await boardReady(page);
    const after = await numbers(page);
    await page.screenshot({ path: 'artifacts/hygiene/kill-achat-apres.png' });
    assert.deepEqual(after, told, 'the ally bought and the coins spent come back together');
    assert.deepEqual(report.errors, []);
    checks.push(`purchase then killed: ${JSON.stringify(after)}`);
  } finally {
    await browser.close();
  }
}

// C. Great adventure: killed in the middle of the second wave.
{
  const { browser, page, report, told } = await killed('en-vague', async (page) => {
    await showHomePage(page, 'classic');
    await page.locator('#home-new').click();
    await boardReady(page);
    await buy(page, 'club', SPOTS);
    assert.equal(await playOut(page, { waves: 1 }), 'preparing');
    const camp = await numbers(page);
    await page.locator('#start').click();
    await page.clock.runFor(4000);
    assert.equal(await status(page), 'fighting');
    return camp;
  });
  try {
    await showHomePage(page, 'classic');
    await page.locator('#home-continue').click();
    await boardReady(page);
    const after = await numbers(page);
    await page.screenshot({ path: 'artifacts/hygiene/kill-en-vague-apres.png' });
    assert.deepEqual(after, told, 'the camp before the wave comes back whole');
    assert.equal(await playOut(page, { waves: 1 }), 'preparing', 'the wave plays again');
    assert.deepEqual(report.errors, []);
    checks.push(`killed in a wave: back at the camp before it ${JSON.stringify(after)}`);
  } finally {
    await browser.close();
  }
}

// D. Expedition: a step is won; the application dies on the result, before « Continuer ».
{
  const { browser, page, report, kept } = await killed('expedition', async (page) => {
    await page.locator('#home-voyage').click();
    await page.locator('.exp-go').first().click();
    await boardReady(page);
    assert.equal(await playOut(page), 'won');
  });
  try {
    const saved = JSON.parse(kept[KEYS.EXPEDITION_STORAGE_KEY]);
    assert.equal(saved.best, 1, 'the step won is in the record');
    assert.equal(saved.current.pending.kind, 'gift', 'its gift waits');
    await page.locator('#home-voyage').click();
    await page.locator('.exp-gift').first().waitFor();
    await page.screenshot({ path: 'artifacts/hygiene/kill-expedition-apres.png' });
    assert.equal(await page.locator('.exp-gift').count(), 3, 'the gift of the step won is offered');
    assert.deepEqual(report.errors, []);
    checks.push('expedition step won then killed: the step counts, its gift waits');
  } finally {
    await browser.close();
  }
}

const out = { recipe: 'forced-close', dir, checks };
await writeFile('artifacts/hygiene/forced-close.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
