import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { Presentation } from '../src/render/presentation.ts';

test('la sortie de l’antre est signalée une seule fois après une vraie apparition', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  g.startWave();
  g.step(1 / 30);
  const snapshot = JSON.stringify(g);
  p.update(g, 16);
  assert.ok('arrivals' in p, 'les sorties sont observées');
  assert.equal(p.arrivals.length, 1);
  assert.equal(p.arrivals[0].source, 'den');
  assert.equal(p.arrivals[0].lane, g.enemies[0].lane);
  p.update(g, 16);
  assert.equal(p.arrivals.length, 1);
  assert.equal(JSON.stringify(g), snapshot);
});

test('une éclosion signale l’œuf et ne fait pas clignoter une antre', () => {
  const g = new Game(),
    p = new Presentation();
  g.startWave();
  g.remaining = 0;
  p.update(g, 16);
  g.eggs.forEach((e) => (e.hatchIn = 0));
  g.step(1 / 30);
  p.update(g, 16);
  assert.ok('arrivals' in p);
  assert.ok(p.arrivals.length >= 2);
  assert.ok(p.arrivals.every((a) => a.source === 'egg'));
});

test('le refuge réagit aux vrais dégâts et réparations sans faux impact au chargement', () => {
  const g = new Game(),
    p = new Presentation();
  g.base = 40;
  p.update(g, 16);
  assert.ok('fortDamage' in p);
  assert.equal(p.fortDamage, 0);
  g.base = 31;
  p.update(g, 16);
  assert.equal(p.fortDamage, 1);
  assert.ok(p.floats.some((f) => f.text === 'Cristal −9'));
  g.gold = 1000;
  assert.equal(g.repair(), true);
  p.update(g, 16);
  assert.equal(p.fortRepair, 1);
  assert.ok(p.floats.some((f) => f.text === 'Cristal +25'));
});

test('les arrivées et réactions du refuge se figent en pause et se nettoient au redémarrage', () => {
  const g = new Game(),
    p = new Presentation();
  p.update(g, 16);
  g.startWave();
  g.step(1 / 30);
  g.base = 91;
  p.update(g, 16);
  assert.ok('arrivals' in p);
  assert.equal(p.arrivals.length, 1);
  g.paused = true;
  const age = p.arrivals[0].age,
    damage = p.fortDamage;
  p.update(g, 1000);
  assert.equal(p.arrivals[0].age, age);
  assert.equal(p.fortDamage, damage);
  p.update(new Game(), 16);
  assert.equal(p.arrivals.length, 0);
  assert.equal(p.fortDamage, 0);
  assert.equal(p.fortRepair, 0);
});

test('les effets d’apparition restent bornés puis expirent', () => {
  const g = new Game(),
    p = new Presentation();
  g.startWave();
  g.step(1 / 30);
  p.update(g, 16);
  const template = g.enemies[0];
  for (let id = 1000; id < 1100; id++) g.enemies.push({ ...template, id, path: [] });
  p.update(g, 16);
  assert.ok('arrivals' in p);
  assert.equal(p.arrivals.length, 24);
  for (let i = 0; i < 30; i++) p.update(g, 100);
  assert.equal(p.arrivals.length, 0);
  assert.equal(p.fortDamage, 0);
});
