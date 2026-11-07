import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { laneDefense } from '../src/ai.ts';

// Removing target hysteresis makes the second shot jump for a four-pixel advantage.
test('un tireur conserve sa cible malgré un léger changement de distance', () => {
  const g = new Game();
  g.units = [];
  g.gold = 1000;
  g.recruit('archer', 900, 324);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const first = g.enemies[0];
  Object.assign(first, {
    id: 900,
    x: 739,
    y: 324,
    hp: 10000,
    maxHp: 10000,
    stage: 4,
    path: [],
    nav: 0,
  });
  const second = { ...first, id: 901, x: 738, path: [] };
  g.enemies = [first, second];
  const u = g.units[0];
  u.cool = 0;
  g.step(1 / 30);
  const firstHp = first.hp,
    secondHp = second.hp;
  assert.ok(firstHp < 10000);
  assert.equal(secondHp, 10000);
  first.x = 738;
  second.x = 742;
  u.cool = 0;
  g.step(1 / 30);
  assert.ok(first.hp < firstHp, 'le tir a abandonné une cible encore prioritaire');
  assert.equal(second.hp, secondHp);
  // Death always releases a retained target.
  first.hp = 0;
  u.cool = 0;
  g.step(1 / 30);
  assert.ok(second.hp < secondHp);
});

test('la stabilité de cible ne masque jamais une urgence sur le cristal', () => {
  const g = new Game();
  g.units = [];
  g.gold = 1000;
  g.recruit('ninja', 780, 180);
  g.startWave();
  g.step(1 / 30);
  g.remaining = 0;
  g.eggs = [];
  const first = g.enemies[0];
  Object.assign(first, { x: 738, y: 180, hp: 10000, maxHp: 10000, stage: 4, path: [], nav: 0 });
  g.step(1 / 30);
  const urgent = { ...first, id: 999, x: 930, y: 468, lane: 2, path: [] };
  g.enemies.push(urgent);
  const u = g.units[0];
  u.nav = 0;
  g.step(1 / 30);
  assert.ok(
    (u.path.at(-1)?.y ?? u.y) > 400,
    'un ancien adversaire masque le danger sur le cristal',
  );
});

test('la couverture des tanks et dragons reflète leur portée et leur santé réelle', () => {
  function scores(kind: 'club' | 'dragon' | 'tank', hp = 100) {
    return laneDefense([{ kind, x: 852, y: 324, hp, maxHp: 100 }]);
  }
  const club = scores('club'),
    dragon = scores('dragon'),
    tank = scores('tank');
  assert.ok(dragon[0] / dragon[1] > (club[0] / club[1]) * 2);
  assert.ok(tank[0] / tank[1] > dragon[0] / dragon[1]);
  assert.deepEqual(scores('tank', 0), [0, 0, 0]);
  assert.ok(scores('tank', 20)[0] < tank[0]);
});
