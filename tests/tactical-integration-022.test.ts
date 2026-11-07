import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { ensureMedical } from '../src/healing.ts';
import type { Entity } from '../src/game.ts';
function arena() {
  const g = new Game(221);
  g.wave = 6;
  g.status = 'fighting';
  g.remaining = 0;
  g.eggs = [];
  const e = {
    ...g.units[0],
    id: 900,
    kind: 'snake',
    variant: 'flying',
    hp: 500,
    maxHp: 500,
    x: 700,
    y: 324,
    lane: 1,
    stage: 4,
    cool: 99,
    homeX: 700,
    homeY: 324,
    path: [],
  } as Entity;
  g.enemies = [e];
  return { g, e };
}
test('un médecin épuise six bandages puis rejoint réellement le fort avant recharge', () => {
  const g = new Game(22);
  g.gold = 1000;
  g.units = g.units.filter((u) => u.kind === 'hero');
  const hero = g.units[0];
  hero.hp = 1;
  assert.ok(g.recruit('medic', 864, 360));
  const medic = g.units.find((u) => u.kind === 'medic')!;
  for (let i = 0; i < 700 && medic.medical?.phase !== 'returning'; i++) g.step(1 / 30);
  assert.equal(medic.medical?.bandages, 0);
  assert.equal(medic.medical?.phase, 'returning');
  const health = hero.hp;
  let sawRestocking = false;
  const phase = () => medic.medical!.phase;
  for (let i = 0; i < 600 && phase() !== 'ready'; i++) {
    g.step(1 / 30);
    if (phase() === 'restocking') {
      sawRestocking = true;
      assert.ok(medic.x > 940);
      assert.equal(hero.hp, health);
    }
  }
  assert.ok(sawRestocking);
  assert.equal(medic.medical!.phase, 'ready');
  assert.equal(medic.medical!.bandages, 6);
});
test('les volants sont hors de portée de mêlée mais les archers peuvent les blesser', () => {
  const { g, e } = arena();
  const hero = g.units.find((u) => u.kind === 'hero')!;
  g.units = [hero];
  Object.assign(hero, { x: 700, y: 324, cool: 0 });
  g.step(1 / 30);
  assert.equal(e.hp, 500, 'La mêlée ne frappe pas le volant');
  g.gold = 1000;
  assert.ok(g.recruit('archer', 800, 324));
  g.step(1 / 30);
  assert.ok(e.hp < 500, 'Les flèches atteignent le volant');
});
test('un volant poursuit sa route pendant sa morsure et ne forme pas un mur de mêlée', () => {
  const { g, e } = arena();
  g.units = g.units.filter((u) => u.kind === 'hero');
  Object.assign(g.units[0], { x: 705, y: 324, cool: 99 });
  e.cool = 0;
  const before = e.x;
  g.step(1 / 30);
  assert.ok(e.x > before);
});
test('le dernier groupe contient le roi et exactement trois gardes dont un soigneur', () => {
  const g = new Game(22);
  g.wave = 11;
  g.startWave();
  g.eggs = [];
  g.remaining = 4;
  g.spawnTimer = 0;
  g.step(1 / 30);
  assert.equal(g.remaining, 0);
  assert.equal(g.enemies.filter((e) => e.boss).length, 1);
  assert.equal(g.enemies.filter((e) => e.court?.role === 'guard').length, 2);
  assert.equal(g.enemies.filter((e) => e.court?.role === 'healer').length, 1);
  const king = g.enemies.find((e) => e.boss)!;
  assert.equal(king.variant, 'normal', 'Le roi reste terrestre et conserve sa défense de voie');
  assert.ok(king.bossState?.heads);
});
test('pause fige stocks, trajet de recharge, vie et temporisations des têtes', () => {
  const g = new Game(22);
  g.gold = 1000;
  g.recruit('medic', 864, 360);
  const medic = g.units.find((u) => u.kind === 'medic')!;
  const state = ensureMedical(medic)!;
  state.bandages = 0;
  state.phase = 'returning';
  g.paused = true;
  const before = JSON.stringify(g);
  g.step(5);
  assert.equal(JSON.stringify(g), before);
});
