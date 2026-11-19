import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import {
  BALANCE_REVISIONS,
  CURRENT_BALANCE_REVISION,
  balanceRecruitPrice,
  lateEggRule,
  ninjaTeleport,
} from '../src/balanceRevision.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { decodeDeparture, departureForGame, encodeDeparture } from '../src/departures.ts';
import type { EnemyKind } from '../src/enemies.ts';
import { hitEnemy } from '../src/engine/damage.ts';
import { blast } from '../src/engine/allies.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { Game } from '../src/game.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createMissionRun } from '../src/missions.ts';
import { routeStages, standable } from '../src/engine/field.ts';
import { CRYSTAL_X } from '../src/boardLandmarks.ts';
import { createCareer } from '../src/progression.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { variantFor } from '../src/waves.ts';
import { abilityOf } from '../src/ui/threatPreview.ts';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp'))
      return {
        format: 'module',
        source: `export default ${JSON.stringify(url)};`,
        shortCircuit: true,
      };
    return nextLoad(url, context);
  },
});

// Fifth balance revision, 18 November 2026: the child's ninja snake « se téléporte dans le dos
// d'un personnage ». The parent chose: once, instead of the dodge, behind the ally that
// struck it. Every number below is retyped on purpose.
const classic = (revision: 1 | 2 | 3 | 4 | 5, seed = 7) =>
  new Game(seed, undefined, undefined, revision);

/** Plays a wave until a snake of this kind is on the board. */
function meet(revision: 4 | 5, kind: EnemyKind, wave: number) {
  const game = classic(revision, 31);
  game.wave = wave - 1;
  game.gold = 20000;
  game.normalizeCamp();
  assert.ok(game.startWave());
  for (let step = 0; step < 30 * 60; step++) {
    game.step(1 / 30);
    const snake = game.enemies.find((e) => e.variant === kind && e.hp > 0);
    if (snake) return { game, snake };
  }
  throw new Error(`aucun ${kind} dans la vague ${wave}`);
}

test('la révision 5 ne change que le ninja', () => {
  // The sixth (the grasshopper snake) is the current one since 18 November 2026.
  assert.deepEqual([...BALANCE_REVISIONS], [1, 2, 3, 4, 5, 6]);
  assert.equal(CURRENT_BALANCE_REVISION, 6);
  for (const kind of Object.keys(kinds) as Kind[])
    assert.equal(balanceRecruitPrice(kind, 5), balanceRecruitPrice(kind, 4), kind);
  assert.deepEqual(lateEggRule(5), lateEggRule(4));
  for (let wave = 1; wave <= 12; wave++)
    for (let index = 0; index < 40; index++)
      assert.equal(variantFor(wave, index, 5), variantFor(wave, index, 4), `${wave}/${index}`);
  assert.deepEqual(ninjaTeleport(5), { behind: 34 });
  for (const revision of [1, 2, 3, 4] as const) assert.equal(ninjaTeleport(revision), null);
  assert.throws(() => new Game(7, undefined, createMissionRun('refuge', 7, undefined, 2), 5));
});

test('révision 5 : le premier coup rate le ninja, qui revient dans le dos de celui qui a frappé', () => {
  const { game, snake } = meet(5, 'shadow', 6);
  const hero = game.units.find((u) => u.kind === 'hero')!;
  hero.facing = -1;
  const full = snake.hp;
  hitEnemy(game, hero, snake, 10);
  assert.equal(snake.hp, full, 'le premier coup le rate');
  assert.equal(snake.dodges, 0);
  // Behind: on the side the hero does not face, at most 34 units away, on open ground.
  assert.ok(snake.x > hero.x && snake.x - hero.x <= 34, `${snake.x} / ${hero.x}`);
  assert.ok(Math.abs(snake.y - hero.y) <= 12);
  assert.ok(standable(snake.x, snake.y, game.level));
  assert.deepEqual(snake.path, []);
  assert.ok(game.effects.some((e) => e.kind === 'blink'));
  const x = snake.x;
  hitEnemy(game, hero, snake, 10);
  assert.equal(snake.hp, full - 10, 'le second le touche');
  assert.equal(snake.x, x, 'une seule fois');
});

