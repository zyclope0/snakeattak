// Recette courte de référence : « Le refuge », même départ, mêmes gestes, sur le paquet
// Android servi hors ligne. Deux passages doivent donner les mêmes nombres.
//   node --experimental-strip-types scripts/hygiene/reference-refuge.mjs [dossier] [passages]
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { open, start, status, boardReady, text, tapBoard, playOut, numbers } from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';
import { revealControl } from '../../tests/reveal-controls.mjs';

const { encodeDeparture } = await import('../../src/departures.ts');
const { createMissionRun } = await import('../../src/missions.ts');
const [dir = 'dist-android', passes = '2'] = process.argv.slice(2);
const CODE = encodeDeparture({ kind: 'mission', run: createMissionRun('refuge', 2026) });
await mkdir('artifacts/hygiene', { recursive: true });
const SPOTS = [
  [800, 300],
  [930, 520],
  [930, 110],
  [700, 520],
  [1000, 300],
];

async function pass(index) {
  const { browser, page, report } = await open({ dir });
  const trace = [];
  try {
    await page.clock.install();
    await start(page);
    await showHomePage(page, 'parents');
    await page.locator('#departure-input').fill(CODE);
    await page.locator('#departure-form button[type=submit]').click();
    await page.locator('#mission-launch').click();
    await boardReady(page);
    assert.equal(await status(page), 'preparing');
    trace.push({ at: 'départ', ...(await numbers(page)) });
    const result = await playOut(page, {
      onWave: async (wave) => {
        // One purchase before the second wave, always the same ally at the same place.
        if (wave !== 1) return;
        await revealControl(page, '[data-kind="club"]');
        await page.locator('[data-kind="club"]').click();
        // The catalogue closes and the board takes the gesture on the next frames.
        await page.clock.runFor(400);
        // An ally may stand on a spot after a wave: the first free one of this list, in order.
        const before = await text(page, '#gold');
        for (const [x, y] of SPOTS) {
          await tapBoard(page, x, y);
          await page.clock.runFor(300);
          if ((await text(page, '#gold')) !== before) break;
        }
        trace.push({ at: 'achat', ...(await numbers(page)) });
      },
    });
    trace.push({ at: 'fin', ...(await numbers(page)) });
    const title = await text(page, '#battle-result-title');
    const stars = await page.locator('#battle-result .mission-stars, #mission-result').innerText();
    await page.screenshot({ path: `artifacts/hygiene/refuge-${index}.png` });
    return { result, title, stars: stars.replace(/\s+/g, ' ').trim(), trace, report };
  } finally {
    await browser.close();
  }
}

const runs = [];
for (let i = 0; i < Number(passes); i++) runs.push(await pass(i));
const [first, ...others] = runs;
for (const other of others)
  assert.deepEqual(
    { ...other, report: null },
    { ...first, report: null },
    'same departure, same gestures: same game',
  );
assert.equal(first.result, 'won');
for (const run of runs) {
  assert.deepEqual(run.report.errors, [], 'no page error');
  assert.deepEqual(run.report.missing, [], 'every file is in the package');
  assert.deepEqual(run.report.external, [], 'no request leaves the device');
}
const out = { recipe: 'refuge', dir, code: CODE, passes: runs.length, ...first, report: undefined };
await writeFile('artifacts/hygiene/reference-refuge.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
