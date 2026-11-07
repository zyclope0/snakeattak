import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const before = process.argv.includes('--before');
const file = '.stage-023-test.html';
let server, browser;
try {
  await mkdir('artifacts/stage-023', { recursive: true });
  await writeFile(
    file,
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
    '4196',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4196')).ok) break;
    } catch {}
    if (server.exitCode !== null || i > 100) throw Error('Stage preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const results = [];
  for (const layout of [0, 1, 2]) {
    await page.goto(`http://127.0.0.1:4196/${file}?layout=${layout}`);
    await page.waitForFunction(() =>
      window.stageFixture?.phaser.scene.getScene('Battle')?.sys.isActive(),
    );
    await page.waitForTimeout(600);
    await page.locator('canvas').screenshot({
      path: `artifacts/stage-023/${before ? 'before' : 'after'}-layout-${layout}.png`,
    });
    const state = await page.evaluate(() => {
      const { session, phaser } = window.stageFixture;
      return {
        rng: session.game.rng,
        layout: session.game.mission.layout,
        renderer: phaser.renderer.type,
        units: session.game.units.length,
      };
    });
    assert.equal(state.layout, layout);
    assert.ok(state.units >= 6);
    results.push(state);
  }
  const checks = {};
  if (!before) {
    const reference = JSON.parse(await readFile('reports/stage-023-before.json', 'utf8'));
    assert.deepEqual(results, reference.results, 'Le rendu ne change aucun état de combat');
    checks.combatStateMatchesBefore = true;
    const titles = await page.locator('#level-name').textContent();
    assert.equal(titles, 'Les trois ponts');
    const sceneState = () =>
      page.evaluate(() => {
        const scene = window.stageFixture.phaser.scene.getScene('Battle');
        return {
          children: scene.children.length,
          foreground: scene.terrain.foreground.length,
          key: scene.terrain.levelId,
          terrainTexts: scene.terrain.objects.list.filter((o) => o.type === 'Text').length,
          fort: {
            left: scene.strongholds.fort.getBounds().left,
            right: scene.strongholds.fort.getBounds().right,
          },
          dens: scene.strongholds.dens.map((d) => ({
            left: d.getBounds().left,
            right: d.getBounds().right,
          })),
        };
      });
    const composed = await sceneState();
    assert.ok(composed.foreground > 3);
    assert.equal(composed.terrainTexts, 0);
    for (const building of [composed.fort, ...composed.dens]) {
      assert.ok(building.left >= 12 && building.right <= 1088);
    }
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.stageFixture.setMode('other'));
      await page.waitForTimeout(100);
      assert.equal((await sceneState()).foreground, composed.foreground);
      await page.evaluate(() => window.stageFixture.setMode('bridges'));
      await page.waitForTimeout(100);
      const current = await sceneState();
      assert.equal(current.foreground, composed.foreground);
      if (i === 0) checks.stableChildren = current.children;
      else
        assert.equal(
          current.children,
          checks.stableChildren,
          'Pas de fuite au changement de mission',
        );
    }
    await page.evaluate(() => window.stageFixture.setMode('classic'));
    await page.waitForTimeout(150);
    assert.ok((await sceneState()).foreground > 3);
    await page
      .locator('canvas')
      .screenshot({ path: 'artifacts/stage-023/classic-generalized.png' });
    await page.evaluate(() => window.stageFixture.setMode('bridges'));
    await page.waitForTimeout(300);
    // Full screenshot equality catches missing ground / alpha props on context restore.
    const previous = await page.locator('canvas').screenshot();
    const contextLoss = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const extension = (canvas.getContext('webgl') || canvas.getContext('webgl2'))?.getExtension(
        'WEBGL_lose_context',
      );
      if (!extension) return false;
      window.stageRestored = false;
      canvas.addEventListener(
        'webglcontextrestored',
        () => {
          window.stageRestored = true;
        },
        { once: true },
      );
      extension.loseContext();
      setTimeout(() => extension.restoreContext(), 100);
      return true;
    });
    if (contextLoss) {
      await page.waitForFunction(() => window.stageRestored);
      await page.waitForTimeout(500);
      const restored = await page.locator('canvas').screenshot();
      assert.equal(
        Buffer.compare(previous, restored),
        0,
        'Rendu identique après restauration WebGL',
      );
    }
    checks.contextRestore = contextLoss;
    await page.goto(`http://127.0.0.1:4196/${file}?canvas&layout=1`);
    await page.waitForFunction(() =>
      window.stageFixture?.phaser.scene.getScene('Battle')?.sys.isActive(),
    );
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => window.stageFixture.phaser.renderer.type), 1);
    await page.locator('canvas').screenshot({ path: 'artifacts/stage-023/canvas-layout-1.png' });
    checks.canvas = true;
    const mobile = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    mobile.on('pageerror', (e) => errors.push(e.message));
    await mobile.goto(`http://127.0.0.1:4196/${file}?layout=2`);
    await mobile.waitForFunction(() =>
      window.stageFixture?.phaser.scene.getScene('Battle')?.sys.isActive(),
    );
    await mobile.waitForTimeout(600);
    assert.ok(await mobile.locator('#orientation-notice').isVisible());
    await mobile.screenshot({ path: 'artifacts/stage-023/portrait-guidance.png' });
    await mobile.setViewportSize({ width: 812, height: 375 });
    await mobile.waitForTimeout(300);
    await mobile.evaluate(() => {
      window.stageFixture.session.selected = 'archer';
      window.stageFixture.refresh();
    });
    const units = await mobile.evaluate(() => window.stageFixture.session.game.units.length);
    const box = await mobile.locator('canvas').boundingBox();
    await mobile.touchscreen.tap(
      box.x + (box.width * 624) / 1100,
      box.y + (box.height * 252) / 620,
    );
    assert.equal(
      await mobile.evaluate(() => window.stageFixture.session.game.units.length),
      units + 1,
      'Pose tactile libre hors des suggestions',
    );
    await mobile.screenshot({ path: 'artifacts/stage-023/mobile-390.png', fullPage: true });
    await mobile.setViewportSize({ width: 915, height: 540 });
    await mobile.waitForTimeout(300);
    await mobile.locator('canvas').screenshot({ path: 'artifacts/stage-023/mobile-landscape.png' });
    await mobile.screenshot({
      path: 'artifacts/stage-023/mobile-landscape-page.png',
      fullPage: true,
    });
    checks.landscape = await mobile.evaluate(() => {
      const { phaser } = window.stageFixture,
        canvas = phaser.canvas,
        camera = phaser.scene.getScene('Battle').cameras.main;
      const rect = canvas.getBoundingClientRect();
      return {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        displayWidth: rect.width,
        displayHeight: rect.height,
        camera: [camera.width, camera.height],
        renderer: [phaser.renderer.width, phaser.renderer.height],
        scrollY,
        innerHeight,
        screenWidth: innerWidth,
      };
    });
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    checks.touchPlacement = true;
    await mobile.close();
    checks.classicRegions = [];
    for (const wave of [0, 4, 8]) {
      await page.goto(`http://127.0.0.1:4196/${file}?classic&wave=${wave}`);
      await page.waitForFunction(() =>
        window.stageFixture?.phaser.scene.getScene('Battle')?.sys.isActive(),
      );
      await page.waitForTimeout(650);
      const region = await page.evaluate(() => ({
        id: window.stageFixture.session.game.level.id,
        key: window.stageFixture.phaser.scene.getScene('Battle').terrain.levelId,
      }));
      assert.match(region.key, new RegExp(`^${region.id}:`));
      checks.classicRegions.push(region.id);
      await page
        .locator('canvas')
        .screenshot({ path: `artifacts/stage-023/classic-${region.id}-025.png` });
    }
    assert.deepEqual(checks.classicRegions, ['clearing', 'grove', 'ruins']);
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `reports/stage-023-${before ? 'before' : 'after'}.json`,
    JSON.stringify({ results, checks, errors, physicalDevice: false }, null, 2) + '\n',
  );
  console.log(JSON.stringify({ phase: before ? 'before' : 'after', results, checks, errors }));
} finally {
  await browser?.close();
  server?.kill();
  await unlink(file).catch(() => {});
}
