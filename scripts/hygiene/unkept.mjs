// Quand ce qui est joué n'est pas gardé. Sur le vrai paquet :
//  1. l'appareil se met à refuser les écritures juste avant une vague : rien ne s'affiche
//     pendant le combat ; à la fin de la vague, la fenêtre « Ta partie n'est pas gardée » ;
//     sur l'accueil, une marque qui la rouvre ; quand l'appareil garde de nouveau, l'accueil
//     le dit ; un second refus est redit ;
//  2. un appareil qui n'a jamais rien gardé (stockage illisible) : pas de fenêtre à l'arrivée,
//     la marque seule ; la fenêtre après la première vague gagnée, avec sa propre phrase ;
//  3. des écritures refusées dès l'arrivée : rien pendant le combat, même quand le jeu essaie
//     d'écrire en pleine vague ; rien par-dessus « Qui joue ? », la fenêtre après « Jouer » ;
//  4. une vague à cadeaux : rien par-dessus les cadeaux, la fenêtre une fois le cadeau choisi ;
//  5. l'aventure sans fin, juste après un roi, écritures refusées : la fenêtre ; le record
//     refusé est réécrit quand l'appareil garde de nouveau, et l'accueil le dit.
//   node --experimental-strip-types scripts/hygiene/unkept.mjs [dossier]
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { open, start, status, boardReady, text, fits, ORIGIN, snapshot } from './harness.mjs';
import { leaveBattle } from '../../tests/browser-entry.mjs';

const [dir = 'dist-android'] = process.argv.slice(2);
await mkdir('artifacts/hygiene', { recursive: true });
const checks = [];
const FR = await import('../../src/texts/fr/failure.ts');
const KEYS = await import('../../src/storageKeys.ts');
/**
 * Installed before the game starts: every write refused while `window.refused` is true. The
 * page may be read again (going home from the endless adventure does): what `refuse` last
 * said is kept in the tab's name, which survives it.
 */
const ARMED = () => {
  const write = Storage.prototype.setItem;
  window.refused = window.name !== 'accepted';
  // `only:<key>` in the tab's name: that key alone is refused.
  const only = window.name.startsWith('only:') ? window.name.slice(5) : null;
  window.patched = true;
  Storage.prototype.setItem = function (key, value) {
    if (window.refused && (!only || key === only))
      throw new DOMException('full', 'QuotaExceededError');
    return write.call(this, key, value);
  };
};
const SIZES = [
  { width: 780, height: 360 },
  { width: 812, height: 375 },
  { width: 1280, height: 800 },
];

/** From now on the device refuses every write, or accepts them again. */
const refuse = (page, on) =>
  page.evaluate((refused) => {
    window.refused = refused;
    window.name = refused ? '' : 'accepted';
    if (window.patched) return;
    window.patched = true;
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.refused) throw new DOMException('full', 'QuotaExceededError');
      return write.call(this, key, value);
    };
  }, on);
/** Lets the wave under way end, taking the gift it may offer. */
async function endWave(page) {
  for (let step = 0; step < 400 && (await status(page)) === 'fighting'; step++)
    await page.clock.runFor(1000);
  await page.clock.runFor(400);
  const gift = page.locator('#reward-cards [data-reward]').first();
  if (await gift.isVisible()) await gift.click();
  await page.clock.runFor(400);
}
/** Starts the next wave, taking first the gift that may still wait to be chosen. */
async function startWave(page) {
  const gift = page.locator('#reward-cards [data-reward]').first();
  if (await gift.isVisible()) await gift.click();
  // A battle left through the pause panel is still paused when the player comes back.
  const resume = page.locator('#resume-game');
  if (await resume.isVisible()) await resume.click();
  await page.locator('#start:not([disabled])').click();
  await page.waitForFunction(() => document.querySelector('#app')?.dataset.status === 'fighting');
}
const home = async (page) => {
  await leaveBattle(page);
  await page.locator('#home-primary').waitFor({ state: 'visible' });
};
/** The window, as it must be: its words, folded for the parent, inside the screen. */
async function shown(page, parents, label) {
  const window = page.locator('#unkept-dialog[open]');
  await window.waitFor({ state: 'visible' });
  assert.equal(await text(page, '#unkept-title'), FR.taPartieNEstPasGardee);
  assert.equal(await text(page, '#unkept-dialog > p'), FR.tuPeuxContinuerAJouerSiTuFermes);
  assert.equal(await text(page, '#unkept-button'), FR.jAiCompris);
  assert.equal(await page.locator('#unkept-parents').getAttribute('open'), null, 'folded');
  await fits(page, '#unkept-dialog', label);
  await page.locator('#unkept-parents > summary').click();
  assert.equal(await text(page, '#unkept-parents > p'), parents);
  await fits(page, '#unkept-dialog', `${label}, unfolded`);
  return window;
}

