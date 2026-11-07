import { enterBattle } from './browser-entry.mjs';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [],
  external = [];
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('request', (r) => {
    if (
      /^https?:/.test(r.url()) &&
      new URL(r.url()).origin !== new URL(process.env.GAME_URL).origin
    )
      external.push(r.url());
  });
  await p.goto(process.env.GAME_URL);
  await enterBattle(p);
  await p.locator('canvas').waitFor();
  assert.equal(await p.locator('#display-toggle').count(), 1, 'Agrandissement accessible absent');
  const field = await p.locator('canvas').boundingBox();
  assert.ok(field.width > 900 && field.y + field.height <= 900, JSON.stringify(field));
  assert.equal(
    await p
      .locator('#shop')
      .evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length),
    2,
  );
  await p.locator('[data-kind="ninja"]').click();
  assert.ok((await p.locator('#selection-name').innerText()).includes('Ninja'));
  assert.ok(await p.locator('#selection-panel').isVisible());
  await p.locator('#cancel').click();
  assert.ok(await p.locator('#selection-panel').isHidden());
  await p.locator('[data-kind="ninja"]').click();
  const rect = await p.locator('canvas').boundingBox();
  await p.mouse.click(rect.x + (rect.width * 900) / 1100, rect.y + (rect.height * 350) / 620);
  await p.waitForFunction(() => document.getElementById('gold').textContent === '150');
  await p.locator('#reset').click();
  assert.ok(await p.locator('#restart-dialog').isVisible());
  assert.equal(await p.evaluate(() => document.activeElement.id), 'keep-playing');
  await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'confirm-restart');
  await p.keyboard.press('Shift+Tab');
  assert.equal(await p.evaluate(() => document.activeElement.id), 'keep-playing');
  await p.locator('#keep-playing').click();
  assert.equal(await p.evaluate(() => document.activeElement.id), 'reset');
  assert.equal(await p.locator('#gold').innerText(), '150', 'Annuler ne doit pas effacer le camp');
  await p.locator('#reset').click();
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#gold').innerText(), '150');
  await p.locator('#reset').click();
  await p.locator('#confirm-restart').click();
  assert.equal(await p.locator('#gold').innerText(), '300');
  await p.locator('#pause').click();
  assert.ok(await p.locator('#pause-overlay').isVisible());
  await p.locator('#help').click();
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#pause').getAttribute('aria-label'), 'Reprendre');
  await p.locator('#resume-game').click();
  assert.ok(await p.locator('#pause-overlay').isHidden());
  await p.locator('#unit-guide').click();
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#pause').getAttribute('aria-label'), 'Mettre en pause');
  await p.locator('#display-toggle').click();
  assert.equal(await p.locator('#display-toggle').getAttribute('aria-pressed'), 'true');
  await p.locator('#display-toggle').click();
  assert.equal(await p.locator('#display-toggle').getAttribute('aria-pressed'), 'false');
  await p.locator('.briefing summary').focus();
  await p.keyboard.press('Space');
  assert.equal(await p.locator('.briefing').getAttribute('open'), '', 'Space should open briefing');
  assert.equal(await p.locator('#pause').getAttribute('aria-label'), 'Mettre en pause');
  await p.keyboard.press('Space');
  await p.screenshot({ path: 'artifacts/interface-015-desktop.png', fullPage: true });
  for (const [width, height, name] of [
    [1024, 768, 'tablet'],
    [1024, 600, 'landscape'],
    [820, 1180, 'tablet-portrait'],
    [390, 844, 'mobile'],
    [320, 740, 'small-mobile'],
    [844, 390, 'phone-landscape'],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(process.env.GAME_URL);
    await enterBattle(page);
    await page.locator('canvas').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      name + ' horizontal overflow',
    );
    const sizes = await page.locator('button:visible, select:visible').evaluateAll((es) =>
      es.map((e) => ({
        id: e.id,
        w: e.getBoundingClientRect().width,
        h: e.getBoundingClientRect().height,
      })),
    );
    assert.deepEqual(
      sizes.filter((e) => e.w < 43.5 || e.h < 43.5),
      [],
      name + ' touch targets',
    );
    await page.locator('[data-kind="ninja"]').click();
    const b = await page.locator('canvas').boundingBox();
    assert.ok(
      b.y >= 0 && b.y + b.height <= height,
      name + ' selected battlefield offscreen ' + JSON.stringify(b),
    );
    await page.touchscreen.tap(b.x + (b.width * 900) / 1100, b.y + (b.height * 350) / 620);
    await page.waitForFunction(() => document.getElementById('gold').textContent === '150');
    await page.locator('[data-kind="ninja"]').click();
    await page.locator('#cancel').click();
    await page.screenshot({ path: `artifacts/interface-015-${name}.png`, fullPage: true });
    if (name === 'landscape') {
      const shop = await page.locator('#shop').boundingBox();
      assert.ok(
        shop.y < height && shop.x > b.x + b.width - 5,
        'Landscape must keep reinforcements next to the board',
      );
    }
    await page.close();
  }
  await p.setViewportSize({ width: 720, height: 450 });
  // 720×450 CSS pixels is the reflow area of a 1440×900 screen at 200% browser zoom.
  assert.ok(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Zoom overflow',
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(external, [], 'UI must work without third-party network requests');
  console.log(
    JSON.stringify({
      interface:
        'desktop/tablet/landscape/mobile, grid, selection, pause/modal, restart protection, expanded mode, touch44, zoom200%',
      errors,
      externalRequests: external.length,
    }),
  );
} finally {
  await browser.close();
}
