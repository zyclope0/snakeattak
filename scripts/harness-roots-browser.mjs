import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

// Exercise test entry points against production HTML, whose battle root starts hidden.
const harnesses = [
  'mobile-031',
  'interruptions-033',
  'presentation',
  'performance-024',
  'tutorial-030',
  'tactical-022',
  'stage-023',
];
const fixture = '.harness-roots.html';
const origin = 'http://127.0.0.1:4369';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const results = [],
  errors = [];
let server, browser;
try {
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4369',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    if (server.exitCode !== null || i > 100) throw Error('Harness server unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const harness of harnesses) {
    await writeFile(
      fixture,
      (await readFile('index.html', 'utf8')).replace(
        'src="/src/main.ts"',
        `src="/tests/${harness}-harness.ts"`,
      ),
    );
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => errors.push(`${harness}: ${e.message}`));
    await page.goto(`${origin}/${fixture}?scenario=refuge`);
    await page.waitForSelector('canvas', { state: 'attached' });
    results.push(
      await page.evaluate(
        (harness) => ({
          harness,
          appHidden: document.getElementById('app').hidden,
          startVisible: document.getElementById('start').checkVisibility(),
          canvasWidth: document.querySelector('canvas').getBoundingClientRect().width,
          canvasHeight: document.querySelector('canvas').getBoundingClientRect().height,
        }),
        harness,
      ),
    );
    await page.close();
  }
  await mkdir('reports', { recursive: true });
  await writeFile(
    `reports/harness-roots-${version}.json`,
    JSON.stringify({ version, results, errors }, null, 2) + '\n',
  );
  console.log(JSON.stringify({ version, results, errors }));
  assert.deepEqual(errors, []);
  for (const result of results) {
    assert.equal(result.appHidden, false, `${result.harness}: battle root visible`);
    assert.equal(result.startVisible, true, `${result.harness}: start control visible`);
    assert.ok(
      result.canvasWidth > 0 && result.canvasHeight > 0,
      `${result.harness}: canvas has area`,
    );
  }
} finally {
  await browser?.close();
  server?.kill();
  await rm(fixture, { force: true });
}