for (const viewport of SIZES) {
  const tag = `${viewport.width}x${viewport.height}`;
  const { browser, page, report } = await open({ dir, viewport, touch: viewport.width < 1000 });
  try {
    await start(page);
    assert.equal(await page.locator('#unkept-mark').count(), 0, 'a device that keeps: no mark');
    await page.locator('#home-primary').click();
    await boardReady(page);
    await refuse(page, true);
    await startWave(page);
    await page.clock.runFor(3000);
    assert.equal(await status(page), 'fighting');
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'never over a fight');
    await endWave(page);
    const window = await shown(page, FR.lAppareilNASansDoutePlusAssezDePlace, `${tag} window`);
    await page.screenshot({ path: `artifacts/hygiene/unkept-${tag}.png` });
    await page.locator('#unkept-button').click();
    // The button closes it, and the game goes on.
    await page.locator('#unkept-dialog').waitFor({ state: 'detached' });
    checks.push(
      `${tag} : écriture refusée, rien pendant le combat, la fenêtre à la fin de la vague`,
    );

    // Once told, it is not told again for the same refusal; the home keeps a mark.
    await home(page);
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'told once');
    const mark = page.locator('button#unkept-mark');
    await mark.waitFor({ state: 'visible' });
    assert.equal(await text(page, '#unkept-mark'), FR.partieNonGardee);
    const size = await mark.boundingBox();
    assert.ok(size.height >= 48 && size.width >= 48, `a mark of ${size.width}×${size.height}`);
    const view = page.viewportSize();
    assert.ok(size.x >= 0 && size.x + size.width <= view.width, 'the mark is inside the screen');
    await page.screenshot({ path: `artifacts/hygiene/unkept-mark-${tag}.png` });
    await mark.click();
    await window.waitFor({ state: 'visible' });
    // Escape closes it too: the game behind it works.
    await page.keyboard.press('Escape');
    await page.locator('#unkept-dialog').waitFor({ state: 'detached' });
    checks.push(`${tag} : sur l'accueil, la marque « Partie non gardée » rouvre la fenêtre`);

    // The device keeps the game again: the home says so, until the player has seen it.
    await refuse(page, false);
    await page.locator('#home-primary').click();
    await boardReady(page);
    await home(page);
    const healed = page.locator('span#unkept-mark');
    await healed.waitFor({ state: 'visible' });
    assert.equal(await text(page, '#unkept-mark'), FR.cEstRepareTaPartieEstDeNouveauGardee);
    assert.equal(await page.locator('#unkept-dialog').count(), 0);
    await page.screenshot({ path: `artifacts/hygiene/unkept-healed-${tag}.png` });
    await page.locator('#home-primary').click();
    await boardReady(page);
    await home(page);
    assert.equal(await page.locator('#unkept-mark').count(), 0, 'seen once, the sentence goes');
    checks.push(`${tag} : l'appareil garde de nouveau, l'accueil le dit, puis la phrase s'en va`);

    // A second refusal is a second time: it is told again.
    await page.locator('#home-primary').click();
    await boardReady(page);
    await refuse(page, true);
    await startWave(page);
    await endWave(page);
    await page.locator('#unkept-dialog[open]').waitFor({ state: 'visible' });
    checks.push(`${tag} : un second refus est redit`);
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}

