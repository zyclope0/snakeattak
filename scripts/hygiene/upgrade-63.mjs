// Mise à jour par-dessus les données : on joue avec le paquet du build 63 des testeurs
// (commit fb347dd), puis on sert le paquet actuel à la même origine, sans rien effacer.
//   node --experimental-strip-types scripts/hygiene/upgrade-63.mjs <dossier du build 63> [dossier actuel]
// Ce que le build 63 a écrit doit se relire : étoiles, aventure en cours, voyage en cours,
// deuxième joueur. Le WebView d'Android garde le stockage de la page entre deux versions ;
// l'installation elle-même (APK par-dessus APK) ne se joue que sur un téléphone.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
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
import { checkUpdate } from './update-checks.mjs';
import { revealControl } from '../../tests/reveal-controls.mjs';

const [old, current = 'dist-android'] = process.argv.slice(2);
assert.ok(old, 'the folder of the build 63 package');
await mkdir('artifacts/hygiene', { recursive: true });
const shot = (page, name) => page.screenshot({ path: `artifacts/hygiene/upgrade-${name}.png` });
const checks = [];
const { browser, page, report, root } = await open({ dir: old });
try {
  await page.clock.install();
  // --- Build 63, player 1: a mission won (stars), then a great adventure under way.
  await start(page);
  await showHomePage(page, 'parents');
  await page.locator('#departure-input').fill('REFUGE-2-0000-7X86-R0');
  await page.locator('#departure-form button[type=submit]').click();
  await page.locator('#mission-launch').click();
  await boardReady(page);
  assert.equal(await playOut(page), 'won', 'build 63: the refuge is won');
  await page.locator('#mission-back-map').click();
  await showHomePage(page, 'home');
  const before = { stars: await text(page, '#mission-total') };
  assert.match(before.stars, /^[1-3] /, `build 63: the refuge gave stars: « ${before.stars} »`);
  await showHomePage(page, 'classic');
  await page.locator('#home-new').click();
  if (await page.locator('#journey-replace').isVisible())
    await page.locator('#journey-replace').click();
  await boardReady(page);
  await revealControl(page, '[data-kind="club"]');
  await page.locator('[data-kind="club"]').click();
  await page.clock.runFor(400);
  await tapBoard(page, 930, 520);
  await page.clock.runFor(300);
  assert.equal(await playOut(page, { waves: 1 }), 'preparing', 'build 63: wave 1 is over');
  before.classic = await numbers(page);
  await shot(page, '63-aventure');
  // --- Build 63, player 1: a voyage with its first stage won and a bonus in the bag.
  await page.reload();
  await page.locator('#home-voyage').waitFor({ state: 'visible' });
  await page.locator('#home-voyage').click();
  await page.locator('#voyage-go').click();
  await boardReady(page);
  assert.equal(await playOut(page), 'won', 'build 63: the first stage is won');
  await page.locator('#voyage-continue').click();
  await page.locator('.bonus-card').first().click();
  await page.locator('#voyage-go').waitFor({ state: 'visible' });
  before.voyage = JSON.parse((await snapshot(page))['conquete-serpents:voyage:v1']);
  await shot(page, '63-voyage');
  // --- Build 63: a second player, who wins nothing.
  await page.reload();
  await page.locator('#player-chip').click();
  await page.locator('#players-dialog').waitFor({ state: 'visible' });
  if (await page.locator('#player-new').isVisible()) await page.locator('#player-new').click();
  await page.locator('#player-save').click();
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  await page.clock.runFor(500);
  before.storage = await snapshot(page);
  before.players = JSON.parse(before.storage['conquete-serpents:players:v1']);
  const first = before.players.players[0].id;
  assert.notEqual(before.players.activeId, first, 'build 63: the second player is the active one');
  await shot(page, '63-joueur-2');
  checks.push('build 63: mission won, adventure and voyage under way, second player');

  // --- The update: the same device, the package of today.
  root.dir = resolve(current);
  await page.reload();
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  await checkUpdate({ page, report, before, checks, shot });
  const out = {
    recipe: 'upgrade-63',
    old,
    current,
    checks,
    before: { ...before, storage: undefined },
  };
  await writeFile('artifacts/hygiene/upgrade-63.json', JSON.stringify(out, null, 2));
  await writeFile('artifacts/hygiene/storage-63.json', JSON.stringify(before.storage, null, 2));
  console.log(JSON.stringify(out));
} catch (error) {
  await shot(page, 'echec').catch(() => {});
  console.error(report);
  throw error;
} finally {
  await browser.close();
}
