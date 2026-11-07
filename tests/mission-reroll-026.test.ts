import { Session } from '../src/session.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMissionRun, MISSIONS, readMissionRun } from '../src/missions.ts';
import { encodeDeparture, decodeDeparture } from '../src/departures.ts';

test('un nouveau tirage change toujours de terrain, même si seul le profil ennemi diffère', () => {
  for (const mission of MISSIONS)
    for (const layout of [0, 1, 2] as const)
      for (const assault of ['balanced', 'rush', 'escort'] as const)
        for (const nest of ['spread', 'clustered'] as const)
          for (const seed of [0, 1, 42, 2026, 0xfffffffe, 0xffffffff]) {
            const previous = { missionId: mission.id, seed: 123, layout, assault, nest };
            const next = createMissionRun(mission.id, seed, previous);
            assert.notEqual(next.layout, previous.layout);
            assert.equal(next.seed, seed);
            assert.deepEqual(next, createMissionRun(mission.id, seed, previous));
            assert.ok(Object.isFrozen(next));
            assert.deepEqual(
              readMissionRun(previous),
              previous,
              'Les anciens départs ne sont pas retirés',
            );
            const code = encodeDeparture({ kind: 'mission', run: previous });
            assert.deepEqual(decodeDeparture(code), {
              ok: true,
              departure: { kind: 'mission', run: previous },
            });
          }
});

test('les nouveaux départs de session ne dépendent pas de Math.random', () => {
  const original = Math.random;
  Math.random = () => {
    throw new Error('Tirage non déterministe interdit');
  };
  try {
    const session = new Session();
    assert.ok(Number.isInteger(session.game.initialSeed));
    session.restart();
    assert.ok(session.game.initialSeed! >= 0 && session.game.initialSeed! <= 0xffffffff);
  } finally {
    Math.random = original;
  }
});
