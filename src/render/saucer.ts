import type Phaser from 'phaser';
import type { Level } from '../levels.ts';
import type { MissionRun } from '../missions.ts';

const geometry = Object.freeze({ x: 1008, y: 48, width: 36, height: 20 });

/** One static decoration, restricted by terrain identity and expedition context. */
export function saucerReadout(
  level: Pick<Level, 'id'>,
  mission: MissionRun | null,
): Readonly<{ x: number; y: number; width: number; height: number }> | null {
  return level.id === 'ruins' && mission === null ? geometry : null;
}

/** Added to the terrain container for its existing cache-and-destroy lifecycle. */
export function drawSaucer(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  level: Level,
  mission: MissionRun | null,
): void {
  const readout = saucerReadout(level, mission);
  if (!readout) return;
  const g = scene.add.graphics().setPosition(readout.x, readout.y);
  container.add(g);

  // Flattened shadow and layered, slightly uneven paper edges; no glow or motion.
  g.fillStyle(0x46574f, 0.22);
  g.fillEllipse(0, 8, 32, 4);
  g.lineStyle(1, 0x9b927c, 1);
  g.lineBetween(0, -8, 0, -6);
  g.fillStyle(0x94c9c4, 1);
  g.fillCircle(0, -9, 1);
  g.fillStyle(0x628f91, 1);
  g.fillEllipse(0, -3, 17, 12);
  g.fillStyle(0x92bab2, 1);
  g.fillEllipse(-2, -4, 12, 8);

  g.fillStyle(0xb4a7b6, 1);
  g.fillEllipse(0, 4, 36, 10);
  g.fillStyle(0xd5c3a4, 1);
  g.fillEllipse(0, 2, 36, 9);
  g.fillStyle(0xe9e0c9, 1);
  g.fillEllipse(-1, 0, 31, 7);
  g.lineStyle(1, 0xa39389, 0.8);
  g.strokeEllipse(0, 4, 33, 7);
  g.fillStyle(0xc7b6b2, 0.8);
  g.fillTriangle(-14, 1, -9, 0, -11, 3);
  g.fillStyle(0x91c9c7, 1);
  for (const x of [-10, 0, 10]) g.fillEllipse(x, 4, 2.5, 1.5);
}
