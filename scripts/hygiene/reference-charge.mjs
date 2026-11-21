// Recette de charge de référence : la vague 11 de la grande aventure avec 48 alliés, même
// graine, même camp, sur le paquet servi hors ligne. Relève la régularité des images avec le
// compteur du jeu (`?perf=1`), le temps de démarrage et la mémoire.
//   node --experimental-strip-types scripts/hygiene/reference-charge.mjs [dossier] [passages] [secondes]
// Le navigateur sans écran dessine sans carte graphique : ces nombres comparent deux versions
// sur la même machine, ils ne disent pas la fluidité d'un téléphone.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { open, start, status, boardReady, text, ORIGIN } from './harness.mjs';

const { Game } = await import('../../src/game.ts');
const { encodeCheckpoint, decodeCheckpoint } = await import('../../src/checkpoints.ts');
const { CAMP_STORAGE_KEY } = await import('../../src/storageKeys.ts');
const [dir = 'dist-android', passes = '3', seconds = '40'] = process.argv.slice(2);
await mkdir('artifacts/hygiene', { recursive: true });

/** The same crowded camp every time: 48 allies before wave 11. */
function denseCamp() {
  const game = new Game(1234);
  game.wave = 10;
  game.normalizeCamp();
  game.gold = 9000;
  const kinds = ['ninja', 'club', 'archer', 'medic', 'shield'];
  let n = 0;
  for (let x = 612; x <= 972; x += 60)
    for (let y = 132; y <= 516; y += 64) if (game.recruit(kinds[n % kinds.length], x, y)) n++;
  const raw = encodeCheckpoint(game);
  assert.ok(decodeCheckpoint(raw), 'the dense camp is a valid save');
  return { raw, units: game.units.length };
}
const camp = denseCamp();
const heap = async (cdp) => {
  await cdp.send('HeapProfiler.collectGarbage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  return Math.round(metrics.find((m) => m.name === 'JSHeapUsedSize').value / 1024);
};

async function pass() {
  const { browser, context, page, report } = await open({
    dir,
    storage: { [CAMP_STORAGE_KEY]: camp.raw },
  });
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    // Startup: from the navigation to a home that can be touched, then to a board that can.
    const t0 = Date.now();
    await start(page, '?perf=1');
    const homeMs = Date.now() - t0;
    const t1 = Date.now();
    await page.locator('#home-classic').click();
    await page.locator('#home-continue').click();
    await boardReady(page);
    const boardMs = Date.now() - t1;
    assert.equal(await text(page, '#wave'), '10');
    assert.equal(await text(page, '#army-count'), String(camp.units));
    const heapBefore = await heap(cdp);
    // The reading window pauses the game: the measure starts again, then the wave starts.
    await page.locator('.performance-panel button').click(); // « Relevé »
    await page.locator('.performance-dialog button').nth(2).click(); // « Recommencer la mesure »
    await page.locator('.performance-dialog button').nth(1).click(); // « Fermer »
    await page.locator('#start').click();
    await page.waitForTimeout(Number(seconds) * 1000);
    const during = await status(page);
    await page.locator('.performance-panel button').click(); // « Relevé »
    const read = JSON.parse(await page.locator('.performance-dialog textarea').inputValue());
    const heapAfter = await heap(cdp);
    assert.deepEqual(report.errors, []);
    return { homeMs, boardMs, during, heapBefore, heapAfter, read };
  } finally {
    await browser.close();
  }
}

const runs = [];
for (let i = 0; i < Number(passes); i++) runs.push(await pass());
const out = { recipe: 'charge', dir, units: camp.units, seconds: Number(seconds), runs };
await writeFile(
  `artifacts/hygiene/reference-charge-${dir.replace(/\W+/g, '_')}.json`,
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 1));
