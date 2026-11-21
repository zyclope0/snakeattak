// Doubles appuis : chaque bouton qui donne ou dépense quelque chose est touché deux fois de
// suite. Rien ne doit être compté deux fois.
//   node --experimental-strip-types scripts/hygiene/double-taps.mjs [dossier]
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { open, start, status, boardReady, text, tapBoard, playOut, snapshot } from './harness.mjs';
import { showHomePage } from '../../tests/browser-entry.mjs';
import { revealControl } from '../../tests/reveal-controls.mjs';

const { Game } = await import('../../src/game.ts');
const { encodeCheckpoint, decodeCheckpoint } = await import('../../src/checkpoints.ts');
const KEYS = await import('../../src/storageKeys.ts');
const [dir = 'dist-android'] = process.argv.slice(2);
await mkdir('artifacts/hygiene', { recursive: true });
const checks = [];
/** Two taps on the same control, as fast as a finger bounces. */
const twice = async (page, selector) => {
  const box = await page.locator(selector).first().boundingBox();
  const point = [box.x + box.width / 2, box.y + box.height / 2];
  await page.touchscreen.tap(...point);
  await page.touchscreen.tap(...point);
};
const camp = async (page) =>
  decodeCheckpoint(JSON.parse((await snapshot(page))[KEYS.FAMILY_STORAGE_KEY]).camp);

// 1. Great adventure: « Lancer la vague » twice, then a purchase tapped twice on the board.
{
  const { browser, page, report } = await open({ dir });
  try {
    await page.clock.install();
    await start(page);
    await showHomePage(page, 'classic');
    await page.locator('#home-new').click();
    await boardReady(page);
    await revealControl(page, '[data-kind="club"]');
    await page.locator('[data-kind="club"]').click();
    await page.clock.runFor(400);
    const gold = Number(await text(page, '#gold'));
    const box = await page.locator('#game canvas').boundingBox();
    const point = [box.x + (box.width * 930) / 1100, box.y + (box.height * 520) / 620];
    await page.touchscreen.tap(...point);
    await page.touchscreen.tap(...point);
    await page.clock.runFor(400);
    const spent = gold - Number(await text(page, '#gold'));
    assert.equal(await text(page, '#army-count'), '4', 'one ally for two taps on the same spot');
    assert.ok(spent > 0 && spent < 100, `one price paid: ${spent}`);
    await twice(page, '#start');
    await page.clock.runFor(400);
    assert.equal(await text(page, '#wave'), '1', 'two taps start one wave');
    assert.equal(await playOut(page, { waves: 0 }), 'fighting');
    for (let i = 0; i < 400 && (await status(page)) === 'fighting'; i++)
      await page.clock.runFor(1000);
    assert.equal(await text(page, '#wave'), '1');
    assert.deepEqual(report.errors, []);
    checks.push(`purchase tapped twice: one ally, ${spent} coins; start tapped twice: wave 1`);
  } finally {
    await browser.close();
  }
}

// 2. Great adventure: a reward card tapped twice at the camp of wave 4.
{
  const game = new Game(33);
  game.wave = 4;
  game.rewards.pending = 4;
  game.normalizeCamp();
  const { browser, page, report } = await open({
    dir,
    storage: { [KEYS.CAMP_STORAGE_KEY]: encodeCheckpoint(game) },
  });
  try {
    await page.clock.install();
    await start(page);
    await showHomePage(page, 'classic');
    await page.locator('#home-continue').click();
    await boardReady(page);
    await page.locator('#reward-cards [data-reward]').first().waitFor({ state: 'visible' });
    const before = await camp(page);
    await twice(page, '#reward-cards [data-reward]');
    await page.clock.runFor(500);
    const after = await camp(page);
    await page.screenshot({ path: 'artifacts/hygiene/double-recompense.png' });
    assert.equal(after.rewards.choices.length, 1, 'one card chosen');
    assert.equal(after.rewards.pending, null, 'no card waits any more');
    assert.ok(
      after.units.length - before.units.length <= 1 && after.gold - before.gold <= 200,
      'one reward only',
    );
    assert.deepEqual(report.errors, []);
    checks.push(`reward card tapped twice: one choice (${after.rewards.choices[0].id})`);
  } finally {
    await browser.close();
  }
}

// 3. Expedition: « C'est parti ! », « Continuer » and a gift, each tapped twice.
{
  const { browser, page, report } = await open({ dir });
  const log = async () => JSON.parse((await snapshot(page))[KEYS.EXPEDITION_STORAGE_KEY]);
  try {
    await page.clock.install();
    await start(page);
    // The door tapped twice opens the page and starts no battle.
    await twice(page, '#home-voyage');
    await page.locator('.exp-go').first().waitFor();
    await page.clock.runFor(400);
    assert.equal(await page.locator('#home-screen').getAttribute('data-page'), 'expedition');
    await twice(page, '.exp-go');
    await boardReady(page);
    assert.equal(await status(page), 'preparing', 'one battle opens');
    assert.equal(await playOut(page), 'won');
    assert.equal((await log()).best, 1);
    // « Continuer » tapped twice: the gifts are drawn under the finger, none is taken.
    await twice(page, '#voyage-continue');
    await page.locator('.exp-gift').first().waitFor();
    await page.clock.runFor(400);
    assert.equal((await log()).current.pending.kind, 'gift', 'the gift still waits');
    assert.equal((await log()).current.boons.length, 0, 'no gift was taken by the second tap');
    await twice(page, '.exp-gift');
    await page.clock.runFor(500);
    const after = await log();
    await page.screenshot({ path: 'artifacts/hygiene/double-cadeau.png' });
    const held = after.current.boons.length + after.current.bag.length;
    assert.ok(
      held <= 1 && after.current.purse <= 400,
      `one gift for two taps: ${JSON.stringify(after.current)}`,
    );
    assert.equal(after.current.pending, null, 'the gift is answered');
    assert.equal(after.best, 1, 'the step counts once');
    assert.deepEqual(report.errors, []);
    checks.push('expedition: go, continue and gift tapped twice: one battle, one step, one gift');
  } finally {
    await browser.close();
  }
}
const out = { recipe: 'double-taps', dir, checks };
await writeFile('artifacts/hygiene/double-taps.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
