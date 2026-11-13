import Phaser from 'phaser';
import type { ArtFrame } from '../art.ts';
import { onSceneExit } from './sceneExit.ts';
import { preparedPixels, rimLayout } from './figurineLayout.ts';

/** Empty pixels between the two images of one surface. */
const GAP = 2;

/** A prepared image: a frame added to the sheet it was reduced from. */
export type PreparedFrame = { texture: string; frame: string };
/** How a rim image sits behind its figure: same point under the feet, a little larger. */
export type Rim = PreparedFrame & {
  /** Display size of the rim for a figure displayed 1 × 1. */
  scaleX: number;
  scaleY: number;
  originX: number;
  originY: number;
};
export type Figurine = { body: PreparedFrame; rim: Rim };

/**
 * A small canvas added to a sheet as one more source, the way a multi-file atlas holds
 * several images. It belongs to the sheet, not to a scene: a freed surface is drawn again
 * instead of being destroyed, and Phaser releases all of them with the sheet.
 */
type Surface = {
  index: number;
  canvas: HTMLCanvasElement;
  source: Phaser.Textures.TextureSource;
  used: boolean;
};
const surfaces = new WeakMap<Phaser.Textures.Texture, Surface[]>();
const shared = new WeakMap<Phaser.Scene, Figurines>();
/** Frame names never come back: a pooled image cannot mistake a dead frame for a live one. */
let serial = 0;

/**
 * Figurines at the size of the screen, for WebGL and Canvas alike.
 *
 * A 512 px cell drawn seven times smaller by the renderer is either jagged (no mipmap) or
 * soft (mipmap: the 64 px level serves a 70 px figure). Here each image in use is reduced
 * once, by halves, to twice the pixels it covers on screen, and the board shows it almost
 * one for one, as crisp as the portraits of the dock. The reduced image is a new frame of
 * its own sheet: an actor still says which sheet it comes from.
 *
 * The rim is that reduced figure grown by the same distance in every direction, in the
 * colour of its camp: one thickness all the way round, smooth edges. The former contour was
 * the figure itself, enlarged: thick far from its feet, absent near them.
 *
 * A prepared surface is a few tens to a few hundreds of KiB; all of them are freed when the
 * canvas changes size and when the scene closes. Their lifetime never follows a unit.
 */
