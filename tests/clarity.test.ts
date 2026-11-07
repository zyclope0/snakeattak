import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { Session } from '../src/session.ts';
import { decideTemptation, chooseTemptedLane } from '../src/tactics.ts';
import { placementSuggestions } from '../src/placement.ts';
import { Presentation } from '../src/render/presentation.ts';

test('le diagnostic du miel conserve les décisions et distingue attraction et choix habituel', () => {
  for (let i = 0; i < 1000; i++)
    for (const boss of [false, true]) {
      const roll = i / 1000,
        decision = decideTemptation([4, 2, 0], 6, roll, 0, boss);
      assert.equal(decision.lane, chooseTemptedLane([4, 2, 0], 6, roll, 0, boss));
      assert.equal(decision.tempted, roll < (boss ? 0.25 : 0.75));
    }
  assert.equal(decideTemptation([0, 0, 0], 1, 0.01, null, false).tempted, false);
});
test('les propositions de placement sont toutes libres et payables ; refus sans dépense', () => {
  const g = new Game();
  const points = placementSuggestions(g, 'club');
  assert.ok(points.length >= 3 && points.length <= 6);
  for (const p of points) assert.equal(g.canRecruit('club', p.x, p.y), true);
  const gold = g.gold;
  assert.equal(g.recruit('club', NaN, 320), false);
  assert.equal(g.gold, gold);
  g.gold = 0;
  assert.deepEqual(placementSuggestions(g, 'club'), []);
});
test('le placement guidé suit le vrai recrutement, pas un simple clic', () => {
  const s = new Session(2);
  s.selected = 'club';
  assert.equal(s.placeSelected(100, 300), false);
  assert.equal(s.hasPlaced, false);
  assert.equal(s.selected, 'club');
  assert.equal(s.placeSelected(900, 300), true);
  assert.equal(s.hasPlaced, true);
  assert.equal(s.selected, null);
  s.restart();
  assert.equal(s.hasPlaced, false);
});
test('la fin de vague ne promet pas une sauvegarde que le navigateur peut refuser', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  g.startWave();
  p.update(g, 16);
  g.remaining = 0;
  g.eggs = [];
  g.enemies = [];
  g.step(0.05);
  p.update(g, 16);
  assert.equal(p.notice?.kind, 'clear');
  assert.doesNotMatch(p.notice!.subtitle, /sauvegardé/);
});
test('le signal miel existe seulement quand le tirage suit réellement le pot à la jonction', () => {
  let signals = 0,
    misses = 0;
  for (let seed = 0; seed < 80; seed++) {
    const g = new Game(seed * 10000019);
    g.startWave();
    g.step(0.05);
    g.offerFeast(2);
    const e = g.enemies[0];
    e.x = 372;
    e.y = 180;
    e.lane = 0;
    e.stage = 0;
    const roll = ((Math.imul(g.rng, 1664525) + 1013904223) >>> 0) / 4294967296;
    g.step(0.05);
    const signal = g.effects.some((e) => e.kind === 'honey');
    assert.equal(signal, roll < 0.75);
    if (signal) {
      signals++;
      assert.equal(g.honeyTurns, 1);
    } else {
      misses++;
      assert.equal(g.honeyTurns, 0);
    }
  }
  assert.ok(signals && misses);
});

test('recrutement et réparation autorisés en préparation et combat, refusés en pause et fin', () => {
  const g = new Game();
  g.gold = 1000;
  g.base = 80;
  assert.equal(g.recruit('club', 900, 180), true);
  assert.equal(g.repair(), true);
  g.startWave();
  g.base = 80;
  assert.equal(g.recruit('archer', 900, 468), true);
  assert.equal(g.repair(), true);
  g.paused = true;
  g.base = 80;
  const gold = g.gold;
  assert.equal(g.recruit('club', 972, 180), false);
  assert.equal(g.repair(), false);
  assert.equal(g.gold, gold);
  g.paused = false;
  g.status = 'lost';
  assert.equal(g.recruit('club', 972, 180), false);
  assert.equal(g.repair(), false);
  assert.equal(g.gold, gold);
});
