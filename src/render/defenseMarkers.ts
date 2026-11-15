import type Phaser from 'phaser';
import type { Game } from '../game.ts';
import * as BOARD_COLOR from './palette.ts';
/** A placement is a home, not a manual movement command. */
export function drawDefenseMarkers(ink: Phaser.GameObjects.Graphics, game: Game) {
  if (game.status !== 'preparing') return;
  for (const u of game.units) {
    ink.lineStyle(1, BOARD_COLOR.placement, 0.3);
    if (Math.hypot(u.x - u.homeX, u.y - u.homeY) > 24) ink.lineBetween(u.x, u.y, u.homeX, u.homeY);
    ink.strokeEllipse(u.homeX, u.homeY + 13, 23, 9);
  }
}
