import type Phaser from 'phaser';
import type { Entity } from '../game.ts';

export function drawSpecialUnit(g: Phaser.GameObjects.Graphics, u: Entity, time: number) {
  const x = u.x,
    y = u.y + (u.state === 'move' ? Math.sin(time * 10) * 2 : 0),
    f = u.facing;
  g.fillStyle(0x123d2b, 0.3);
  g.fillEllipse(x, y + 19, 70, 17);
  if (u.kind === 'tank') {
    g.fillStyle(0x30443d);
    g.fillRoundedRect(x - 32, y + 3, 64, 22, 8);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0x86928a);
      g.fillCircle(x - 24 + i * 12, y + 15, 7);
      g.fillStyle(0x43564b);
      g.fillCircle(x - 24 + i * 12, y + 15, 3);
    }
    g.fillStyle(0x859e88);
    g.fillRoundedRect(x - 28, y - 13, 56, 28, 6);
    g.fillStyle(0xa8bba0);
    g.fillRoundedRect(x - 16, y - 27, 32, 20, 7);
    g.lineStyle(10, 0x425e51);
    g.lineBetween(x + f * 8, y - 19, x + f * 47, y - 19);
    g.lineStyle(4, 0xc8cfb5);
    g.lineBetween(x + f * 14, y - 22, x + f * 42, y - 22);
    return;
  }
  if (u.kind === 'cavalry') {
    g.fillStyle(0x865c3c);
    g.fillEllipse(x, y + 6, 58, 30);
    g.fillTriangle(x - f * 21, y + 4, x - f * 41, y - 6, x - f * 34, y + 14);
    g.fillRoundedRect(x + f * 21 - 7, y - 17, 16, 30, 5);
    g.fillEllipse(x + f * 29, y - 15, 25, 15);
    for (const offset of [-17, 17]) {
      g.lineStyle(5, 0x634c35);
      g.lineBetween(
        x + offset,
        y + 13,
        x + offset + (u.state === 'move' ? Math.sin(time * 12 + offset) * 5 : 0),
        y + 31,
      );
    }
    g.fillStyle(0x729cb4);
    g.fillRoundedRect(x - 9, y - 26, 18, 23, 5);
    g.fillStyle(0xe3c38d);
    g.fillCircle(x, y - 36, 9);
    g.fillStyle(0xb8c9c6);
    g.fillEllipse(x, y - 42, 23, 12);
    g.lineStyle(3, 0xe1d4a8);
    g.lineBetween(x + f * 8, y - 16, x + f * 36, y - 48);
    if (u.charge > 0.65) {
      g.lineStyle(3, 0xf5d58a);
      g.lineBetween(x - 20, y + 36, x - 20 + 40 * u.charge, y + 36);
    }
    return;
  }
  g.fillStyle(0x758995);
  g.fillRoundedRect(x - 20, y - 13, 40, 32, 7);
  g.lineStyle(7, 0x394d49);
  g.lineBetween(x - 12, y + 13, x - 16, y + 29);
  g.lineBetween(x + 12, y + 13, x + 16, y + 29);
  for (const offset of [-11, 11]) {
    g.fillStyle(0xe1bf87);
    g.fillCircle(x + offset, y - 25, 10);
    g.fillStyle(0xb9b99f);
    g.fillEllipse(x + offset, y - 31, 24, 15);
    g.fillStyle(0x354943);
    g.fillRect(x + offset - 6, y - 26, 12, 3);
  }
  g.lineStyle(4, 0xd3ded0);
  g.lineBetween(x - 21, y, x - 33, y - 23);
  g.lineBetween(x + 21, y, x + 33, y - 23);
}
