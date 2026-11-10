import type { Session } from '../session.ts';

/** UI-owned pause leases. Nothing here advances or serializes the simulation. */
function createPauseState(session: Session) {
  let game = session.game;
  let retained = game.paused;
  const owners = new Set<symbol>();
  const current = () => {
    if (game === session.game) return;
    game = session.game;
    retained = game.paused;
    owners.clear();
  };
  return {
    hold() {
      current();
      if (!owners.size) retained = game.paused;
      const observed = game;
      const owner = Symbol();
      owners.add(owner);
      game.paused = true;
      return () => {
        current();
        if (game !== observed || !owners.delete(owner)) return;
        game.paused = retained || owners.size > 0;
      };
    },
    /** Read-only readiness for an action that will release its own lease first. */
    pausedAfterRelease() {
      current();
      return retained || owners.size > 1;
    },
    interrupt() {
      current();
      retained = true;
      game.paused = true;
    },
    resume() {
      current();
      retained = false;
      game.paused = owners.size > 0;
    },
    sync() {
      current();
      if (owners.size) game.paused = true;
    },
  };
}

const states = new WeakMap<Session, ReturnType<typeof createPauseState>>();
export function pauseStateFor(session: Session) {
  let state = states.get(session);
  if (!state) {
    state = createPauseState(session);
    states.set(session, state);
  }
  return state;
}
