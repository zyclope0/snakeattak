import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { blocked, findPath } from '../src/navigation.ts';
import { encodeCheckpoint, decodeCheckpoint } from '../src/checkpoints.ts';

// Removing the active-level getter would leave all campaigns on the original terrain.
test('trois clairières réelles suivent les chapitres, y compris au camp', () => {
  const g = new Game();
  assert.ok('level' in g, 'le moteur expose son niveau actif');
  const first = g.level;
  for (const wave of [4, 8]) {
    g.wave = wave;
    assert.notEqual(g.level.id, first.id);
  }
  g.wave = 3;
  assert.equal(g.level.id, first.id);
});

test('les cartes indépendantes gardent trois passages et deux jonctions navigables', async () => {
  const { levelForWave } = await import('../src/levels.ts');
  const maps = [1, 5, 9].map(levelForWave);
  assert.equal(new Set(maps.map((l) => l.id)).size, 3);
  assert.equal(new Set(maps.map((l) => JSON.stringify(l.rocks))).size, 3);
  for (const level of maps) {
    for (const y of [180, 324, 468]) {
      assert.ok(findPath({ x: 444, y }, { x: 612, y }, level).length);
      assert.ok(findPath({ x: 612, y }, { x: 1032, y: 324 }, level).length);
    }
    for (const x of [372, 684]) assert.ok(findPath({ x, y: 180 }, { x, y: 468 }, level).length);
  }
  // Repeating the same query on different maps must never reuse another map's path.
  const start = { x: 708, y: 180 },
    end = { x: 804, y: 180 };
  for (const level of [maps[0], maps[1], maps[0], maps[2], maps[1]])
    assert.ok(findPath(start, end, level).every((p) => !blocked(p.x, p.y, level)));
  const rock = maps[1].rocks.find((r) => !blocked(r.x, r.y, maps[0]))!;
  assert.ok(rock);
  assert.equal(blocked(rock.x, rock.y, maps[1]), true);
  assert.equal(blocked(rock.x, rock.y, maps[0]), false);
});

test('une transition reloge seulement les positions invalides sans perdre le camp', async () => {
  const { levelForWave } = await import('../src/levels.ts');
  for (const completed of [4, 8]) {
    const g = new Game(73);
    g.units = [];
    g.wave = completed - 1;
    g.gold = 5000;
    const previous = levelForWave(completed),
      next = levelForWave(completed + 1);
    const rock = next.rocks.find((r) => !blocked(r.x, r.y, previous))!;
    assert.ok(g.recruit('club', rock.x, rock.y));
    assert.ok(g.recruit('club', 948, 324));
    const safe = g.units[1];
    g.units[0].hp = 45;
    const ids = g.units.map((u) => u.id),
      gold = g.gold;
    g.startWave();
    const rng = g.rng;
    g.remaining = 0;
    g.eggs = [];
    g.step(1 / 30);
    assert.equal(g.status, 'preparing');
    assert.equal(g.level.id, next.id);
    assert.deepEqual(
      g.units.map((u) => u.id),
      ids,
    );
    assert.equal(g.units[0].hp, 45);
    assert.equal(g.rng, rng);
    assert.ok(g.gold > gold);
    assert.deepEqual({ x: safe.x, y: safe.y }, { x: 948, y: 324 });
    for (const u of g.units) {
      assert.equal(blocked(u.x, u.y, next), false);
      assert.equal(blocked(u.homeX, u.homeY, next), false);
    }
    assert.ok(Math.hypot(g.units[0].homeX - safe.homeX, g.units[0].homeY - safe.homeY) >= 28);
    assert.equal(g.canRecruit('club', g.units[0].homeX, g.units[0].homeY), false);
    const restored = decodeCheckpoint(encodeCheckpoint(g)!)!;
    assert.equal(restored.level.id, next.id);
    assert.deepEqual(
      restored.units.map((u) => [u.id, u.hp, u.homeX, u.homeY]),
      g.units.map((u) => [u.id, u.hp, u.homeX, u.homeY]),
    );
  }
});

test('une ancienne sauvegarde de frontière projette positions et domiciles sur la nouvelle carte', async () => {
  const { levelForWave } = await import('../src/levels.ts');
  const raw = JSON.parse(encodeCheckpoint(new Game(39))!);
  raw.wave = 4;
  raw.version = 2;
  delete raw.rewards;
  const rock = levelForWave(5).rocks[0];
  for (const u of raw.units)
    Object.assign(u, { x: rock.x, y: rock.y, homeX: rock.x, homeY: rock.y });
  const restored = decodeCheckpoint(JSON.stringify(raw))!;
  assert.ok(restored);
  assert.equal(restored.units.length, 3);
  for (const u of restored.units) {
    assert.equal(blocked(u.x, u.y, restored.level), false);
    assert.equal(blocked(u.homeX, u.homeY, restored.level), false);
  }
  for (let i = 0; i < restored.units.length; i++)
    for (let j = i + 1; j < restored.units.length; j++)
      assert.ok(
        Math.hypot(
          restored.units[i].homeX - restored.units[j].homeX,
          restored.units[i].homeY - restored.units[j].homeY,
        ) >= 28,
      );
});
