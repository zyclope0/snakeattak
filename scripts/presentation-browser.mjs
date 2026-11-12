import { spawn } from 'node:child_process';
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';
import { chromium } from 'playwright-core';
import { revealControl } from '../tests/reveal-controls.mjs';
const path = '.presentation-test.html';
let server, browser;
try {
  const html = (await readFile('index.html', 'utf8')).replace(
    'src="/src/main.ts"',
    'src="/tests/presentation-harness.ts"',
  );
  await writeFile(path, html);
  await mkdir('artifacts', { recursive: true });
  server = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4181', '--strictPort'],
    { stdio: 'inherit' },
  );
  const deadline = Date.now() + 15000;
  while (true) {
    if (server.exitCode !== null) throw Error('Fixture server exited');
    try {
      if ((await fetch('http://127.0.0.1:4181')).ok) break;
    } catch {}
    if (Date.now() > deadline) throw Error('Fixture server timeout');
    await setTimeout(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const errors = [];
  const scenarios = [
    'boss',
    'won',
    'honey',
    'placement',
    'storage-failed',
    'formation',
    'allies',
    'grove',
    'ruins',
    'refuge',
    'spawn',
    'tactics',
    'bestiaire',
    'royal-guard',
  ];
  const chosen = process.env.PRESENTATION_SCENARIO;
  if (chosen && !scenarios.includes(chosen)) throw Error('Unknown presentation scenario');
  for (const scenario of chosen ? [chosen] : scenarios) {
    const page = await browser.newPage({
      locale: 'fr-CH',
      viewport: { width: 1440, height: 1100 },
      reducedMotion: scenario === 'won' ? 'reduce' : 'no-preference',
    });
    page.on('pageerror', (e) => errors.push(e.message));
    if (process.env.PRESENTATION_DELAY_ASSETS === '1')
      await page.route('**/*.webp', async (route) => {
        await setTimeout(1500);
        await route.continue();
      });
    await page.goto(`http://127.0.0.1:4181/${path}?scenario=${scenario}`);
    await page.locator('canvas').waitFor();
    // Inspect the board first: the full-screen catalogue owns a temporary pause.
    // Read its advanced notices later, then close it before board captures.
    if (scenario === 'royal-guard') {
      if (!(await page.evaluate(() => !!window.strongholdFixture)))
        throw Error('Missing real boss fixture');
      await page.waitForFunction(() =>
        window.strongholdFixture.phaser.scene.getScene('Battle').sys.isActive(),
      );
      await page.waitForFunction(() =>
        document.getElementById('boss-status').textContent.includes('Phase 1/3'),
      );
      const state = await page.evaluate(() => {
        const f = window.strongholdFixture,
          g = f.session.game,
          b = g.enemies.find((e) => e.boss),
          scene = f.phaser.scene.getScene('Battle');
        return {
          windup: b.bossState.windup,
          shield: b.bossState.shield,
          range: g.tuning.bossShotRadius,
          ground: scene.bossSignals.ground.commandBuffer.length,
          protection: scene.bossSignals.protection.commandBuffer.length,
        };
      });
      if (!(state.windup > 0 && state.shield > 0 && state.ground > 0 && state.protection > 0))
        throw Error('Missing real protection/telegraph: ' + JSON.stringify(state));
      await page.waitForFunction(
        () => !window.strongholdFixture.phaser.scene.getScene('Battle').presentation.notice,
      );
      await page.screenshot({ path: 'artifacts/personnalite-royal-guard.png', fullPage: true });
      await page.locator('#pause').click();
      const paused = await page.evaluate(() =>
        JSON.stringify(window.strongholdFixture.session.game.enemies.find((e) => e.boss).bossState),
      );
      await page.waitForTimeout(150);
      if (
        (await page.evaluate(() =>
          JSON.stringify(
            window.strongholdFixture.session.game.enemies.find((e) => e.boss).bossState,
          ),
        )) !== paused
      )
        throw Error('Boss clock advanced in pause');
      await page.locator('#pause').click();
      const impact = await page.evaluate(() => {
        const g = window.strongholdFixture.session.game,
          b = g.enemies.find((e) => e.boss),
          archer = g.units.find((u) => u.kind === 'archer'),
          before = archer.hp,
          shots = b.bossState.shotsFired;
        for (const u of g.units) u.cool = 99;
        const ticks = Math.ceil(b.bossState.windup * 30) + 1;
        for (let i = 0; i < ticks; i++) g.step(1 / 30);
        return {
          shots: b.bossState.shotsFired - shots,
          damage: before - archer.hp,
          max: g.tuning.bossShotDamage,
        };
      });
      if (impact.shots !== 1 || !(impact.damage > 0 && impact.damage <= impact.max))
        throw Error('Wrong announced impact: ' + JSON.stringify(impact));
      await page.waitForTimeout(100);
      await page.screenshot({ path: 'artifacts/personnalite-royal-impact.png', fullPage: true });
    }
    if (scenario === 'refuge' || scenario === 'spawn') {
      await page.waitForFunction(() =>
        window.strongholdFixture?.phaser.scene.getScene('Battle').sys.isActive(),
      );
      if (scenario === 'refuge') {
        const initial = await page.evaluate(() => {
          const scene = window.strongholdFixture.phaser.scene.getScene('Battle');
          return {
            damage: scene.presentation.fortDamage,
            label: scene.strongholds.label.text,
            flip: scene.strongholds.fort.flipX,
          };
        });
        if (initial.damage !== 0 || initial.label !== 'REFUGE · 28 %' || !initial.flip)
          throw Error('Refuge restore state/orientation wrong');
        await page.evaluate(() => {
          window.strongholdFixture.session.game.base = 19;
        });
        await page.waitForFunction(
          () =>
            window.strongholdFixture.phaser.scene.getScene('Battle').strongholds.label.text ===
            'REFUGE · 19 %',
        );
        await revealControl(page, '[data-kind="club"]');
        await page.locator('[data-kind="club"]').click();
        const field = await page.locator('canvas').boundingBox();
        await page.mouse.click(
          field.x + (field.width * 984) / 1100,
          field.y + (field.height * 312) / 620,
        );
        const visible = await page.evaluate(async () => {
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
          const f = window.strongholdFixture,
            scene = f.phaser.scene.getScene('Battle');
          const unit = f.session.game.units.find(
            (u) => Math.abs(u.homeX - 984) < 1 && Math.abs(u.homeY - 312) < 1,
          );
          return (
            !!unit &&
            scene.actors.pieces.get(`entity:${unit.id}`).depth > scene.strongholds.fort.depth
          );
        });
        if (!visible) throw Error('Fort hides a legally recruited defender at (984,312)');
      } else {
        await page.evaluate(() => {
          const g = window.strongholdFixture.session.game;
          g.startWave();
          g.step(1 / 30);
        });
        await page.waitForFunction(
          () =>
            window.strongholdFixture.phaser.scene.getScene('Battle').presentation.arrivals
              .length === 1,
        );
        const spawn = await page.evaluate(() => {
          const f = window.strongholdFixture,
            scene = f.phaser.scene.getScene('Battle'),
            p = scene.presentation;
          const a = p.arrivals[0];
          a.age = 0.14;
          p.update = () => {}; // A frozen visual control frame, never production code.
          return {
            source: a.source,
            lane: a.lane,
            actual: f.session.game.enemies[0].lane,
            count: f.session.game.enemies.length,
          };
        });
        if (spawn.source !== 'den' || spawn.lane !== spawn.actual || spawn.count !== 1)
          throw Error('False den pulse or extra monster');
      }
    }
    if (scenario === 'tactics') {
      await page.waitForFunction(() =>
        window.strongholdFixture?.phaser.scene.getScene('Battle').sys.isActive(),
      );
      await page.waitForFunction(
        () =>
          window.strongholdFixture.phaser.scene.getScene('Battle').presentation.actions.size > 0,
      );
      const state = await page.evaluate(() => {
        const f = window.strongholdFixture,
          g = f.session.game,
          p = f.phaser.scene.getScene('Battle').presentation;
        for (const action of p.actions.values()) action.age = 0.14;
        p.update = () => {};
        return {
          sticky: g.feast?.flavor,
          guard: g.units.find((u) => u.kind === 'shield')?.guardCool,
          open: g.enemies.filter((e) => e.variant === 'umbrella' && e.state === 'move').length,
          closed: g.enemies.filter((e) => e.variant === 'umbrella' && e.state === 'attack').length,
          ninja: g.units.find((u) => u.kind === 'ninja')?.targetId,
          dragonAction: p.actions.get(g.units.find((u) => u.kind === 'dragon').id)?.kind,
          dinoAction: p.actions.get(g.units.find((u) => u.kind === 'dino').id)?.kind,
          actions: [...p.actions].map(([id, action]) => ({ id, ...action })),
          effects: g.effects.map((e) => ({ source: e.sourceId, kind: e.kind })),
        };
      });
      if (
        state.sticky !== 'sticky' ||
        !(state.guard > 0) ||
        state.open < 1 ||
        state.closed < 1 ||
        state.ninja !== 2003 ||
        state.dragonAction !== 'fire' ||
        state.dinoAction !== 'hit'
      )
        throw Error('Missing true tactics state: ' + JSON.stringify(state));
      if (
        (await page.locator('[data-feast-flavor="sticky"]').getAttribute('aria-pressed')) !== 'true'
      )
        throw Error('Active honey flavour absent');
    }
    if (scenario === 'formation') {
      const state = await page.evaluate(async () => {
        const f = window.battleFixture;
        for (let i = 0; i < 240; i++) {
          f.step(1);
          await new Promise(requestAnimationFrame);
        }
        return {
          status: f.game.status,
          edge: f.game.units.filter((u) => u.kind !== 'ninja' && u.kind !== 'medic' && u.x <= 636)
            .length,
        };
      });
      if (state.status !== 'fighting' || state.edge > 0)
        throw Error('Defenders collapsed into the bridge');
    }
    if (scenario === 'allies' && (await page.locator('#army-count').innerText()) !== '21')
      throw Error(`Missing illustrated ally: HUD=${await page.locator('#army-count').innerText()}`);
    if (scenario === 'bestiaire') {
      await page.waitForFunction(() =>
        window.strongholdFixture?.phaser.scene.getScene('Battle').sys.isActive(),
      );
      const state = await page.evaluate(async () => {
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const f = window.strongholdFixture,
          g = f.session.game,
          scene = f.phaser.scene.getScene('Battle');
        return {
          confused: g.units.filter((u) => u.confusedFor > 0).length,
          kinds: g.units.map((u) => u.kind),
          art: g.enemies.map((e) => scene.actors.pieces.get(`entity:${e.id}`)?.texture.key),
          outlines: [...g.units, ...g.enemies].every((u) => {
            const actor = scene.actors.pieces.get(`entity:${u.id}`),
              edge = scene.actors.pieces.get(`edge:${u.id}`);
            return (
              !!edge &&
              actor.x === edge.x &&
              actor.y === edge.y &&
              actor.flipX === edge.flipX &&
              actor.rotation === edge.rotation &&
              edge.depth < actor.depth
            );
          }),
        };
      });
      if (
        state.kinds.length !== 6 ||
        state.confused < 1 ||
        !state.outlines ||
        // Un serpent qui mord montre la même case sur la planche d'attaque de sa famille.
        state.art.some((k) => k?.replace(/-attack$/, '') !== 'serpents-family')
      )
        throw Error('Bestiary sprites/status/outline missing: ' + JSON.stringify(state));
      // Let the entrance banner clear so the review frame exposes all silhouettes.
      await page.waitForFunction(
        () => !window.strongholdFixture.phaser.scene.getScene('Battle').presentation.notice,
      );
    }
    if (
      scenario === 'grove' &&
      !(await page.locator('#level-name').textContent()).includes('bosquet')
    )
      throw Error('Missing grove');
    if (
      scenario === 'ruins' &&
      !(await page.locator('#level-name').textContent()).includes('pierres')
    )
      throw Error('Missing ruins');
    if (scenario === 'boss') {
      await revealControl(page, '#encounter');
      await page.locator('#encounter[data-tone="boss"]').waitFor();
    }
    if (scenario === 'honey')
      await page.waitForFunction(() =>
        document.getElementById('feast-status').textContent.includes('1 détour'),
      );
    if (scenario === 'placement') {
      await revealControl(page, '#encounter');
      await page.locator('#encounter[data-tone="place"]').waitFor();
    }
    if (scenario === 'storage-failed') {
      await page.waitForFunction(
        () => document.getElementById('phase').textContent === 'PRÉPARATION',
      );
      await revealControl(page, '#save-status');
      if (!(await page.locator('#save-status').innerText()).includes('indisponible'))
        throw Error('Storage failure hidden');
      if ((await page.locator('body').innerText()).includes('Votre camp est sauvegardé'))
        throw Error('False save promise');
    }
    await page.waitForTimeout(500);
    if (await page.locator('#reinforcements').isVisible()) {
      await page.screenshot({
        path: `artifacts/personnalite-${scenario}-details.png`,
        fullPage: true,
      });
      await page.locator('#reinforcements-close').click();
    }
    if (scenario !== 'royal-guard')
      await page.screenshot({ path: `artifacts/personnalite-${scenario}.png`, fullPage: true });
    if (scenario === 'refuge') {
      const repaired = await page.evaluate(() => window.strongholdFixture.session.game.repair());
      if (!repaired) throw Error('Real refuge repair rejected');
      await page.waitForFunction(
        () =>
          window.strongholdFixture.phaser.scene.getScene('Battle').strongholds.label.text ===
          'REFUGE · 44 %',
      );
      await page.screenshot({ path: 'artifacts/personnalite-refuge-repare.png', fullPage: true });
    }
    if (scenario === 'won') {
      if (!(await page.locator('[data-feast-flavor="sticky"]').isDisabled()))
        throw Error('Honey selection active after victory');
      // The catalogue is closed before the visible result action.
      await page.locator('#end-restart').click();
      if ((await page.locator('#wave').innerText()) !== '0')
        throw Error('Restart from victory failed');
    }
    await page.close();
  }
  if (errors.length) throw Error(errors.join('\n'));
  console.log(
    `Presentation fixtures: ${chosen ? chosen : `${scenarios.length} scenarios including royal shield, locked shot, pause and impact`}; no browser errors.`,
  );
} finally {
  await browser?.close();
  server?.kill();
  await unlink(path).catch(() => {});
}
