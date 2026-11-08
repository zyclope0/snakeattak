import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { pauseStateFor } from '../src/ui/pauseState.ts';

test('une interruption survit à la fermeture de la pause temporaire', () => {
  const s = new Session(33),
    pauses = pauseStateFor(s);
  s.game.startWave();
  const release = pauses.hold();
  pauses.interrupt();
  release();
  assert.equal(s.game.paused, true);
  const before = s.game.time;
  s.advance(60000);
  assert.equal(s.game.time, before);
  pauses.resume();
  s.advance(40);
  assert.ok(s.game.time > before);
});

for (const reverse of [false, true]) {
  test(`deux pauses temporaires se libèrent dans les deux ordres (${reverse})`, () => {
    const s = new Session(33),
      pauses = pauseStateFor(s);
    const first = pauses.hold(),
      second = pauses.hold();
    (reverse ? first : second)();
    assert.equal(s.game.paused, true);
    (reverse ? second : first)();
    assert.equal(s.game.paused, false);
  });
}

test('la pause volontaire antérieure appartient toujours au joueur', () => {
  const s = new Session(33),
    pauses = pauseStateFor(s);
  s.game.paused = true;
  const release = pauses.hold();
  release();
  assert.equal(s.game.paused, true);
  pauses.resume();
  assert.equal(s.game.paused, false);
});

test('reprendre ne contourne pas une fenêtre ou une consigne de rotation', () => {
  const s = new Session(33),
    pauses = pauseStateFor(s);
  pauses.interrupt();
  const release = pauses.hold();
  pauses.resume();
  assert.equal(s.game.paused, true);
  release();
  assert.equal(s.game.paused, false);
});

test('les répétitions ne consomment pas de RNG et libérer deux fois est neutre', () => {
  const s = new Session(33),
    pauses = pauseStateFor(s);
  const before = JSON.stringify(s.game);
  const release = pauses.hold();
  pauses.sync();
  release();
  release();
  assert.equal(JSON.stringify(s.game), before);
  const a = s.game,
    b = new Game(33);
  a.startWave();
  b.startWave();
  for (let i = 0; i < 150; i++) {
    a.step(1 / 30);
    b.step(1 / 30);
  }
  assert.deepEqual(a, b);
});

test('fermer une ancienne fenêtre ne reprend pas une nouvelle mission', () => {
  const s = new Session(33),
    pauses = pauseStateFor(s);
  const oldRelease = pauses.hold();
  s.useGame(new Game(34));
  const newRelease = pauses.hold();
  pauses.interrupt();
  oldRelease();
  assert.equal(s.game.paused, true);
  newRelease();
  assert.equal(s.game.paused, true);
  pauses.resume();
  assert.equal(s.game.paused, false);
});

test('un nouveau Game ne reçoit pas une ancienne pause temporaire', () => {
  const s = new Session(33),
    pauses = pauseStateFor(s);
  const release = pauses.hold();
  s.useGame(new Game(34));
  pauses.sync();
  release();
  assert.equal(s.game.paused, false);
  assert.equal(pauseStateFor(s), pauses);
});

test('une reprise après interruption ne garde aucun reste de pas fixe', () => {
  const s = new Session(33),
    pauses = pauseStateFor(s);
  s.game.startWave();
  s.advance(20);
  pauses.interrupt();
  s.advance(60000);
  pauses.resume();
  s.advance(20);
  assert.equal(s.game.time, 0);
});
