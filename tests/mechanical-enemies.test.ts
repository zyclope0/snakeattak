import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { enemies } from '../src/enemies.ts';
import { variantFor, waveBriefing } from '../src/waves.ts';

// These checks fail if mechanical types are cosmetic aliases or arrive before their chapter.
test('les serpents mécaniques sont annoncés et introduits aux vagues 5 et 9', () => {
  assert.ok('clockwork' in enemies);
  assert.ok('spring' in enemies);
  for (let wave = 1; wave <= 12; wave++) {
    const variants = Array.from({ length: 24 }, (_, i) => variantFor(wave, i));
    assert.equal(variants.includes('clockwork'), wave >= 5);
    assert.equal(variants.includes('spring'), wave >= 9);
  }
  assert.match(waveBriefing(5).tip, /plaque|rouage/i);
  assert.match(waveBriefing(9).tip, /impulsion|ressort/i);
});

function duel(variant: 'clockwork' | 'spring') {
  const g = new Game(20);
  g.units = [];
  g.gold = 1000;
  g.recruit('archer', 900, 324);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const e = g.enemies[0];
  Object.assign(e, { variant, x: 738, y: 324, hp: 1000, maxHp: 1000, stage: 4, path: [], nav: 0 });
  return { g, e, u: g.units[0] };
}

test('la plaque du serpent à rouages casse à mi-vie et réduit moins les vrais tirs', () => {
  const { g, e, u } = duel('clockwork');
  u.cool = 0;
  g.step(1 / 30);
  const intactDamage = 1000 - e.hp;
  e.hp = 500;
  u.cool = 0;
  g.step(1 / 30);
  const brokenDamage = 500 - e.hp;
  assert.ok(
    intactDamage > 0 && brokenDamage > intactDamage * 1.3,
    `${intactDamage} puis ${brokenDamage}`,
  );
});

test('un serpent à ressort alterne réellement lenteur et impulsion et la pause fige son horloge', () => {
  const { g, e } = duel('spring');
  g.units = [];
  function travel(at: number) {
    g.time = at;
    Object.assign(e, { x: 108, y: 324, stage: 0, path: [], nav: 0 });
    for (let i = 0; i < 6; i++) g.step(1 / 30);
    return e.x - 108;
  }
  const slow = travel(0),
    fast = travel(1.1);
  assert.ok(slow > 0 && fast > slow * 3, `${slow} puis ${fast}`);
  const before = JSON.stringify(g);
  g.paused = true;
  g.step(0.05);
  g.paused = false;
  assert.equal(JSON.stringify(g), before);
});

test('le roi cobra final conserve son identité et ne devient pas un serpent à ressort', () => {
  const g = new Game();
  g.wave = 11;
  g.startWave();
  g.remaining = 1;
  g.eggs = [];
  g.units = [];
  g.step(1 / 30);
  const king = g.enemies[0];
  assert.equal(king.boss, true);
  assert.equal(
    king.variant,
    'normal',
    'le dernier index de vague ne doit pas attribuer une mécanique cachée au roi',
  );
});
