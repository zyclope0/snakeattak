import type Phaser from 'phaser';
import type { Effect } from '../game.ts';
import { BLINK_SECONDS, LEAP_SECONDS } from '../engine/state.ts';
import { shakeBoard } from './boardResolution.ts';
import * as BOARD_COLOR from './palette.ts';

type Graphics = Phaser.GameObjects.Graphics;
/** Seconds the rules give an effect to live, and a honey detour (see `engine/state.ts`). */
const EFFECT_SECONDS = 0.3,
  HONEY_SECONDS = 0.9;

/** A golden thread from the snake to the pot, with four drops sliding along it. */
function drawHoneyThread(g: Graphics, e: Effect, clock: number, reduced: boolean) {
  const fade = Math.max(0, e.life / HONEY_SECONDS);
  g.lineStyle(3, 0xf2ce78, fade * 0.65);
  g.lineBetween(e.x, e.y, e.tx, e.ty);
  for (let i = 0; i < 4; i++) {
    const progress = (i / 4 + (reduced ? 0 : clock * 0.7)) % 1;
    g.fillStyle(0xffde89, fade * 0.8);
    g.fillCircle(e.x + (e.tx - e.x) * progress, e.y + (e.ty - e.y) * progress, 3);
  }
}
function drawBlock(g: Graphics, e: Effect, alpha: number) {
  g.lineStyle(3, 0xc5e5c3, alpha);
  g.strokeCircle(e.tx, e.ty - 25, 12 + (1 - alpha) * 11);
}
function drawShell(g: Graphics, e: Effect, alpha: number) {
  g.lineStyle(5, 0xf0c47b, alpha);
  g.lineBetween(e.x, e.y - 14, e.tx, e.ty - 7);
  g.lineStyle(4, 0xffe2a3, alpha);
  g.strokeCircle(e.tx, e.ty - 7, 12 + (1 - alpha) * 30);
}
function drawFire(g: Graphics, e: Effect, alpha: number) {
  g.lineStyle(10, 0xe88a42, alpha * 0.7);
  g.lineBetween(e.x, e.y - 12, e.tx, e.ty - 7);
  g.lineStyle(4, 0xffe497, alpha);
  g.lineBetween(e.x, e.y - 12, e.tx, e.ty - 7);
  g.strokeCircle(e.tx, e.ty - 7, 25 * (1 - alpha) + 10);
}
function drawPoison(g: Graphics, e: Effect, alpha: number) {
  g.lineStyle(3, 0xc0dc78, alpha);
  g.lineBetween(e.x, e.y - 12, e.tx, e.ty - 12);
  g.fillStyle(0xc0dc78, alpha);
  g.fillCircle(e.tx, e.ty - 12, 5);
}
function drawArrow(g: Graphics, e: Effect, alpha: number) {
  g.lineStyle(2, 0xf7df9c, alpha);
  g.lineBetween(e.x, e.y - 15, e.tx, e.ty - 7);
}
/** A small green cross above the ally being healed. */
function drawHeal(g: Graphics, e: Effect, alpha: number) {
  g.lineStyle(3, 0xceffa9, alpha);
  g.lineBetween(e.tx - 7, e.ty - 40, e.tx + 7, e.ty - 40);
  g.lineBetween(e.tx, e.ty - 47, e.tx, e.ty - 33);
}
/** A coin that rises on the spot, for players who asked for less motion. */
function drawStillCoin(g: Graphics, e: Effect, alpha: number) {
  g.fillStyle(BOARD_COLOR.coin, alpha);
  g.fillCircle(e.x, e.y - 20 - (1 - alpha) * 25, 5);
}
function drawImpact(g: Graphics, e: Effect, alpha: number) {
  g.lineStyle(3, 0xffe2a1, alpha);
  g.strokeCircle(e.tx, e.ty - 4, 9 + (1 - alpha) * 13);
}

/**
 * The ninja snake vanishes and comes back: a ring closes where it was, one opens where it
 * is. Dark under light, large and slow enough to be seen on the pale road of a phone.
 */
function drawBlink(g: Graphics, e: Effect) {
  const left = Math.max(0, Math.min(1, e.life / BLINK_SECONDS));
  const alpha = Math.min(1, left * 1.6);
  for (const [width, color] of [
    [8, 0x2b2140],
    [4, 0xf1ecff],
  ] as const) {
    g.lineStyle(width, color, alpha);
    g.strokeCircle(e.x, e.y - 6, 6 + left * 22);
    g.strokeCircle(e.tx, e.ty - 6, 6 + (1 - left) * 22);
  }
}

/**
 * The grasshopper snake leaps over the line: a dotted arc from where it took off to where it
 * lands, fading as it goes. Dark under light, like the rings of the ninja.
 */
function drawLeap(g: Graphics, e: Effect) {
  const left = Math.max(0, Math.min(1, e.life / LEAP_SECONDS));
  const alpha = Math.min(1, left * 1.6);
  const height = Math.min(90, 30 + Math.abs(e.tx - e.x) * 0.35);
  for (const [size, color] of [
    [6, 0x24361a],
    [3.5, 0xeaf7d6],
  ] as const) {
    g.fillStyle(color, alpha);
    for (let step = 0; step <= 12; step++) {
      const t = step / 12;
      const x = e.x + (e.tx - e.x) * t;
      const y = e.y + (e.ty - e.y) * t - 4 * height * t * (1 - t) - 6;
      g.fillCircle(x, y, size);
    }
  }
}

/**
 * The effects of the rules, drawn for their short life: trails, impacts, crosses. Display
 * only: an effect is read, never changed.
 */
export class EffectTrails {
  /** Shells that already shook the board: one small shake each. */
  private shaken = new WeakSet<Effect>();
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  draw(g: Graphics, effects: readonly Effect[], clock: number, reduced: boolean) {
    for (const e of effects) this.drawEffect(g, e, clock, reduced);
  }
  private drawEffect(g: Graphics, e: Effect, clock: number, reduced: boolean) {
    const alpha = e.life / EFFECT_SECONDS;
    switch (e.kind) {
      case 'honey':
        drawHoneyThread(g, e, clock, reduced);
        break;
      case 'block':
        drawBlock(g, e, alpha);
        break;
      case 'shell':
        drawShell(g, e, alpha);
        this.shakeOnce(e, reduced);
        break;
      case 'fire':
        drawFire(g, e, alpha);
        break;
      case 'poison':
        drawPoison(g, e, alpha);
        break;
      case 'arrow':
        drawArrow(g, e, alpha);
        break;
      case 'heal':
        drawHeal(g, e, alpha);
        break;
      case 'blink':
        drawBlink(g, e);
        break;
      case 'leap':
        drawLeap(g, e);
        break;
      case 'gold':
        // With motion, BattleJuice flies a coin to the counter instead.
        if (reduced) drawStillCoin(g, e, alpha);
        break;
      default:
        drawImpact(g, e, alpha);
    }
  }
  private shakeOnce(shell: Effect, reduced: boolean) {
    if (this.shaken.has(shell)) return;
    this.shaken.add(shell);
    if (!reduced) shakeBoard(this.scene, 80, 0.001);
  }
}
