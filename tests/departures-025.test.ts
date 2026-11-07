import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeDeparture, decodeDeparture, departureForGame } from '../src/departures.ts';
import { MISSIONS, readMissionRun, missionWave } from '../src/missions.ts';
import { Game } from '../src/game.ts';

test('les codes conservent les 108 configurations et toutes les bornes de graine', () => {
  const codes = new Set<string>();
  for (const mission of MISSIONS)
    for (const layout of [0, 1, 2] as const)
      for (const assault of ['balanced', 'rush', 'escort'] as const)
        for (const nest of ['spread', 'clustered'] as const)
          for (const seed of [0, 1, 2026, 0xffffffff]) {
            const run = readMissionRun({ missionId: mission.id, seed, layout, assault, nest })!;
            const code = encodeDeparture({ kind: 'mission', run });
            const decoded = decodeDeparture(code);
            assert.equal(decoded.ok, true);
            if (!decoded.ok) throw Error('invalid code');
            assert.deepEqual(decoded.departure, { kind: 'mission', run });
            assert.ok(!codes.has(code));
            codes.add(code);
            assert.deepEqual(
              missionWave(run, 1),
              missionWave(decoded.departure.kind === 'mission' ? decoded.departure.run : run, 1),
            );
          }
  assert.equal(codes.size, 432);
});
test('aventure et mission restent distinctes, avec un contrôle de saisie', () => {
  for (const seed of [0, 2026, 0xffffffff]) {
    const code = encodeDeparture({ kind: 'classic', seed });
    const decoded = decodeDeparture(code.toLowerCase());
    assert.deepEqual(decoded, { ok: true, departure: { kind: 'classic', seed } });
    assert.equal(decodeDeparture(code.slice(0, -1) + (code.endsWith('0') ? '1' : '0')).ok, false);
    assert.equal(decodeDeparture(code.replace('-1-', '-2-')).ok, false);
    assert.equal(decodeDeparture(code.replace('AVENTURE', 'PONTS')).ok, false);
  }
  for (const raw of ['', 'FOUGERE-42', '<script>', 'A'.repeat(1000), null, {}, 42])
    assert.equal(decodeDeparture(raw).ok, false);
  for (const seed of [-1, 1.5, NaN, Infinity, 0x100000000])
    assert.throws(() => encodeDeparture({ kind: 'classic', seed }), RangeError);
});
test('lire et copier un code ne consomment pas le RNG et le code ne suit pas le combat', () => {
  const game = new Game(2026),
    before = JSON.stringify(game);
  const departure = departureForGame(game)!;
  const code = encodeDeparture(departure);
  decodeDeparture(code);
  assert.equal(JSON.stringify(game), before);
  game.startWave();
  for (let i = 0; i < 60; i++) game.step(1 / 30);
  assert.equal(encodeDeparture(departureForGame(game)!), code);
});
