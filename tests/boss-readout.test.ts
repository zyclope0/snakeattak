import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { bossReadout } from '../src/render/bossReadout.ts';

function fixture() {
  const g = new Game(42);
  g.wave = 11;
  g.units = [];
  g.startWave();
  g.remaining = 1;
  g.eggs = [];
  g.step(1 / 30);
  const boss = g.enemies[0];
  boss.bossState = {
    phase: 2,
    shield: 50,
    shieldMax: 100,
    shieldsBroken: 1,
    shotsFired: 1,
    shotCooldown: 0,
    windup: g.tuning.bossShotWindup / 2,
    targetX: 900,
    targetY: 324,
    shotTargetId: 99,
    breakFlash: 0.3,
  };
  return { g, boss };
}
test('le signal du boss suit sa vraie marque et le rayon du moteur', () => {
  const { g, boss } = fixture(),
    before = JSON.stringify(g);
  const r = bossReadout(boss, g.tuning)!;
  assert.equal(r.phase, 2);
  assert.equal(r.shieldRatio, 0.5);
  assert.deepEqual(r.shot, { x: 900, y: 324, radius: g.tuning.bossShotRadius, progress: 0.5 });
  assert.match(r.label, /Phase 2\/3/);
  assert.equal(JSON.stringify(g), before, 'le rendu ne change pas la simulation');
});
test('pas de faux signal après mort, sans boss ou sans télégraphe', () => {
  const { g, boss } = fixture();
  boss.bossState!.windup = 0;
  assert.equal(bossReadout(boss, g.tuning)!.shot, null);
  boss.hp = 0;
  assert.equal(bossReadout(boss, g.tuning), null);
  boss.hp = 100;
  boss.boss = false;
  assert.equal(bossReadout(boss, g.tuning), null);
});
