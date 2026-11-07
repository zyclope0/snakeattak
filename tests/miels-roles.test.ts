import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { lanePoint } from '../src/routes.ts';

function duel() {
  const g = new Game(31);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  return { g, e: g.enemies[0] };
}
test('un pot collant est explicite, gratuit, exclusif et refuse une saveur inconnue', () => {
  const { g } = duel();
  const gold = g.gold;
  assert.equal(g.offerFeast(1, 'invalid' as never), false);
  assert.equal(g.offerFeast(1, 'sticky'), true);
  assert.equal(g.feast?.flavor, 'sticky');
  assert.equal(g.gold, gold);
  assert.equal(g.offerFeast(0, 'lure'), false);
});
test('le miel collant ralentit réellement un serpent sur le sentier choisi, sans le figer', () => {
  const a = duel(),
    b = duel();
  for (const { g, e } of [a, b]) {
    g.units = [];
    Object.assign(e, { ...lanePoint(730, 1, g.level, 11), lane: 1, stage: 4, path: [], nav: 0 });
  }
  a.g.offerFeast(1, 'sticky');
  const ax = a.e.x,
    bx = b.e.x;
  for (let i = 0; i < 20; i++) {
    a.g.step(1 / 30);
    b.g.step(1 / 30);
  }
  assert.ok(a.e.x > ax);
  assert.ok(a.e.x - ax < (b.e.x - bx) * 0.7);
});
test('le miel collant ne change pas les choix de voie ni les compteurs d’attraction', () => {
  const a = duel(),
    b = duel();
  a.g.units = [];
  b.g.units = [];
  a.g.offerFeast(0, 'sticky');
  for (const { e } of [a, b])
    Object.assign(e, { x: 372, y: 180, lane: 0, stage: 0, path: [], nav: 0 });
  a.g.step(1 / 30);
  b.g.step(1 / 30);
  assert.equal(a.e.lane, b.e.lane);
  assert.equal(a.g.rng, b.g.rng);
  assert.equal(a.g.honeyTurns, 0);
  assert.equal(
    a.g.effects.some((e) => e.kind === 'honey'),
    false,
  );
});
test('le ralentissement est local, plus léger sur le roi et expire en respectant la pause', async () => {
  const tactics = await import('../src/tactics.ts');
  assert.ok('stickySpeed' in tactics);
  const { g } = duel();
  g.offerFeast(0, 'sticky');
  const p = lanePoint(756, 0, g.level);
  assert.equal(tactics.stickySpeed({ ...p, boss: false }, g.feast, g.level), 0.55);
  assert.equal(tactics.stickySpeed({ ...p, boss: true }, g.feast, g.level), 0.75);
  assert.equal(tactics.stickySpeed({ x: 500, y: p.y, boss: false }, g.feast, g.level), 1);
  assert.equal(tactics.stickySpeed({ x: p.x, y: p.y + 80, boss: false }, g.feast, g.level), 1);
  g.paused = true;
  g.step(0.05);
  assert.equal(g.feast?.remaining, 14);
  g.paused = false;
  g.units = [];
  g.enemies = [];
  g.eggs = [{ id: 999, x: 300, y: 180, lane: 0, duration: 50, hatchIn: 50, count: 2 }];
  for (let i = 0; i < 420; i++) g.step(1 / 30);
  assert.equal(g.feast, null);
  assert.equal(tactics.stickySpeed({ ...p, boss: false }, g.feast, g.level), 1);
});

