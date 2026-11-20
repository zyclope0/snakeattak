import { Game } from './game.ts';
import type { Kind } from './data.ts';
import type { FeastFlavor } from './tactics.ts';
import { CURRENT_BALANCE_REVISION, type BalanceRevision } from './balanceRevision.ts';
import { START_TEAM_SIZE } from './gameConstants.ts';
import { CURRENT_ENDLESS_VERSION, ENDLESS_RULES } from './endless.ts';

const STEP = 1 / 30;
const freshSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];

/** Browser-independent owner of a game and its fixed-rate simulation clock. */
export class Session {
  game: Game;
  screen: 'home' | 'battle' = 'battle';
  selected: Kind | null = null;
  selectedFeast: FeastFlavor | null = null;
  actionHint: string | null = null;
  speed: 1 | 2 = 1;
  hasPlaced = false;
  purchaseCount = 0;
  private accumulator = 0;
  constructor(seed = freshSeed()) {
    this.game = new Game(seed, undefined, undefined, CURRENT_BALANCE_REVISION);
  }
  restart(seed = freshSeed(), balanceRevision: BalanceRevision = CURRENT_BALANCE_REVISION) {
    this.useGame(new Game(seed, undefined, undefined, balanceRevision));
  }
  /** A new endless adventure, by the latest rules of the endless adventure. */
  restartEndless(seed = freshSeed()) {
    const rules = ENDLESS_RULES[CURRENT_ENDLESS_VERSION];
    this.useGame(new Game(seed, undefined, undefined, rules.balance, undefined, rules));
  }
  /** Starts again a game of the same kind as the current one: endless stays endless. */
  restartSame() {
    if (this.game.endless) this.restartEndless();
    else this.restart();
  }
  #reset() {
    this.selectUnit(null);
    this.hasPlaced = false;
    this.speed = 1;
    this.accumulator = 0;
  }
  useGame(game: Game) {
    this.game = game;
    this.#reset();
    this.hasPlaced = game.wave > 0 || game.kings > 0 || game.units.length > START_TEAM_SIZE;
  }
  placeSelected(x: number, y: number): boolean {
    if (!this.selected || !this.game.recruit(this.selected, x, y)) return false;
    this.selectUnit(null);
    this.hasPlaced = true;
    this.purchaseCount++;
    return true;
  }
  /** Successful UI purchases are observed even if income offsets their gold cost. */
  repair(): boolean {
    if (!this.game.repair()) return false;
    this.purchaseCount++;
    return true;
  }
  trainHero(path: 'force' | 'guard'): boolean {
    if (!this.game.trainHero(path)) return false;
    this.purchaseCount++;
    return true;
  }
  selectUnit(kind: Kind | null) {
    this.selected = kind;
    this.selectedFeast = null;
    this.actionHint = null;
  }
  selectFeast(flavor: FeastFlavor | null) {
    this.selected = null;
    this.selectedFeast = flavor;
    this.actionHint = null;
  }
  placeFeast(lane: number): boolean {
    if (!this.selectedFeast || !this.game.offerFeast(lane, this.selectedFeast)) return false;
    this.selectFeast(null);
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
    const fighting = this.game.status === 'fighting';
    this.accumulator += Math.min(deltaMs / 1000, 0.1) * (this.speed === 2 ? 2 : 1);
    while (this.accumulator + 1e-10 >= STEP) {
      this.game.step(STEP);
      this.accumulator = Math.max(0, this.accumulator - STEP);
    }
    if (fighting && this.game.status !== 'fighting') {
      this.selectedFeast = null;
      this.actionHint = null;
    }
  }
}
