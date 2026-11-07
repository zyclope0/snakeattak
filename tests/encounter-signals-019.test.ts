import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { Presentation } from '../src/render/presentation.ts';

function fighting(seed = 19) {
  const game = new Game(seed);
  game.startWave();
  return game;
}

function read(game: Game) {
  const presentation = new Presentation();
  presentation.update(game, 16);
  return presentation.encounter;
}

test('0.19 : seuls les œufs vivants à trois secondes de l’éclosion sont annoncés', () => {
  const game = fighting();
  const egg = { ...game.eggs[0], duration: 12 };
  game.eggs = [
    { ...egg, id: 101, hatchIn: 3.01 },
    { ...egg, id: 102, hatchIn: 3 },
    { ...egg, id: 103, hatchIn: 0.01 },
    { ...egg, id: 104, hatchIn: 0 },
  ];
  assert.deepEqual(
    read(game)?.eggs.map((e) => [e.id, e.label]),
    [
      [102, 'Éclosion · 3 s'],
      [103, 'Éclosion · 1 s'],
    ],
  );
});

test('0.19 : la confusion décrit les alliés vivants et disparaît avec l’hésitation', () => {
  const game = fighting();
  game.units[0].confusedFor = 0.8;
  game.units[1].confusedFor = 0.2;
  game.units[1].hp = 0;
  assert.deepEqual(read(game)?.confusion, { count: 1, label: '? 1 allié hésite' });
  game.units[2].confusedFor = 0.3;
  assert.deepEqual(read(game)?.confusion, { count: 2, label: '? 2 alliés hésitent' });
  for (const unit of game.units) unit.confusedFor = 0;
  assert.equal(read(game)?.confusion, null);
});

test('0.19 : le courage lit les huit vraies secondes puis cesse sans délai visuel', () => {
  const game = fighting();
  assert.equal(game.encourage(), true);
  assert.deepEqual(read(game)?.encouragement, {
    remaining: 8,
    ratio: 1,
    label: 'Courage ! · attaques accélérées · 8 s',
  });
  game.step(0.1);
  assert.equal(read(game)?.encouragement?.remaining, game.encouragementRemaining);
  assert.equal(read(game)?.encouragement?.ratio, game.encouragementRemaining / 8);
  game.encouragementRemaining = 0;
  assert.equal(read(game)?.encouragement, null);
});

test('0.19 : le crachat complète la vraie cible de BossSignals sans nouveau minuteur', () => {
  const game = new Game(19);
  game.wave = 11;
  game.startWave();
  game.remaining = 1;
  game.eggs = [];
  game.step(1 / 30);
  const boss = game.enemies.find((e) => e.boss)!;
  Object.assign(boss.bossState!, { windup: 0.6, targetX: 900, targetY: 324 });
  assert.deepEqual(read(game)?.shot, {
    x: 900,
    y: 324,
    radius: game.tuning.bossShotRadius,
    remaining: 0.6,
    label: 'Crachat ici · 1 s',
  });
  boss.bossState!.windup = 0;
  assert.equal(read(game)?.shot, null);
  boss.bossState!.windup = 0.6;
  boss.hp = 0;
  assert.equal(read(game)?.shot, null);
});

test('0.19 : pause, fin et redémarrage ne laissent aucun signal périmé', () => {
  const game = fighting();
  game.eggs[0].hatchIn = 2;
  game.units[0].confusedFor = 0.8;
  game.encourage();
  const presentation = new Presentation();
  presentation.update(game, 16);
  game.paused = true;
  const before = structuredClone(presentation.encounter);
  game.step(10);
  presentation.update(game, 10_000);
  assert.ok(before, 'un modèle des signaux doit être exposé');
  assert.deepEqual(presentation.encounter, before);
  game.status = 'lost';
  presentation.update(game, 16);
  assert.deepEqual(presentation.encounter, {
    eggs: [],
    confusion: null,
    encouragement: null,
    shot: null,
  });
  presentation.update(new Game(), 16);
  assert.deepEqual(presentation.encounter, {
    eggs: [],
    confusion: null,
    encouragement: null,
    shot: null,
  });
});

test('0.19 : les observations sont bornées et ne changent aucun tirage de combat', () => {
  const game = fighting(922);
  const egg = game.eggs[0];
  game.eggs = Array.from({ length: 100 }, (_, id) => ({ ...egg, id, hatchIn: 2 }));
  const before = structuredClone(game);
  const signals = read(game);
  assert.ok(signals, 'un modèle des signaux doit être exposé');
  assert.equal(signals.eggs.length, 6);
  assert.deepEqual(structuredClone(game), before);

  const observed = fighting(922),
    control = fighting(922),
    presentation = new Presentation();
  observed.encourage();
  control.encourage();
  for (let i = 0; i < 600; i++) {
    observed.step(1 / 30);
    control.step(1 / 30);
    presentation.update(observed, 1000 / 30);
  }
  assert.deepEqual(structuredClone(observed), structuredClone(control));
});

test('0.19 : plusieurs œufs voisins gardent des étiquettes séparées et reliées à leur œuf', async () => {
  const readouts = await import('../src/render/encounterReadout.ts');
  const eggs = [252, 300, 348].map((x) => ({ x, y: 180 }));
  const labels = readouts.eggLabelPositions?.(eggs);
  assert.ok(labels, 'les étiquettes doivent éviter les voisines de la même voie');
  assert.equal(labels.length, eggs.length);
  for (let i = 0; i < labels.length; i++) {
    assert.ok(labels[i].x >= 77 && labels[i].x <= 1023);
    assert.ok(labels[i].y >= 145 && labels[i].y <= 597);
    for (let j = 0; j < i; j++) assert.ok(Math.abs(labels[i].x - labels[j].x) >= 154);
  }
  const dense = readouts.eggLabelPositions(Array.from({ length: 6 }, () => ({ x: 1000, y: 468 })));
  assert.ok(dense.every((label) => label.x >= 77 && label.x <= 1023));
  assert.equal(new Set(dense.map((label) => label.x)).size, 6);
});
