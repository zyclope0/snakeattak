// Mise à jour par-dessus les données d'un testeur, sans le paquet du build 63 : on rend à
// l'appareil ce que le build 63 y avait écrit (`tests/fixtures/appareil-build-63.json`, figé
// par `upgrade-63.mjs`), puis on ouvre le paquet d'aujourd'hui. C'est la moitié « après » de
// `upgrade-63.mjs`, assez légère pour tourner à chaque PR.
//   node --experimental-strip-types scripts/hygiene/update-frozen.mjs [dossier]
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { open, ORIGIN } from './harness.mjs';
import { checkUpdate } from './update-checks.mjs';

const [dir = 'dist-android'] = process.argv.slice(2);
const device = JSON.parse(await readFile('tests/fixtures/appareil-build-63.json', 'utf8'));
const before = { ...device.attendu, storage: device.storage };
await mkdir('artifacts/hygiene', { recursive: true });
const shot = (page, name) => page.screenshot({ path: `artifacts/hygiene/update-${name}.png` });
const checks = [];
const { browser, page, report } = await open({ dir, storage: device.storage });
try {
  await page.clock.install();
  await page.goto(`${ORIGIN}/`);
  // A device with two players asks who plays when the application opens: the one who played
  // last, as after an update in place.
  const active = before.players.activeId;
  await page.locator(`#players-dialog [data-player="${active}"] button`).first().click();
  await page.locator('#players-dialog').waitFor({ state: 'hidden' });
  await page.locator('#home-primary').waitFor({ state: 'visible' });
  await checkUpdate({ page, report, before, checks, shot });
  const out = { recipe: 'update-frozen', dir, checks };
  await writeFile('artifacts/hygiene/update-frozen.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
} catch (error) {
  await shot(page, 'echec').catch(() => {});
  console.error(report);
  assert.fail(error);
} finally {
  await browser.close();
}
