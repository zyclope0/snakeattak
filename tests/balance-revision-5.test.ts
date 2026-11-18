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
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { Game } from '../src/game.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createMissionRun } from '../src/missions.ts';
import { blocked } from '../src/navigation.ts';
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

test('la révision 5 est la révision courante, et ne change que le ninja', () => {
  assert.deepEqual([...BALANCE_REVISIONS], [1, 2, 3, 4, 5]);
  assert.equal(CURRENT_BALANCE_REVISION, 5);
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
  assert.ok(!blocked(snake.x, snake.y, game.level));
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

test('le ninja ne revient jamais sur un rocher, dans la rivière ni sur le cristal', () => {
  const { game, snake } = meet(5, 'shadow', 6);
  for (const [x, y, facing] of [
    [960, 324, -1],
    [520, 200, -1],
    [700, 324, 1],
    [1070, 140, -1],
  ] as const) {
    const fresh = { ...snake, dodges: 1, x: 300, y: 324, path: [] };
    const ally = { ...game.units[0], x, y, facing };
    hitEnemy(game, ally, fresh, 5);
    const moved = fresh.x !== 300 || fresh.y !== 324;
    if (moved) assert.ok(!blocked(fresh.x, fresh.y, game.level), `${x},${y}`);
    assert.ok(fresh.x <= 940, `trop près du cristal : ${fresh.x}`);
  }
});

test('le roi ne se téléporte pas, ni aucun autre serpent', () => {
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