// A device that never let the game keep anything: its storage cannot even be read.
{
  const { browser, page } = await open({ dir });
  try {
    await page.addInitScript(() => {
      const refuse = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
      Storage.prototype.getItem = refuse;
      Storage.prototype.setItem = refuse;
    });
    await start(page);
    // Nothing stops a child who has just arrived; the home carries the mark.
    await page.locator('button#unkept-mark').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'no window at the door');
    await page.locator('#home-primary').click();
    await boardReady(page);
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'nor before a wave is won');
    await startWave(page);
    await endWave(page);
    await shown(page, FR.cetAppareilNeLaissePasLeJeuGarder, 'blocked storage');
    checks.push(
      'stockage illisible : pas de fenêtre à l’arrivée, la marque seule ; la fenêtre après la première vague gagnée',
    );
  } finally {
    await browser.close();
  }
}
// Writes refused from the door: the game tries to write during the wave too. Nothing is shown
// while the child fights; the window comes when the wave is over.
{
  const { browser, page, report } = await open({ dir });
  try {
    await page.addInitScript(ARMED);
    await start(page);
    await page.locator('#home-primary').click();
    await boardReady(page);
    await startWave(page);
    for (let second = 0; second < 6; second++) {
      await page.clock.runFor(1000);
      if ((await status(page)) !== 'fighting') break;
      assert.equal(await page.locator('#unkept-dialog').count(), 0, 'never over a fight');
    }
    await endWave(page);
    await page.locator('#unkept-dialog[open]').waitFor({ state: 'visible' });
    checks.push('écritures refusées dès l’arrivée : rien pendant la vague, la fenêtre à sa fin');
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}

// Two players, the one chosen with a camp at wave 3 and no family file yet; writes refused
// from the door. « Qui joue ? » is a window: nothing is shown over it. The child presses
// « Jouer »: then the window comes.
{
  const { Game } = await import('../../src/game.ts');
  const { encodeCheckpoint } = await import('../../src/checkpoints.ts');
  const device = JSON.parse(await readFile('tests/fixtures/appareil-build-63.json', 'utf8'));
  const storage = { ...(device.storage ?? device) };
  const game = new Game(33);
  game.wave = 3;
  game.normalizeCamp();
  const camp = Object.keys(storage).find((key) => /camp:v1:p2$/.test(key));
  const second = camp ?? `${KEYS.CAMP_STORAGE_KEY}:p2`;
  storage[second] = encodeCheckpoint(game);
  for (const key of Object.keys(storage)) if (/family:v1:p2$/.test(key)) delete storage[key];
  const { browser, page, report } = await open({ dir, storage });
  try {
    await page.addInitScript(ARMED);
    await page.goto(`${ORIGIN}/`);
    const players = page.locator('#players-dialog[open]');
    await players.waitFor({ state: 'visible' });
    await page.clock.runFor(2500);
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'nothing over « Qui joue ? »');
    await page.locator('#players-dialog [data-player="p2"] button').first().click();
    await players.waitFor({ state: 'detached' }).catch(() => players.waitFor({ state: 'hidden' }));
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'nor on the home');
    await page.locator('#home-primary').click();
    await page.locator('#unkept-dialog[open]').waitFor({ state: 'visible' });
    checks.push(
      'deux joueurs, écritures refusées : rien par-dessus « Qui joue ? », la fenêtre après « Jouer »',
    );
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}