export class Figurines {
  private figurines = new Map<string, Figurine>();
  private plain = new Map<string, PreparedFrame>();
  private fills = new Map<string, PreparedFrame>();
  private owned: { texture: Phaser.Textures.Texture; surface: Surface; frames: string[] }[] = [];
  private pixelsPerUnit = 1;
  private scratch: HTMLCanvasElement[] = [];
  private scene: Phaser.Scene;
  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    onSceneExit(scene.events, () => {
      this.clear();
      shared.delete(scene);
    });
  }
  /** One set per scene, shared by everything that draws a miniature. */
  static of(scene: Phaser.Scene): Figurines {
    let figurines = shared.get(scene);
    if (!figurines) shared.set(scene, (figurines = new Figurines(scene)));
    return figurines;
  }

  /** Canvas pixels per board unit. A new value frees every prepared image. */
  setScale(pixelsPerUnit: number) {
    if (pixelsPerUnit === this.pixelsPerUnit) return;
    this.pixelsPerUnit = pixelsPerUnit;
    this.clear();
  }
  private clear() {
    for (const { texture, surface, frames } of this.owned) {
      // A sheet destroyed with the game has already released its frames and surfaces.
      if (texture.manager) for (const frame of frames) texture.remove(frame);
      surface.used = false;
    }
    this.owned = [];
    this.figurines.clear();
    this.plain.clear();
    this.fills.clear();
  }
  /** A cleared canvas of the sheet `art` belongs to, and a way to publish frames cut from it. */
  private surface(art: ArtFrame, width: number, height: number) {
    const texture = this.scene.textures.get(art.texture);
    let list = surfaces.get(texture);
    if (!list) surfaces.set(texture, (list = []));
    let surface = list.find((candidate) => !candidate.used);
    if (surface) {
      surface.canvas.width = width;
      surface.canvas.height = height;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const source = new Phaser.Textures.TextureSource(texture, canvas, width, height);
      texture.source.push(source);
      list.push((surface = { index: texture.source.length - 1, canvas, source, used: false }));
    }
    surface.used = true;
    const owned = { texture, surface, frames: [] as string[] };
    this.owned.push(owned);
    const { index, canvas, source } = surface;
    return {
      context: canvas.getContext('2d')!,
      /** Call once the drawing is done; then cut the frames. */
      publish() {
        source.width = width;
        source.height = height;
        source.update();
      },
      frame(x: number, y: number, w: number, h: number): PreparedFrame {
        const name = `figurine:${++serial}`;
        texture.add(name, index, x, y, w, h);
        owned.frames.push(name);
        return { texture: art.texture, frame: name };
      },
    };
  }
  /** Reduce by exact halves, then once to the wanted size: no pixel of the source is skipped. */
  private reduced(art: ArtFrame, width: number, height: number): CanvasImageSource {
    const frame = this.scene.textures.getFrame(art.texture, art.frame);
    let source = frame.source.image as CanvasImageSource,
      x = frame.cutX,
      y = frame.cutY,
      w = frame.cutWidth,
      h = frame.cutHeight,
      turn = 0;
    while (w / 2 >= width && h / 2 >= height) {
      const canvas = (this.scratch[turn] ??= document.createElement('canvas'));
      const context = canvas.getContext('2d')!;
      canvas.width = Math.ceil(w / 2);
      canvas.height = Math.ceil(h / 2);
      context.drawImage(source, x, y, w, h, 0, 0, canvas.width, canvas.height);
      source = canvas;
      x = y = 0;
      w = canvas.width;
      h = canvas.height;
      turn = 1 - turn;
    }
    const canvas = (this.scratch[2] ??= document.createElement('canvas'));
    const context = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, x, y, w, h, 0, 0, width, height);
    return canvas;
  }
  private size(art: ArtFrame, width: number, height: number, pixelsPerUnit = this.pixelsPerUnit) {
    const frame = this.scene.textures.getFrame(art.texture, art.frame);
    return {
      width: preparedPixels(width, pixelsPerUnit, frame.cutWidth),
      height: preparedPixels(height, pixelsPerUnit, frame.cutHeight),
    };
  }
  private colour(
    context: CanvasRenderingContext2D,
    color: number,
    alpha: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    context.save();
    // `source-in` empties everything outside its shape: keep it inside this image.
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();
    context.globalCompositeOperation = 'source-in';
    context.globalAlpha = alpha;
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillRect(x, y, width, height);
    context.restore();
  }

  /**
   * An image without a rim (egg, honey pot, refuge, scenery prop), shown `width` × `height`
   * board units. `pixelsPerUnit` is given by the terrain, whose cache has its own size.
   */
  image(art: ArtFrame, width: number, height: number, pixelsPerUnit?: number): PreparedFrame {
    const size = this.size(art, width, height, pixelsPerUnit);
    const name = `${art.texture}:${art.frame}:${size.width}x${size.height}`;
    const cached = this.plain.get(name);
    if (cached) return cached;
    const surface = this.surface(art, size.width, size.height);
    surface.context.drawImage(this.reduced(art, size.width, size.height), 0, 0);
    surface.publish();
    const result = surface.frame(0, 0, size.width, size.height);
    this.plain.set(name, result);
    return result;
  }

  /**
   * A fighter shown `width` × `height` board units and its rim, `thickness` board units
   * wide, in `color` at `opacity`. `originX`/`originY` are the origin the figure is
   * displayed with.
   */
  figurine(
    art: ArtFrame,
    width: number,
    height: number,
    color: number,
    thickness: number,
    opacity: number,
    originX: number,
    originY: number,
  ): Figurine {
    const size = this.size(art, width, height);
    const name = `${art.texture}:${art.frame}:${size.width}x${size.height}:${color}`;
    const cached = this.figurines.get(name);
    if (cached) return cached;
    const reach = (thickness * size.width) / width;
    const layout = rimLayout(size.width, size.height, reach, originX, originY);
    // One surface for both: the body on the left, its rim on the right.
    const left = size.width + GAP;
    const surface = this.surface(art, left + layout.fullWidth, layout.fullHeight);
    const context = surface.context;
    const body = this.reduced(art, size.width, size.height);
    // Two rings of copies: the outer one sets the thickness, the inner one closes the gaps.
    for (const [ring, copies] of [
      [reach, 16],
      [reach / 2, 8],
    ] as const)
      for (let i = 0; i < copies; i++) {
        const angle = (i / copies) * Math.PI * 2;
        context.drawImage(
          body,
          left + layout.pad + Math.cos(angle) * ring,
          layout.pad + Math.sin(angle) * ring,
        );
      }
    this.colour(context, color, opacity, left, 0, layout.fullWidth, layout.fullHeight);
    context.drawImage(body, 0, 0);
    surface.publish();
    const figurine = {
      body: surface.frame(0, 0, size.width, size.height),
      rim: { ...surface.frame(left, 0, layout.fullWidth, layout.fullHeight), ...layout },
    };
    this.figurines.set(name, figurine);
    return figurine;
  }

  /** The figure as one flat colour: the Canvas renderer cannot tint an image. */
  fill(art: ArtFrame, width: number, height: number, color: number): PreparedFrame {
    const size = this.size(art, width, height);
    const name = `${art.texture}:${art.frame}:${size.width}x${size.height}:${color}`;
    const cached = this.fills.get(name);
    if (cached) return cached;
    const surface = this.surface(art, size.width, size.height);
    surface.context.drawImage(this.reduced(art, size.width, size.height), 0, 0);
    this.colour(surface.context, color, 1, 0, 0, size.width, size.height);
    surface.publish();
    const result = surface.frame(0, 0, size.width, size.height);
    this.fills.set(name, result);
    return result;
  }
}
