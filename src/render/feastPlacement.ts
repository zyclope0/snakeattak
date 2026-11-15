import type Phaser from 'phaser';
import { LANE_IDS } from '../ai.ts';
import type { Game } from '../game.ts';
import type { Level } from '../levels.ts';
import { lanePoint } from '../routes.ts';

const paths = new WeakMap<Level, { x: number; y: number }[][]>();
/** Visual targets follow the real curved lanes; no rule or random draw occurs here. */
export function drawFeastPlacement(ink: Phaser.GameObjects.Graphics, game: Game) {
  if (game.paused || game.status !== 'fighting' || game.feastUsed) return;
  let roads = paths.get(game.level);
  if (!roads) {
    roads = LANE_IDS.map((lane) =>
      Array.from({ length: 37 }, (_, i) => lanePoint(108 + i * 24, lane, game.level)),
    );
    paths.set(game.level, roads);
  }
  for (const [lane, road] of roads.entries()) {
    if (!game.enemyLanes.includes(lane)) continue;
    ink.lineStyle(30, 0xf1ce7a, 0.32);
    ink.beginPath();
    ink.moveTo(road[0].x, road[0].y);
    for (const p of road.slice(1)) ink.lineTo(p.x, p.y);
    ink.strokePath();
  }
}
