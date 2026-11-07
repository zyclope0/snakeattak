import { Game } from './game.ts';
import type { Kind } from './data.ts';

const STEP = 1 / 30;
const freshSeed = () => Math.floor(Math.random() * 4294967296);

/** Browser-independent owner of a game and its fixed-rate simulation clock. */
export class Session {
  game: Game;
  screen: 'home' | 'battle' = 'battle';
  selected: Kind | null = null;
  speed: 1 | 2 = 1;
  hasPlaced = false;
  private accumulator = 0;
  constructor(seed = freshSeed()) {
    this.game = new Game(seed);
  }
  restart(seed = freshSeed()) {
    this.game = new Game(seed);
    this.selected = null;
    this.hasPlaced = false;
    this.speed = 1;
    this.accumulator = 0;
  }
  useGame(game: Game) {
    this.game = game;
    this.selected = null;
    this.hasPlaced = game.wave > 0 || game.units.length > 3;
    this.speed = 1;
    this.accumulator = 0;
  }
  placeSelected(x: number, y: number): boolean {
    if (!this.selected || !this.game.recruit(this.selected, x, y)) return false;
    this.selected = null;
    this.hasPlaced = true;
    return true;
  }
  advance(deltaMs: number) {
    if (
      this.screen === 'home' ||
      this.game.paused ||
      this.game.status === 'won' ||
      this.game.status === 'lost'
    ) {
      this.accumulator = 0;
      return;
    }
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    this.accumulator += Math.min(deltaMs / 1000, 0.1) * (this.speed === 2 ? 2 : 1);
    while (this.accumulator + 1e-10 >= STEP) {
      this.game.step(STEP);
      this.accumulator = Math.max(0, this.accumulator - STEP);
    }
  }
}
