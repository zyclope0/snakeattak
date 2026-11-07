import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
function isolated(kind: 'club' | 'archer' | 'ninja', x = 900, y = 324) {
  const g = new Game(2026);
  g.units = [];
  g.gold = 1000;
  g.recruit(kind, x, y);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  e.hp = e.maxHp = 100000;
  return { g, e, u: g.units[0] };
}
function advance(g: Game, seconds: number) {
  for (let i = 0; i < seconds * 30; i++) g.step(1 / 30);
}
test('un tireur attend à son placement pendant l’approche sur l’autre rive', () => {
  const { g, e, u } = isolated('archer', 900, 180);
  e.lane = 0;
  e.y = 180;
  advance(g, 5);
  assert.ok(e.x < 480);
  assert.ok(Math.hypot(u.x - 900, u.y - 180) < 15, `tireur parti au pont : ${u.x},${u.y}`);
});
test('un gardien ne vide pas la voie basse pour suivre un ennemi sur la haute', () => {
  const { g, e } = isolated('club', 780, 180);
  g.recruit('club', 780, 468);
  const bottom = g.units.at(-1)!;
  Object.assign(e, { x: 660, y: 180, lane: 0, stage: 3, path: [], nav: 0 });
  advance(g, 3);
  assert.ok(
    bottom.x > 760 && Math.abs(bottom.y - 468) < 20,
    `voie abandonnée : ${bottom.x},${bottom.y}`,
  );
});
test('un gardien rentre à son placement après disparition de la menace', () => {
  const { g, u } = isolated('club', 900, 324);
  g.enemies = [];
  u.x = 660;
  advance(g, 5);
  assert.ok(Math.hypot(u.x - 900, u.y - 324) < 20, `pas de retour : ${u.x},${u.y}`);
});
test('un ninja reste un renfort mobile entre voies', () => {
  const { g, e, u } = isolated('ninja', 900, 468);
  Object.assign(e, { x: 660, y: 180, lane: 0, stage: 3, path: [], nav: 0 });
  advance(g, 3);
  assert.ok(u.y < 350, `ninja sans mobilité : ${u.x},${u.y}`);
});
test('un ennemi près du cristal devient prioritaire même hors secteur', () => {
  const { g, e, u } = isolated('club', 780, 180);
  Object.assign(e, { x: 930, y: 468, lane: 2, stage: 5, path: [], nav: 0 });
  g.enemies.push({ ...e, id: 999, x: 660, y: 180, lane: 0, path: [] });
  advance(g, 1);
  assert.ok(u.x > 800, 'le gardien préfère la menace proche au danger sur le cristal');
});
test('le placement horizontal est conservé par la sauvegarde v6', async () => {
  const { encodeCheckpoint, decodeCheckpoint } = await import('../src/checkpoints.ts');
  const g = new Game();
  g.recruit('archer', 948, 180);
  const u = g.units.at(-1)!;
  u.x = 780;
  const raw = encodeCheckpoint(g)!;
  assert.equal(JSON.parse(raw).version, 6);
  const r = decodeCheckpoint(raw)!;
  assert.equal(r.units.at(-1)!.homeX, 948);
});
test('une sauvegarde v1 est migrée sans perdre le camp', async () => {
  const { encodeCheckpoint, decodeCheckpoint } = await import('../src/checkpoints.ts');
  const raw = JSON.parse(encodeCheckpoint(new Game())!);
  raw.version = 1;
  for (const u of raw.units) delete u.homeX;
  const restored = decodeCheckpoint(JSON.stringify(raw))!;
  assert.ok(restored);
  assert.equal(restored.units.length, 3);
  assert.equal(restored.units[0].homeX, restored.units[0].x);
});
test('un gardien peut sortir de son avance habituelle pour atteindre un cracheur qui le vise', () => {
  const { g, e } = isolated('club', 900, 324);
  g.recruit('medic', 948, 324);
  g.wave = 7;
  Object.assign(e, {
    x: 660,
    y: 324,
    variant: 'spitter',
    stage: 3,
    path: [],
    nav: 0,
    hp: 1000,
    maxHp: 1000,
  });
  advance(g, 12);
  assert.ok(e.hp < 1000, 'duel infini contre un cracheur hors de la zone de poursuite');
});
test('un gardien ferme la dernière distance contre un intrus proche de sa ligne', () => {
  const { g, e } = isolated('club', 900, 324);
  g.recruit('medic', 780, 324);
  Object.assign(e, {
    x: 738,
    y: 324,
    variant: 'normal',
    stage: 3,
    path: [],
    nav: 0,
    hp: 1000,
    maxHp: 1000,
  });
  advance(g, 12);
  assert.ok(e.hp < 1000, 'gardien figé juste hors de portée');
});
test('un soigneur seul ne peut pas retenir une vague par auto-guérison', () => {
  const g = new Game();
  g.units = [];
  g.recruit('medic', 948, 180);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  Object.assign(e, { x: 840, y: 180, lane: 0, stage: 5, path: [], nav: 0, hp: 1000, maxHp: 1000 });
  advance(g, 35);
  assert.equal(g.enemies.length, 0);
  assert.equal(g.base, 91);
});
test('le point de retour d’un allié reste réservé pendant son déplacement', () => {
  const g = new Game();
  g.recruit('club', 780, 180);
  g.units.at(-1)!.x = 660;
  const gold = g.gold;
  assert.equal(g.recruit('club', 780, 180), false);
  assert.equal(g.gold, gold);
});
test('une palissade soignée reçoit un secours sans attirer toute l’armée', () => {
  const g = new Game();
  g.units = [];
  g.gold = 5000;
  for (const [x, y] of [
    [780, 324],
    [900, 180],
    [900, 468],
  ])
    g.recruit('club', x, y);
  g.recruit('wall', 612, 324);
  g.recruit('medic', 708, 324);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  Object.assign(e, { x: 576, y: 324, lane: 1, stage: 2, path: [], nav: 0, hp: 1000, maxHp: 1000 });
  advance(g, 15);
  assert.ok(e.hp < 1000, 'palissade soignée bloquée sans secours');
  assert.ok(
    g.units.filter((u) => u.kind === 'club' && u.x < 640).length <= 2,
    'tous les gardiens sont venus au pont',
  );
});
test('les renforts mobiles se répartissent entre plusieurs intrusions', () => {
  const g = new Game();
  g.units = [];
  g.gold = 2000;
  for (const y of [276, 324, 372]) g.recruit('ninja', 852, y);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  g.enemies = [180, 324, 468].map((y, i) => ({
    ...e,
    id: 900 + i,
    x: 684,
    y,
    lane: i,
    stage: 3,
    hp: 10000,
    maxHp: 10000,
    path: [],
    nav: 0,
  }));
  g.step(1 / 30);
  const goals = g.units.map((u) => u.path.at(-1)?.y ?? u.y);
  assert.ok(
    goals.some((y) => y < 250) && goals.some((y) => y > 400),
    `mobiles regroupés : ${goals}`,
  );
});
test('un cracheur dans le camp peut menacer un archer avant son premier tir', () => {
  const { g, e, u } = isolated('archer', 876, 324);
  g.wave = 7;
  Object.assign(e, {
    x: 660,
    y: 324,
    variant: 'spitter',
    stage: 3,
    path: [],
    nav: 0,
    hp: 1000,
    maxHp: 1000,
  });
  const hp = u.hp;
  g.step(1 / 30);
  assert.ok(u.hp < hp, 'les tireurs n’ont pas de contre à portée comparable');
});
test('le cracheur privilégie un tireur exposé plutôt que le gardien voisin', () => {
  const g = new Game();
  g.units = [];
  g.gold = 1000;
  g.recruit('club', 708, 324);
  g.recruit('archer', 804, 324);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  g.wave = 7;
  const e = g.enemies[0];
  Object.assign(e, {
    x: 660,
    y: 324,
    variant: 'spitter',
    stage: 3,
    path: [],
    nav: 0,
    hp: 1000,
    maxHp: 1000,
    cool: 0,
  });
  const guard = g.units[0],
    archer = g.units[1];
  g.step(1 / 30);
  assert.ok(archer.hp < archer.maxHp, 'aucune pression sur le tireur');
  assert.equal(guard.hp, guard.maxHp);
});
test('les soins concernent les alliés vivants et ne réparent pas le bois', () => {
  const g = new Game();
  g.units = [];
  g.recruit('wall', 780, 324);
  g.recruit('medic', 876, 324);
  const wall = g.units[0];
  wall.hp = 200;
  g.step(1 / 30);
  assert.equal(wall.hp, 200);
});
test('un tireur trouve un poste de tir libre quand son recul tombe sur un rocher', () => {
  const g = new Game();
  g.units = [];
  g.gold = 1000;
  g.recruit('archer', 900, 420);
  g.recruit('wall', 744, 324);
  g.recruit('medic', 780, 324);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  Object.assign(e, {
    x: 708,
    y: 324,
    lane: 1,
    stage: 4,
    path: [],
    nav: 0,
    variant: 'normal',
    hp: 1000,
    maxHp: 1000,
  });
  advance(g, 12);
  assert.ok(e.hp < 1000, 'poste de tir inaccessible près du rocher');
});
test('la migration d’un ancien camp choisit un domicile libre près d’un rocher', async () => {
  const { encodeCheckpoint, decodeCheckpoint } = await import('../src/checkpoints.ts');
  const { blocked, CELL } = await import('../src/navigation.ts');
  const g = new Game();
  g.units = [];
  g.recruit('archer', 936, 432);
  const raw = JSON.parse(encodeCheckpoint(g)!);
  raw.version = 1;
  raw.units[0].x = 864;
  raw.units[0].y = 180;
  raw.units[0].homeY = 432;
  delete raw.units[0].homeX;
  const restored = decodeCheckpoint(JSON.stringify(raw))!;
  assert.ok(restored);
  const u = restored.units[0];
  assert.equal(blocked(u.homeX, u.homeY), false);
  assert.equal(
    blocked(
      Math.floor(u.homeX / CELL) * CELL + CELL / 2,
      Math.floor(u.homeY / CELL) * CELL + CELL / 2,
    ),
    false,
  );
  advance(restored, 10);
  assert.ok(Math.hypot(u.x - u.homeX, u.y - u.homeY) < 22, 'retour de camp migré impossible');
});
