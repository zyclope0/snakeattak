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
  const before = { stars: await text(page, '#home-stars') };
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
  await page.locator('#home-players').click();
  await page.locator('#player-new').click();
  await page.locator('#player-save').click();
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  await page.clock.runFor(500);
  before.storage = await snapshot(page);
  before.players = JSON.parse(before.storage['conquete-serpents:players:v1']);
  await shot(page, '63-joueur-2');
  checks.push('build 63: mission won, adventure and voyage under way, second player');

  // --- The update: the same device, the package of today.
  root.dir = resolve(current);
  await page.reload();
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  assert.deepEqual(report.errors, [], 'the update starts without an error');
  const after = await snapshot(page);
  const changed = Object.keys(before.storage).filter((key) => after[key] !== before.storage[key]);
  const lost = Object.keys(before.storage).filter((key) => !(key in after));
  assert.deepEqual(lost, [], 'no key of build 63 is removed at start');
  await shot(page, 'apres-joueur-2');
  // Player 2 is still the active one, with nothing won.
  const players = JSON.parse(after['conquete-serpents:players:v1']);
  assert.deepEqual(players.players, before.players.players, 'the same players');
  assert.equal(players.activeId, before.players.activeId, 'the same active player');
  checks.push(`update: starts clean, keys rewritten at start: ${JSON.stringify(changed)}`);
  // Back to player 1: stars, adventure, voyage.
  await page.locator('#home-players').click();
  await page.locator('#players-dialog [data-player="child-1"] button').first().click();
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  await page.clock.runFor(500);
  await showHomePage(page, 'home');
  assert.equal(await text(page, '#home-stars'), before.stars, 'the stars of player 1');
  await shot(page, 'apres-joueur-1');
  // The voyage begun in build 63 is to finish: the door leads to it, same stage, same bag.
  await page.locator('#home-voyage').click();
  await page.locator('#voyage-go').waitFor({ state: 'visible' });
  const voyage = JSON.parse((await snapshot(page))['conquete-serpents:voyage:v1']);
  assert.deepEqual(voyage.current, before.voyage.current, 'the voyage under way, as it was');
  await shot(page, 'apres-voyage');
  await page.locator('#voyage-go').click();
  await boardReady(page);
  assert.equal(await status(page), 'preparing', 'the second stage of the voyage opens');
  await page.reload();
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  await showHomePage(page, 'classic');
  await page.locator('#home-continue').click();
  await boardReady(page);
  assert.deepEqual(await numbers(page), before.classic, 'the adventure under way, as it was');
  await shot(page, 'apres-aventure');
  // It goes on with the rules it was begun with: the next wave plays to its end.
  assert.match(await playOut(page, { waves: 1 }), /preparing|won|lost/);
  checks.push('update: stars, voyage and adventure of player 1 read back and go on');
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.missing, []);
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
