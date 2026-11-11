import { revealControl } from '../tests/reveal-controls.mjs';
import { showHomePage } from '../tests/browser-entry.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { lanePoint } from '../src/routes.ts';
const fixture = 'child-mobile-035-fixture.html';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const artifact = `artifacts/child-mobile-${version}`;
let preview, dev, browser;
const errors = [],
  sizes = [];
async function ready(url) {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    if (i > 120) throw Error('Server unavailable');
    await delay(100);
  }
}
async function launch(page, url) {
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await showHomePage(page, 'missions');
  await page.locator('#home-play').click();
  await page.locator('#mission-launch').click();
  await page.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
}
async function tapWorld(page, point) {
  const b = await page.locator('#game canvas').boundingBox();
  await page.touchscreen.tap(b.x + (b.width * point.x) / 1100, b.y + (b.height * point.y) / 620);
}
try {
  await mkdir(artifact, { recursive: true });
  preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4361',
    '--strictPort',
  ]);
  await ready('http://127.0.0.1:4361');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height, insets] of [
    [812, 375, [0, 0, 0, 0]],
    [812, 375, [24, 48, 16, 0]],
    [568, 320, [0, 0, 0, 0]],
    [568, 320, [24, 48, 16, 0]],
    [480, 320, [24, 48, 16, 0]],
    [667, 375, [24, 0, 16, 48]],
  ]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width, height },
      hasTouch: true,
    });
    await launch(page, 'http://127.0.0.1:4361');
    await page.evaluate((safe) => {
      for (const [i, k] of ['top', 'right', 'bottom', 'left'].entries())
        document.documentElement.style.setProperty('--safe-area-inset-' + k, safe[i] + 'px');
    }, insets);
    assert.equal(
      await page.locator('#battle-dock [data-dock-kind]').count(),
      4,
      'Four permanent ally shortcuts',
    );
    await page.locator('#battle-dock').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#battle-dock [data-dock-feast]').count(), 2);
    const dock = await page.locator('#battle-dock').boundingBox(),
      canvas = await page.locator('#game canvas').boundingBox();
    assert.ok(canvas.x + canvas.width <= dock.x + 1, 'Dock never covers a lane');
    if (width === 812) {
      assert.ok(canvas.height >= (height - insets[0] - insets[2]) * 0.85);
      assert.ok(canvas.width >= (width - insets[1] - insets[3]) * 0.65);
    }
    for (const b of await page.locator('#battle-dock button').all()) {
      if (!(await b.isVisible())) continue;
      const r = await b.boundingBox();
      assert.ok(r.width >= 48 && r.height >= 48, 'Dock needs48px targets');
      assert.ok(
        r.y >= insets[0] && r.y + r.height <= height - insets[2] + 1,
        'Dock target fits safe viewport',
      );
    }
    assert.equal(
      await page.locator('#battle-dock').evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
      true,
      'Dock needs no scroll',
    );
    await page.screenshot({ path: `${artifact}/dock-${width}-${insets[1]}.png` });
    const catalogue = (await page.locator('#dock-catalogue').isVisible())
      ? '#dock-catalogue'
      : '#reinforcements-toggle';
    await page.locator(catalogue).click();
    assert.equal(await page.locator('#reinforcements').evaluate((d) => d.open), true);
    assert.equal(
      await page.locator('#battle-dock button').evaluateAll((ns) =>
        ns.every((n) => {
          const b = n.getBoundingClientRect();
          return !document
            .elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)
            ?.closest('#battle-dock');
        }),
      ),
      true,
      'Native catalogue covers every dock target',
    );
    await page.locator('#reinforcements-close').click();
    assert.equal(await page.locator('#battle-dock').isVisible(), true);
    if (height <= 350) {
      await page.locator('[data-dock-feast="lure"]').click();
      assert.equal(
        await page.locator('[data-dock-feast="lure"]').getAttribute('aria-pressed'),
        'true',
      );
      await page.locator('[data-dock-feast="lure"]').click();
      assert.equal(
        await page.locator('[data-dock-feast="lure"]').getAttribute('aria-pressed'),
        'false',
      );
    }
    sizes.push({ width, height, insets, dock, canvas });
    await page.close();
  }
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/mobile-031-harness.ts"',
    ),
  );
  dev = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4362',
    '--strictPort',
  ]);
  await ready('http://127.0.0.1:4362/' + fixture);
  const custom = await browser.newPage({
    locale: 'fr-CH',
    viewport: { width: 812, height: 375 },
    hasTouch: true,
  });
  await launch(custom, 'http://127.0.0.1:4361');
  const favourites = ['tank', 'trex', 'knight', 'dragon', 'archer', 'club', 'medic', 'ninja'];
  await custom.evaluate((favourites) => {
    const key = 'conquete-serpents:family:v1',
      profile = JSON.parse(localStorage.getItem(key));
    profile.career.rosters[0] = favourites;
    localStorage.setItem(key, JSON.stringify(profile));
  }, favourites);
  await custom.reload();
  await showHomePage(custom, 'missions');
  await custom.locator('#home-play').click();
  await custom.locator('#mission-launch').click();
  await custom.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  assert.deepEqual(
    await custom
      .locator('[data-dock-kind]')
      .evaluateAll((cards) => cards.map((card) => card.dataset.dockKind)),
    ['archer', 'club', 'medic', 'ninja'],
  );
  assert.deepEqual(
    await custom.evaluate(
      () => JSON.parse(localStorage.getItem('conquete-serpents:family:v1')).career.rosters[0],
    ),
    favourites,
  );
  await custom.evaluate(() => {
    const key = 'conquete-serpents:family:v1',
      profile = JSON.parse(localStorage.getItem(key));
    profile.career.rosters[0] = [
      'twohead',
      'mutantStretch',
      'stegosaurus',
      'triceratops',
      'tank',
      'trex',
      'dragon',
      'ninja',
    ];
    for (const id of Object.keys(profile.missions.bestStars))
      profile.missions.bestStars[id] = id === 'carrefour' ? 0 : 3;
    localStorage.setItem(key, JSON.stringify(profile));
  });
  await custom.setViewportSize({ width: 568, height: 320 });
  await custom.reload();
  await showHomePage(custom, 'missions');
  await custom.locator('#home-play').click();
  await custom.locator('#mission-launch').click();
  await custom.waitForFunction(
    () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
  );
  assert.deepEqual(
    await custom
      .locator('[data-dock-kind]')
      .evaluateAll((cards) => cards.map((card) => card.dataset.dockKind)),
    ['twohead', 'mutantStretch', 'stegosaurus', 'triceratops'],
  );
  const labelFits = await custom.locator('[data-dock-kind]').evaluateAll((cards) =>
    cards.every((card) => {
      const b = card.getBoundingClientRect(),
        name = card.querySelector('.dock-name').getBoundingClientRect(),
        portrait = card.querySelector('.portrait').getBoundingClientRect(),
        parent = card.parentElement.getBoundingClientRect();
      return (
        name.bottom <= b.bottom + 0.5 &&
        name.top >= b.top &&
        name.left >= b.left &&
        name.right <= b.right &&
        portrait.bottom <= name.top + 0.5 &&
        b.bottom <= parent.bottom + 0.5
      );
    }),
  );
  assert.equal(labelFits, true, 'Long names fit without clipping their portraits or labels');
  assert.equal(
    await custom.locator('#battle-dock').evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
    true,
  );
  await custom.close();
  const page = await browser.newPage({
    locale: 'fr-CH',
    viewport: { width: 812, height: 375 },
    hasTouch: true,
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4362/' + fixture);
  await page.waitForFunction(() => window.mobileInterface?.phaser.scene.isActive('Battle'));
  await page.locator('#battle-dock').waitFor();
  const initial = await page.evaluate(() => ({
    gold: window.mobileInterface.session.game.gold,
    units: window.mobileInterface.session.game.units.length,
  }));
  await page.locator('[data-dock-kind="archer"]').click();
  assert.equal(await page.evaluate(() => window.mobileInterface.session.game.gold), initial.gold);
  await tapWorld(page, { x: 950, y: 468 });
  await page.waitForFunction(
    (n) => window.mobileInterface.session.game.units.length === n + 1,
    initial.units,
  );
  assert.equal(
    await page.evaluate(() => window.mobileInterface.session.game.gold),
    initial.gold - 150,
  );
  assert.equal(await page.locator('#battle-dock').isVisible(), true);
  await page.locator('#start').click();
  assert.match(await page.locator('#message').textContent(), /défends/);
  await page.locator('[data-dock-feast="sticky"]').click();
  assert.equal(await page.evaluate(() => window.mobileInterface.session.selected), null);
  const level = await page.evaluate(() => window.mobileInterface.session.game.level);
  await tapWorld(page, lanePoint(750, 0, level));
  assert.equal(
    await page.evaluate(() => window.mobileInterface.session.game.feastUsed),
    false,
    'Peaceful lane costs no pot',
  );
  await tapWorld(page, { x: 700, y: 250 });
  assert.equal(await page.evaluate(() => window.mobileInterface.session.game.feastUsed), false);
  await page.locator('#pause').click();
  await page.evaluate(() =>
    document.querySelector('#game canvas').dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: 400,
        clientY: 200,
        pointerId: 1,
        pointerType: 'touch',
      }),
    ),
  );
  assert.equal(await page.evaluate(() => window.mobileInterface.session.game.feastUsed), false);
  await page.locator('#resume-game').click();
  await tapWorld(page, lanePoint(750, 1, level));
  await page.waitForFunction(() => window.mobileInterface.session.game.feast?.flavor === 'sticky');
  assert.equal(await page.evaluate(() => window.mobileInterface.session.selectedFeast), null);
  assert.equal(await page.locator('[data-dock-feast="sticky"]').isDisabled(), true);
  await page.screenshot({ path: `${artifact}/miel-tactile.png` });
  await page.reload();
  await page.waitForFunction(() => window.mobileInterface?.phaser.scene.isActive('Battle'));
  await page.locator('#start').click();
  await page.locator('[data-dock-feast="lure"]').click();
  await page.locator('[data-dock-kind="club"]').click();
  assert.equal(await page.evaluate(() => window.mobileInterface.session.selectedFeast), null);
  await page.locator('[data-dock-feast="lure"]').click();
  await page.locator('#dock-cancel').click();
  assert.equal(await page.evaluate(() => window.mobileInterface.session.selectedFeast), null);
  await page.locator('[data-dock-feast="lure"]').click();
  await tapWorld(page, lanePoint(750, 1, level));
  await page.waitForFunction(() => window.mobileInterface.session.game.feast?.flavor === 'lure');
  await page.reload();
  await page.waitForFunction(() => window.mobileInterface?.phaser.scene.isActive('Battle'));
  await page.evaluate(() => (window.mobileInterface.session.game.gold = 0));
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-dock-kind]')].every((b) => b.disabled),
  );
  assert.equal(await page.locator('[data-dock-kind]').count(), 4, 'Poor cards remain visible');
  await page.evaluate(() => (window.mobileInterface.session.game.gold = 450));
  await page.locator('#start').click();
  await page.locator('#dock-catalogue').click();
  await revealControl(page, '[data-feast-flavor="sticky"]');
  await page.locator('[data-feast-flavor="sticky"]').click();
  await revealControl(page, '[data-feast-lane="1"]');
  await page.locator('[data-feast-lane="1"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(
    await page.evaluate(() => window.mobileInterface.session.game.feast?.flavor),
    'sticky',
    'Keyboard lane alternative retained',
  );
  assert.equal(
    await page.locator('#reinforcements').isVisible(),
    false,
    'Keyboard honey action closes its temporary catalogue',
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator('#orientation-notice').waitFor();
  await page.setViewportSize({ width: 1280, height: 800 });
  assert.equal(await page.locator('#battle-dock').isVisible(), true);
  assert.equal(await page.locator('#reinforcements').isVisible(), false);
  assert.equal(await page.locator('[data-dock-kind]:visible').count(), 4);
  await page.close();
  assert.deepEqual(errors, []);
  await mkdir('artifacts/reports', { recursive: true });
  await writeFile(
    `artifacts/reports/child-mobile-${version}.json`,
    JSON.stringify(
      {
        version,
        artifact,
        source: 'Chromium cloud, not physical Android',
        sizes,
        checks: [
          'permanent favourites',
          'no hidden lane',
          'safe areas',
          '48px',
          'real recruit',
          'honey touch both flavours',
          'inactive and offroad refusal',
          'pause',
          'cancel',
          'exclusive selection',
          'rotation',
          'custom favourites preserved',
          'poor shortcuts remain visible',
          'keyboard honey alternative',
        ],
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ sizes: sizes.length, errors }));
} finally {
  await browser?.close();
  preview?.kill();
  dev?.kill();
  await rm(fixture, { force: true });
}
