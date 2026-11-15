import Phaser from 'phaser';
import type { Game } from '../game.ts';
import { flightLift, isFlying } from '../flying.ts';
import * as DEPTH from './boardLayers.ts';

/** Two shared layers; wings and a detached shadow remain visible with reduced motion. */
export class FlightSignals {
  private shadows: Phaser.GameObjects.Graphics;
  private wings: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.shadows = scene.add.graphics().setDepth(DEPTH.flightShadows);
    this.wings = scene.add.graphics().setDepth(DEPTH.wings);
  }

  draw(game: Game, reduced: boolean) {
    const shadow = this.shadows,
      wing = this.wings;
    shadow.clear();
    wing.clear();
    for (const enemy of game.enemies) {
      if (enemy.hp <= 0 || !isFlying(enemy)) continue;
      const x = enemy.x,
        y = enemy.y - flightLift - 10,
        flap = reduced ? 0 : Math.sin(game.time * 9 + enemy.id) * 5;
      shadow.fillStyle(0x18352c, 0.26);
      shadow.fillEllipse(x, enemy.y + 12, 44, 14);
      for (const side of [-1, 1]) {
        const tipX = x + side * 64,
          tipY = y - 36 - flap;
        wing.fillStyle(0xf2edd1, 0.98);
        wing.lineStyle(2, 0x486b50, 0.95);
        wing.beginPath();
        wing.moveTo(x + side * 6, y + 5);
        wing.lineTo(x + side * 32, y - 22);
        wing.lineTo(tipX, tipY);
        wing.lineTo(x + side * 54, y - 8);
        wing.lineTo(x + side * 36, y + 16);
        wing.closePath();
        wing.fillPath();
        wing.strokePath();
        wing.lineStyle(1, 0x8ca177, 0.9);
        wing.lineBetween(x + side * 10, y + 3, tipX, tipY);
        wing.lineBetween(x + side * 10, y + 3, x + side * 54, y - 8);
      }
    }
  }
}