function rangedDuel(shield = false) {
  const { g, e } = duel();
  g.units = [];
  g.gold = 5000;
  g.wave = 2;
  g.recruit('archer', 900, 324);
  if (shield) g.recruit('shield', 852, 324);
  Object.assign(e, {
    x: 700,
    y: 324,
    lane: 1,
    stage: 4,
    variant: 'spitter',
    hp: 10000,
    maxHp: 10000,
    cool: 0,
    path: [],
    nav: 0,
  });
  return { g, e, archer: g.units[0], guard: g.units[1] };
}
test('un bouclier protège réellement un voisin d’un tir puis recharge', () => {
  const plain = rangedDuel(),
    covered = rangedDuel(true);
  const hp = plain.archer.hp;
  plain.g.step(1 / 30);
  covered.g.step(1 / 30);
  const full = hp - plain.archer.hp,
    reduced = hp - covered.archer.hp;
  assert.ok(Math.abs(reduced - full * 0.4) < 1e-8);
  assert.ok(covered.g.effects.some((e) => e.kind === 'block'));
  const before = covered.archer.hp;
  covered.e.cool = 0;
  covered.g.step(1 / 30);
  assert.ok(Math.abs(before - covered.archer.hp - full) < 1e-8);
});
test('un protecteur mort ou trop loin ne bloque pas de tir', () => {
  for (const missing of ['dead', 'far']) {
    const a = rangedDuel(),
      b = rangedDuel(true);
    if (missing === 'dead') b.guard.hp = 0;
    else Object.assign(b.guard, { x: 804, y: 468, homeX: 804, homeY: 468 });
    a.g.step(1 / 30);
    b.g.step(1 / 30);
    assert.equal(a.archer.hp, b.archer.hp);
    assert.equal(
      b.g.effects.some((e) => e.kind === 'block'),
      false,
    );
  }
});
test('le ninja préfère un cracheur exposé mais garde la priorité au cristal', () => {
  for (const urgent of [false, true]) {
    const { g, e } = duel();
    g.units = [];
    g.gold = 1000;
    g.recruit('ninja', 900, 324);
    Object.assign(e, {
      x: urgent ? 930 : 800,
      y: urgent ? 468 : 324,
      lane: urgent ? 2 : 1,
      stage: 4,
      hp: 10000,
      maxHp: 10000,
    });
    const spitter = {
      ...e,
      id: 999,
      x: 720,
      y: 324,
      variant: 'spitter' as const,
      lane: 1,
      path: [],
    };
    g.enemies.push(spitter);
    g.step(1 / 30);
    assert.equal(g.units[0].targetId, urgent ? e.id : spitter.id);
  }
});
test('la feuille protège des flèches frontales en marche et se découvre au contact', () => {
  for (const [kind, x, state, expected] of [
    ['archer', 900, 'move', 3.75],
    ['archer', 900, 'attack', 15],
    ['archer', 612, 'move', 15],
    ['club', 800, 'move', 26],
    ['dragon', 900, 'move', 34],
    ['tank', 950, 'move', 70],
  ] as const) {
    const { g, e } = duel();
    g.units = [];
    g.gold = 5000;
    g.wave = 10;
    g.recruit(kind, x, 324);
    Object.assign(e, {
      x: 772,
      y: 324,
      lane: 1,
      stage: 4,
      variant: 'umbrella',
      state,
      facing: 1,
      hp: 1000,
      maxHp: 1000,
      path: [],
      nav: 0,
    });
    g.step(1 / 30);
    assert.ok(Math.abs(1000 - e.hp - expected) < 1e-8, `${kind}/${state}/${x}: ${1000 - e.hp}`);
  }
});

test('la protection ne se cumule pas et ne renforce pas le bouclier lui-même', () => {
  const a = rangedDuel(true),
    b = rangedDuel(true);
  b.g.recruit('shield', 876, 276);
  a.g.step(1 / 30);
  b.g.step(1 / 30);
  assert.equal(a.archer.hp, b.archer.hp);
  assert.equal(b.g.effects.filter((e) => e.kind === 'block').length, 1);
  const { g, e } = duel();
  g.units = [];
  g.wave = 2;
  g.gold = 500;
  g.recruit('shield', 852, 324);
  Object.assign(e, {
    x: 700,
    y: 324,
    variant: 'spitter',
    cool: 0,
    stage: 4,
    hp: 10000,
    maxHp: 10000,
  });
  const hp = g.units[0].hp;
  g.step(1 / 30);
  assert.ok(Math.abs(hp - g.units[0].hp - 8 * 0.8 * 0.6) < 1e-8);
  assert.equal(
    g.effects.some((e) => e.kind === 'block'),
    false,
  );
});
test('les vrais coups alimentent une animation bornée, figée en pause et sans mutation', async () => {
  const { Presentation } = await import('../src/render/presentation.ts');
  const p = new Presentation(),
    { g, e } = duel();
  g.units = [];
  g.gold = 500;
  g.recruit('club', 800, 324);
  Object.assign(e, { x: 772, y: 324, lane: 1, stage: 4, hp: 10000, maxHp: 10000 });
  p.update(g, 16);
  g.step(1 / 30);
  const snapshot = JSON.stringify(g);
  p.update(g, 16);
  assert.ok('actions' in p);
  assert.ok(p.actions.has(g.units[0].id));
  assert.equal(JSON.stringify(g), snapshot);
  const age = p.actions.get(g.units[0].id)!.age;
  g.paused = true;
  p.update(g, 1000);
  assert.equal(p.actions.get(g.units[0].id)!.age, age);
  g.paused = false;
  for (let i = 0; i < 10; i++) p.update(g, 100);
  assert.equal(p.actions.size, 0);
  p.update(new Game(), 16);
  assert.equal(p.actions.size, 0);
});
test('les mouvements caractéristiques respectent les mouvements réduits', async () => {
  const mod = await import('../src/render/characterMotion.ts');
  const g = new Game();
  const u = g.units[0];
  const motion = mod.characterMotion(u, 1, { age: 0.14, kind: 'hit' }, false);
  assert.ok(Math.abs(motion.angle) > 0 || Math.abs(motion.dx) > 0);
  assert.deepEqual(mod.characterMotion(u, 1, { age: 0.14, kind: 'hit' }, true), {
    dx: 0,
    dy: 0,
    angle: 0,
    sx: 1,
    sy: 1,
  });
});

