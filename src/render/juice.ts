import type Phaser from 'phaser';
import type { Presentation, Spark } from './presentation.ts';
import { BOARD_WIDTH, BOARD_HEIGHT, shakeBoard } from './boardResolution.ts';
import { nextSeed, seedShare } from '../seededRandom.ts';

const CAPACITY = 40;
const PUFF = 1,
  SHARD = 2,
  COIN = 3,
  DUST = 4;
/** A little cloud drifts, slows down by `drag`, fades from `alpha` and grows from `size`. */
type Cloud = { color: number; alpha: number; drag: number; size: number; growth: number };
const PUFF_CLOUD: Cloud = { color: 0xf6ecd0, alpha: 0.8, drag: 0.7, size: 0.7, growth: 0.9 },
  DUST_CLOUD: Cloud = { color: 0xe2d3ad, alpha: 0.5, drag: 0, size: 0.8, growth: 1.3 };
const CONFETTI = [0xeacd79, 0xb9d795, 0xf0b08c, 0xa8d6de, 0xf6ecd0];
/** Burst length; the calm falling confetti takes over afterwards. */
const CONFETTI_BURST = 2.4;

/** Where a coin flies to, in board coordinates: the HUD counter, kept inside the board. */
export function coinTarget(
  canvas: { left: number; top: number; width: number; height: number },
  counter: { left: number; top: number; width: number; height: number } | undefined,
) {
  if (!counter || !(canvas.width > 0) || !(canvas.height > 0)) return { x: 60, y: 12 };
  const x = ((counter.left + counter.width / 2 - canvas.left) / canvas.width) * BOARD_WIDTH,
    y = ((counter.top + counter.height / 2 - canvas.top) / canvas.height) * BOARD_HEIGHT;
  return { x: Math.max(16, Math.min(1084, x)), y: Math.max(12, Math.min(608, y)) };
}

/**
 * Cosmetic particles only: placement puffs, egg shards, flying coins and the dust of heavy steps.
 * One Graphics, forty preallocated slots reused in a ring, a private random
 * stream (never the game's), the visual clock (frozen in pause). Nothing is
 * spawned when motion is reduced.
 */
