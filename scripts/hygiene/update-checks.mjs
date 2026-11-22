// Ce qu'une mise à jour doit retrouver sur l'appareil d'un joueur du build 63 : rien d'effacé
// au démarrage, le même joueur actif, puis les étoiles, le voyage à finir et l'aventure en
// cours du premier joueur. Deux recettes s'en servent : `upgrade-63.mjs` (qui joue d'abord
// avec le vrai paquet du build 63) et `update-frozen.mjs` (qui part d'un stockage figé, pour
// la CI).
import assert from 'node:assert/strict';
import { status, boardReady, text, playOut, numbers, snapshot } from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';

/**
 * `before` : ce que l'appareil gardait (`storage`) et ce que le joueur voyait (`stars`,
 * `classic`, `voyage`, `players`). La page est ouverte sur le paquet d'aujourd'hui, à
 * l'accueil. `shot(page, nom)` prend une image.
 */
export async function checkUpdate({ page, report, before, checks, shot }) {
  const first = before.players.players[0].id;
  assert.deepEqual(report.errors, [], 'the update starts without an error');
  const after = await snapshot(page);
  const changed = Object.keys(before.storage).filter((key) => after[key] !== before.storage[key]);
  const lost = Object.keys(before.storage).filter((key) => !(key in after));
  assert.deepEqual(lost, [], 'no key of build 63 is removed at start');
  // A key written again at start holds the same content (the order of its fields may change).
  for (const key of changed)
    assert.deepEqual(
      JSON.parse(after[key]),
      JSON.parse(before.storage[key]),
      `${key}: same content`,
    );
  await shot(page, 'apres-joueur-2');
  // Player 2 is still the active one, with nothing won.
  const players = JSON.parse(after['conquete-serpents:players:v1']);
  assert.deepEqual(players.players, before.players.players, 'the same players');
  assert.equal(players.activeId, before.players.activeId, 'the same active player');
  checks.push(`update: starts clean, keys rewritten at start: ${JSON.stringify(changed)}`);
  // Back to player 1: stars, adventure, voyage.
  await page.locator('#player-chip').click();
  await page.locator('#players-dialog').waitFor({ state: 'visible' });
  await page.locator(`#players-dialog [data-player="${first}"] button`).first().click();
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  await page.clock.runFor(500);
  await showHomePage(page, 'home');
  assert.equal(await text(page, '#mission-total'), before.stars, 'the stars of player 1');
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
}
