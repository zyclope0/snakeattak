import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { missionLevel } from '../src/levels.ts';
import { CURRENT_MISSION_PATHS, createMissionRun, readMissionRun } from '../src/missions.ts';
import { CELL, COLS, ROWS, blocked, findPath } from '../src/navigation.ts';
import type { PathRules, Point } from '../src/navigation.ts';
import { decodeCheckpoint, encodeCheckpoint } from '../src/checkpoints.ts';
import { decodeDeparture, encodeDeparture } from '../src/departures.ts';

const center = (n: number) => n * CELL + CELL / 2;
/** True when a walker following the straight line from `a` to `b` meets no obstacle. */
function walkable(a: Point, b: Point, layout: 0 | 1 | 2): boolean {
  const level = missionLevel(layout);
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
  for (let i = 0; i <= steps; i++)
    if (blocked(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps, level))
      return false;
  return true;
}
/** Paths between free cells of the camp side, a few cells apart: how many cross a rock. */
function crossings(layout: 0 | 1 | 2, rules: PathRules): { paths: number; crossed: number } {
  const level = missionLevel(layout);
  const cells: Point[] = [];
  for (let x = 24; x < COLS; x += 2)
    for (let y = 4; y < ROWS - 3; y += 2)
      if (!blocked(center(x), center(y), level)) cells.push({ x: center(x), y: center(y) });
  let paths = 0,
    crossed = 0;
  for (let i = 0; i < cells.length; i += 3)
    for (let j = 1; j < cells.length; j += 7) {
      const path = findPath(cells[i], cells[j], level, rules);
      if (!path.length) continue;
      paths++;
      const points = [cells[i], ...path];
      if (points.some((p, n) => n > 0 && !walkable(points[n - 1], p, layout))) crossed++;
    }
  return { paths, crossed };
}

test('les secondes règles de chemin ne font jamais traverser un rocher', () => {
  for (const layout of [0, 1, 2] as const) {
    const second = crossings(layout, 2);
    assert.ok(second.paths > 300, `layout ${layout}: ${second.paths} paths`);
    assert.equal(second.crossed, 0, `layout ${layout}: no path crosses a rock`);
  }
  // The first rules did, on the map of the crossroads: this is the defect they keep, so that
  // the games begun with them stay the games they were.
  assert.ok(crossings(2, 1).crossed > 0, 'the first rules cross a rock on layout 2');
});

/**
 * The longest time, in seconds, an ally placed at `spot` stands still with a path to follow
 * and something to do, in a whole mission on the map of the crossroads.
 */
function standing(spot: [number, number], paths?: 2): number {
  let run = null;
  for (let seed = 1; seed < 500 && !run; seed++) {
    const drawn = createMissionRun('trois-ponts', seed, null, 2, paths);
    if (drawn.layout === 2) run = drawn;
  }
  const game = new Game(1, undefined, run!);
  assert.ok(game.recruit('club', ...spot));
  const club = game.units.at(-1)!;
  let longest = 0,
    row = 0,
    last = { x: club.x, y: club.y };
  for (let wave = 1; wave <= game.totalWaves && game.status === 'preparing'; wave++) {
    game.startWave();
    const started = game.time;
    while ((game.status as string) === 'fighting' && game.time - started < 300) {
      game.step(1 / 30);
      if (!game.units.includes(club)) break;
      const still = Math.hypot(club.x - last.x, club.y - last.y) < 0.01;
      const away = Math.hypot(club.x - club.homeX, club.y - club.homeY) > 20;
      const walking = club.path.length > 0 && club.state !== 'attack';
      row = still && walking && (club.targetId !== null || away) ? row + 1 : 0;
      longest = Math.max(longest, row);
      last = { x: club.x, y: club.y };
    }
  }
  return longest / 30;
}

