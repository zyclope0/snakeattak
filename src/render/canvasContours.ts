import type Phaser from 'phaser';
import type { ArtFrame } from '../art.ts';

/** Phaser tint is WebGL-only. Canvas gets tiny, shared silhouettes from loaded
 * sprite alpha, never full recoloured atlases or a per-actor drawing/filter pass.
 * Each128×128 surface is64KiB RGBA; its lifetime belongs to Actors, not a unit.
 */
export class CanvasContours {
  private frames = new Map<string, ArtFrame>();
  constructor(private scene: Phaser.Scene) {}

  frame(art: ArtFrame, color: number): ArtFrame {
    const key = `canvas-contour:${art.texture}:${art.frame}:${color}`;
    const cached = this.frames.get(key);
    if (cached) return cached;
    const source = this.scene.textures.getFrame(art.texture, art.frame);
    const texture = this.scene.textures.createCanvas(key, 128, 128)!;
    const context = texture.context;
    context.drawImage(
      source.source.image as CanvasImageSource,
      source.cutX,
      source.cutY,
      source.cutWidth,
      source.cutHeight,
      0,
      0,
      128,
      128,
    );
    context.save();
    context.globalCompositeOperation = 'source-in';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, 128, 128);
    context.restore();
    texture.add(0, 0, 0, 0, 128, 128);
    texture.refresh();
    const result = { texture: key, frame: 0 };
    this.frames.set(key, result);
    return result;
  }

  destroy() {
    for (const frame of this.frames.values()) this.scene.textures.remove(frame.texture);
    this.frames.clear();
  }
}
