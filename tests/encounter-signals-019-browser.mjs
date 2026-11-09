import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
// Test fixture only: real Game/Scene, fixed combat frame, no production route.
const fixture = 'encounter-signals-019-test.html';
let server, browser;
try {
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      'src="/src/main.ts"',
      'src="/tests/presentation-harness.ts"',
    ),
  );
  await mkdir('artifacts', { recursive: true });
  server = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4189', '--strictPort'],
    { stdio: 'inherit' },
  );
  const deadline = Date.now() + 15000;
  while (true) {
    assert.equal(server.exitCode, null, 'le serveur de fixture doit rester actif');
    try {
      if ((await fetch('http://127.0.0.1:4189')).ok) break;
    } catch {}
    assert.ok(Date.now() < deadline, 'le serveur doit démarrer');
    await setTimeout(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [width, height] of [
    [1440, 1000],
    [390, 844],
    [320, 740],
    [844, 390],
  ]) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({
        locale: 'fr-CH',
        viewport: { width, height },
        reducedMotion,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:4189/${fixture}?scenario=royal-guard`);
      await page.waitForFunction(() =>
        window.strongholdFixture?.phaser.scene.getScene('Battle').sys.isActive(),
      );
      await page.evaluate(() => {
        const game = window.strongholdFixture.session.game;
        game.eggs = [252, 300, 348].map((x, i) => ({
          id: 9901 + i,
          x,
          y: 324,
          lane: 1,
          duration: 8,
          hatchIn: 2.6,
          count: 1,
        }));
        game.units[0].confusedFor = 0.8;
        game.encourage();
      });
      await page.waitForTimeout(100);
      const read = () =>
        page.evaluate(() => {
          const { session, phaser } = window.strongholdFixture;
          const scene = phaser.scene.getScene('Battle');
          const labels = scene.feedback.encounterLabels;
          return {
            allocated: labels?.length ?? 0,
            labels:
              labels
                ?.filter((label) => label.visible)
                .map((label) => ({
                  text: label.text,
                  x: label.x,
                  y: label.y,
                  alpha: label.alpha,
                  width: label.width,
                  height: label.height,
                })) ?? [],
            signals: scene.presentation.encounter,
            clock: scene.presentation.clock,
            game: JSON.stringify(session.game),
            canvas: { width: phaser.canvas.width, height: phaser.canvas.height },
          };
        });
      const initial = await read();
      assert.ok(
        await page.locator('#encounter-tip').isVisible(),
        'le signal urgent reste expliqué en HTML sur petit écran',
      );
      assert.match(
        await page.locator('#encounter-tip').innerText(),
        /cercle au sol|zone.*touchée/i,
      );
      assert.equal(initial.allocated, 9, 'neuf textes réutilisés pour tous les signaux');
      assert.equal(initial.labels.length, 6);
      const eggs = initial.labels.filter((label) => label.text.includes('Éclosion'));
      assert.equal(eggs.length, 3);
      for (let i = 1; i < eggs.length; i++)
        assert.ok(eggs[i].x - eggs[i - 1].x >= 154, 'étiquettes des œufs sans chevauchement');
      for (const pattern of [
        /Éclosion · 3 s/,
        /\? 1 allié hésite/,
        /Courage !.*8 s/,
        /Crachat ici/,
      ])
        assert.ok(
          initial.labels.some((label) => pattern.test(label.text)),
          String(pattern),
        );
      for (const label of initial.labels) {
        assert.ok(label.x - label.width / 2 >= 0 && label.x + label.width / 2 <= 1100);
        assert.ok(label.y - label.height / 2 >= 0 && label.y + label.height / 2 <= 620);
      }
      await page.screenshot({
        path: `artifacts/signaux-019-${width}-${reducedMotion}.png`,
        fullPage: true,
      });
      if (width === 1440) {
        await page.evaluate(async () => {
          const { waveBriefing } = await import('/src/waves.ts');
          const scene = window.strongholdFixture.phaser.scene.getScene('Battle');
          const briefing = waveBriefing(9);
          scene.presentation.notice = {
            kind: 'wave',
            title: briefing.title,
            subtitle: briefing.tip,
            remaining: 2.6,
            duration: 2.6,
            priority: 1,
          };
        });
        await page.waitForTimeout(60);
        const briefingSize = await page.evaluate(() => {
          const text = window.strongholdFixture.phaser.scene.getScene('Battle').feedback.subtitle;
          return { width: text.width, height: text.height };
        });
        assert.ok(
          briefingSize.width <= 742 && briefingSize.height <= 34,
          `le briefing long reste dans sa plaque : ${JSON.stringify(briefingSize)}`,
        );
      }
      await page.evaluate(() => {
        window.strongholdFixture.session.game.paused = true;
      });
      await page.waitForTimeout(60);
      const paused = await read();
      await page.waitForTimeout(150);
      const after = await read();
      assert.deepEqual(after.labels, paused.labels, 'les textes restent fixes pendant la pause');
      assert.deepEqual(after.signals, paused.signals);
      assert.equal(after.clock, paused.clock);
      assert.equal(after.game, paused.game);
      await page.evaluate(() => {
        const game = window.strongholdFixture.session.game;
        game.paused = false;
        game.encouragementRemaining = 0;
        game.units.forEach((unit) => {
          unit.confusedFor = 0;
        });
        game.eggs = [];
        game.enemies.find((enemy) => enemy.boss).bossState.windup = 0;
      });
      await page.waitForTimeout(80);
      assert.equal((await read()).labels.length, 0, 'chaque signal cesse avec son état réel');
      await page.evaluate(() => {
        const game = window.strongholdFixture.session.game;
        game.status = 'lost';
        game.encouragementRemaining = 8;
      });
      await page.waitForTimeout(80);
      assert.equal((await read()).labels.length, 0, 'aucun signal de combat après la fin');
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  console.log(
    'Signaux 0.19 : 8 contrôles navigateur, pause/fin, bornes, états réels, mouvements réduits ; aucune erreur.',
  );
} finally {
  await browser?.close();
  server?.kill();
  await unlink(fixture).catch(() => {});
}
