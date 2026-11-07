import type Phaser from 'phaser';
import type { Entity } from '../game.ts';

export function drawCreature(g: Phaser.GameObjects.Graphics, u: Entity, time: number) {
  const x = u.x,
    y = u.y + (u.state === 'move' ? Math.sin(time * 10 + u.id) * 2 : 0),
    f = u.facing,
    dragon = u.kind === 'dragon';
  const body = dragon ? 0xd48b50 : 0x79a861,
    light = dragon ? 0xf1bd70 : 0xb5d18b;
  g.fillStyle(0x123d2b, 0.3);
  g.fillEllipse(x, y + 19, 55, 16);
  if (dragon) {
    g.fillStyle(0xae6842);
    g.fillTriangle(x - 9 * f, y - 4, x - 25 * f, y - 43, x + 6 * f, y - 17);
    g.fillStyle(0xedb363);
    g.fillTriangle(x - 8 * f, y - 10, x - 21 * f, y - 34, x + 1 * f, y - 18);
  }
  g.fillStyle(body);
  g.fillTriangle(x - 12 * f, y + 8, x - 44 * f, y - 9, x - 27 * f, y + 14);
  g.fillEllipse(x, y + 3, 43, 33);
  g.fillStyle(light);
  g.fillEllipse(x + 8 * f, y + 7, 17, 23);
  g.fillStyle(body);
  g.fillRoundedRect(x + 8 * f - 12, y - 23, 26, 31, 8);
  g.fillEllipse(x + 24 * f, y - 13, 28, 19);
  g.fillStyle(light);
  g.fillTriangle(x + 12 * f, y - 28, x + 17 * f, y - 39, x + 20 * f, y - 25);
  g.fillStyle(body);
  g.fillRoundedRect(x - 15, y + 13, 13, 12, 4);
  g.fillRoundedRect(x + 6, y + 13, 13, 12, 4);
  g.fillStyle(0xeff1c6);
  g.fillCircle(x + 19 * f, y - 21, 5);
  g.fillStyle(0x244334);
  g.fillCircle(x + 21 * f, y - 21, 2);
  g.lineStyle(2, 0x405638);
  g.lineBetween(x + 26 * f, y - 8, x + 35 * f, y - 10);
  if (!dragon) {
    g.fillStyle(0xc1da99);
    for (let i = 0; i < 3; i++)
      g.fillTriangle(x - 19 + i * 9, y - 5, x - 16 + i * 9, y - 17, x - 12 + i * 9, y - 6);
  }
}
