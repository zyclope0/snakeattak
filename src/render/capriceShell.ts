import type Phaser from 'phaser';
/** Visual geometry only: never writes an entity or its collision radius. */
export function shellGeometry(size: number, shell: boolean) {
  const scale = shell ? 1.18 : 1;
  return { size: size * scale, width: size * scale * 0.53, height: size * scale * 0.37 };
}
export function drawCapriceShell(g: Phaser.GameObjects.Graphics, width: number, height: number) {
  g.fillStyle(0xf9f1d8, 1);
  g.fillEllipse(0, 0, width + 9, height + 9);
  g.fillStyle(0xd2552d, 1);
  g.fillEllipse(0, 0, width + 6, height + 6);
  g.fillStyle(0x777c59, 1);
  g.fillEllipse(0, 0, width, height);
  g.lineStyle(2, 0x414d37, 1);
  g.strokeEllipse(0, 0, width, height);
  g.lineBetween(-width * 0.25, -height * 0.35, width * 0.2, height * 0.4);
  g.lineBetween(width * 0.25, -height * 0.35, -width * 0.2, height * 0.4);
  g.lineStyle(2, 0xb0b18b, 0.8);
  g.strokeEllipse(0, -height * 0.1, width * 0.65, height * 0.65);
}
