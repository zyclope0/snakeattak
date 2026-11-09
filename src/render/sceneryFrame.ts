import type Phaser from 'phaser';

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
        .image(550, 310, texture)
        .setDisplaySize(1100, 620)
        .setCrop((x * 1600) / 1100, (y * 900) / 620, (width * 1600) / 1100, (height * 900) / 620)
        .setAlpha(alpha),
    );
  };
  // Feathered80px upper/lower frame; the nearest road centre is at least130px.
  for (let inset = 0; inset < 80; inset += 5) {
    const alpha = 0.88 * (1 - inset / 80) ** 0.8;
    strip(0, inset, 1100, 5, alpha);
    strip(0, 615 - inset, 1100, 5, alpha);
  }
  // Side strips stop before the lane entrances; corners are not double shaded.
  for (let inset = 0; inset < 40; inset += 5) {
    const alpha = 0.75 * (1 - inset / 40);
    strip(inset, 80, 5, 460, alpha);
    strip(1095 - inset, 80, 5, 460, alpha);
  }
}
