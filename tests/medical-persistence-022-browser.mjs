import { showHomePage } from './browser-entry.mjs';
import assert from 'node:assert/strict';
import { launchChromium, FAMILY_STORAGE_KEY } from '../scripts/lib/recipe.mjs';
import { Game } from '../src/game.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { createCareer } from '../src/progression.ts';
import { createMissionProgressController } from '../src/missionProgress.ts';
import { writeFamilyBackup, readFamilyBackup } from '../src/familyBackup.ts';
const browser = await launchChromium();
const errors = [];
async function state(p) {
  return p.evaluate(
    (key) =>
      JSON.parse(JSON.parse(localStorage.getItem(key)).camp).units.find((u) => u.kind === 'medic'),
    FAMILY_STORAGE_KEY,
  );
}
try {
  for (const phase of ['ready', 'returning', 'restocking']) {
    const context = await browser.newContext({
      locale: 'fr-CH',
      viewport: { width: 390, height: 844 },
      acceptDownloads: true,
    });
    const p = await context.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    const g = new Game(2207);
    g.gold = 500;
    assert.ok(g.recruit('medic', 864, 360));
    const medic = g.units.find((u) => u.kind === 'medic');
    medic.medical = {
      bandages: phase === 'ready' ? 2 : 0,
      phase,
      remaining: phase === 'restocking' ? 2.5 : 0,
    };
    medic.cool = 1.23;
    if (phase === 'restocking') {
      medic.x = 984;
      medic.y = 324;
    }
    const progress = createMissionProgressController();
    progress.sync(g);
    const raw = writeFamilyBackup(encodeCheckpoint(g), createCareer().state, progress.state);
    assert.ok(raw);
    await p.goto(process.env.GAME_URL);
    await p.locator('#home-screen').waitFor({ state: 'visible' });
    await showHomePage(p, 'parents');
    await p.locator('#home-family').click();
    await p.locator('#family-dialog[open]').waitFor();
    await p.locator('#family-file').setInputFiles({
      name: 'bandages.json',
      mimeType: 'application/json',
      buffer: Buffer.from(raw),
    });
    await p.locator('#family-apply').click();
    assert.deepEqual((await state(p)).medical, medic.medical);
    assert.equal((await state(p)).medicalCool, 1.23);
    await p.reload();
    await p.locator('#home-screen').waitFor({ state: 'visible' });
    assert.deepEqual((await state(p)).medical, medic.medical);
    assert.equal((await state(p)).medicalCool, 1.23);
    await showHomePage(p, 'parents');
    await p.locator('#home-family').click();
    await p.locator('#family-dialog[open]').waitFor();
    const download = p.waitForEvent('download');
    await p.locator('#family-export').click();
    const file = await download;
    const { readFile } = await import('node:fs/promises');
    const exported = readFamilyBackup(await readFile(await file.path(), 'utf8'));
    assert.ok(exported);
    const restored = JSON.parse(exported.camp).units.find((u) => u.kind === 'medic');
    assert.deepEqual(restored.medical, medic.medical);
    assert.equal(restored.medicalCool, 1.23);
    const invalid = JSON.parse(raw),
      bad = JSON.parse(invalid.camp);
    bad.units.find((u) => u.kind === 'medic').medical.bandages = 999;
    invalid.camp = JSON.stringify(bad);
    await p.locator('#family-file').setInputFiles({
      name: 'invalide.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(invalid)),
    });
    await p.waitForFunction(() =>
      document.getElementById('family-status').textContent.includes('invalide'),
    );
    assert.ok(await p.locator('#family-apply').isDisabled());
    assert.deepEqual((await state(p)).medical, medic.medical);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    'Medical persistence: partial stock, return, restock, cooldown, reload, export and invalid import preserved.',
  );
} finally {
  await browser.close();
}