export class BattleJuice {
  private graphics: Phaser.GameObjects.Graphics;
  private kind = new Uint8Array(CAPACITY);
  private x = new Float32Array(CAPACITY);
  private y = new Float32Array(CAPACITY);
  private vx = new Float32Array(CAPACITY);
  private vy = new Float32Array(CAPACITY);
  private age = new Float32Array(CAPACITY);
  private life = new Float32Array(CAPACITY);
  private size = new Float32Array(CAPACITY);
  private next = 0;
  private live = 0;
  private drawn = false;
  private clock = 0;
  private seed = 0x6a756963;
  private target = { x: 60, y: 12 };
  private targetAt = -Infinity;
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(21);
  }
  private random() {
    this.seed = nextSeed(this.seed);
    return seedShare(this.seed);
  }
  private spawn(
    kind: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
  ) {
    const i = this.next;
    this.next = (i + 1) % CAPACITY;
    if (!this.kind[i]) this.live++;
    this.kind[i] = kind;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.age[i] = 0;
    this.life[i] = life;
    this.size[i] = size;
  }
  /** Frees every slot at once. */
  private empty() {
    this.kind.fill(0);
    this.live = 0;
  }
  private puff(x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = ((i + this.random() * 0.6) / count) * Math.PI * 2;
      this.spawn(
        PUFF,
        x + Math.cos(angle) * 8,
        y + Math.sin(angle) * 3,
        Math.cos(angle) * (55 + this.random() * 35),
        Math.sin(angle) * 22 - 18,
        0.42 + this.random() * 0.14,
        6 + this.random() * 3,
      );
    }
  }
  /** Dust under a heavy step. */
  private dust(x: number, y: number) {
    // Never at the expense of a coin in flight: dust only uses free room.
    for (let i = 0; i < 2 && this.live < CAPACITY / 2; i++)
      this.spawn(
        DUST,
        x + (this.random() - 0.5) * 10,
        y + 15,
        (this.random() - 0.5) * 24,
        -9 - this.random() * 9,
        0.34 + this.random() * 0.1,
        2.6 + this.random() * 1.6,
      );
  }
  /** An egg hatches: a small puff and six shards thrown upwards. */
  private hatch(x: number, y: number) {
    this.puff(x, y + 10, 3);
    for (let i = 0; i < 6; i++)
      this.spawn(
        SHARD,
        x,
        y - 6,
        (i - 2.5) * 34 + (this.random() - 0.5) * 20,
        -150 - this.random() * 70,
        0.55,
        5 + this.random() * 2,
      );
  }
  private coinGoal() {
    // Layout is read at most once a second, and only when a coin appears.
    if (this.clock - this.targetAt < 1) return this.target;
    this.targetAt = this.clock;
    const counter = typeof document === 'undefined' ? null : document.getElementById('gold');
    this.target = coinTarget(
      this.scene.game.canvas.getBoundingClientRect(),
      counter?.getClientRects().length ? counter.getBoundingClientRect() : undefined,
    );
    return this.target;
  }
  /** Turns one cue of the presentation into particles, or into a shake for the king. */
  private ignite(s: Spark) {
    if (s.kind === 'ally') this.puff(s.x, s.y + 14, 7);
    else if (s.kind === 'dust') this.dust(s.x, s.y);
    else if (s.kind === 'egg') this.hatch(s.x, s.y);
    else if (s.kind === 'coin') {
      const goal = this.coinGoal();
      // vx, vy hold the destination: a coin follows a fixed arc, not a velocity.
      this.spawn(COIN, s.x, s.y - 14, goal.x, goal.y, 0.8, 9);
    } else if (s.kind === 'boss') shakeBoard(this.scene, 320, 0.0045);
  }
  draw(p: Presentation, reduced: boolean) {
    // A new game restarts the visual clock: drop what belonged to the previous one.
    if (p.clock < this.clock) {
      this.empty();
      this.targetAt = -Infinity;
    }
    const dt = Math.max(0, Math.min(0.1, p.clock - this.clock));
    this.clock = p.clock;
    if (reduced) {
      if (this.live || this.drawn) {
        this.empty();
        this.drawn = false;
        this.graphics.clear();
      }
      return;
    }
    for (const s of p.sparks) this.ignite(s);
    if (!this.live && !this.drawn) return;
    this.graphics.clear();
    this.drawn = this.live > 0;
    for (let i = 0; i < CAPACITY; i++) if (this.kind[i]) this.drawParticle(i, dt);
  }
  /** Ages the particle in slot `i`, then draws it, or frees the slot at the end of its life. */
  private drawParticle(i: number, dt: number) {
    const kind = this.kind[i],
      age = (this.age[i] += dt),
      t = age / this.life[i];
    if (t >= 1) {
      this.kind[i] = 0;
      this.live--;
    } else if (kind === PUFF) this.drawCloud(i, t, dt, PUFF_CLOUD);
    else if (kind === DUST) this.drawCloud(i, t, dt, DUST_CLOUD);
    else if (kind === SHARD) this.drawShard(i, t, dt, age);
    else this.drawCoin(i, t);
  }
  private drawCloud(i: number, t: number, dt: number, cloud: Cloud) {
    const g = this.graphics,
      slow = 1 - t * cloud.drag;
    this.x[i] += this.vx[i] * dt * slow;
    this.y[i] += this.vy[i] * dt * slow;
    g.fillStyle(cloud.color, (1 - t) * cloud.alpha);
    g.fillCircle(this.x[i], this.y[i], this.size[i] * (cloud.size + t * cloud.growth));
  }
  /** A shard of shell falls back under its own weight, spinning. */
  private drawShard(i: number, t: number, dt: number, age: number) {
    const g = this.graphics;
    this.vy[i] += 620 * dt;
    this.x[i] += this.vx[i] * dt;
    this.y[i] += this.vy[i] * dt;
    const s = this.size[i],
      spin = age * 9 + i,
      cx = Math.cos(spin) * s,
      cy = Math.sin(spin) * s,
      x = this.x[i],
      y = this.y[i];
    g.fillStyle(i % 2 ? 0xf3e7c8 : 0xe2c58a, Math.min(1, (1 - t) * 3));
    g.fillTriangle(x + cx, y + cy, x - cy, y + cx, x - cx * 0.6, y - cy * 0.6);
  }
  /** A little hop where the snake fell, then a glide to the counter. */
  private drawCoin(i: number, t: number) {
    const g = this.graphics,
      glide = t * t * (3 - 2 * t),
      hop = Math.sin(Math.min(1, t * 2.4) * Math.PI) * 30,
      x = this.x[i] + (this.vx[i] - this.x[i]) * glide,
      y = this.y[i] + (this.vy[i] - this.y[i]) * glide - hop,
      r = this.size[i] * (1 - glide * 0.3),
      alpha = Math.min(1, (1 - t) * 6);
    g.fillStyle(0xa9772a, alpha);
    g.fillCircle(x, y, r);
    g.fillStyle(0xffd66a, alpha);
    g.fillCircle(x, y, r - 2);
    g.fillStyle(0xfff3c4, alpha);
    g.fillCircle(x - r * 0.28, y - r * 0.3, r * 0.3);
  }
}

