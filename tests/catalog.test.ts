import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { kinds } from '../src/data.ts';
import { healAmount, incomingDamage, attackDamage } from '../src/unitRules.ts';
test('les quatorze alliés du ZIP restent au catalogue, avec la palissade et six nouveaux alliés', () => {
  for (const kind of [
    'hero',
    'club',
    'shield',
    'bat',
    'archer',
    'nurse',
    'medic',
    'ninja',
    'knight',
    'cavalry',
    'twohead',
    'dragon',
    'dino',
    'tank',
  ])
    assert.ok(Object.hasOwn(kinds, kind), kind);
  assert.equal(Object.keys(kinds).length, 21);
});
test('infirmier et médecin soignent différemment ; le bouclier réduit les dégâts', () => {
  assert.ok(healAmount('nurse') > 0 && healAmount('medic') > healAmount('nurse'));
  assert.equal(incomingDamage('club', 100), 100);
  assert.equal(incomingDamage('shield', 100), 60);
  assert.equal(incomingDamage('knight', 100), 80);
});
test('la charge du cavalier dépend du déplacement accumulé', () => {
  assert.equal(attackDamage('cavalry', 0), kinds.cavalry.damage);
  assert.ok(attackDamage('cavalry', 1) > kinds.cavalry.damage * 1.5);
});
test('le chevalier à deux têtes touche deux voisins, le tank fait des dégâts de zone', () => {
  for (const kind of ['twohead', 'tank'] as const) {
    const g = new Game();
    g.wave = 10;
    g.gold = 5000;
    g.units = [];
    g.recruit(kind, 900, 300);
    g.startWave();
    g.step(0.05);
    const e = g.enemies[0];
    e.x = 870;
    e.y = 300;
    e.hp = 1000;
    e.maxHp = 1000;
    const b = { ...e, id: 999, x: 855, path: [] };
    g.enemies.push(b);
    g.units[0].cool = 0;
    g.step(0.05);
    assert.ok(e.hp < 1000 && b.hp < 1000, kind);
  }
});

test('un infirmier soigne réellement un allié vivant de 14 PV', () => {
  const g = new Game();
  g.units = [];
  g.gold = 500;
  g.recruit('nurse', 900, 300);
  g.recruit('club', 840, 300);
  g.units[1].hp = 100;
  g.step(0.05);
  assert.equal(g.units[1].hp, 114);
});
test('un cavalier qui court produit réellement une première frappe chargée', () => {
  const g = new Game();
  g.wave = 4;
  g.units = [];
  g.gold = 1000;
  g.recruit('cavalry', 960, 300);
  g.startWave();
  g.step(0.05);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  e.x = 612;
  e.y = 324;
  e.stage = 3;
  e.variant = 'normal';
  e.hp = 10000;
  e.maxHp = 10000;
  let hit = 0;
  for (let i = 0; i < 200 && !hit; i++) {
    const before = e.hp;
    g.step(1 / 30);
    hit = before - e.hp;
  }
  assert.ok(hit > kinds.cavalry.damage * 1.5, `charge absente : ${hit}`);
});
