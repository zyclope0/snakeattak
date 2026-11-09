import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
const before = process.argv.includes('--before');
const file = '.performance-024-test.html',
  phase = before ? 'before' : 'after';
const summarize = (data) => {
  const sorted = data.filter((x) => Number.isFinite(x) && x >= 0).sort((a, b) => a - b);
  return {
    count: sorted.length,
    median: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
  };
};
let server, browser;
try {
  await mkdir('artifacts/performance-024', { recursive: true });
  await writeFile(
    file,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/performance-024-harness.ts"',
    ),
  );
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4197',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4197')).ok) break;
    } catch {}
    if (server.exitCode !== null || i > 100) throw Error('Performance fixture server unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [],
    results = [];
  for (const canvas of [false, true]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width: 1280, height: 1000 },
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:4197/${file}${canvas ? '?canvas' : ''}`);
    await page.waitForFunction(() =>
      window.renderProbe?.phaser.scene.getScene('Battle')?.sys.isActive(),
    );
    const graphics = await page.evaluate(() => {
      const gl = window.renderProbe.phaser.renderer.gl;
      window.probeDraws = 0;
      if (!gl) return { type: 'Canvas' };
      for (const key of ['drawArrays', 'drawElements']) {
        const original = gl[key].bind(gl);
        gl[key] = (...args) => {
          window.probeDraws++;
          return original(...args);
        };
      }
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        type: 'WebGL',
        renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unavailable',
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      };
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const heapBytes = async () =>
      (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'JSHeapUsedSize')
        ?.value ?? null;
    for (const busy of [false, true]) {
      await page.evaluate((busy) => window.renderProbe.profile(busy), busy);
      await page.waitForTimeout(1600);
      // Presentation ages use the clamped visual clock, so a software GPU can
      // leave recruitment messages alive after the same wall time. Freeze only
      // these transient fixture signals before comparing the static picture.
      await page.evaluate(() => window.renderProbe.stabilize());
      await page.waitForTimeout(160);
      await page.locator('canvas').screenshot({
        path: `artifacts/performance-024/${phase}-${canvas ? 'canvas' : 'webgl'}-${busy ? 'busy' : 'normal'}.png`,
      });
      if (!before) {
        const prefix = `artifacts/performance-024/`;
        const suffix = `${canvas ? 'canvas' : 'webgl'}-${busy ? 'busy' : 'normal'}.png`;
        assert.equal(
          Buffer.compare(
            await readFile(`${prefix}before-${suffix}`),
            await readFile(`${prefix}after-${suffix}`),
          ),
          0,
          'Same state must keep the exact rendered image',
        );
      }
      const gameState = await page.evaluate(() => JSON.stringify(window.renderProbe.game));
      await page.evaluate(() => {
        window.probeDraws = 0;
        window.renderProbe.start();
      });
      await page.waitForTimeout(2400);
      const state = await page.evaluate(() => ({
        ...window.renderProbe.stop(),
        draws: window.probeDraws,
        game: JSON.stringify(window.renderProbe.game),
        images: window.renderProbe.phaser.scene
          .getScene('Battle')
          .children.list.filter((o) => o.type === 'Image').length,
      }));
      assert.equal(state.game, gameState, 'Render must not mutate rules');
      results.push({
        graphics,
        profile: busy ? 'busy' : 'normal',
        cpuMs: summarize(state.cpu),
        frameMs: summarize(state.frame),
        imagesCreated: state.imagesCreated,
        imagesDestroyed: state.imagesDestroyed,
        textsCreated: state.textsCreated,
        textsDestroyed: state.textsDestroyed,
        drawCallsPerFrame: state.draws / state.cpu.length,
        displayImages: state.images,
        jsHeapUsedBytes: await heapBytes(),
        stateHash: createHash('sha256').update(state.game).digest('hex'),
      });
    }
    // Eight enemy/healer generations: retain measurements separately from steady render.
    await page.evaluate(() => window.renderProbe.start());
    for (let round = 0; round < 8; round++) {
      await page.evaluate((round) => window.renderProbe.churn(round), round);
      await page.waitForFunction((round) => window.renderProbe.renderedGeneration === round, round);
      await page.waitForTimeout(170);
    }
    const churn = await page.evaluate(() => window.renderProbe.stop());
    results.push({
      graphics,
      profile: 'turnover-8',
      acknowledgedGenerations: 8,
      jsHeapUsedBytes: await heapBytes(),
      imagesCreated: churn.imagesCreated,
      imagesDestroyed: churn.imagesDestroyed,
      textsCreated: churn.textsCreated,
      textsDestroyed: churn.textsDestroyed,
      cpuMs: summarize(churn.cpu),
    });
    assert.ok(churn.cpu.length > 8);
    if (!before) {
      assert.ok(churn.imagesCreated <= 324, 'Warm reserve handles later generations');
      assert.equal(churn.imagesDestroyed, 0);
      assert.ok(churn.textsCreated <= 6);
      assert.equal(churn.textsDestroyed, 0);
      const reuse = await page.evaluate(() => {
        const { phaser, game } = window.renderProbe,
          scene = phaser.scene.getScene('Battle');
        for (const image of scene.actors.pieces.active.values())
          image.setTintFill(0xff0000).setFlip(true, true).setAlpha(0.3).setRotation(0.7);
        game.units = [];
        game.enemies = [];
        game.effects = [];
        game.eggs = [];
        scene.actors.draw(game, scene.presentation, scene.ink, true);
        game.eggs = [{ id: 9000, x: 420, y: 324, hatchIn: 2, duration: 2 }];
        scene.actors.draw(game, scene.presentation, scene.ink, true);
        const egg = scene.actors.pieces.active.get('egg:9000');
        return {
          alpha: egg.alpha,
          flipX: egg.flipX,
          flipY: egg.flipY,
          rotation: egg.rotation,
          tint: egg.tintTopLeft,
          tintFill: egg.tintFill,
          texture: egg.texture.key,
          stats: scene.actors.pieces.stats,
        };
      });
      assert.equal(reuse.alpha, 1);
      assert.equal(reuse.flipX, false);
      assert.equal(reuse.flipY, false);
      assert.equal(reuse.rotation, 0);
      assert.equal(reuse.tint, 0xffffff);
      assert.equal(reuse.tintFill, false);
      assert.equal(reuse.texture, 'enemies-mechanical');
      assert.ok(reuse.stats.idle <= 384);
      assert.equal(
        await page.evaluate(() =>
          window.renderProbe.phaser.scene
            .getScene('Battle')
            .actors.pieces.idle.every((image) => !image.displayList),
        ),
        true,
        'Inactive views must not enter rendering or depth sorting',
      );
      await page.evaluate(() => window.renderProbe.phaser.scene.stop('Battle'));
      await page.waitForTimeout(100);
      const cleared = await page.evaluate(
        () => window.renderProbe.phaser.scene.getScene('Battle').actors.pieces.stats,
      );
      assert.equal(cleared.active, 0);
      assert.equal(cleared.idle, 0);
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `reports/performance-0.24-${phase}.json`,
    JSON.stringify({ phase, physicalDevice: false, synthetic: true, results, errors }, null, 2) +
      '\n',
  );
  console.log(JSON.stringify({ phase, results, errors }));
} finally {
  await browser?.close();
  server?.kill();
  await unlink(file).catch(() => {});
}
