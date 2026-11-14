import type { Game } from '../src/game.ts';
import type { Kind } from '../src/data.ts';

/** A storage double: what was read or written, and a way to make it refuse everything. */
export function memory(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  let blocked = false;
  const guard = () => {
    if (blocked) throw Error('blocked');
  };
  return {
    values,
    set blocked(value: boolean) {
      blocked = value;
    },
    getItem(key: string) {
      guard();
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      guard();
      values.set(key, value);
    },
    removeItem(key: string) {
      guard();
      values.delete(key);
    },
  };
}

const STRONGEST_FIRST: Kind[] = ['dino', 'knight', 'shield', 'archer', 'club'];

/** A camp no wave can break: the tests need a stage won, not a fair fight. */
function fillCamp(game: Game) {
  game.gold = 1000000;
  for (let x = 660; x <= 948; x += 48)
    for (let y = 132; y <= 516; y += 48) STRONGEST_FIRST.some((kind) => game.recruit(kind, x, y));
}

/** Plays a game to its end on the real engine: won behind a full camp, lost without one. */
export function fight(game: Game, outcome: 'won' | 'lost'): Game {
  for (let steps = 0; steps < 30 * 60 * 30; steps++) {
    if (game.status === 'won' || game.status === 'lost') break;
    if (game.status === 'preparing') {
      if (outcome === 'won') fillCamp(game);
      else game.units.length = 0;
      game.startWave();
    }
    game.step(1 / 30);
  }
  if (game.status !== outcome) throw Error(`expected a game ${outcome}, got ${game.status}`);
  return game;
}
