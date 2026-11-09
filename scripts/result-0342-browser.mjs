import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const fixture = '.result-0342-test.html',
  root = 'http://127.0.0.1:4393',
  folder = 'artifacts/result-0342';
const checks = [],
  errors = [];
let server, browser;
try {
  await mkdir(folder, { recursive: true });
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/result-0342-harness.ts"',
    ),
  );
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4393',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(root)).ok) break;
    } catch {}
    if (i > 100) throw Error('No Vite');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height] of [
    [1280, 800],
    [812, 375],
    [568, 320],
  ])
    for (const mode of [
      'first-win',
      'first-loss',
      'last-win',
      'classic-win',
      'classic-loss',
      'preparing',
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        hasTouch: width < 1000,
        reducedMotion: 'reduce',
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${root}/${fixture}?case=${mode}`);
      await page.waitForFunction(
        () => window.resultFixture?.phaser.scene.getScene('Battle').initialized,
      );
      const state = await page.evaluate(() => ({
        before: window.resultFixture.before,
        after: JSON.stringify(window.resultFixture.session.game),
      }));
      assert.equal(state.after, state.before, 'Outcome UI must not alter rules/RNG/state');
      if (mode === 'preparing') {
        assert.equal(await page.locator('#battle-result').isVisible(), false);
        assert.equal(await page.locator('#battle-dock').isVisible(), true);
      } else {
        const primary =
          mode === 'first-win'
            ? '#mission-next'
            : mode.startsWith('classic')
              ? '#end-restart'
              : '#mission-again';
        assert.equal(
          await page.locator(primary).isVisible(),
          true,
          `${mode}/${width}: result action visible without opening Allies`,
        );
        const box = await page.locator(primary).boundingBox();
        assert.ok(box.height >= 48, `${mode}/${width}:48px target, observed${box.height}`);
        assert.ok(box.y >= 0 && box.y + box.height <= height + 1, 'Primary action inside viewport');
        assert.equal(await page.locator('#battle-dock').isVisible(), false);
        await page.screenshot({ path: `${folder}/${mode}-${width}.png` });
        if (mode === 'last-win' || mode === 'first-loss')
          assert.equal(await page.locator('#mission-next').isVisible(), false);
        if (mode === 'first-win') {
          await page.locator('#mission-next').click();
          await page.locator('#mission-dialog').waitFor({ state: 'visible' });
          const run = JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run'));
          assert.equal(run.missionId, 'trois-ponts');
        } else if (mode === 'first-loss' || mode === 'last-win') {
          await page.locator('#mission-again').click();
          const data = await page.evaluate(() => ({
            run: window.resultFixture.lastLaunch,
            expected: window.resultFixture.originalRun,
            wave: window.resultFixture.session.game.wave,
            army: window.resultFixture.session.game.units.length,
          }));
          assert.deepEqual(data.run, data.expected);
          assert.equal(data.wave, 0);
          assert.equal(data.army, 3);
          assert.equal(await page.locator('#battle-result').isVisible(), false);
          assert.equal(
            await page
              .locator('#mission-battle-actions')
              .evaluate((e) => e.closest('#camp-observation') !== null),
            true,
          );
        } else {
          await page.locator('#end-restart').click();
          assert.equal(await page.locator('#battle-result').isVisible(), false);
          assert.equal(await page.evaluate(() => window.resultFixture.session.game.wave), 0);
        }
      }
      checks.push({ mode, width, height });
      await page.close();
    }
  assert.deepEqual(errors, []);
  await writeFile(
    `${folder}/report.json`,
    JSON.stringify(
      { checks, errors, method: 'Controlled UI outcomes, not played games' },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ checks: checks.length, errors }));
} finally {
  await browser?.close();
  server?.kill();
  await unlink(fixture).catch(() => {});
}
