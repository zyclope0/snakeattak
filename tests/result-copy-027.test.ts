import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { Session } from '../src/session.ts';
import { createMissionRun } from '../src/missions.ts';
import { coachFor } from '../src/ui/coaching.ts';

for (const [id, waves] of [
  ['refuge', 3],
  ['carrefour', 4],
] as const)
  test(`victoire ${id} : ${waves} vagues, sans promettre la mort du roi`, () => {
    const session = new Session(2026);
    session.useGame(new Game(2026, undefined, createMissionRun(id, 2026)));
    session.game.status = 'won';
    const before = JSON.stringify(session.game);
    const copy = coachFor(session);
    assert.match(copy.subtitle, new RegExp(`${waves} vagues`));
    assert.doesNotMatch(copy.title + copy.subtitle, /douze|roi/i);
    assert.equal(JSON.stringify(session.game), before);
  });

test('victoire classique : les 12 vagues et le roi sont bien annoncés', () => {
  const session = new Session(2026);
  session.game.status = 'won';
  const copy = coachFor(session);
  assert.match(copy.subtitle, /12 vagues/);
  assert.match(copy.subtitle, /roi/);
});