// A milestone wave offers gifts on a panel, which is not a window: the window waits until a
// gift is chosen, and comes then.
{
  const { Game } = await import('../../src/game.ts');
  const { encodeCheckpoint } = await import('../../src/checkpoints.ts');
  const { showHomePage } = await import('../../tests/browser-entry.mjs');
  const game = new Game(33);
  game.wave = 3;
  game.gold = 5000;
  game.normalizeCamp();
  const { browser, page, report } = await open({
    dir,
    storage: { [KEYS.CAMP_STORAGE_KEY]: encodeCheckpoint(game) },
  });
  try {
    await start(page);
    await showHomePage(page, 'classic');
    await page.locator('#home-continue').click();
    await boardReady(page);
    await refuse(page, true);
    await startWave(page);
    for (let step = 0; step < 400 && (await status(page)) === 'fighting'; step++)
      await page.clock.runFor(1000);
    const gift = page.locator('#reward-cards [data-reward]').first();
    await gift.waitFor({ state: 'visible' });
    await page.clock.runFor(1500);
    assert.equal(await page.locator('#unkept-dialog').count(), 0, 'nothing over the gifts');
    await gift.click();
    await page.locator('#unkept-dialog[open]').waitFor({ state: 'visible' });
    checks.push(
      'vague à cadeaux : rien par-dessus les cadeaux, la fenêtre une fois le cadeau choisi',
    );
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}

/** A camp of the endless adventure just after a king, its gift still to choose. */
async function endlessKingCamp() {
  const { Game } = await import('../../src/game.ts');
  const { ENDLESS_RULES } = await import('../../src/endless.ts');
  const { encodeCheckpoint } = await import('../../src/checkpoints.ts');
  const { freshRosters } = await import('../../src/roster.ts');
  const rules = ENDLESS_RULES[1];
  const game = new Game(4242, undefined, undefined, rules.balance, undefined, rules);
  game.wave = 11;
  game.status = 'preparing';
  game.rewards.pending = null;
  game.startWave();
  game.remaining = 0;
  game.enemies = [];
  game.eggs = [];
  game.step(1 / 30);
  const career = JSON.stringify({
    version: 1,
    bestStars: [3, 3, 3],
    rosters: freshRosters(),
    activeRoster: 0,
    chapterCamps: [null, null],
  });
  const storage = {
    [KEYS.CAREER_STORAGE_KEY]: career,
    [KEYS.CAMP_STORAGE_KEY]: encodeCheckpoint(game),
    [KEYS.LANGUAGE_KEY]: 'fr',
  };
  return storage;
}

// The endless adventure, just after a king: the camp is at wave 0 with a gift to choose, and
// the device refuses every write. A king beaten is something to lose: the window comes. The
// record of the king is refused. The parent frees space, the child goes home and plays on: the
// record is written at the next save, and the home says the game is kept again.
{
  const storage = await endlessKingCamp();
  const { browser, page, report } = await open({ dir, storage });
  try {
    await page.addInitScript(ARMED);
    await page.goto(`${ORIGIN}/`);
    // A king beaten is something to lose: the child is told at once, at the home.
    await page.locator('#unkept-dialog[open]').waitFor({ state: 'visible' });
    await page.locator('#unkept-button').click();
    await page.locator('#unkept-dialog').waitFor({ state: 'detached' });
    if (await page.locator('#home-primary').isVisible())
      await page.evaluate(() => document.querySelector('[data-home-target="classic"]').click());
    if (await page.locator('#home-continue').isVisible()) await page.click('#home-continue');
    await page.locator('#reward-panel').waitFor({ state: 'visible' });
    await page.locator('#reward-cards button:visible').first().click();
    await page.clock.runFor(500);
    assert.equal((await snapshot(page))[KEYS.ENDLESS_RECORDS_KEY], undefined, 'record refused');
    checks.push(
      'après un roi de l’aventure sans fin, écritures refusées : la fenêtre ; le record refusé',
    );
    // The words of the home are watched as they come: once seen, they go when the home is left.
    await page.evaluate(() => {
      window.healed = [];
      new MutationObserver(() => {
        const mark = document.querySelector('span#unkept-mark');
        if (mark) window.healed.push(mark.textContent);
      }).observe(document.body, { childList: true, subtree: true });
    });
    await refuse(page, false);
    await page.click('#endless-home');
    await page.locator('#home-screen').waitFor();
    // Going home saves nothing; the next save tries the record again, as it tries the file.
    await page.locator('#home-primary').click();
    await boardReady(page);
    await home(page);
    assert.ok(
      (await page.evaluate(() => window.healed)).includes(FR.cEstRepareTaPartieEstDeNouveauGardee),
      'the home said the game is kept again',
    );
    assert.equal(await page.locator('button#unkept-mark').count(), 0, 'no « non gardée » mark');
    const kept = (await snapshot(page))[KEYS.ENDLESS_RECORDS_KEY];
    assert.equal(
      JSON.parse(kept ?? '{}').best?.[0]?.kings,
      1,
      'the record of the king is on the device',
    );
    checks.push(
      'le record refusé est écrit quand l’appareil garde de nouveau, et l’accueil le dit',
    );
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}

// Only the records are refused, the family file is kept: the record alone tells the family.
{
  const { browser, page, report } = await open({ dir, storage: await endlessKingCamp() });
  try {
    await page.addInitScript(
      (key) => (window.name = window.name === 'accepted' ? window.name : `only:${key}`),
      KEYS.ENDLESS_RECORDS_KEY,
    );
    await page.addInitScript(ARMED);
    await page.goto(`${ORIGIN}/`);
    await page.locator('#unkept-dialog[open]').waitFor({ state: 'visible' });
    assert.equal(await text(page, '#unkept-parents > p'), FR.lAppareilNASansDoutePlusAssezDePlace);
    const stored = await snapshot(page);
    assert.ok(stored[KEYS.FAMILY_STORAGE_KEY], 'the family file is kept');
    assert.equal(stored[KEYS.ENDLESS_RECORDS_KEY], undefined, 'the record is not');
    checks.push('seuls les records refusés : la fenêtre le dit, le fichier familial étant gardé');
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
}
console.log(JSON.stringify({ ok: true, checks }, null, 2));
