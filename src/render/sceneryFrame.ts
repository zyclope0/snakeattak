import type Phaser from 'phaser';
import { BOARD_WIDTH, BOARD_HEIGHT } from './boardResolution.ts';

/** Supplied artwork frames the stage, never paints details over playable roads.
 * Static crop strips work in WebGL and Canvas, with no masks or per-frame FX.
 * Texture exports are1600×900; the existing ground stays untouched underneath.
 */
export function addSceneryFrame(
  scene: Phaser.Scene,
  objects: Phaser.GameObjects.Container,
  texture: string | null,
) {
  if (!texture) return;
  const strip = (x: number, y: number, width: number, height: number, alpha: number) => {
    objects.add(
      scene.add
        .image(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, texture)
        .setDisplaySize(BOARD_WIDTH, BOARD_HEIGHT)
        .setCrop(
          (x * 1600) / BOARD_WIDTH,
          (y * 900) / BOARD_HEIGHT,
          (width * 1600) / BOARD_WIDTH,
          (height * 900) / BOARD_HEIGHT,
        )
        .setAlpha(alpha),
    );
  };
  // Feathered80px upper/lower frame; the nearest road centre is at least130px.
  for (let inset = 0; inset < 80; inset += 5) {
    const alpha = 0.88 * (1 - inset / 80) ** 0.8;
    strip(0, inset, BOARD_WIDTH, 5, alpha);
    strip(0, BOARD_HEIGHT - 5 - inset, BOARD_WIDTH, 5, alpha);
  }
  // Side strips stop before the lane entrances; corners are not double shaded.
  for (let inset = 0; inset < 40; inset += 5) {
    const alpha = 0.75 * (1 - inset / 40);
    strip(inset, 80, 5, 460, alpha);
    strip(BOARD_WIDTH - 5 - inset, 80, 5, 460, alpha);
  }
}
