// Mémoire après plusieurs parties : « Le refuge » rejoué dans la même page, le tas JavaScript
// relevé après ramasse-miettes à la fin de chaque partie. Un tas qui monte à chaque partie
// est une fuite.   node --experimental-strip-types scripts/hygiene/memory.mjs [dossier] [parties]
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { open, start, boardReady, playOut } from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';

const [dir = 'dist-android', games = '8'] = process.argv.slice(2);
await mkdir('artifacts/hygiene', { recursive: true });
const { browser, context, page, report } = await open({ dir });
try {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const heap = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    const { metrics } = await cdp.send('Performance.getMetrics');
    const of = (name) => Math.round(metrics.find((m) => m.name === name).value);
    return {
      heapKo: Math.round(of('JSHeapUsedSize') / 1024),
      nodes: of('Nodes'),
      listeners: of('JSEventListeners'),
    };
  };
  await page.clock.install();
  await start(page);
  await showHomePage(page, 'parents');
  await page.locator('#departure-input').fill('REFUGE-2-0000-7X86-R0');
  await page.locator('#departure-form button[type=submit]').click();
  await page.locator('#mission-launch').click();
  await boardReady(page);
  const series = [];
  for (let game = 1; game <= Number(games); game++) {
    assert.equal(await playOut(page), 'won', `game ${game}`);
    series.push({ game, ...(await heap()) });
    await page.locator('#mission-again').click();
    await page.clock.runFor(500);
    await boardReady(page);
  }
  assert.deepEqual(report.errors, []);
  const out = { recipe: 'memory', dir, series };
  await writeFile('artifacts/hygiene/memory.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(series));
} finally {
  await browser.close();
}
