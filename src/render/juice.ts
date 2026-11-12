import type Phaser from 'phaser';
import type { Presentation } from './presentation.ts';

const CAPACITY = 40;
const PUFF = 1,
  SHARD = 2,
  COIN = 3;
const CONFETTI = [0xeacd79, 0xb9d795, 0xf0b08c, 0xa8d6de, 0xf6ecd0];
/** Burst length; the calm falling confetti of BattleScene takes over afterwards. */
export const CONFETTI_BURST = 2.4;

/** Where a coin flies to, in board coordinates: the HUD counter, kept inside the board. */
export function coinTarget(
  canvas: { left: number; top: number; width: number; height: number },
  counter: { left: number; top: number; width: number; height: number } | undefined,
) {
  if (!counter || !(canvas.width > 0) || !(canvas.height > 0)) return { x: 60, y: 12 };
  const x = ((counter.left + counter.width / 2 - canvas.left) / canvas.width) * 1100,
    y = ((counter.top + counter.height / 2 - canvas.top) / canvas.height) * 620;
  return { x: Math.max(16, Math.min(1084, x)), y: Math.max(12, Math.min(608, y)) };
}

/**
 * Cosmetic particles only: placement puffs, egg shards and flying coins.
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
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
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
  draw(p: Presentation, reduced: boolean) {
    const g = this.graphics;
    // A new game restarts the visual clock: drop what belonged to the previous one.
    if (p.clock < this.clock) {
      this.kind.fill(0);
      this.live = 0;
      this.targetAt = -Infinity;
    }
    const dt = Math.max(0, Math.min(0.1, p.clock - this.clock));
    this.clock = p.clock;
    if (reduced) {
      if (this.live || this.drawn) {
        this.kind.fill(0);
        this.live = 0;
        this.drawn = false;
        g.clear();
      }
      return;
    }
    for (const s of p.sparks) {
      if (s.kind === 'ally') this.puff(s.x, s.y + 14, 7);
      else if (s.kind === 'egg') {
        this.puff(s.x, s.y + 10, 3);
        for (let i = 0; i < 6; i++)
          this.spawn(
            SHARD,
            s.x,
            s.y - 6,
            (i - 2.5) * 34 + (this.random() - 0.5) * 20,
            -150 - this.random() * 70,
            0.55,
            5 + this.random() * 2,
          );
      } else if (s.kind === 'coin') {
        const goal = this.coinGoal();
        // vx, vy hold the destination: a coin follows a fixed arc, not a velocity.
        this.spawn(COIN, s.x, s.y - 14, goal.x, goal.y, 0.8, 9);
      } else if (s.kind === 'boss') this.scene.cameras.main.shake(320, 0.0045);
    }
    if (!this.live && !this.drawn) return;
    g.clear();
    this.drawn = this.live > 0;
    for (let i = 0; i < CAPACITY; i++) {
      const kind = this.kind[i];
      if (!kind) continue;
      const age = (this.age[i] += dt),
        t = age / this.life[i];
      if (t >= 1) {
        this.kind[i] = 0;
        this.live--;
        continue;
      }
      if (kind === PUFF) {
        const slow = 1 - t * 0.7;
        this.x[i] += this.vx[i] * dt * slow;
        this.y[i] += this.vy[i] * dt * slow;
        g.fillStyle(0xf6ecd0, (1 - t) * 0.8);
        g.fillCircle(this.x[i], this.y[i], this.size[i] * (0.7 + t * 0.9));
      } else if (kind === SHARD) {
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
      } else {
        // A little hop where the snake fell, then a glide to the counter.
        const glide = t * t * (3 - 2 * t),
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
  }
}

/** Closed-form paper burst from both lower corners: no state, no allocation. */
export function drawConfettiBurst(g: Phaser.GameObjects.Graphics, age: number) {
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
