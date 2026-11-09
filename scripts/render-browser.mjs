import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
const file = '.render-test.html';
let server, b;
try {
  await writeFile(
    file,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/presentation-harness.ts"',
    ),
  );
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4182',
    '--strictPort',
  ]);
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4182')).ok) break;
    } catch {}
    await delay(100);
  }
  b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await b.newPage({
    locale: 'fr-CH',
    viewport: { width: 1440, height: 1000 },
  });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:4182/' + file + '?scenario=allies');
  await p.waitForTimeout(1000);
  await p.evaluate(() => {
    window.rafDeltas = [];
    let last = performance.now();
    function f(t) {
      window.rafDeltas.push(t - last);
      last = t;
      requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  });
  await p.waitForTimeout(2500);
  const metrics = await p.evaluate(() => {
    const a = window.rafDeltas.filter((x) => x > 0).sort((a, b) => a - b);
    return {
      count: a.length,
      median: a[Math.floor(a.length / 2)],
      p95: a[Math.floor(a.length * 0.95)],
    };
  });
  assert.ok(metrics.count >= 10 && metrics.p95 < 200, 'Render stalled: ' + JSON.stringify(metrics));
  const at = Date.now();
  await p.locator('[data-kind="ninja"]').click({ timeout: 10000 });
  const clickMs = Date.now() - at;
  const shot = Date.now();
  await p.screenshot({ path: 'artifacts/refonte-profile.png', fullPage: true, timeout: 15000 });
  const screenshotMs = Date.now() - shot;
  const box = await p.locator('canvas').boundingBox();
  const samples = [
    { name: 'terrain', x: 300, y: 300 },
    { name: 'fort', x: 1034, y: 300 },
    { name: 'den', x: 84, y: 152 },
  ].map((s) => ({
    name: s.name,
    clip: {
      x: Math.round(box.x + (box.width * s.x) / 1100),
      y: Math.round(box.y + (box.height * s.y) / 620),
      width: 24,
      height: 24,
    },
  }));
  const before = [];
  for (const sample of samples) before.push(await p.screenshot({ clip: sample.clip }));
  const contextTest = await p.evaluate(() => {
    const canvas = document.querySelector('canvas'),
      gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_lose_context');
    if (!ext) return false;
    window.contextRestored = false;
    canvas.addEventListener('webglcontextrestored', () => (window.contextRestored = true), {
      once: true,
    });
    ext.loseContext();
    setTimeout(() => ext.restoreContext(), 100);
    return true;
  });
  if (contextTest) {
    await p.waitForFunction(() => window.contextRestored, {}, { timeout: 10000 });
    await p.waitForTimeout(500);
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i],
        after = await p.screenshot({ clip: sample.clip });
      await writeFile(`artifacts/context-${sample.name}-before.png`, before[i]);
      await writeFile(`artifacts/context-${sample.name}-after.png`, after);
      assert.equal(
        Buffer.compare(before[i], after),
        0,
        `${sample.name} changed after WebGL restore`,
      );
    }
  }
  assert.deepEqual(errs, []);
  await mkdir('reports', { recursive: true });
  const result = {
    scenario: 'Chromium, 21 illustrated allies and outlines, 1440px',
    rafMilliseconds: metrics,
    clickMs,
    screenshotMs,
    physicalDevice: false,
    contextRestore: contextTest,
    restoredLayers: contextTest ? samples.map((s) => s.name) : [],
  };
  await writeFile('reports/render-performance.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await b?.close();
  server?.kill();
  await unlink(file).catch(() => {});
}
