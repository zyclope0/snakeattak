import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
const phase = process.argv.includes('--before') ? 'before' : 'after';
const fixture = '.plateau-028-test.html';
let server, browser;
try {
  await mkdir('artifacts/plateau-028', { recursive: true });
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
    '4343',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4343')).ok) break;
    } catch {}
    if (i > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const samples = [];
  const errors = [];
  for (const [width, height] of [
    [1280, 800],
    [812, 375],
  ]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width, height },
      hasTouch: width === 812,
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:4343/' + fixture);
    await page.waitForFunction(
      () => window.stageFixture?.phaser.scene.getScene('Battle').initialized,
    );
    const data = await page.evaluate(() => {
      const g = window.stageFixture.session.game;
      return {
        rng: g.rng,
        units: g.units.map((u) => ({ id: u.id, x: u.x, y: u.y, hp: u.hp })),
        enemies: g.enemies.map((e) => ({ id: e.id, x: e.x, y: e.y, hp: e.hp })),
        gold: g.gold,
        base: g.base,
      };
    });
    await page.screenshot({ path: `artifacts/plateau-028/${phase}-${width}.png` });
    samples.push({ width, height, state: data });
    await page.close();
  }
  assert.deepEqual(errors, []);
  if (phase === 'after')
    assert.deepEqual(
      samples,
      JSON.parse(await readFile('artifacts/plateau-028/before.json', 'utf8')).samples,
      'Presentation must not change game state',
    );
  await writeFile(
    `artifacts/plateau-028/${phase}.json`,
    JSON.stringify({ samples, errors }, null, 2),
  );
  console.log(
    'Plateau ' +
      phase +
      ': 1280×800 and812×375; state snapshots ' +
      (phase === 'after' ? 'identical' : 'captured'),
  );
} finally {
  await browser?.close();
  server?.kill();
  await unlink(fixture).catch(() => {});
}
