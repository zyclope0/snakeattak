import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const step = Number(process.argv[2] ?? 1);
const fixture = '.corrections-026-test.html';
let server, browser;
try {
  await mkdir('artifacts/corrections-026', { recursive: true });
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/stage-023-harness.ts"',
    ),
  );
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4206',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4206')).ok) break;
    } catch {}
    if (server.exitCode !== null || i > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:4206/${fixture}`);
  await page.waitForFunction(() => window.stageFixture?.phaser.scene.isActive('Battle'));
  await page.locator('#pause').click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#pause-overlay').isVisible(), true);
  assert.equal(
    await page.evaluate(() => window.stageFixture.phaser.scene.getScene('Battle').overlay.visible),
    false,
    'Une seule pause, en HTML',
  );
  await page.locator('#resume-game').click();
  for (const status of ['won', 'lost']) {
    await page.evaluate((status) => {
      window.stageFixture.session.game.status = status;
      window.stageFixture.refresh();
    }, status);
    await page.waitForTimeout(100);
    assert.equal(
      await page.evaluate(
        () => window.stageFixture.phaser.scene.getScene('Battle').overlay.visible,
      ),
      true,
    );
    assert.equal(await page.locator('#pause-overlay').isVisible(), false);
  }
  assert.deepEqual(errors, []);
  console.log(`Corrections 0.26 : étapes 1–${step} OK`);
} finally {
  await browser?.close();
  server?.kill();
  await unlink(fixture).catch(() => {});
}
