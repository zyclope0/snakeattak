import { showHomePage } from '../tests/browser-entry.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const baseline = process.argv.includes('--baseline');
const fixture = 'camp-tools-033-fixture.html';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const artifact = `artifacts/child-tools-${version}`;
const errors = [],
  sizes = [],
  checks = [];
let preview, dev, browser;
async function ready(url) {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    if (i > 100) throw Error('Server unavailable: ' + url);
    await delay(100);
  }
}
async function snap(page, name) {
  await page.screenshot({ path: `${artifact}/${baseline ? 'before' : 'after'}-${name}.png` });
}
async function closeHelp(page) {
  await page.locator('#close-camp-tool-help').click();
  await page.locator('#camp-tool-dialog').waitFor({ state: 'hidden' });
}
try {
  await mkdir(artifact, { recursive: true });
  preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4365',
    '--strictPort',
  ]);
  await ready('http://127.0.0.1:4365');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height, touch] of [
    [1280, 800, false],
    [1366, 768, false],
    [780, 360, true],
    [375, 812, true],
  ]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: width < height ? { width: 812, height: 375 } : { width, height },
      hasTouch: touch,
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4365');
    await showHomePage(page, 'missions');
    await page.locator('#home-play').click();
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
    if (width < height) await page.setViewportSize({ width, height });
    if (touch && width > height) {
      await page.evaluate(() => {
        document.documentElement.style.setProperty('--safe-area-inset-left', '24px');
        document.documentElement.style.setProperty('--safe-area-inset-right', '24px');
      });
    }
    await snap(page, `${width}x${height}-board`);
    const board = await page.locator('#game').boundingBox();
    sizes.push({ width, height, board });
    if (baseline || width < height) {
      await page.close();
      continue;
    }
    const dock = await page.locator('#battle-dock').boundingBox();
    const help = page.locator('#dock-tool-help');
    await help.focus();
    await page.keyboard.press('Enter');
    await page.locator('#camp-tool-dialog').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-camp-tool]').count(), 4);
    for (const tool of ['honey', 'encourage', 'repair', 'hero']) {
      await page.locator(`[data-camp-tool="${tool}"]`).click();
      assert.equal(
        await page.locator(`[data-camp-tool="${tool}"]`).getAttribute('aria-pressed'),
        'true',
      );
      assert.ok((await page.locator('#camp-tool-result').textContent()).length > 0);
      assert.equal(
        await page.locator('#camp-tool-dialog').evaluate((dialog) => {
          const bounds = dialog.getBoundingClientRect();
          return (
            dialog.scrollHeight <= dialog.clientHeight + 1 &&
            ['camp-tool-cost', 'camp-tool-status'].every((id) => {
              const box = document.getElementById(id).getBoundingClientRect();
              return (
                box.top >= bounds.top &&
                box.bottom <= bounds.bottom &&
                box.left >= bounds.left &&
                box.right <= bounds.right
              );
            })
          );
        }),
        true,
        `${width}×${height}: whole ${tool} help and cost fit without scrolling`,
      );
      if (width === 780 || width === 1280) await snap(page, `${width}x${height}-${tool}`);
    }
    const dialog = await page.locator('#camp-tool-dialog').boundingBox();
    assert.ok(
      dialog.x >= 0 &&
        dialog.y >= 0 &&
        dialog.x + dialog.width <= width + 1 &&
        dialog.y + dialog.height <= height + 1,
    );
    assert.ok(await page.locator('#close-camp-tool-help').isVisible());
    for (let tab = 0; tab < 6; tab++) {
      await page.keyboard.press('Tab');
      assert.equal(
        await page
          .locator('#camp-tool-dialog')
          .evaluate(
            (e) => document.activeElement === document.body || e.contains(document.activeElement),
          ),
        true,
        'Native modal prevents focus on background controls (browser chrome remains reachable)',
      );
    }
    await snap(page, `${width}x${height}-help`);
    await page.keyboard.press('Escape');
    await page.locator('#camp-tool-dialog').waitFor({ state: 'hidden' });
    assert.equal(
      await help.evaluate((e) => e === document.activeElement),
      true,
      'Escape restores opener focus',
    );
    const afterDock = await page.locator('#battle-dock').boundingBox();
    assert.equal(afterDock.height, dock.height, 'Help never enlarges dock');
    checks.push(`${width}x${height}: help keyboard, topics, viewport, focus, dock height`);
    if (touch) {
      await help.click();
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForFunction(() => matchMedia('(orientation: portrait)').matches);
      await page.locator('#camp-tool-dialog').waitFor({ state: 'hidden' });
      assert.equal(
        await page.locator('#camp-tool-dialog').evaluate((e) => e.open),
        false,
        'Portrait closes help so the rotation instruction remains readable',
      );
      await snap(page, '375x812-help');
      await page.locator('#orientation-notice').waitFor({ state: 'visible' });
      await page.setViewportSize({ width, height });
    }
    await page.close();
  }
  if (baseline) {
    const page = await browser.newPage({
      locale: 'fr-CH',
    });
    await page.goto('http://127.0.0.1:4365');
    assert.equal(
      await page.locator('#dock-tool-help').count(),
      1,
      'The requested dock help is absent in the baseline',
    );
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
    '4366',
    '--strictPort',
  ]);
  await ready('http://127.0.0.1:4366/' + fixture);
  const page = await browser.newPage({
    locale: 'fr-CH',
    viewport: { width: 1280, height: 800 },
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4366/' + fixture);
  await page.waitForFunction(() => window.mobileInterface?.phaser.scene.isActive('Battle'));
  const state = () =>
    page.evaluate(() => {
      const s = window.mobileInterface.session;
      const game = JSON.parse(JSON.stringify(s.game));
      delete game.paused;
      return { game, selected: s.selected, selectedFeast: s.selectedFeast, speed: s.speed };
    });
  await page.locator('[data-dock-kind="club"]').click();
  assert.equal(await page.locator('#dock-tool-help').isVisible(), false);
  assert.equal(await page.locator('#dock-cancel').isVisible(), true);
  await page.locator('#pause').click();
  const before = await state();
  await page.locator('#dock-catalogue').click();
  await page.locator('#camp-tools > summary').click();
  await page.locator('#camp-tool-help').click();
  for (const topic of await page.locator('[data-camp-tool]').all()) await topic.click();
  await page.keyboard.press('Escape');
  assert.equal(
    await page.locator('#reinforcements').isVisible(),
    true,
    'Escape closes only the help, leaving its camp opener visible',
  );
  assert.equal(
    await page.locator('#camp-tool-help').evaluate((e) => e === document.activeElement),
    true,
    'Camp help restores focus to its opener',
  );
  assert.deepEqual(
    await state(),
    before,
    'Consulting help preserves selected ally, gold, RNG and all game state',
  );
  await page.locator('#reinforcements-close').click();
  await page.locator('#dock-cancel').click();
  assert.equal(await page.locator('#dock-tool-help').isVisible(), true);
  await page.locator('#resume-game').click();
  await page.locator('[data-dock-feast="sticky"]').click();
  await page.locator('#pause').click();
  const honey = await state();
  await page.locator('#camp-tool-help').evaluate((e) => e.click());
  await closeHelp(page);
  assert.deepEqual(await state(), honey, 'Consulting help preserves selected honey');
  await page.locator('#dock-cancel').click();
  await page.locator('#resume-game').click();
  await page.locator('#start').click();
  await page.locator('#dock-tool-help').click();
  const held = await state();
  await delay(200);
  assert.deepEqual(await state(), held, 'Help freezes combat');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await closeHelp(page);
  assert.equal(
    await page.evaluate(() => window.mobileInterface.session.game.paused),
    true,
    'Closing help retains interruption',
  );
  await page.locator('#resume-game').click();
  await page.locator('#pause').click();
  await page.locator('#dock-tool-help').click();
  await closeHelp(page);
  assert.equal(
    await page.evaluate(() => window.mobileInterface.session.game.paused),
    true,
    'Closing help retains player pause',
  );
  await page.locator('#resume-game').click();
  await page.locator('#dock-tool-help').click();
  await closeHelp(page);
  await page.waitForFunction(() => !window.mobileInterface.session.game.paused);
  checks.push(
    'real UI: selected ally/honey and Game/RNG unchanged, temporary pause, retained background/player pause, explicit resume',
  );
  assert.deepEqual(errors, []);
  await mkdir('reports', { recursive: true });
  await writeFile(
    `reports/child-tools-${version}.json`,
    JSON.stringify(
      {
        version,
        artifact,
        source: 'Chromium cloud, not physical Android',
        sizes,
        checks,
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ sizes: sizes.length, checks, errors }));
} finally {
  await browser?.close();
  preview?.kill();
  dev?.kill();
  await rm(fixture, { force: true });
}
