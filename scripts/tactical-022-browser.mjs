import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright-core';
const path = '.tactical-022-test.html';
let server, browser;
try {
  await writeFile(
    path,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/tactical-022-harness.ts"',
    ),
  );
  server = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4194', '--strictPort'],
    { stdio: 'inherit' },
  );
  for (let i = 0; ; i++) {
    try {
      if ((await fetch('http://127.0.0.1:4194')).ok) break;
    } catch {}
    if (i > 100) throw Error('Fixture timeout');
    await delay(100);
  }
  await mkdir('artifacts', { recursive: true });
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  for (const scenario of ['medical', 'flying', 'court']) {
    for (const width of [1440, 390, 320, 844]) {
      const p = await browser.newPage({
        viewport: { width, height: width === 1440 ? 1100 : width === 844 ? 390 : 844 },
        reducedMotion: 'reduce',
      });
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(`http://127.0.0.1:4194/${path}?case=${scenario}`);
      await p.waitForFunction(() =>
        window.tacticalFixture?.phaser.scene.getScene('Battle').sys.isActive(),
      );
      if (scenario === 'medical') {
        assert.match(await p.locator('#medical-status').innerText(), /Bandages/);
        await p.evaluate(() => window.tacticalFixture.step(1));
        assert.equal(
          await p.evaluate(
            () => window.tacticalFixture.game.units.find((u) => u.kind === 'medic').medical.phase,
          ),
          'returning',
        );
        await p.evaluate(() => window.tacticalFixture.step(90));
        const before = await p.evaluate(() => JSON.stringify(window.tacticalFixture.game));
        await p.locator('#pause').click();
        const paused = await p.evaluate(() => JSON.stringify(window.tacticalFixture.game));
        await p.evaluate(() => window.tacticalFixture.step(300));
        assert.equal(await p.evaluate(() => JSON.stringify(window.tacticalFixture.game)), paused);
        await p.locator('#pause').click();
        await p.evaluate(() => window.tacticalFixture.step(240));
        assert.ok(
          await p.evaluate(
            () =>
              window.tacticalFixture.game.units.find((u) => u.kind === 'medic').medical.bandages >
              0,
          ),
        );
        assert.notEqual(
          before,
          await p.evaluate(() => JSON.stringify(window.tacticalFixture.game)),
        );
      } else if (scenario === 'flying') {
        const hp = await p.evaluate(() => window.tacticalFixture.game.enemies[0].hp);
        await p.evaluate(() => window.tacticalFixture.step(60));
        assert.ok(await p.evaluate((hp) => window.tacticalFixture.game.enemies[0].hp < hp, hp));
      } else {
        assert.equal(
          await p.evaluate(() => window.tacticalFixture.game.enemies.filter((e) => e.court).length),
          3,
        );
        assert.match(await p.locator('#boss-status').innerText(), /Gardienne.*Cracheuse.*Mixte/);
        await p.evaluate(() => window.tacticalFixture.dropRanged());
        await p.evaluate(() => window.tacticalFixture.step(120));
        assert.equal(
          await p.evaluate(
            () => window.tacticalFixture.game.enemies.find((e) => e.boss).bossState.heads.ranged.hp,
          ),
          0,
        );
        assert.match(await p.locator('#boss-status').innerText(), /Cracheuse KO/);
      }
      await p.screenshot({
        path: `artifacts/tactique-022-${scenario}-${width}.png`,
        fullPage: true,
      });
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (width === 390 || width === 320) {
        assert.ok(
          await p.evaluate(() => {
            const title = document.querySelector('#app .brand h1').getBoundingClientRect();
            const dashboard = document.querySelector('.dashboard').getBoundingClientRect();
            return title.top >= 0 && title.bottom <= dashboard.top + 1;
          }),
          'The full title remains above the dashboard in narrow desktop portraits',
        );
        for (const button of await p.locator('.app-header button, .dashboard button').all()) {
          if (!(await button.isVisible())) continue;
          const rect = await button.boundingBox();
          assert.ok(
            rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width + 1 && rect.height >= 44,
            'Every portrait command stays reachable without reducing its touch target',
          );
        }
      }
      await p.close();
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    'Tactique0.22: bandages/retour/pause, vol/contres, cour/têtes/soins, deuxformats et mouvementréduit OK.',
  );
} finally {
  await browser?.close();
  server?.kill();
  await unlink(path).catch(() => {});
}
