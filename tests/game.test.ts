import test from 'node:test';
import assert from 'node:assert/strict';
import { TOTAL_WAVES } from '../src/data.ts';
import { Game } from '../src/game.ts';
import { findPath, blocked } from '../src/navigation.ts';

test('départ : deux massues et un héros ; recrutement payant seulement dans le camp', () => {
  const g = new Game();
  assert.deepEqual(
    g.units.map((u) => u.kind),
    ['club', 'club', 'hero'],
  );
  const gold = g.gold;
  assert.equal(g.recruit('ninja', 200, 250), false);
  assert.equal(g.gold, gold);
  assert.equal(g.recruit('ninja', 700, 350), true);
  assert.equal(g.gold, gold - 150);
  assert.equal(g.recruit('medic', 900, 300), true);
  assert.equal(g.recruit('ninja', 700, 350), false);
});
test('pause et fin empêchent les achats ; les morts ne ressuscitent pas', () => {
  const g = new Game();
  g.paused = true;
  assert.equal(g.recruit('club', 740, 350), false);
  g.paused = false;
  g.units[0].hp = 0;
  g.step(0.05);
  assert.equal(g.units.length, 2);
  g.status = 'lost';
  assert.equal(g.recruit('club', 740, 350), false);
  assert.equal(g.startWave(), false);
});
test('A* contourne les rochers et ne traverse pas les cases bloquées', () => {
  const p = findPath({ x: 600, y: 300 }, { x: 900, y: 300 });
  assert.ok(p.length > 0);
  for (const point of p) assert.equal(blocked(point.x, point.y), false);
  assert.deepEqual(findPath({ x: 600, y: 300 }, { x: 720, y: 216 }), []);
});
test('simulation répétable ; une vague se termine et donne une récompense unique', () => {
  const a = new Game(),
    b = new Game();
  a.startWave();
  b.startWave();
  for (let i = 0; i < 2400; i++) {
    a.step(1 / 30);
    b.step(1 / 30);
  }
  assert.deepEqual(a, b);
  assert.equal(a.wave, 1);
  assert.equal(a.status, 'preparing');
  assert.ok(a.gold > 300);
  const gold = a.gold;
  for (let i = 0; i < 90; i++) a.step(1 / 30);
  assert.equal(a.gold, gold);
});
test('un médecin soigne un blessé vivant sans dépasser sa santé maximale', () => {
  const g = new Game();
  g.recruit('medic', 900, 300);
  const hero = g.units[2];
  hero.hp -= 20;
  for (let i = 0; i < 120; i++) g.step(1 / 30);
  assert.equal(hero.hp, hero.maxHp);
});
test('douze vagues peuvent être gagnées, le boss est présent à la dernière', () => {
  const g = new Game();
  let boss = false;
  for (let w = 1; w <= TOTAL_WAVES; w++) {
    if (g.rewards.pending !== null) assert.equal(g.skipReward(), true);
    assert.equal(g.startWave(), true);
    for (let i = 0; i < 1500 && g.status === 'fighting'; i++) {
      g.step(1 / 30);
      for (const e of g.enemies) {
        if (e.boss) boss = true;
        e.hp = 0;
      }
    }
  }
  assert.equal(g.status, 'won');
  assert.equal(boss, true);
  assert.equal(g.startWave(), false);
});
test('défaite quand la base tombe ; aucune récompense pour un serpent entré', () => {
  const g = new Game();
  g.startWave();
  g.step(0.05);
  g.units = [];
  g.base = 1;
  const e = g.enemies[0];
  e.x = 1018;
  e.y = 320;
  const gold = g.gold;
  g.step(0.05);
  assert.equal(g.status, 'lost');
  assert.equal(g.gold, gold);
});
test('un serpent au bord du pont reste attaquable par ses défenseurs', () => {
  const g = new Game();
  g.startWave();
  g.step(0.05);
  g.enemies[0].x = 568;
  g.enemies[0].y = 324;
  g.units[0].x = 602;
  g.units[0].y = 324;
  const hp = g.enemies[0].hp;
  g.step(0.05);
  assert.ok(g.enemies[0].hp < hp);
});
test('une armée répartie finit les douze vagues sans blocage ni intervention sur les ennemis', () => {
  const g = new Game();
  const buy = (kind: 'archer' | 'medic' | 'shield' | 'ninja' | 'dragon') => {
    const rear = ['archer', 'medic', 'dragon'].includes(kind);
    for (const x of rear ? [948, 876, 804, 732, 660] : [660, 732, 804, 876, 948])
      for (const y of [180, 324, 468, 132, 228, 276, 372, 420, 516])
        if (g.recruit(kind, x, y)) return true;
    return false;
  };
  buy('archer');
  buy('medic');
  for (let w = 1; w <= TOTAL_WAVES; w++) {
    if (g.rewards.pending !== null) assert.equal(g.skipReward(), true);
    assert.equal(g.startWave(), true);
    let frames = 0;
    while (g.status === 'fighting' && frames++ < 3600) g.step(1 / 30);
    assert.notEqual(g.status, 'fighting', `vague ${w} bloquée`);
    assert.notEqual(g.status, 'lost', `armée répartie battue à la vague ${w}`);
    if (g.base < 80) g.repair();
    if (g.units.filter((u) => u.kind === 'medic').length < 3) buy('medic');
    for (const kind of ['shield', 'archer', 'ninja', 'dragon', 'archer'] as const) buy(kind);
  }
  assert.equal(g.status, 'won');
});
test('un recrutement accepté près des rochers peut quitter sa position', () => {
  for (const [x, y] of [
    [837, 450],
    [882, 459],
    [891, 450],
  ]) {
    const g = new Game();
    assert.equal(g.recruit('club', x, y), true);
    const u = g.units.at(-1)!;
    const start = { x: u.x, y: u.y };
    g.startWave();
    g.step(0.05);
    const e = g.enemies[0];
    e.x = 612;
    e.y = start.y; // Intruder in this guard's sector; other lanes are intentionally ignored.
    e.lane = 2;
    e.stage = 5;
    e.path = [];
    e.nav = 0;
    g.remaining = 0;
    g.eggs = [];
    e.hp = 99999;
    let furthest = 0;
    for (let i = 0; i < 200; i++) {
      g.step(1 / 30);
      furthest = Math.max(furthest, Math.hypot(u.x - start.x, u.y - start.y));
    }
    assert.ok(furthest > 20, `recrue bloquée ${x},${y}`);
  }
});
test('le roi cobra qui entre dans le camp provoque une défaite, jamais une fausse victoire', () => {
  const g = new Game();
  g.wave = TOTAL_WAVES - 1;
  g.startWave();
  g.step(0.05);
  g.remaining = 0;
  g.units = [];
  const boss = g.enemies[0];
  boss.boss = true;
  boss.x = 1018;
  boss.y = 324;
  g.step(0.05);
  assert.equal(g.status, 'lost');
  assert.equal(g.base, 0);
});
test('un placement libre dans une case dont le centre est bloqué est refusé sans paiement', () => {
  const g = new Game();
  const gold = g.gold;
  assert.equal(g.recruit('club', 696, 192), false);
  assert.equal(g.gold, gold);
});
