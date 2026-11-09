import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const before = process.argv.includes('--before');
const phase = before ? 'before' : 'after';
const folder = 'artifacts/craft-034';
const base = 'http://127.0.0.1:4385';
const fixture = '.craft-034-test.html';
let server, browser;
const results = [],
  errors = [];
try {
  await mkdir(folder, { recursive: true });
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
    '4385',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    if (i > 100 || server.exitCode !== null) throw Error('Vite unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  // Inspect the published product as well as deterministic fixtures, in fresh contexts.
  if (before) {
    for (const [width, height] of [
      [1280, 800],
      [812, 375],
    ]) {
      const page = await browser.newPage({
        locale: 'fr-CH',
        viewport: { width, height },
        hasTouch: width === 812,
      });
      await page.goto('https://conquete-serpents-famille.zyclope.chatgpt.site/');
      await page.screenshot({ path: `${folder}/site-${width}-home.png` });
      await page.locator('#home-play').click();
      await page.locator('#mission-launch').click();
      await page.waitForFunction(
        () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
      );
      await page.screenshot({ path: `${folder}/site-${width}-board.png` });
      await page.close();
    }
  }
  for (const [width, height] of [
    [1280, 800],
    [812, 375],
  ]) {
    for (const [name, query] of [
      ['clearing', 'classic&wave=1'],
      ['grove', 'classic&wave=5'],
      ['ruins', 'classic&wave=9'],
      ['mission0', 'layout=0'],
      ['mission1', 'layout=1'],
      ['mission2', 'layout=2'],
      ['canvas', 'layout=1&canvas'],
    ]) {
      const page = await browser.newPage({
        locale: 'fr-CH',
        viewport: { width, height },
        hasTouch: width === 812,
        reducedMotion: 'reduce',
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${base}/${fixture}?${query}`);
      await page.waitForFunction(
        () => window.stageFixture?.phaser.scene.getScene('Battle').initialized,
      );
      await page.waitForTimeout(100);
      const state = await page.evaluate(() => {
        const { session, phaser } = window.stageFixture;
        return {
          game: JSON.stringify(session.game),
          canvas: { width: phaser.canvas.width, height: phaser.canvas.height },
          textures: phaser.textures
            .getTextureKeys()
            .filter((k) => k.startsWith('scenery-'))
            .sort(),
        };
      });
      await page.screenshot({ path: `${folder}/${phase}-${width}-${name}.png` });
      results.push({ width, height, name, ...state });
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
  if (!before) {
    const previous = JSON.parse(await readFile(`${folder}/before.json`, 'utf8'));
    assert.deepEqual(
      results.map(({ textures, ...r }) => r),
      previous.results.map(({ textures, ...r }) => r),
      'Same game, RNG and native canvas size',
    );
    for (const r of results)
      assert.equal(r.textures.length, r.name === 'grove' ? 0 : 1, 'One useful frame texture only');
  }
  await writeFile(`${folder}/${phase}.json`, JSON.stringify({ results, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ phase, cases: results.length, errors }));
} finally {
  await browser?.close();
  server?.kill();
  await unlink(fixture).catch(() => {});
}
