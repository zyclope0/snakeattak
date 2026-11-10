import { enterBattle } from './browser-entry.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { Game } from '../src/game.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';
import { REWARDS } from '../src/rewards.ts';
const url = process.env.GAME_URL;
assert.ok(url);
function camp(seed = 23, wave = 4) {
  const g = new Game(seed);
  g.wave = wave - 1;
  g.startWave();
  g.remaining = 0;
  g.eggs = [];
  g.enemies = [];
  g.step(1 / 30);
  return g;
}
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [],
  external = [];
await mkdir('artifacts', { recursive: true });
async function pageFor(g, viewport = { width: 1440, height: 1050 }, earlyDialog = false) {
  const context = await browser.newContext({
    locale: 'fr-CH',
    viewport,
    reducedMotion: 'reduce',
  });
  if (earlyDialog)
    await context.addInitScript(() => {
      // Synthetic stress timing: a real visible start click opens Help during
      // dispatch, immediately before the existing handler renders battle/rewards.
      // No hidden or inert control is clicked by the test.
      const openDuringStart = (event) => {
        if (!event.target.closest('#home-continue, #home-new')) return;
        document.removeEventListener('click', openDuringStart, true);
        document.getElementById('help-dialog').showModal();
      };
      document.addEventListener('click', openDuringStart, true);
    });
  const p = await context.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('request', (r) => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(url).origin)
      external.push(r.url());
  });
  await p.goto(url);
  await p.locator('#home-screen').waitFor({ state: 'visible' });
  // Seed only this fresh test context. Subsequent reloads run the application alone.
  const boot = p.waitForEvent('load');
  await p.evaluate((raw) => {
    localStorage.setItem('conquete-serpents:camp:v1', raw);
    localStorage.removeItem('conquete-serpents:family:v1');
    sessionStorage.setItem('chapter-fixture', '1');
    location.reload();
  }, encodeCheckpoint(g));
  await boot;
  await enterBattle(p);
  await p.locator('canvas').waitFor();
  return { p, context };
}
const save = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('conquete-serpents:camp:v1')));
try {
  const modal = await pageFor(camp(), undefined, true);
  assert.ok(await modal.p.locator('#help-dialog').isVisible());
  assert.ok(await modal.p.evaluate(() => !!document.activeElement.closest('#help-dialog')));
  await modal.p.waitForTimeout(350);
  assert.ok(await modal.p.evaluate(() => !!document.activeElement.closest('#help-dialog')));
  await modal.context.close();
  const g = camp();
  const { p, context } = await pageFor(g);
  assert.equal(await p.locator('[data-reward]').count(), 3, 'Three reward buttons are missing');
  const ids = await p
    .locator('[data-reward]')
    .evaluateAll((nodes) => nodes.map((n) => n.dataset.reward));
  assert.deepEqual(ids, g.rewardOffer);
  assert.ok(await p.locator('#start').isDisabled());
  await p.reload();
  await enterBattle(p);
  await p.locator('canvas').waitFor();
  assert.deepEqual(
    await p.locator('[data-reward]').evaluateAll((nodes) => nodes.map((n) => n.dataset.reward)),
    ids,
  );
  await p.locator('#pause').click();
  assert.ok(await p.locator('[data-reward]').first().isDisabled());
  await p.locator('#help').click();
  assert.ok(await p.locator('#help-dialog').isVisible());
  await p.keyboard.press('Escape');
  assert.ok(await p.locator('[data-reward]').first().isDisabled());
  await p.locator('#pause').click();
  await p.locator('[data-reward]').first().focus();
  await p.keyboard.press('Tab');
  await p.waitForTimeout(350);
  assert.equal(await p.evaluate(() => document.activeElement.dataset.reward), ids[1]);
  await p.screenshot({ path: 'artifacts/bonus-017-desktop.png', fullPage: true });
  const unitId = ids.find((id) => REWARDS[id].kind),
    kind = REWARDS[unitId].kind;
  await p.locator(`[data-reward="${unitId}"]`).click();
  assert.ok(await p.locator('#reward-panel').isHidden());
  assert.ok((await p.locator(`[data-kind="${kind}"] .price`).innerText()).includes('Offert'));
  const point = Array.from({ length: 16 }, (_, i) => ({ x: 612 + i * 24, y: 324 })).find((pt) =>
    g.canRecruit(kind, pt.x, pt.y),
  );
  assert.ok(point);
  const before = await save(p),
    rect = await p.locator('canvas').boundingBox();
  await p.mouse.click(
    rect.x + (rect.width * point.x) / 1100,
    rect.y + (rect.height * point.y) / 620,
  );
  await p.waitForFunction(
    (n) => JSON.parse(localStorage.getItem('conquete-serpents:camp:v1')).units.length === n,
    before.units.length + 1,
  );
  const after = await save(p);
  assert.equal(after.gold, before.gold);
  assert.ok(after.rewards.choices[0].used);
  assert.ok(decodeCheckpoint(JSON.stringify(after)), 'The real saved camp must decode');
  await p.evaluate(() => sessionStorage.removeItem('chapter-fixture'));
  await p.reload();
  await enterBattle(p);
  await p.locator('canvas').waitFor();
  const loaded = await save(p);
  if (loaded.units.length !== after.units.length)
    console.error(
      'Reload diagnostic',
      JSON.stringify({
        after,
        loaded,
        decodedBefore: !!decodeCheckpoint(JSON.stringify(after)),
        status: await p.locator('#save-status').innerText(),
        flag: await p.evaluate(() => sessionStorage.getItem('chapter-fixture')),
      }),
    );
  assert.equal(loaded.units.length, after.units.length);
  assert.equal(
    await p.evaluate(() => sessionStorage.getItem('chapter-fixture')),
    null,
    'Une recharge ne doit jamais réinjecter la fixture de départ',
  );
  // The family envelope is authoritative even if a legacy mirror is absent.
  if (await p.evaluate(() => localStorage.getItem('conquete-serpents:family:v1'))) {
    await p.evaluate(() => localStorage.removeItem('conquete-serpents:camp:v1'));
    await p.reload();
    await enterBattle(p);
    await p.locator('canvas').waitFor();
    assert.equal(
      await p.evaluate(() => sessionStorage.getItem('chapter-fixture')),
      null,
      'La fixture ne doit pas revenir quand le miroir historique est absent',
    );
    assert.equal((await save(p)).units.length, after.units.length);
  }
  assert.ok(!(await p.locator(`[data-kind="${kind}"] .price`).innerText()).includes('Offert'));
  assert.ok(await p.locator('#start').isEnabled());
  await context.close();
  for (const width of [390, 320]) {
    const { p, context } = await pageFor(camp(51, 8), { width, height: 844 });
    await p.locator('#reward-panel').scrollIntoViewIfNeeded();
    const sizes = await p.locator('[data-reward]').evaluateAll((ns) =>
      ns.map((n) => ({
        width: n.getBoundingClientRect().width,
        height: n.getBoundingClientRect().height,
      })),
    );
    assert.ok(sizes.every((s) => s.width >= 44 && s.height >= 44));
    assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await p.screenshot({ path: `artifacts/bonus-017-mobile-${width}.png`, fullPage: true });
    await p.locator('#skip-reward').click();
    assert.ok(await p.locator('#start').isEnabled());
    assert.equal((await save(p)).rewards.choices[0].id, 'skip');
    await context.close();
  }
  for (const id of ['miel', 'cristal', 'pieces']) {
    let g;
    for (let seed = 1; seed < 100; seed++) {
      g = camp(seed);
      if (g.rewardOffer.includes(id)) break;
    }
    const { p, context } = await pageFor(g);
    await p.locator(`[data-reward="${id}"]`).click();
    const chosen = await save(p);
    assert.equal(chosen.rewards.choices[0].id, id);
    if (id === 'pieces') assert.equal(chosen.gold, g.gold + 100);
    if (id === 'cristal') assert.equal(chosen.rewards.ward, 18);
    if (id === 'miel')
      assert.ok(
        (await p.locator('[data-feast-lane="1"]').getAttribute('title')).includes('18 secondes'),
      );
    await p.reload();
    await enterBattle(p);
    await p.locator('canvas').waitFor();
    assert.deepEqual((await save(p)).rewards, chosen.rewards);
    assert.equal((await save(p)).gold, chosen.gold);
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    JSON.stringify({
      rewards: true,
      pendingReload: true,
      singleClaim: true,
      freePlacement: true,
      keyboard: true,
      pause: true,
      viewports: [1440, 390, 320],
      pageErrors: errors,
      externalRequests: external.length,
      portable: url.startsWith('file:'),
    }),
  );
} finally {
  await browser.close();
}
