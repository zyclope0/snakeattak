import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import type { Entity } from '../src/game.ts';
import { characterMotion, dustSpacing, stepLength } from '../src/render/characterMotion.ts';
import type { Gait } from '../src/render/characterMotion.ts';
import { Presentation } from '../src/render/presentation.ts';

const still = { dx: 0, dy: 0, angle: 0, sx: 1, sy: 1 };
const base = () => new Game().units[0];
const walker = (kind: string, extra: Partial<Entity> = {}) =>
  ({ ...base(), kind, state: 'move', facing: 1, ...extra }) as Entity;
const gait = (travel: number, rest = 0): Gait => ({ travel, rest });
const walkers = [
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
  'tank',
  'dino',
  'raptor',
  'triceratops',
  'stegosaurus',
  'trex',
  'mutantRock',
  'mutantStretch',
  'snake',
];

test('la marche suit le chemin parcouru, pas l’horloge', () => {
  for (const kind of walkers) {
    const unit = walker(kind);
    // Même distance, autre instant : même pose. La pause et un blocage figent donc le pas.
    assert.deepEqual(
      characterMotion(unit, 0, undefined, false, gait(7)),
      characterMotion(unit, 123.4, undefined, false, gait(7)),
      kind,
    );
    // En avançant, le corps bouge vraiment : il ne glisse plus.
    const poses = new Set<string>();
    for (let travel = 0; travel < stepLength(unit) * 4; travel += 0.5)
      poses.add(JSON.stringify(characterMotion(unit, 0, undefined, false, gait(travel))));
    assert.ok(poses.size >= 3, `${kind} : ${poses.size} poses sur quatre pas`);
    // Image par image : chaque pose tient un quart de pas, pas un glissement continu.
    assert.ok(poses.size <= 32, `${kind} : ${poses.size} poses`);
  }
});

test('amplitudes de marche modestes, lisibles sur téléphone', () => {
  for (const kind of walkers)
    for (const boss of kind === 'snake' ? [false, true] : [false])
      for (const facing of [-1, 1]) {
        const unit = walker(kind, { facing, boss });
        let lift = 0;
        for (let travel = 0; travel < 200; travel += 0.37) {
          const pose = characterMotion(unit, 0, undefined, false, gait(travel));
          assert.ok(Math.abs(pose.dx) <= 6 && Math.abs(pose.dy) <= 5, `${kind} décalage`);
          assert.ok(pose.sx >= 0.85 && pose.sx <= 1.15 && pose.sy >= 0.85 && pose.sy <= 1.15);
          assert.ok(Math.abs(pose.angle) <= 0.14, `${kind} inclinaison ${pose.angle}`);
          lift = Math.max(lift, Math.abs(pose.dy) + Math.abs(pose.sx - 1) * 20);
        }
        assert.ok(lift >= 0.8, `${kind} : mouvement visible`);
      }
});

test('un combattant à pied sautille et se dandine ; un serpent ondule sans quitter le sol', () => {
  const club = walker('club');
  let up = 0,
    left = 0,
    right = 0;
  for (let travel = 0; travel < stepLength(club) * 2; travel += 0.25) {
    const pose = characterMotion(club, 0, undefined, false, gait(travel));
    assert.ok(pose.dy <= 0, 'un pas ne s’enfonce pas dans le sol');
    up = Math.min(up, pose.dy);
    // L'inclinaison alterne autour d'un léger penché vers l'avant.
    left = Math.min(left, pose.angle - 0.02);
    right = Math.max(right, pose.angle - 0.02);
  }
  assert.ok(up <= -2, `saut ${up}`);
  assert.ok(left < -0.03 && right > 0.03, 'dandinement d’un pied sur l’autre');
  const snake = walker('snake');
  let stretch = 0,
    gather = 0;
  for (let travel = 0; travel < stepLength(snake); travel += 0.25) {
    const pose = characterMotion(snake, 0, undefined, false, gait(travel));
    assert.ok(Math.abs(pose.dy) <= 1, 'un serpent ne saute pas');
    stretch = Math.max(stretch, pose.sx);
    gather = Math.min(gather, pose.sx - 1);
    // Étiré, il avance la tête ; ramassé, il la recule.
    if (pose.sx > 1.01) assert.ok(pose.dx > 0);
    if (pose.sx < 0.99) assert.ok(pose.dx < 0);
  }
  assert.ok(stretch >= 1.05 && gather <= -0.05, 'ondulation étirée puis ramassée');
  // Le serpent se retourne : l'ondulation aussi.
  const back = characterMotion({ ...snake, facing: -1 }, 0, undefined, false, gait(7));
  const forth = characterMotion(snake, 0, undefined, false, gait(7));
  assert.equal(back.dx, -forth.dx);
});

