import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const fixture = 'interruptions-033-fixture.html';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const origin = 'http://127.0.0.1:4355';
let server, browser;
const errors = [],
  checks = [];
async function visibility(page, hidden) {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}
async function paused(page) {
  return page.evaluate(() => window.mobileInterface.session.game.paused);
}
async function frozen(page) {
  const before = await page.evaluate(() => window.mobileInterface.session.game.time);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.mobileInterface.session.game.time), before);
}
async function running(page) {
  const before = await page.evaluate(() => window.mobileInterface.session.game.time);
  await page.waitForFunction((before) => window.mobileInterface.session.game.time > before, before);
}
try {
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/interruptions-033-harness.ts"',
    ),
  );
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4355',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(origin + '/' + fixture)).ok) break;
    } catch {}
    if (i > 100) throw Error('Fixture unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height, touch] of [
    [812, 375, true],
    [1280, 800, false],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(origin + '/' + fixture);
    await page.waitForFunction(() => window.mobileInterface?.phaser.scene.isActive('Battle'));
    await page.locator('#start').click();
    await running(page);
    if (touch) {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.locator('#orientation-notice').waitFor({ state: 'visible' });
      assert.equal(await paused(page), true);
      await visibility(page, true);
      await visibility(page, false);
      await page.setViewportSize({ width, height });
      await page.locator('#orientation-notice').waitFor({ state: 'hidden' });
      assert.equal(await paused(page), true, 'Background pause survives returning from portrait');
      await page.locator('#pause-overlay').waitFor({ state: 'visible' });
      await frozen(page);
      await page.locator('#resume-game').click();
      await running(page);
      checks.push('portrait/background/landscape waits for explicit resume');
      // A rotation alone still releases only its temporary pause.
      await page.setViewportSize({ width: 375, height: 812 });
      await page.locator('#orientation-notice').waitFor({ state: 'visible' });
      await page.setViewportSize({ width, height });
      await page.locator('#orientation-notice').waitFor({ state: 'hidden' });
      assert.equal(await paused(page), false);
      await running(page);
      checks.push('simple rotation releases its own pause');
    }
    // pagehide can arrive before visibilitychange (navigation/BFCache).
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
    );
    assert.equal(await paused(page), true, 'pagehide pauses immediately');
    await frozen(page);
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })),
    );
    assert.equal(await paused(page), true, 'pageshow never resumes by itself');
    await page.locator('#resume-game').click();
    await running(page);
    checks.push(`${width}: pagehide/pageshow retained pause`);
    // Visibility while a modal owns a temporary pause must not release it.
    await page.locator('#help').evaluate((b) => b.click());
    await page.locator('#help-dialog').waitFor({ state: 'visible' });
    await visibility(page, true);
    await visibility(page, false);
    await page.locator('#close-help').click();
    await page.locator('#help-dialog').waitFor({ state: 'hidden' });
    assert.equal(await paused(page), true, 'Dialog close retains the interruption');
    await frozen(page);
    await page.locator('#resume-game').click();
    await running(page);
    checks.push(`${width}: dialog/background/close retained pause`);
    // Dialog and portrait acquire/release in the opposite order.
    if (touch) {
      await page.locator('#help').evaluate((b) => b.click());
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForFunction(() => matchMedia('(orientation: portrait)').matches);
      await page.locator('#close-help').evaluate((b) => b.click());
      assert.equal(await paused(page), true);
      await page.setViewportSize({ width, height });
      await page.locator('#orientation-notice').waitFor({ state: 'hidden' });
      assert.equal(
        await paused(page),
        false,
        'Last temporary owner releases without a stuck pause',
      );
      await running(page);
      checks.push('dialog then portrait, closing dialog first leaves no stuck pause');
      // A modal opened while already in portrait releases before the rotation does.
      await page.setViewportSize({ width: 375, height: 812 });
      await page.locator('#orientation-notice').waitFor({ state: 'visible' });
      await page.locator('#help').evaluate((b) => b.click());
      await page.setViewportSize({ width, height });
      await page.locator('#orientation-notice').waitFor({ state: 'hidden' });
      assert.equal(await paused(page), true);
      await page.locator('#close-help').click();
      assert.equal(await paused(page), false);
      await running(page);
      checks.push('portrait then dialog, landscape first retains the dialog pause');
    }
    const adapters = await page.evaluate(async () => {
      const { Session } = await import('/src/session.ts');
      const { bindLifecycle } = await import('/src/ui/lifecycle.ts');
      const { pauseForDialog } = await import('/src/ui/dialogs.ts');
      const session = new Session(33);
      let refreshes = 0;
      const dispose = bindLifecycle(session, () => refreshes++);
      window.dispatchEvent(new PageTransitionEvent('pagehide'));
      const first = session.game.paused;
      session.game.paused = false;
      dispose();
      window.dispatchEvent(new PageTransitionEvent('pagehide'));
      const cleaned = !session.game.paused && refreshes === 1;
      // Reopening before the queued close event arrives must retain the new lease.
      const dialog = document.createElement('dialog');
      document.body.append(dialog);
      const controller = pauseForDialog(dialog, session, () => {});
      controller.open();
      controller.close();
      controller.open();
      await new Promise((r) => setTimeout(r, 40));
      const reopened = session.game.paused && dialog.open;
      controller.close();
      const released = !session.game.paused;
      controller.dispose();
      dialog.remove();
      const detached = pauseForDialog(document.createElement('dialog'), session, () => {});
      let threw = false;
      try {
        detached.open();
      } catch {
        threw = true;
      }
      const failedOpenReleased = !session.game.paused;
      detached.dispose();
      return { first, cleaned, reopened, released, threw, failedOpenReleased };
    });
    assert.deepEqual(adapters, {
      first: true,
      cleaned: true,
      reopened: true,
      released: true,
      threw: true,
      failedOpenReleased: true,
    });
    checks.push(`${width}: cleanup, queued close and failed dialog opening`);
    await page.close();
  }
  const hidden = await browser.newPage({ viewport: { width: 812, height: 375 }, hasTouch: true });
  hidden.on('pageerror', (e) => errors.push(e.message));
  await hidden.addInitScript(() =>
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }),
  );
  await hidden.goto(origin + '/' + fixture);
  await hidden.waitForFunction(() => window.mobileInterface?.phaser.scene.isActive('Battle'));
  assert.equal(await paused(hidden), true, 'A hidden startup is paused');
  await visibility(hidden, false);
  assert.equal(await paused(hidden), true, 'Visible startup waits for explicit resume');
  await hidden.locator('#resume-game').click();
  assert.equal(await paused(hidden), false);
  await hidden.close();
  checks.push('hidden startup remains paused until Resume');
  assert.deepEqual(errors, []);
  await mkdir('reports', { recursive: true });
  await writeFile(
    `reports/interruptions-${version}.json`,
    JSON.stringify(
      {
        source: 'Chromium cloud; synthetic page lifecycle, not physical Android',
        version,
        checks,
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ checks, errors }));
} finally {
  await browser?.close();
  server?.kill();
  await rm(fixture, { force: true });
}