/**
 * The paper of a victory won `victoryAge` visual seconds ago: a burst from both lower corners,
 * then a calm fall. With reduced motion the paper appears at once and stays still.
 */
export function drawCelebration(
  g: Phaser.GameObjects.Graphics,
  victoryAge: number,
  clock: number,
  reduced: boolean,
) {
  const burst = reduced ? Infinity : victoryAge;
  if (burst < CONFETTI_BURST) drawConfettiBurst(g, burst);
  else drawFallingConfetti(g, Math.min(1, burst - CONFETTI_BURST), clock, reduced);
}

/** Thirty-two papers falling at one speed; `rise` fades them in after the burst. */
function drawFallingConfetti(
  g: Phaser.GameObjects.Graphics,
  rise: number,
  clock: number,
  reduced: boolean,
) {
  for (let i = 0; i < 32; i++) {
    const x = (i * 173 + 42) % BOARD_WIDTH,
      y = reduced ? 80 + ((i * 37) % 450) : (i * 71 + clock * 42) % 580;
    g.fillStyle(i % 2 ? 0xeacd79 : 0xb9d795, 0.7 * rise);
    g.fillRect(x, y, 5, 9);
  }
}

/** Closed-form paper burst from both lower corners: no state, no allocation. */
function drawConfettiBurst(g: Phaser.GameObjects.Graphics, age: number) {
  const fade = Math.min(1, (CONFETTI_BURST - age) / 0.5);
  if (fade <= 0) return;
  for (let i = 0; i < 36; i++) {
    const left = i % 2 === 0,
      a = (i * 0.618034) % 1,
      b = (i * 0.754878 + 0.3) % 1;
    const vx = (left ? 1 : -1) * (90 + a * 380),
      vy = 620 + b * 380,
      t = Math.max(0, age - (i % 3) * 0.05);
    const x = (left ? 140 : 960) + vx * t * (1 - t * 0.14),
      y = 628 - vy * t + 470 * t * t;
    if (y > 624) continue;
    const flip = Math.cos(t * 7 + i);
    g.fillStyle(CONFETTI[i % CONFETTI.length], 0.92 * fade);
    g.fillRect(x - (1.5 + Math.abs(flip) * 4), y - 6, 3 + Math.abs(flip) * 8, 12);
  }
}