test('arrêté en plein pas, le combattant repose le pied ; effets légers : aucune marche', () => {
  const unit = walker('club');
  const mid = gait(stepLength(unit) * 0.5);
  assert.notDeepEqual(characterMotion(unit, 0, undefined, false, mid), still);
  assert.deepEqual(characterMotion(unit, 0, undefined, false, { ...mid, rest: 0.2 }), still);
  for (const kind of walkers)
    assert.deepEqual(characterMotion(walker(kind), 0, undefined, true, gait(9)), still);
});

test('les volants gardent leur vol : horloge, pas de pas', () => {
  const flying = walker('snake', { variant: 'flying' } as Partial<Entity>);
  const dragon = walker('dragon');
  for (const unit of [flying, dragon]) {
    const flight = unit === flying;
    assert.deepEqual(
      characterMotion(unit, 1.3, undefined, false, gait(5), flight),
      characterMotion(unit, 1.3, undefined, false, gait(50), flight),
    );
    assert.notDeepEqual(
      characterMotion(unit, 1.3, undefined, false, gait(5), flight),
      characterMotion(unit, 1.6, undefined, false, gait(5), flight),
    );
  }
});

test('le pas observé vient des positions du moteur et ne les modifie pas', () => {
  const g = new Game(),
    p = new Presentation();
  const unit = g.units[0];
  p.update(g, 16);
  p.update(g, 16);
  const start = p.gaits.get(unit.id)!.travel;
  const rng = g.rng;
  const before = structuredClone(unit);
  unit.x += 3;
  unit.y += 4;
  p.update(g, 16);
  assert.equal(p.gaits.get(unit.id)!.travel, start + 5);
  assert.equal(p.gaits.get(unit.id)!.rest, 0);
  assert.deepEqual({ ...unit, x: before.x, y: before.y }, before);
  assert.equal(g.rng, rng);
  // Immobile : le repos s'allonge, la distance ne bouge plus.
  p.update(g, 50);
  p.update(g, 50);
  assert.equal(p.gaits.get(unit.id)!.travel, start + 5);
  assert.ok(Math.abs(p.gaits.get(unit.id)!.rest - 0.1) < 1e-9);
  // En pause, rien ne vieillit.
  g.paused = true;
  p.update(g, 500);
  assert.ok(Math.abs(p.gaits.get(unit.id)!.rest - 0.1) < 1e-9);
  g.paused = false;
  // Un camp replacé d'un coup n'est pas une marche.
  unit.x += 300;
  p.update(g, 16);
  assert.equal(p.gaits.get(unit.id)!.travel, start + 5);
  // Deux combattants ne partent pas du même pied.
  const other = g.units[1];
  assert.notEqual(p.gaits.get(other.id)!.travel, p.gaits.get(unit.id)!.travel - 5);
  // Disparu : son pas est oublié.
  g.units.splice(0, 1);
  p.update(g, 16);
  assert.equal(p.gaits.has(unit.id), false);
});

test('seuls les corps lourds soulèvent un peu de poussière, à intervalles de marche', () => {
  for (const kind of [
    'tank',
    'cavalry',
    'trex',
    'triceratops',
    'stegosaurus',
    'mutantRock',
    'dino',
  ])
    assert.ok(dustSpacing(walker(kind)) >= 30, kind);
  for (const kind of ['hero', 'club', 'archer', 'ninja', 'snake', 'dragon', 'wall'])
    assert.equal(dustSpacing(walker(kind)), 0, kind);
  const g = new Game(),
    p = new Presentation();
  const unit = g.units[0];
  (unit as { kind: string }).kind = 'trex';
  p.update(g, 16);
  p.update(g, 16);
  let dust = 0;
  for (let i = 0; i < 100; i++) {
    unit.x -= 2;
    p.update(g, 16);
    dust += p.sparks.filter((s) => s.kind === 'dust').length;
  }
  // 200 unités parcourues, un nuage toutes les 40 : cinq, pas un par image.
  assert.equal(dust, 5);
  (unit as { kind: string }).kind = 'club';
  for (let i = 0; i < 60; i++) {
    unit.x -= 2;
    p.update(g, 16);
    assert.equal(p.sparks.filter((s) => s.kind === 'dust').length, 0);
  }
});
