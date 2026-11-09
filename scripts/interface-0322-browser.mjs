import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
// Catches a return of the desktop catalogue, a smaller/clipped board, duplicate
// notices over the top lane, or a clipped/substituted approved home illustration.
// 0.33.1 replaces three atlas actors with the intact retained icon. The old
// white-bar pixel check applied to that removed atlas crop, so verify the actual
// visible image, its contain geometry and byte-identical approved source instead.
let server, noticeServer, browser;
const results = [],
  errors = [];
const base = 'http://127.0.0.1:4382';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const captures = `docs/captures-${version}`;
const reportDir = `reports/suivi-${version}`;
async function check(name, action) {
  try {
    const value = await action();
    results.push({ name, ok: true, value });
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
  }
}
try {
  await mkdir(reportDir, { recursive: true });
  await mkdir(captures, { recursive: true });
  server = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    ...(process.env.AUDIT_DEV ? [] : ['preview']),
    '--host',
    '127.0.0.1',
    '--port',
    '4382',
    '--strictPort',
  ]);
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    if (i > 100) throw Error('Preview unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height, touch] of [
    [1280, 800, false],
    [1366, 768, false],
    [780, 360, true],
  ]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width, height },
      hasTouch: touch,
      isMobile: touch,
      deviceScaleFactor: touch ? 3 : 1,
    });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${captures}/accueil-${width}x${height}.png` });
    await check(`approved intact home image ${width}x${height}`, async () => {
      const hero = page.locator('.home-icon');
      assert.equal(await hero.isVisible(), true);
      const geometry = await hero.evaluate((img) => ({
        complete: img.complete,
        width: img.naturalWidth,
        height: img.naturalHeight,
        fit: getComputedStyle(img).objectFit,
        clip: getComputedStyle(img).clipPath,
        src: img.src,
        bounds: img.getBoundingClientRect().toJSON(),
        parent: img.parentElement.getBoundingClientRect().toJSON(),
      }));
      assert.equal(geometry.complete, true);
      assert.equal(geometry.width, 512);
      assert.equal(geometry.height, 512);
      assert.equal(geometry.fit, 'contain');
      assert.equal(geometry.clip, 'none');
      assert.ok(geometry.bounds.width > 100 && geometry.bounds.height > 100);
      assert.ok(
        geometry.bounds.left >= geometry.parent.left &&
          geometry.bounds.right <= geometry.parent.right + 1,
      );
      assert.ok(
        geometry.bounds.top >= geometry.parent.top &&
          geometry.bounds.bottom <= geometry.parent.bottom + 1,
      );
      const bytes = await (await page.request.get(geometry.src)).body();
      const hash = (value) => createHash('sha256').update(value).digest('hex');
      assert.equal(hash(bytes), hash(await readFile('resources/android-icon/icon-512.png')));
      await hero.screenshot({ path: `${captures}/illustration-${width}x${height}.png` });
      return { ...geometry, sourceSha256: hash(bytes) };
    });
    await page.locator('#home-parent-options > summary').click();
    await page.locator('#departure-input').fill('REFUGE-2-FZZZ-ZZR4-9F');
    await page.locator('#departure-form button').click();
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.querySelector('#game')?.getAttribute('aria-busy') === 'false',
    );
    const canvas = await page.locator('#game canvas').boundingBox();
    await check(`dock and board ${width}x${height}`, async () => {
      assert.equal(
        await page.locator('#battle-dock').isVisible(),
        true,
        'Same dock on desktop and phone',
      );
      assert.equal(
        await page.locator('#reinforcements').isVisible(),
        false,
        'Full catalogue closed initially',
      );
      assert.equal(await page.locator('[data-dock-kind]:visible').count(), 4);
      assert.equal(await page.locator('[data-dock-feast]:visible').count(), 2);
      if (width === 1280) assert.ok(canvas.height > 525.3 + 50, 'Board must gain useful height');
      assert.ok(canvas.y + canvas.height <= height + 1, 'Whole board fits');
      assert.ok(
        Math.abs(canvas.width / canvas.height - 1100 / 620) < 0.005,
        'Keep world proportions',
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollHeight > innerHeight),
        false,
      );
      return canvas;
    });
    await page.screenshot({ path: `${captures}/combat-${width}x${height}.png` });
    if (await page.locator('#battle-dock').isVisible()) {
      await check(`catalogue lifecycle ${width}x${height}`, async () => {
        const gold = await page.locator('#gold').textContent();
        await page.locator('#dock-catalogue').click();
        await page.locator('#reinforcements').waitFor({ state: 'visible' });
        assert.equal(await page.locator('#reinforcements').evaluate((e) => e.inert), false);
        await page.locator('#shop-ready').click();
        await page.locator('#shop [data-kind="club"]').click();
        assert.equal(
          await page.locator('#reinforcements').isVisible(),
          false,
          'Selecting closes catalogue',
        );
        assert.equal(
          await page.locator('#gold').textContent(),
          gold,
          'Selecting alone never spends coins',
        );
        await page.locator('#dock-cancel').click();
        await page.locator('#dock-catalogue').click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#reinforcements').isVisible(), false);
        return 'open, select without purchase, close, Escape';
      });
    }
    await page.locator('#start').click();
    await check(`single bottom event ${width}x${height}`, async () => {
      const banner = page.locator('#battle-announcement');
      assert.equal(await banner.count(), 1, 'One HTML event line');
      assert.equal(await banner.isVisible(), true, 'Event visible');
      const box = await banner.boundingBox();
      const pills = await page.locator('#tutorial-lanes').boundingBox();
      assert.ok(box.y > canvas.y + canvas.height * 0.85, 'Notice below the three lane corridors');
      assert.ok(box.y + box.height <= canvas.y + canvas.height + 1, 'Notice stays inside board');
      assert.ok(!pills || box.y > pills.y + pills.height, 'No overlap with lane pills');
      assert.equal(await banner.evaluate((e) => getComputedStyle(e).whiteSpace), 'nowrap');
      return { box, text: await banner.textContent() };
    });
    await page.screenshot({ path: `${captures}/evenement-${width}x${height}.png` });
    if (touch) {
      await page.locator('#speed').click();
      await check('natural egg hatch on wave 2, same departure as baseline', async () => {
        await page.waitForFunction(
          () =>
            document.querySelector('#app').dataset.status === 'preparing' &&
            document.querySelector('#wave').textContent === '1',
          undefined,
          { timeout: 90000 },
        );
        await page.locator('#start').click();
        await page.waitForFunction(
          () => document.querySelector('#battle-announcement')?.textContent.includes('CRAC'),
          undefined,
          { timeout: 60000 },
        );
        const event = await page.locator('#battle-announcement').boundingBox();
        const board = await page.locator('#game canvas').boundingBox();
        assert.ok(event.y > board.y + board.height * 0.85);
        assert.ok(event.y + event.height <= board.y + board.height + 1);
        await page.screenshot({ path: `${captures}/evenement-vague2-780x360.png` });
        return { event, departure: 'REFUGE-2-FZZZ-ZZR4-9F' };
      });
    }
    await page.close();
  }
  for (const [width, height] of [
    [920, 600],
    [800, 600],
    [1101, 520],
    [1280, 800],
  ]) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width, height },
    });
    await page.goto(base);
    await page.locator('#home-play').click();
    await page.locator('#mission-launch').click();
    await page.waitForFunction(
      () => document.querySelector('#game').getAttribute('aria-busy') === 'false',
    );
    async function fits() {
      const metrics = await page.evaluate(() => ({
        height: innerHeight,
        doc: document.documentElement.scrollHeight,
        canvas: document.querySelector('#game canvas').getBoundingClientRect().toJSON(),
        panel: document.querySelector('#reinforcements').getBoundingClientRect().toJSON(),
      }));
      assert.ok(metrics.doc <= metrics.height + 1, JSON.stringify(metrics));
      assert.ok(metrics.canvas.bottom <= height + 1, 'Board not clipped');
      if (await page.locator('#reinforcements').isVisible())
        assert.ok(metrics.panel.bottom <= height + 1, 'Catalogue fits');
      return metrics;
    }
    await check(`intermediate closed fits ${width}x${height}`, fits);
    await page.locator('#dock-catalogue').click();
    await check(`intermediate catalogue fits ${width}x${height}`, fits);
    if (width === 1280) {
      await check('desktop home then mission restores dock', async () => {
        await page.locator('#menu-home').click();
        await page.locator('#home-play').click();
        await page.locator('#mission-launch').click();
        assert.equal(await page.locator('#battle-dock').isVisible(), true);
        assert.equal(await page.locator('#reinforcements').isVisible(), false);
      });
      if (await page.locator('#reinforcements').isVisible())
        await page.locator('#reinforcements-close').click();
      await page.locator('#dock-catalogue').click();
      await page.setViewportSize({ width: 780, height: 360 });
      await check('resize never leaves focus in hidden catalogue', async () => {
        await page.waitForFunction(
          () => !document.querySelector('#app').classList.contains('reinforcements-open'),
        );
        assert.equal(
          await page.evaluate(() => !!document.activeElement.closest('#reinforcements')),
          false,
        );
        await page.locator('#dock-catalogue').click();
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForFunction(
          () => !document.querySelector('#app').classList.contains('reinforcements-open'),
        );
        assert.equal(await page.evaluate(() => document.activeElement.id), 'dock-catalogue');
      });
    }
    await page.close();
  }
  // Exercise the actual DOM adapter independently of the game clock: a lower
  // priority egg flash must still be visible when the separate coach explains
  // placement or an imminent danger, as the former Phaser plaque was.
  noticeServer = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4383',
    '--strictPort',
  ]);
  for (let n = 0; ; n++) {
    try {
      if ((await fetch('http://127.0.0.1:4383')).ok) break;
    } catch {}
    if (n > 100) throw Error('Notice server unavailable');
    await delay(100);
  }
  const noticePage = await browser.newPage({
    locale: 'fr-CH',
  });
  await noticePage.route('**/notice-check.html', (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><div id="encounter"><b id="encounter-title"></b><span id="encounter-tip"></span></div><div id="battle-announcement" hidden></div><script type="module">import {bindBattleNotices} from '/src/ui/battleNotices.ts';window.noticeCheck=bindBattleNotices(()=>({title:'Place ton allié',subtitle:'Dans ton camp',priority:5}),()=>true);</script>`,
    }),
  );
  await noticePage.goto('http://127.0.0.1:4383/notice-check.html');
  await noticePage.waitForFunction(() => !!window.noticeCheck);
  await check('egg event remains visible alongside placement guide', async () => {
    await noticePage.evaluate(() =>
      window.noticeCheck({
        kind: 'egg',
        title: 'CRAC ! Les œufs ont éclos',
        subtitle: 'Des serpents arrivent',
        remaining: 1,
        duration: 1.8,
        priority: 0,
      }),
    );
    assert.equal(await noticePage.locator('#battle-announcement').isVisible(), true);
    assert.equal(
      await noticePage.locator('#battle-announcement').textContent(),
      'CRAC ! Les œufs ont éclos',
    );
    assert.equal(await noticePage.locator('#encounter-title').textContent(), 'Place ton allié');
    await noticePage.evaluate(() => window.noticeCheck(null));
    assert.equal(await noticePage.locator('#battle-announcement').isVisible(), false);
    return 'event appears once; separate placement guide preserved; event clears';
  });
  await noticePage.close();
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  server?.kill();
  noticeServer?.kill();
  await writeFile(
    `${reportDir}/interface.json`,
    JSON.stringify(
      { source: 'Chromium; 780x360 touch DPR3 emulation, not physical S24', results, errors },
      null,
      2,
    ) + '\n',
  );
}
console.log(
  JSON.stringify(
    {
      passed: results.filter((x) => x.ok).length,
      total: results.length,
      errors,
      failures: results.filter((x) => !x.ok),
    },
    null,
    2,
  ),
);
if (errors.length || results.some((x) => !x.ok)) process.exitCode = 1;