test('avec les secondes règles, un allié ne reste plus collé au rocher', () => {
  // Just above the right-hand rock, and just under it: a snake passes on the other side.
  for (const spot of [
    [876, 228],
    [876, 300],
  ] as [number, number][]) {
    const first = standing(spot),
      second = standing(spot, 2);
    assert.ok(first > 3, `${spot}: the first rules leave it standing ${first} s`);
    // What is left is the ordinary pause between two steps of a fight, never a rock.
    assert.ok(second < 1, `${spot}: the second rules do not (${second} s)`);
  }
});

test('une mission garde ses règles de chemin : tirage, code de départ, sauvegarde', () => {
  assert.equal(CURRENT_MISSION_PATHS, 2);
  const old = createMissionRun('course', 77, null, 2);
  const fresh = createMissionRun('course', 77, null, 2, 2);
  assert.equal(Object.hasOwn(old, 'paths'), false);
  assert.deepEqual(fresh, { ...old, paths: 2 }, 'the same draw, the second path rules');
  assert.equal(new Game(1, undefined, old).pathRules, 1);
  assert.equal(new Game(1, undefined, fresh).pathRules, 2);
  assert.equal(new Game(1).pathRules, 1, 'the great adventure keeps the first rules');
  // Only with the second balance revision, and only the value 2.
  assert.throws(() => createMissionRun('course', 77, null, undefined, 2));
  const { balance: _, ...first } = fresh;
  assert.equal(readMissionRun(first), null);
  assert.equal(readMissionRun({ ...fresh, paths: 3 }), null);
  assert.deepEqual(readMissionRun(fresh), fresh);

  // The departure code: a rule of its own; the old code keeps its exact text.
  const oldCode = encodeDeparture({ kind: 'mission', run: old });
  const code = encodeDeparture({ kind: 'mission', run: fresh });
  assert.match(oldCode, /^VIFS-4-/);
  assert.match(code, /^VIFS-0-/);
  assert.deepEqual(decodeDeparture(oldCode), {
    ok: true,
    departure: { kind: 'mission', run: old },
  });
  assert.deepEqual(decodeDeparture(code), { ok: true, departure: { kind: 'mission', run: fresh } });
  assert.deepEqual(decodeDeparture(code.toLowerCase()), decodeDeparture(code));
  // The letter O typed for the digit is read as the digit, as everywhere in a code.
  assert.deepEqual(decodeDeparture(code.replace('VIFS-0-', 'VIFS-O-')), decodeDeparture(code));
  // A rule this version does not know is « another version », never a code badly typed.
  for (const rule of ['A', 'B', 'Z'])
    assert.deepEqual(decodeDeparture(code.replace('VIFS-0-', `VIFS-${rule}-`)), {
      ok: false,
      reason: 'version',
    });
  const challenge = { ...fresh, caprice: 'course-moyen' };
  assert.deepEqual(decodeDeparture(encodeDeparture({ kind: 'mission', run: challenge })), {
    ok: true,
    departure: { kind: 'mission', run: challenge },
  });
  // The great adventure has no such rule: a code that says so was not written by the game.
  const classic = encodeDeparture({ kind: 'classic', seed: 5, balance: 2 });
  assert.equal(decodeDeparture(classic.replace('-4-', '-0-')).ok, false);

  // The saved camp: a version of its own, which holds these rules and only these.
  const saved = encodeCheckpoint(new Game(1, undefined, fresh))!;
  assert.equal(JSON.parse(saved).version, 16);
  assert.deepEqual(decodeCheckpoint(saved)!.mission, fresh);
  assert.equal(decodeCheckpoint(saved)!.pathRules, 2);
  const before = encodeCheckpoint(new Game(1, undefined, old))!;
  assert.equal(JSON.parse(before).version, 9);
  assert.equal(decodeCheckpoint(before)!.pathRules, 1);
  const swap = (raw: string, version: number, mission: object) =>
    decodeCheckpoint(JSON.stringify({ ...JSON.parse(raw), version, mission }));
  assert.equal(swap(saved, 9, fresh), null, 'version 9 cannot hold the second rules');
  assert.equal(swap(before, 16, old), null, 'version 16 holds nothing else');
});
