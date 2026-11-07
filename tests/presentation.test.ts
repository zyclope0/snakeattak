import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { Presentation } from '../src/render/presentation.ts';

test('la présentation observe les combats sans modifier la simulation', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  g.startWave();
  g.step(0.05);
  const before = structuredClone(g);
  p.update(g, 16);
  assert.deepEqual(structuredClone(g), before);
  assert.equal(p.notice?.kind, 'wave');
});
test('dégâts et soins produisent des réactions distinctes, limitées dans le temps', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  g.units[0].hp -= 20;
  p.update(g, 16);
  assert.ok(p.floats.some((f) => f.text === '−20'));
  assert.ok(p.reactions.get(g.units[0].id)!.hurt > 0);
  g.units[0].hp += 10;
  p.update(g, 16);
  assert.ok(p.floats.some((f) => f.text === '+10'));
  assert.ok(p.reactions.get(g.units[0].id)!.heal > 0);
  for (let i = 0; i < 120; i++) p.update(g, 16);
  assert.equal(p.floats.length, 0);
  assert.equal(p.reactions.size, 0);
});
test('le roi est annoncé une seule fois quand il apparaît réellement', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  g.wave = 11;
  g.startWave();
  g.step(0.05);
  const king = g.enemies[0];
  king.boss = true;
  p.update(g, 16);
  assert.equal(p.notice?.kind, 'boss');
  for (let i = 0; i < 300; i++) p.update(g, 16);
  assert.equal(p.notice, null);
  p.update(g, 16);
  assert.equal(p.notice, null);
});
test('une vraie protection cassée du roi produit un signal unique, sans faux signal au chargement', () => {
  const g = new Game(31),
    p = new Presentation();
  g.wave = 11;
  g.startWave();
  g.remaining = 1;
  g.eggs = [];
  g.step(1 / 30);
  const king = g.enemies[0],
    hero = g.units.find((u) => u.kind === 'hero')!;
  g.units = [hero];
  Object.assign(king, { x: 800, y: 324, stage: 4, path: [], nav: 0, cool: 99 });
  Object.assign(hero, { x: 828, y: 324, homeX: 828, homeY: 324, cool: 0 });
  king.bossState!.shield = 1;
  p.update(g, 16);
  assert.equal(
    p.floats.some((f) => f.text === 'Protection brisée !'),
    false,
  );
  g.step(1 / 30);
  p.update(g, 16);
  assert.equal(p.floats.filter((f) => f.text === 'Protection brisée !').length, 1);
  p.update(g, 16);
  assert.equal(p.floats.filter((f) => f.text === 'Protection brisée !').length, 1);
  p.update(new Game(), 16);
  assert.equal(p.floats.length, 0);
});
test('pause fige les animations et une nouvelle partie nettoie les réactions', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  g.units[0].hp -= 5;
  p.update(g, 16);
  g.paused = true;
  const age = p.floats[0].age;
  p.update(g, 1000);
  assert.equal(p.floats[0].age, age);
  p.update(new Game(), 16);
  assert.equal(p.floats.length, 0);
  assert.equal(p.notice, null);
});
test('les effets répétés ne créent pas une file de particules sans limite', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  for (let i = 0; i < 200; i++) {
    g.effects.push({ x: 300, y: 300, tx: 300, ty: 300, kind: 'gold', life: 0.3 });
    p.update(g, 1);
  }
  assert.ok(p.floats.length <= 40);
  assert.ok(p.bursts.length <= 24);
});

test('les poses animées sont des vues sans mouvement réel ; mode réduit sans déformation', async () => {
  const { visualPose } = await import('../src/render/presentation.ts');
  const g = new Game();
  const u = g.units[0],
    before = structuredClone(u),
    reactions = new Map([[u.id, { hurt: 1, heal: 0 }]]);
  const pose = visualPose(u, 1, reactions, false);
  assert.notEqual(pose.x, u.x);
  assert.deepEqual(u, before);
  assert.equal(visualPose(u, 1, reactions, true), u);
});
test('la plaque du serpent mécanique se brise avec un signal unique sans modifier le combat', () => {
  const g = new Game(),
    p = new Presentation();
  g.wave = 4;
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  e.variant = 'clockwork';
  e.hp = e.maxHp = 100;
  p.update(g, 16);
  e.hp = 49;
  const before = JSON.stringify(g);
  p.update(g, 16);
  assert.equal(JSON.stringify(g), before);
  assert.equal(p.floats.filter((f) => f.text === 'Clac !').length, 1);
  p.update(g, 16);
  assert.equal(p.floats.filter((f) => f.text === 'Clac !').length, 1);
});
test('le passage vers une nouvelle clairière est annoncé après la vague', () => {
  const g = new Game(),
    p = new Presentation();
  g.wave = 3;
  g.startWave();
  p.update(g, 16);
  g.remaining = 0;
  g.eggs = [];
  g.enemies = [];
  g.step(1 / 30);
  p.update(g, 16);
  assert.equal(p.notice?.kind, 'clear');
  assert.match(p.notice!.subtitle, /bosquet/i);
});