test('révision 4 : le ninja esquive sans bouger, comme avant', () => {
  const { game, snake } = meet(4, 'shadow', 6);
  const hero = game.units.find((u) => u.kind === 'hero')!;
  const at = { x: snake.x, y: snake.y };
  hitEnemy(game, hero, snake, 10);
  assert.deepEqual({ x: snake.x, y: snake.y }, at);
  assert.ok(!game.effects.some((e) => e.kind === 'blink'));
});

test('le ninja ne revient jamais sur un rocher, dans la rivière ni devant un allié près du cristal', () => {
  const { game, snake } = meet(5, 'shadow', 6);
  const level = game.level;
  const rock = level.rocks[0];
  let moved = 0;
  for (const [x, y, facing] of [
    [rock.x - 30, rock.y, -1],
    [470, 200, 1],
    [470, 324, 1],
    [700, 324, -1],
    [800, 156, -1],
    [930, 324, -1],
    [984, 324, -1],
    [1060, 140, -1],
  ] as const) {
    const fresh = { ...snake, dodges: 1, x: 300, y: 324, path: [] };
    const ally = { ...game.units[0], x, y, facing };
    hitEnemy(game, ally, fresh, 5);
    if (fresh.x === 300 && fresh.y === 324) continue;
    moved++;
    assert.ok(standable(fresh.x, fresh.y, level), `${x},${y} → ${fresh.x},${fresh.y}`);
    assert.ok(fresh.x <= CRYSTAL_X - 60, `trop près du cristal : ${fresh.x}`);
    // Behind, never in front: on the side the ally does not face.
    assert.ok((fresh.x - x) * facing <= 0, `devant l'allié : ${x} → ${fresh.x}`);
  }
  assert.ok(moved >= 3, `${moved} téléportations seulement`);
  // Its back is the river: the first place is refused, a nearer one on the bank is taken.
  assert.ok(!standable(600 - 34, 250, level), 'la première place est dans la rivière');
  const fresh = { ...snake, dodges: 1, x: 300, y: 250, path: [] };
  hitEnemy(game, { ...game.units[0], x: 600, y: 250, facing: 1 }, fresh, 5);
  assert.ok(fresh.x !== 300, 'il saute quand même');
  assert.ok(standable(fresh.x, fresh.y, level) && fresh.x >= 576, `${fresh.x},${fresh.y}`);
  // Its back is a rock: never inside it.
  for (const r of level.rocks) {
    const near = { ...snake, dodges: 1, x: 300, y: r.y, path: [] };
    hitEnemy(game, { ...game.units[0], x: r.x - 34, y: r.y, facing: -1 }, near, 5);
    assert.ok(Math.hypot(near.x - r.x, near.y - r.y) >= r.r, `dans le rocher ${r.x},${r.y}`);
  }
});

test('après son saut, le ninja ne revient pas en arrière vers l’antre', () => {
  const { game, snake } = meet(5, 'shadow', 6);
  const hero = { ...game.units[0], x: 860, y: 324, facing: -1 };
  hitEnemy(game, hero, snake, 5);
  assert.ok(snake.x > 860);
  const stages = routeStages(game.level);
  assert.ok(stages[snake.stage] > snake.x || snake.stage === stages.length - 1);
  assert.equal(snake.turnY, null);
  const start = snake.x;
  let least = start;
  for (let i = 0; i < 60 && snake.hp > 0 && game.enemies.includes(snake); i++) {
    game.step(1 / 30);
    least = Math.min(least, snake.x);
  }
  assert.ok(least >= start - 30, `recule de ${start - least}`);
});

test('l’explosion reste où elle tombe, et ne téléporte que le serpent visé', () => {
  for (const revision of [4, 5] as const) {
    const { game, snake } = meet(revision, 'shadow', 6);
    snake.x = 700;
    snake.y = 324;
    const tank = { ...game.units[0], kind: 'tank' as const, x: 850, y: 324, facing: -1 };
    // A plain snake beside the ninja, met by the loop after it; a second ninja on the edge.
    const near = { ...snake, id: 99001, variant: 'normal' as const, dodges: undefined, x: 680 };
    const grazed = { ...snake, id: 99002, dodges: 1, x: 725 };
    game.enemies.splice(0, game.enemies.length, snake, near, grazed);
    const nearHp = near.hp;
    blast(game, tank, snake, 70);
    assert.ok(near.hp < nearHp, `révision ${revision} : le voisin est touché`);
    assert.deepEqual([grazed.x, grazed.y], [725, 324], 'effleuré, il ne saute pas');
    assert.equal(grazed.dodges, 0, 'mais son premier coup est passé');
  }
});

