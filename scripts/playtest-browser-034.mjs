import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createMissionRun, MISSIONS } from '../src/missions.ts';
import { encodeDeparture } from '../src/departures.ts';
const root = process.env.PLAYTEST_URL ?? 'https://conquete-serpents-famille.zyclope.chatgpt.site/';
const expectedVersion = process.env.PLAYTEST_VERSION ?? '0.34.1';
const folder = process.env.PLAYTEST_FOLDER ?? 'artifacts/playtest-0341';
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const saved =
  process.argv.includes('--classic-only') || process.argv.includes('--ranged-classic')
    ? JSON.parse(await readFile(folder + '/browser-games.json', 'utf8'))
    : null;
const records = saved?.records ?? [],
  errors = saved?.errors ?? [];
let serial = 0;
async function main(profile, width = 1280, height = 800, campaign = true, classic = false) {
  const context = await browser.newContext({
    locale: process.env.PLAYTEST_LANGUAGE ?? 'fr-CH',
    viewport: { width, height },
    hasTouch: width < 1000,
  });
  const page = await context.newPage();
  let controlled = false;
  page.on('pageerror', (e) => errors.push(e.message));
  async function step(ms) {
    if (controlled) await page.clock.runFor(ms);
    else await delay(ms);
  }
  async function read() {
    return page.evaluate(() => ({
      status: document.querySelector('#app').dataset.status,
      wave: +document.querySelector('#wave').textContent,
      total: +document.querySelector('#wave-total').textContent,
      gold: +document.querySelector('#gold').textContent.replace(/[^0-9.-]/g, ''),
      base: parseFloat(document.querySelector('#base').textContent),
      army: +document.querySelector('#army-count').textContent,
      message: document.querySelector('#message').textContent,
      phase: document.querySelector('#phase').textContent,
      boss: document.querySelector('#boss-status').hidden
        ? null
        : document.querySelector('#boss-status').textContent,
      paused: !document.querySelector('#pause-overlay').hidden,
    }));
  }
  async function tap(selector) {
    const el = page.locator(selector).first();
    if (!(await el.isVisible()) || !(await el.isEnabled())) return false;
    await el.evaluate((e) =>
      e.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' }),
    );
    const b = await el.boundingBox();
    if (!b) return false;
    const x = b.x + b.width / 2,
      y = b.y + b.height / 2;
    const hit = await el.evaluate(
      (e, { x, y }) => {
        const h = document.elementFromPoint(x, y);
        return h === e || e.contains(h);
      },
      { x, y },
    );
    if (!hit || x < 0 || y < 0 || x > width || y > height) return false;
    if (width < 1000) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    return true;
  }
  async function ready() {
    for (let i = 0; i < 100; i++) {
      await step(100);
      if ((await page.locator('#game').getAttribute('aria-busy')) === 'false') return;
      await delay(50);
    }
    throw Error('Assets unavailable');
  }
  async function home() {
    if (await page.locator('#app').evaluate((e) => !e.hidden))
      assert.ok(await tap(width < 1000 ? '#mobile-home' : '#menu-home'));
  }
  async function launch(id, seed) {
    await home();
    const detail = page.locator('#home-parent-options');
    if (!(await detail.evaluate((e) => e.open)))
      assert.ok(await tap('#home-parent-options>summary'));
    const run = classic ? { missionId: 'classic', seed } : createMissionRun(id, seed),
      code = encodeDeparture(classic ? { kind: 'classic', seed } : { kind: 'mission', run });
    await page.locator('#departure-input').fill(code);
    assert.ok(await tap('#departure-form button'));
    if (classic) {
      assert.ok(await tap('#departure-start'));
      if (await page.locator('#journey-confirm').isVisible())
        assert.ok(await tap('#journey-replace'));
      await ready();
      return { run, code };
    }
    if (!(await page.locator('#mission-dialog').isVisible()))
      throw Error(
        'Mission locked/unavailable: ' + (await page.locator('#departure-message').textContent()),
      );
    const actual = JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run'));
    assert.deepEqual(actual, run);
    assert.ok(await tap('#mission-launch'));
    if (await page.locator('#journey-confirm').isVisible())
      assert.ok(await tap('#journey-replace'));
    await ready();
    return { run, code };
  }
  async function card(kind) {
    const dock = `#dock-allies [data-dock-kind="${kind}"]`;
    if ((await page.locator(dock).count()) && (await page.locator(dock).isVisible())) return dock;
    if (!(await page.locator('#app').evaluate((e) => e.classList.contains('reinforcements-open'))))
      await tap('#reinforcements-toggle');
    const shop = `#shop [data-kind="${kind}"]`;
    if (!(await page.locator(shop).count()) || !(await page.locator(shop).isVisible())) return null;
    return shop;
  }
  async function buy(kind, turn) {
    const s = await card(kind);
    if (!s || !(await page.locator(s).isEnabled()) || !(await tap(s))) return false;
    if (await page.locator('#app').evaluate((e) => e.classList.contains('reinforcements-open')))
      await tap('#reinforcements-toggle');
    const before = await read(),
      canvas = await page.locator('#game canvas').boundingBox();
    for (let i = 0; i < 54; i++) {
      const lane = (turn + i) % 3,
        x = [660, 732, 804, 876, 948, 696][Math.floor(i / 9) % 6],
        y = [180, 324, 468][lane] + [0, -48, 48][Math.floor(i / 3) % 3];
      const px = canvas.x + (x / 1100) * canvas.width,
        py = canvas.y + (y / 620) * canvas.height;
      if (width < 1000) await page.touchscreen.tap(px, py);
      else await page.mouse.click(px, py);
      const after = await read();
      if (after.gold < before.gold && after.army > before.army)
        return { kind, x, y, cost: before.gold - after.gold };
    }
    await tap('#dock-cancel');
    return false;
  }
  await page.goto(root);
  assert.equal(
    (await page.locator('[data-app-version]').first().textContent()).trim(),
    `v${expectedVersion}`,
  );
  for (const [index, mission] of (classic
    ? [{ id: 'classic', waves: Array(12).fill(1) }]
    : campaign
      ? MISSIONS
      : [MISSIONS[0]]
  ).entries()) {
    const setup = await launch(
      mission.id,
      20261109 + index * 104729 + (profile === 'novice' ? 1 : 0),
    );
    if (!controlled) {
      await page.clock.install();
      await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 1000)));
      controlled = true;
    }
    const rec = {
      profile,
      viewport: { width, height },
      ...setup,
      events: [],
      waves: [],
      status: null,
    };
    records.push(rec);
    await tap('#speed');
    let turn = 0;
    for (let wave = 1; wave <= mission.waves.length; wave++) {
      const before = await read();
      if (before.status === 'won' || before.status === 'lost') break;
      const purchases = [];
      const sequence =
        profile === 'none'
          ? []
          : profile === 'novice'
            ? ['club', 'wall']
            : profile === 'ranged'
              ? wave === 1
                ? ['nurse', 'archer', 'club']
                : ['archer', 'archer', 'archer', 'shield', 'medic', 'archer']
              : wave === 1
                ? ['nurse', 'shield', 'archer', 'club', 'archer', 'club']
                : ['archer', 'shield', 'archer', 'club', 'nurse', 'archer'];
      for (const kind of sequence) {
        const b = await buy(kind, turn++);
        if (b) purchases.push(b);
      }
      const prep = await read();
      await page.screenshot({ path: `${folder}/${profile}-${mission.id}-wave${wave}-prep.png` });
      if (await page.locator('#reward-panel').isVisible()) assert.ok(await tap('#skip-reward'));
      assert.ok(await tap('#start'), 'Wave launch button reachable');
      const wr = { wave, purchases, prep, intervals: 0, combat: [], virtualMs: 0 };
      rec.waves.push(wr);
      for (let tick = 0; tick < 360; tick++) {
        await step(1000);
        wr.virtualMs += 1000;
        const state = await read();
        if (tick % 10 === 0) wr.combat.push(state);
        if (state.boss && !wr.bossSeen) {
          wr.bossSeen = true;
          await page.screenshot({
            path: `${folder}/${profile}-${mission.id}-wave${wave}-boss.png`,
          });
        }
        if (tick === 5) {
          await page.screenshot({
            path: `${folder}/${profile}-${mission.id}-wave${wave}-combat.png`,
          });
          if (
            profile === 'mixed' &&
            (await page.locator('#dock-honey button').first().isEnabled())
          ) {
            await tap('#dock-honey button');
            const c = await page.locator('#game canvas').boundingBox();
            if (width < 1000)
              await page.touchscreen.tap(c.x + c.width * 0.65, c.y + c.height * 0.52);
            else await page.mouse.click(c.x + c.width * 0.65, c.y + c.height * 0.52);
          }
        }
        if (state.status !== 'fighting') {
          wr.result = state;
          wr.intervals = tick + 1;
          break;
        }
      }
      if (!wr.result) {
        rec.status = 'timeout';
        rec.last = await read();
        break;
      }
      console.log(
        JSON.stringify({
          profile,
          mission: mission.id,
          wave,
          result: wr.result,
          virtualMs: wr.virtualMs,
          purchases: purchases.length,
        }),
      );
      await writeFile(
        `${folder}/progress.json`,
        JSON.stringify({ records, errors }, null, 2) + '\n',
      );
    }
    rec.status ??= (await read()).status;
    rec.final = await read();
    rec.resultActions = await page.evaluate(() =>
      Object.fromEntries(
        ['mission-next', 'mission-again', 'mission-back-map', 'end-restart'].map((id) => {
          const e = document.getElementById(id),
            r = e.getBoundingClientRect();
          return [
            id,
            {
              hidden: e.hidden,
              visible: !!(r.width && r.height),
              ancestors: [
                ...(function* (n) {
                  while (n) {
                    if (n.tagName === 'DETAILS') yield { id: n.id, open: n.open };
                    n = n.parentElement;
                  }
                })(e),
              ],
            },
          ];
        }),
      ),
    );
    await page.screenshot({ path: `${folder}/${profile}-${mission.id}-result.png` });
    if (process.argv.includes('--smoke-only') && rec.status === 'won') {
      assert.equal(await page.locator('#mission-next').isVisible(), true);
      assert.ok(await tap('#mission-next'));
      assert.equal(
        JSON.parse(await page.locator('#mission-dialog').getAttribute('data-run')).missionId,
        'trois-ponts',
      );
      rec.nextMissionPreviewFromVisibleAction = true;
    }
    console.log(
      JSON.stringify({
        completed: rec.run.missionId,
        profile,
        status: rec.status,
        resultActions: rec.resultActions,
      }),
    );
    await writeFile(`${folder}/progress.json`, JSON.stringify({ records, errors }, null, 2) + '\n');
    if (rec.status !== 'won' || !campaign) break;
  }
  await context.close();
}
try {
  if (process.argv.includes('--smoke-only')) await main('mixed', 812, 375, false);
  else if (process.argv.includes('--ranged-classic')) await main('ranged', 812, 375, false, true);
  else if (process.argv.includes('--classic-only')) await main('none', 812, 375, false, true);
  else {
    await main('mixed');
    await main('none', 812, 375, false);
    await main('novice', 812, 375, false);
  }
} finally {
  await writeFile(
    `${folder}/browser-games.json`,
    JSON.stringify(
      {
        method:
          'Real browser app, fresh isolated contexts, native pointer/touch commands; no engine injections or save edits; supported x2 plus Playwright clock.runFor enumerating animation frames, not human real-time play',
        version: expectedVersion,
        url: root,
        records,
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  await browser.close();
}
