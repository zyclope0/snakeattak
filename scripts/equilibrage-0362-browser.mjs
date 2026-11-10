import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { Game } from '../src/game.ts';
import { REWARDS } from '../src/rewards.ts';
import { createMissionRun } from '../src/missions.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { createCareer } from '../src/progression.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCapriceAlbums } from '../src/capriceAlbums.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';
import { encodeDeparture, decodeDeparture } from '../src/departures.ts';
const folder =
  process.env.BALANCE_UI_REPORT_DIR ?? `artifacts/equilibrage-0362/task2/browser-${Date.now()}`;
const fixture = '.equilibrage-0362-fixture.html';
const key = 'conquete-serpents:family:v1';
const marker = 'conquete-serpents:recruitment-reminder:v1';
const results = [],
  errors = [];
let browser, preview, dev;
async function check(name, action) {
  if (process.env.BALANCE_UI_CASE && !name.includes(process.env.BALANCE_UI_CASE)) return;
  const start = Date.now();
  try {
    await action();
    results.push({ name, ok: true, ms: Date.now() - start });
  } catch (error) {
    results.push({ name, ok: false, error: error.stack });
    throw error;
  }
}
async function ready(url) {
  for (let i = 0; i < 150; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await delay(100);
  }
  throw Error(`Unavailable ${url}`);
}
function family(revision = 2, gold = 800, wave = 0) {
  const g = new Game(50362, undefined, undefined, revision);
  g.gold = gold;
  g.wave = wave;
  const missions = createMissionProgress();
  for (const id of ['refuge', 'trois-ponts', 'course', 'coquilles', 'sonnette', 'carrefour'])
    missions.bestStars[id] = 3;
  return writeFamilyBackup(
    encodeCheckpoint(g),
    createCareer().state,
    missions,
    createCapriceAlbums(),
  );
}
async function pageAt(
  width = 1280,
  height = 800,
  lang = 'fr',
  revision = 2,
  raw = family(revision),
) {
  const page = await browser.newPage({ viewport: { width, height }, hasTouch: width < 1000 });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(
    ({ key, raw, lang }) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, raw);
        localStorage.setItem('conquete-serpents:language:v1', lang);
        sessionStorage.setItem('seeded', '1');
      }
    },
    { key, raw, lang },
  );
  await page.goto('http://127.0.0.1:4382');
  await page.locator('#home-screen').waitFor({ state: 'visible' });
  return page;
}
const hint = (p) => p.locator('#battle-announcement');
async function waitHint(page, text, timeout = 20000) {
  await page.waitForFunction(
    (text) => {
      const el = document.getElementById('battle-announcement');
      return el && !el.hidden && el.textContent === text;
    },
    text,
    { timeout },
  );
}
async function current(page) {
  const value = await page.locator('#current-departure-code').inputValue();
  const result = decodeDeparture(value);
  assert.ok(result.ok);
  return result.departure;
}
async function launchCode(page, departure) {
  await page.locator('#departure-input').fill(encodeDeparture(departure));
  await page.locator('#departure-form button[type="submit"]').click();
  await page.locator('#departure-start').click();
  if (await page.locator('#journey-confirm').isVisible())
    await page.locator('#journey-replace').click();
  await page.locator('#app').waitFor({ state: 'visible' });
}
try {
  await mkdir(folder, { recursive: true });
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      '/src/main.ts',
      '/tests/equilibrage-0362-harness.ts',
    ),
  );
  preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4382',
    '--strictPort',
  ]);
  dev = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '4383',
    '--strictPort',
  ]);
  await Promise.all([ready('http://127.0.0.1:4382'), ready('http://127.0.0.1:4383')]);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const revision of [1, 2])
    await check(`production prices/guide/code revision ${revision}`, async () => {
      const page = await pageAt(1280, 800, 'fr', revision);
      await page.locator('#home-guide').click();
      await page.locator('#guide-select').selectOption('trex');
      assert.match(await page.locator('#guide-stats').innerText(), /340 pièces/);
      await page.locator('#close-unit-guide').click();
      await page.locator('#home-continue').click();
      for (const [kind, price] of Object.entries(
        revision === 2
          ? { trex: 340, dragon: 210, tank: 440 }
          : { trex: 390, dragon: 240, tank: 500 },
      )) {
        assert.match(
          await page.locator(`[data-kind="${kind}"] .price`).textContent(),
          new RegExp(String(price)),
        );
      }
      await page.locator('#dock-catalogue').click();
      await page.locator('#unit-guide').click();
      await page.locator('#guide-select').selectOption('trex');
      assert.match(
        await page.locator('#guide-stats').innerText(),
        new RegExp(`${revision === 2 ? 340 : 390} pièces`),
      );
      await page.locator('#close-unit-guide').click();
      assert.equal((await current(page)).balance ?? 1, revision);
      await page.locator('#camp-tools > summary').click();
      await page.locator('#current-departure').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#current-original-rules').isVisible(), revision === 1);
      await page.locator('#reinforcements-close').click();
      await page.screenshot({ path: `${folder}/prices-r${revision}.png` });
      await page.close();
    });
  await check('legacy camp without a departure seed still labels original rules', async () => {
    const g = new Game(9500362);
    g.initialSeed = null;
    g.gold = 800;
    const raw = writeFamilyBackup(
      encodeCheckpoint(g),
      createCareer().state,
      createMissionProgress(),
      createCapriceAlbums(),
    );
    const page = await pageAt(1280, 800, 'fr', 1, raw);
    await page.locator('#home-continue').click();
    await page.locator('#dock-catalogue').click();
    await page.locator('#camp-tools > summary').click();
    await page.locator('#departure-unavailable').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#departure-unavailable').isVisible(), true);
    assert.equal(await page.locator('#current-departure').isVisible(), false);
    assert.equal(await page.locator('#current-original-rules').isVisible(), true);
    assert.match(await page.locator('[data-kind="trex"] .price').textContent(), /390/);
    await page.close();
  });
  await check(
    'classic code 1/4 zero/max seeds, cancel and confirm preserve complete departure',
    async () => {
      const page = await pageAt();
      await page.locator('#home-parent-options > summary').click();
      for (const balance of [undefined, 2])
        for (const seed of [0, 0xffffffff]) {
          const departure = { kind: 'classic', seed, ...(balance ? { balance } : {}) };
          await page.locator('#departure-input').fill(encodeDeparture(departure));
          await page.locator('#departure-form button[type="submit"]').click();
          await page.locator('#departure-cancel').click();
          assert.equal(await page.locator('#home-screen').isVisible(), true);
          await launchCode(page, departure);
          assert.deepEqual(await current(page), departure);
          await page.locator('#menu-home').click();
        }
      await page.close();
    },
  );
  await check(
    'mission new/reroll/code/retry preserve revision and original refuge flags',
    async () => {
      const page = await pageAt();
      await page.locator('#home-play').click();
      const draft = () =>
        page.locator('#mission-dialog').evaluate((d) => JSON.parse(d.dataset.run));
      assert.equal((await draft()).balance, 2);
      await page.locator('#mission-reroll').click();
      assert.equal((await draft()).balance, 2);
      await page.locator('#mission-close').click();
      await page.locator('#home-parent-options > summary').click();
      for (const balance of [undefined, 2]) {
        const { rules: _, ...historical } = createMissionRun('refuge', 8900362);
        const run = {
          ...historical,
          ...(balance ? { balance } : {}),
          caprice: 'refuge-createur-moyen',
        };
        await page.locator('#departure-input').fill(encodeDeparture({ kind: 'mission', run }));
        await page.locator('#departure-form button[type="submit"]').click();
        assert.deepEqual(await draft(), run);
        assert.equal(await page.locator('#mission-original-rules').isVisible(), balance !== 2);
        await page.locator('#mission-reroll').click();
        const rerolled = await draft();
        assert.equal(rerolled.balance, balance);
        assert.equal(Object.hasOwn(rerolled, 'rules'), false);
        assert.equal(rerolled.caprice, run.caprice);
        await page.locator('#mission-launch').click();
        assert.deepEqual(await current(page), { kind: 'mission', run: rerolled });
        await page.locator('#menu-home').click();
        await page.locator('#home-play').click();
        await page.locator('#mission-close').click();
        // The mission card draws a new departure; its explicit retry restores the original run.
        if (!(await page.locator('#mission-list').evaluate((d) => d.open)))
          await page.locator('#home-expeditions').click();
        await page.locator('[data-mission-card="refuge"]').click();
        assert.equal((await draft()).balance, 2);
        if (!(await page.locator('#mission-parent-options').evaluate((d) => d.open)))
          await page.locator('#mission-parent-options > summary').click();
        await page.locator('#mission-retry').click();
        assert.deepEqual(await draft(), rerolled);
        await page.locator('#mission-close').click();
      }
      await page.close();
    },
  );
  await check(
    'voucher price is free in catalogue and battle guide, home guide keeps standard prices',
    async () => {
      const g = new Game(50362, undefined, undefined, 2);
      g.wave = 4;
      g.gold = 800;
      g.rewards.pending = 4;
      const gift = g.rewardOffer.find((id) => REWARDS[id].kind);
      assert.ok(gift && g.chooseReward(gift));
      const kind = REWARDS[gift].kind;
      const raw = writeFamilyBackup(
        encodeCheckpoint(g),
        createCareer().state,
        createMissionProgress(),
        createCapriceAlbums(),
      );
      const page = await pageAt(1280, 800, 'fr', 2, raw);
      await page.locator('#home-guide').click();
      await page.locator('#guide-select').selectOption(kind);
      assert.doesNotMatch(await page.locator('#guide-stats').innerText(), /Gratuit/);
      await page.locator('#close-unit-guide').click();
      await page.locator('#home-continue').click();
      await page.locator('#dock-catalogue').click();
      assert.match(await page.locator(`[data-kind="${kind}"] .price`).textContent(), /Offert/);
      await page.locator('#unit-guide').click();
      await page.locator('#guide-select').selectOption(kind);
      assert.match(await page.locator('#guide-stats').innerText(), /Gratuit/);
      await page.locator('#close-unit-guide').click();
      await page.close();
    },
  );
  for (const [width, height] of [
    [1280, 800],
    [780, 360],
    [812, 375],
  ])
    for (const lang of ['fr', 'en'])
      await check(`native 10s x${width === 812 ? 2 : 1} ${width} ${lang}`, async () => {
        const page = await pageAt(width, height, lang);
        await page.locator('#home-continue').click();
        if (width === 812) await page.locator('#speed').click();
        const start = Date.now();
        await page.locator('#start').click();
        const text =
          lang === 'fr' ? 'Tu as des pièces, recrute !' : 'You have coins, recruit an ally!';
        await waitHint(page, text);
        assert.ok(Date.now() - start >= 9500, 'real ten seconds at both speeds');
        const box = await hint(page).boundingBox(),
          board = await page.locator('#game').boundingBox();
        assert.ok(
          box &&
            box.x >= 0 &&
            box.x + box.width <= width + 1 &&
            box.y >= 0 &&
            box.y + box.height <= height + 1,
          'bottom line in viewport',
        );
        assert.ok(
          box.y >= board.y + board.height * (550 / 620),
          'reminder stays outside the lanes',
        );
        await page.screenshot({ path: `${folder}/reminder-${width}-${lang}.png` });
        await page.waitForTimeout(2500);
        assert.equal(await hint(page).textContent(), text);
        await page.waitForTimeout(1800);
        assert.notEqual(await hint(page).textContent(), text);
        const seen = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), marker);
        assert.equal(seen.length, 1);
        assert.match(seen[0], /^AVENTURE-4-/);
        await page.reload();
        await page.locator('#home-continue').click();
        await page.locator('#start').click();
        await page.waitForTimeout(11000);
        assert.notEqual(await hint(page).textContent(), text, 'same-code reload does not repeat');
        await page.close();
      });
  await check('native pause/dialog/home/portrait freeze countdown', async () => {
    const page = await pageAt();
    await page.locator('#home-continue').click();
    await page.locator('#start').click();
    await page.waitForTimeout(2000);
    await page.locator('#pause').click();
    await page.waitForTimeout(10500);
    assert.notEqual(await hint(page).textContent(), 'Tu as des pièces, recrute !');
    await page.locator('#pause').click();
    await page.locator('#help').click();
    await page.waitForTimeout(2000);
    await page.locator('#close-help').click();
    await page.locator('#menu-home').click();
    await page.waitForTimeout(2000);
    await page.locator('#home-continue').click();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${folder}/portrait-375.png` });
    assert.notEqual(await hint(page).textContent(), 'Tu as des pièces, recrute !');
    await page.setViewportSize({ width: 1280, height: 800 });
    if (await page.locator('#resume-game').isVisible()) await page.locator('#resume-game').click();
    await page.waitForTimeout(3000);
    assert.notEqual(await hint(page).textContent(), 'Tu as des pièces, recrute !');
    await waitHint(page, 'Tu as des pièces, recrute !');
    await page.close();
  });
  await check('native spending resets ten-second countdown above the threshold', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: 'fr-CH' });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`http://127.0.0.1:4383/${fixture}`);
    await page.waitForFunction(() => !!window.balanceFixture);
    await page.evaluate(() => {
      window.balanceFixture.session.game.gold = 600;
      window.balanceFixture.refresh();
    });
    await page.locator('#start').click();
    await page.waitForTimeout(8000);
    const spentAt = Date.now();
    await page.evaluate(() => {
      window.balanceFixture.session.game.gold = 520;
      window.balanceFixture.refresh();
    });
    await page.waitForTimeout(3000);
    assert.notEqual(await hint(page).textContent(), 'Tu as des pièces, recrute !');
    await waitHint(page, 'Tu as des pièces, recrute !');
    assert.ok(Date.now() - spentAt >= 9500, 'spending restarts ten native active seconds');
    await page.screenshot({ path: `${folder}/spending-reset.png` });
    await page.close();
  });
  await check(
    'native danger priority, readable window, purchase cancellation and refused storage',
    async () => {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
        locale: 'fr-CH',
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`http://127.0.0.1:4383/${fixture}?refused=1`);
      await page.waitForFunction(() => !!window.balanceFixture);
      await page.evaluate(() => window.balanceFixture.danger(true));
      await page.locator('#start').click();
      await page.waitForTimeout(11500);
      assert.notEqual(await hint(page).textContent(), 'Tu as des pièces, recrute !');
      await page.evaluate(() => window.balanceFixture.danger(false));
      try {
        await waitHint(page, 'Tu as des pièces, recrute !');
      } catch (error) {
        await page.screenshot({ path: `${folder}/priority-failure.png` });
        await writeFile(
          `${folder}/priority-state.json`,
          JSON.stringify(
            await page.evaluate(() => ({
              screen: window.balanceFixture.session.screen,
              game: window.balanceFixture.session.game,
              hidden: document.hidden,
              dialogs: [...document.querySelectorAll('dialog[open]')].map((d) => d.id),
              line: document.getElementById('battle-announcement').textContent,
            })),
            null,
            2,
          ),
        );
        throw error;
      }
      await page.evaluate(() => window.balanceFixture.danger(true));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.balanceFixture.danger(false));
      await waitHint(page, 'Tu as des pièces, recrute !');
      await page.locator('#dock-catalogue').click();
      await page.locator('[data-kind="club"]').click();
      const board = await page.locator('#game canvas').boundingBox();
      await page.mouse.click(
        board.x + (board.width * 900) / 1100,
        board.y + (board.height * 180) / 620,
      );
      await page.waitForTimeout(300);
      assert.notEqual(await hint(page).textContent(), 'Tu as des pièces, recrute !');
      assert.equal(await page.evaluate(() => window.balanceFixture.session.recruitmentCount), 1);
      await page.close();
    },
  );
  assert.deepEqual(errors, []);
} finally {
  await writeFile(`${folder}/results.json`, JSON.stringify({ results, errors }, null, 2) + '\n');
  await browser?.close();
  preview?.kill();
  dev?.kill();
  await rm(fixture, { force: true });
}
console.log(JSON.stringify({ checks: results.length, folder }));