test('un groupe de ninjas ne délaisse jamais une urgence au cristal pour un cracheur', () => {
  const { g, e } = duel();
  g.units = [];
  g.gold = 10000;
  for (const x of [828, 948])
    for (const y of [132, 204, 276, 348, 420, 516]) g.recruit('ninja', x, y);
  assert.ok(g.units.length >= 10);
  Object.assign(e, { x: 930, y: 468, lane: 2, stage: 5, hp: 10000, maxHp: 10000 });
  g.enemies.push({
    ...e,
    id: 999,
    x: 780,
    y: 324,
    lane: 1,
    stage: 4,
    variant: 'spitter',
    path: [],
  });
  g.step(1 / 30);
  assert.ok(
    g.units.every((u) => u.targetId === e.id),
    'des réservations de cible masquent le danger au cristal',
  );
});
test('les anciens camps v2 restent lisibles et réinitialisent la recharge de protection', async () => {
  const { encodeCheckpoint, decodeCheckpoint } = await import('../src/checkpoints.ts');
  const g = new Game();
  g.wave = 1;
  g.gold = 1000;
  assert.ok(g.recruit('shield', 900, 324));
  g.units.at(-1)!.guardCool = 2.7;
  const data = JSON.parse(encodeCheckpoint(g)!);
  data.version = 2;
  delete data.rewards;
  const raw = JSON.stringify(data);
  assert.equal(JSON.parse(raw).version, 2);
  assert.equal(Object.hasOwn(JSON.parse(raw).units.at(-1), 'guardCool'), false);
  const restored = decodeCheckpoint(raw)!;
  assert.ok(restored);
  assert.equal(restored.units.at(-1)!.guardCool, 0);
});

test('deux renforts aident un gardien entouré à la sortie du pont sans vider le camp pour un seul serpent', () => {
  for (const count of [1, 3]) {
    const { g, e } = duel();
    g.units = [];
    g.gold = 5000;
    g.wave = 12;
    assert.ok(g.recruit('shield', 612, 468));
    assert.ok(g.recruit('archer', 732, 384));
    assert.ok(g.recruit('club', 732, 468));
    g.units[0].cool = 100;
    g.enemies = Array.from({ length: count }, (_, i) => ({
      ...e,
      id: 1000 + i,
      x: 570 + i,
      y: 457,
      lane: 2,
      stage: 2,
      state: 'attack' as const,
      hp: 400,
      maxHp: 400,
      path: [],
      nav: 0,
    }));
    for (let i = 0; i < 5; i++) g.step(1 / 30);
    const fired = g.effects.some((e) => e.kind === 'arrow');
    assert.equal(fired, count === 3, `soutien au pack de ${count}`);
  }
});

test('un renfort arrivé au pont ne déclenche pas l’appel de toute l’armée', async () => {
  const { reliefTeams } = await import('../src/defenders.ts');
  const { g, e } = duel();
  g.units = [];
  g.gold = 5000;
  g.wave = 12;
  g.recruit('shield', 612, 468);
  g.recruit('club', 732, 468);
  g.recruit('archer', 732, 384);
  g.recruit('knight', 876, 348);
  const [guard, helper] = g.units;
  Object.assign(helper, { x: 612, y: 450 });
  g.enemies = Array.from({ length: 3 }, (_, i) => ({
    ...e,
    id: 1000 + i,
    x: 570 + i,
    y: 457,
    lane: 2,
    state: 'attack' as const,
    path: [],
  }));
  const teams = reliefTeams(g.units, g.enemies);
  const mobilized = new Set([
    guard.id,
    helper.id,
    ...[...teams.values()].flatMap((ids) => [...ids]),
  ]);
  assert.ok(mobilized.size <= 3, 'un nouveau groupe remplace les renforts déjà arrivés');
});

test('les ripostes et secours rejoignent un cracheur près d’un rocher malgré sa cellule bloquée', () => {
  const { g, e } = duel();
  g.units = [];
  g.gold = 5000;
  g.wave = 9;
  assert.ok(g.recruit('shield', 876, 180));
  assert.ok(g.recruit('medic', 948, 180));
  assert.ok(g.recruit('dragon', 948, 468));
  Object.assign(e, {
    x: 670.3128985990505,
    y: 242.32463712018483,
    variant: 'spitter',
    lane: 1,
    stage: 4,
    turnY: 324,
    state: 'attack',
    hp: 500,
    maxHp: 500,
    path: [],
    nav: 0,
  });
  for (let i = 0; i < 300; i++) g.step(1 / 30);
  assert.ok(e.hp < 500, 'la cible est légale mais sa cellule empêche toute riposte');
});
