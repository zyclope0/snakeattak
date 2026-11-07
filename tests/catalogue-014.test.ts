import test from 'node:test';
import assert from 'node:assert/strict';
import { kinds, unlockWave } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { defenseRole } from '../src/defenders.ts';
import { incomingDamage, attackDamage, specialAbility } from '../src/unitRules.ts';
import { Game } from '../src/game.ts';

const additions = [
  'raptor',
  'triceratops',
  'stegosaurus',
  'trex',
  'mutantRock',
  'mutantStretch',
] as Kind[];

test('quatre espèces de dinosaures et deux mutants rejoignent nos alliés existants', () => {
  for (const kind of additions) assert.ok(Object.hasOwn(kinds, kind), kind);
  assert.equal(Object.keys(kinds).length, 21);
  assert.equal(kinds.dragon.name, 'Bébé dragon');
  assert.equal(kinds.dino.name, 'Petit dinosaure');
});

test('chaque nouvel allié se recrute à sa vague, jamais avant, et paie son vrai prix', () => {
  for (const kind of additions) {
    const g = new Game();
    g.units = [];
    g.gold = 1000;
    g.wave = (unlockWave[kind] ?? 1) - 2;
    assert.equal(g.recruit(kind, 948, 324), false, `${kind} prématuré`);
    g.wave++;
    assert.equal(g.recruit(kind, 948, 324), true, kind);
    assert.equal(g.gold, 1000 - kinds[kind].cost);
    assert.equal(g.units[0].kind, kind);
    assert.equal(g.units[0].hp, kinds[kind].hp);
  }
});

test('le ninja reste le plus rapide, le vélociraptor est un renfort mobile', () => {
  assert.equal(kinds.ninja.speed, 225);
  assert.ok(kinds.raptor.speed < kinds.ninja.speed);
  assert.ok(kinds.raptor.speed > kinds.cavalry.speed);
  assert.equal(defenseRole('raptor' as Kind), 'mobile');
  assert.equal(defenseRole('triceratops' as Kind), 'mobile');
  assert.equal(defenseRole('mutantStretch' as Kind), 'guard');
});

test('les plaques du stégosaure et la peau du mutant roc réduisent les coups reçus', () => {
  assert.equal(incomingDamage('stegosaurus' as Kind, 100), 75);
  assert.equal(incomingDamage('mutantRock' as Kind, 100), 80);
  assert.match(specialAbility('stegosaurus' as Kind), /25 %/);
  assert.match(specialAbility('mutantRock' as Kind), /20 %/);
});

test('la charge du tricératops renforce seulement le coup chargé', () => {
  const kind = 'triceratops' as Kind;
  assert.equal(attackDamage(kind, 0), kinds[kind].damage);
  assert.equal(attackDamage(kind, 0.94), kinds[kind].damage);
  assert.equal(attackDamage(kind, 1), kinds[kind].damage * 1.8);
  assert.match(specialAbility(kind), /Charge/);
});

test('le tricératops peut courir vers un vrai ennemi et porter une première charge', () => {
  const g = new Game();
  g.units = [];
  g.gold = 1000;
  g.wave = 4;
  assert.ok(g.recruit('triceratops', 960, 300));
  g.startWave();
  g.step(0.05);
  g.remaining = 0;
  g.eggs = [];
  const enemy = g.enemies[0];
  enemy.x = 612;
  enemy.y = 324;
  enemy.stage = 3;
  enemy.variant = 'normal';
  enemy.hp = enemy.maxHp = 10000;
  let firstHit = 0;
  for (let i = 0; i < 240 && !firstHit; i++) {
    const before = enemy.hp;
    g.step(1 / 30);
    firstHit = before - enemy.hp;
  }
  assert.equal(firstHit, kinds.triceratops.damage * 1.8);
});
