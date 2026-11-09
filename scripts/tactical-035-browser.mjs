import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
const fixture = '.tactical-035-test.html',
  folder = 'artifacts/tactical-035',
  checks = [],
  errors = [];
await mkdir(folder, { recursive: true });
await writeFile(
  fixture,
  (await readFile('index.html', 'utf8')).replace(
    'src="/src/main.ts"',
    'src="/tests/tactical-035-harness.ts"',
  ),
);
const server = await createServer({ server: { host: '127.0.0.1', port: 4407, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const [width, height] of [
    [1280, 800],
    [812, 375],
    [568, 320],
  ]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width, height },
      hasTouch: width < 1000,
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(
      `http://127.0.0.1:4407/${fixture}?case=first-win${width === 568 ? '&safe=1' : ''}`,
    );
    await page.waitForFunction(
      () =>
        window.tacticalNoticeBound &&
        window.resultFixture?.phaser.scene.getScene('Battle').initialized,
    );
    const earnedStarsAccessible =
      (await page.getByRole('img', { name: '3 étoiles gagnées sur 3', exact: true }).count()) === 1;
    await page.screenshot({ path: `${folder}/stars-${width}.png` });
    await page.goto(
      `http://127.0.0.1:4407/${fixture}?case=preparing${width === 568 ? '&safe=1' : ''}`,
    );
    await page.waitForFunction(
      () =>
        window.tacticalNoticeBound &&
        window.resultFixture?.phaser.scene.getScene('Battle').initialized,
    );
    await page.locator('#dock-allies [data-dock-kind="archer"]').click();
    await page.waitForTimeout(100);
    const placementHintOnBoard =
      (await page.locator('#battle-announcement').isVisible()) &&
      /Touche.*droite.*derrière/i.test(await page.locator('#battle-announcement').textContent());
    const box = await page.locator('#battle-announcement').boundingBox(),
      board = await page.locator('#game').boundingBox();
    const hintFits =
      !!box &&
      box.x >= board.x - 1 &&
      box.x + box.width <= board.x + board.width + 1 &&
      box.y + box.height <= board.y + board.height + 1;
    assert.equal(
      await page.locator('#battle-announcement').evaluate((e) => getComputedStyle(e).pointerEvents),
      'none',
    );
    await page.screenshot({ path: `${folder}/placement-${width}.png` });
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const f = window.resultFixture,
        g = f.session.game;
      g.wave = 1;
      g.feastUsed = true;
      g.units = g.units.filter((u) => u.kind === 'hero');
      Object.assign(g.units[0], { x: 800, y: 324, homeX: 800, homeY: 324 });
      f.refresh();
    });
    const honeyDoesNotHideAdvice = /À renforcer/.test(await page.locator('#dock-mode').innerText());
    checks.push({
      width,
      height,
      earnedStarsAccessible,
      placementHintOnBoard,
      hintFits,
      boardBounds: board,
      honeyDoesNotHideAdvice,
    });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    `${folder}/report.json`,
    JSON.stringify(
      { checks, errors, method: 'Controlled UI states, no real child/physical Android claim' },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ checks, errors }));
  assert.ok(
    checks.every(
      (c) =>
        c.earnedStarsAccessible && c.placementHintOnBoard && c.hintFits && c.honeyDoesNotHideAdvice,
    ),
    'Every new outcome and placement requirement must pass',
  );
} finally {
  await browser.close();
  await server.close();
  await unlink(fixture).catch(() => {});
}
