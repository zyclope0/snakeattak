import test from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { TOTAL_WAVES } from '../src/gameConstants.ts';
import { ENDLESS_RULES } from '../src/endless.ts';

// « Something to lose » for the window « Ta partie n'est pas gardée » (src/ui/failure/unkept.ts):
// a wave, or a king, won since the game in hand was put in play. A camp found at the door is
// not yet something this child would lose (counter-attacks of 23 November 2026).

const at = (wave: number, status: Game['status'], kings?: number) => {
  const rules = ENDLESS_RULES[1];
  const game =
    kings === undefined
      ? new Game(7)
      : new Game(7, undefined, undefined, rules.balance, undefined, rules);
  game.wave = wave;
  game.status = status;
  if (kings !== undefined) game.kings = kings;
  return game;
};

test('only a wave over and not lost counts, from where the game was put in play', () => {
  const session = new Session(7);
  assert.equal(session.wonSinceStart, false, 'a fresh game');
  const camp = at(3, 'preparing');
  session.useGame(camp);
  assert.equal(session.wonSinceStart, false, 'a camp found at the door');
  camp.wave = 4;
  camp.status = 'fighting';
  assert.equal(session.wonSinceStart, false, 'a wave under way is not won');
  camp.status = 'lost';
  assert.equal(session.wonSinceStart, false, 'nor a wave lost');
  camp.status = 'preparing';
  assert.equal(session.wonSinceStart, true, 'a wave won');
});

test('a game set aside and brought back keeps its first count', () => {
  const session = new Session(7);
  const classic = at(5, 'preparing');
  session.useGame(classic);
  classic.wave = 6;
  classic.status = 'fighting';
  // A mission in between, then the classic adventure brought back in the middle of its wave.
  session.useGame(at(0, 'preparing'));
  session.useGame(classic);
  assert.equal(session.wonSinceStart, false, 'the wave it was fighting is not won by coming back');
  classic.status = 'preparing';
  assert.equal(session.wonSinceStart, true, 'once it is won');
  // Won before a mission, and brought back after it: still won in this session.
  session.useGame(at(0, 'preparing'));
  session.useGame(classic);
  assert.equal(session.wonSinceStart, true, 'a wave won before the mission still counts');
});

test('a king of the endless adventure counts for all of his waves', () => {
  const session = new Session(7);
  const endless = at(TOTAL_WAVES, 'fighting', 0);
  session.useGame(endless);
  // The king falls: the camp after him is at wave 0, one king more.
  endless.wave = 0;
  endless.kings = 1;
  endless.status = 'preparing';
  assert.equal(session.wonSinceStart, true, 'the king won');
  const found = at(0, 'preparing', 1);
  session.useGame(found);
  assert.equal(session.wonSinceStart, false, 'a camp after a king, found at the door');
});