test('aucun autre serpent ne se téléporte', () => {
  const { game } = meet(5, 'shadow', 6);
  const hero = game.units.find((u) => u.kind === 'hero')!;
  const other = game.enemies.find((e) => e.variant !== 'shadow' && e.hp > 0)!;
  const at = { x: other.x, y: other.y };
  hitEnemy(game, hero, other, 1);
  assert.deepEqual({ x: other.x, y: other.y }, at);
});

test('les fiches disent ce que fait le ninja dans la partie où on le rencontre', () => {
  assert.equal(abilityOf('shadow', 4), 'Rapide : il esquive le premier coup');
  assert.equal(
    abilityOf('shadow', 5),
    'Rapide : au premier coup, il disparaît et revient derrière celui qui l’a frappé',
  );
  assert.equal(abilityOf('shadow'), abilityOf('shadow', 5));
  assert.equal(abilityOf('fang', 5), abilityOf('fang', 4));
});

test('révision 5 : code AVENTURE-7, camp en version 12, sauvegarde familiale', () => {
  const code = encodeDeparture({ kind: 'classic', seed: 2026, balance: 5 });
  assert.match(code, /^AVENTURE-7-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{2}$/);
  const decoded = decodeDeparture(code);
  assert.ok(decoded.ok);
  assert.deepEqual({ ...decoded.departure }, { kind: 'classic', seed: 2026, balance: 5 });
  // The codes of the fourth revision still read as before.
  assert.match(encodeDeparture({ kind: 'classic', seed: 2026, balance: 4 }), /^AVENTURE-6-/);
  const game = classic(5, 2026);
  game.initialSeed = 2026;
  assert.equal(encodeDeparture(departureForGame(game)!), code);
  const raw = encodeCheckpoint(game)!;
  assert.equal(JSON.parse(raw).version, 12);
  assert.equal(decodeCheckpoint(raw)!.balanceRevision, 5);
  const older = classic(4, 2026);
  older.initialSeed = 2026;
  assert.equal(JSON.parse(encodeCheckpoint(older)!).version, 11);
  assert.equal(decodeCheckpoint(encodeCheckpoint(older)!)!.balanceRevision, 4);
  const backup = writeFamilyBackup(
    raw,
    createCareer().state,
    createMissionProgress(),
    createCapriceAlbumsController().state,
  );
  assert.ok(backup);
  assert.ok(readFamilyBackup(backup!));
});

test('aucun mot quand le ninja se téléporte ; « Esquive ! » quand il esquive sur place', async () => {
  const { Presentation } = await import('../src/render/presentation.ts');
  for (const revision of [4, 5] as const) {
    const { game, snake } = meet(revision, 'shadow', 6);
    const p = new Presentation();
    p.update(game, 16);
    hitEnemy(game, { ...game.units[0], x: 700, y: 324, facing: -1 }, snake, 5);
    p.update(game, 16);
    const said = p.floats.some((f) => f.text === 'Esquive !');
    // The child chose no word for the teleport; the dodge of an older game keeps its word.
    assert.equal(said, revision === 4, `révision ${revision}`);
  }
  // A short leap (only the place at half the distance is free) says nothing either: the
  // rings tell the teleport, not the distance.
  const { game, snake } = meet(5, 'shadow', 6);
  const p = new Presentation();
  p.update(game, 16);
  const from = { x: snake.x, y: snake.y };
  snake.dodges = 0;
  snake.x += 17;
  game.effects.push({
    sourceId: snake.id,
    targetId: undefined,
    x: from.x,
    y: from.y,
    tx: snake.x,
    ty: snake.y,
    kind: 'blink',
    life: 0.8,
  });
  p.update(game, 16);
  assert.ok(!p.floats.some((f) => f.text === 'Esquive !'));
});
