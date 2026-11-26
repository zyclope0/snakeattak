import Phaser from 'phaser';
import type { Game } from '../game.ts';
import { isFlying } from '../flying.ts';
import * as DEPTH from './boardLayers.ts';

/**
 * The detached shadow of each flying snake, which shows how high it flies, also with reduced
 * motion. Its wings are in its drawing (26 November 2026); they were drawn here before.
 */
export class FlightSignals {
  private shadows: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.shadows = scene.add.graphics().setDepth(DEPTH.flightShadows);
  }

  draw(game: Game) {
    const shadow = this.shadows;
    shadow.clear();
    for (const enemy of game.enemies) {
      if (enemy.hp <= 0 || !isFlying(enemy)) continue;
      shadow.fillStyle(0x18352c, 0.26);
      shadow.fillEllipse(enemy.x, enemy.y + 12, 44, 14);
    }
  }
}
