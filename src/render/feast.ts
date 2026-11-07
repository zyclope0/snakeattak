import type Phaser from 'phaser';
import { LANES } from '../ai.ts';
import type { Feast } from '../tactics.ts';

/** Pure drawing helper: the food influences routes only in the simulation. */
export function drawFeast(g: Phaser.GameObjects.Graphics, feast: Feast, time: number) {
  const y = LANES[feast.lane];
  for (const x of [372, 684]) {
    g.lineStyle(2, 0xf2c963, 0.5);
    g.strokeEllipse(x, y, 50 + Math.sin(time * 4) * 6, 28);
    for (let i = 0; i < 3; i++) {
      const rise = (time * 18 + i * 10) % 32;
      g.fillStyle(0xffdf86, (1 - rise / 40) * 0.65);
      g.fillCircle(x + Math.sin(time * 2 + i) * 12, y - rise, 2);
    }
  }
  const x = 420;
  g.fillStyle(0x345037, 0.3);
  g.fillEllipse(x, y + 18, 40, 12);
  g.fillStyle(0x9c6f3a);
  g.fillRoundedRect(x - 15, y - 15, 30, 31, 7);
  g.fillStyle(0xe9b447);
  g.fillRoundedRect(x - 12, y - 12, 24, 25, 5);
  g.fillStyle(0xffdf78);
  g.fillEllipse(x, y - 14, 29, 10);
  g.lineStyle(3, 0xd9962e);
  g.lineBetween(x - 4, y - 15, x - 4, y - 5);
  g.fillStyle(0xfaf0c2);
  g.fillRoundedRect(x - 8, y - 1, 16, 10, 2);
  g.lineStyle(2, 0xbd8a39);
  g.strokeCircle(x, y + 4, 3);
}
