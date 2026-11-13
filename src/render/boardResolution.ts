import type Phaser from 'phaser';

/** The board in world units. Rules, layout and input all speak these coordinates. */
export const BOARD_WIDTH = 1100;
export const BOARD_HEIGHT = 620;
/** Canvas pixels per board unit never exceed this: four times the pixels of the plain board. */
export const MAX_BOARD_SCALE = 2;
/** Nor go below this: a board shown that small is a thumbnail, not a place to play. */
const MIN_BOARD_SCALE = 0.5;
/** A new size must be wanted for this long before the canvas is rebuilt. */
const SETTLE_MS = 250;
/** A canvas within this many pixels of the wanted width is left alone: no rebuild for a hair. */
const SLACK = 3;

/**
 * Width of the canvas, in its own pixels, for a board shown `cssWidth` CSS pixels wide: the
 * very pixels of the screen, so that the browser has nothing left to stretch or shrink.
 * « Effets légers » never goes above the plain 1100 px board: that switch is also the
 * performance mode. `cap` is the largest scale the device has shown it can keep up with.
 */
export function boardPixelsFor(
  cssWidth: number,
  pixelRatio: number,
  light: boolean,
  cap = MAX_BOARD_SCALE,
): number {
  if (!(cssWidth > 0) || !(pixelRatio > 0)) return BOARD_WIDTH;
  const most = BOARD_WIDTH * (light ? 1 : Math.max(1, Math.min(MAX_BOARD_SCALE, cap)));
  return Math.round(Math.max(BOARD_WIDTH * MIN_BOARD_SCALE, Math.min(most, cssWidth * pixelRatio)));
}

/** Canvas pixels per board unit of a running game: 1 for the test harnesses, which never resize. */
export function boardScale(scene: Phaser.Scene): number {
  return scene.scale.width / BOARD_WIDTH;
}

/** A pointer in board units, whatever the size of the canvas behind it. */
export function boardPoint(scene: Phaser.Scene, pointer: { x: number; y: number }) {
  const scale = boardScale(scene);
  return { x: pointer.x / scale, y: pointer.y / scale };
}

/** Same shake on screen at every canvas size: Phaser scales it with the camera twice. */
export function shakeBoard(scene: Phaser.Scene, duration: number, intensity: number) {
  const scale = boardScale(scene);
  scene.cameras.main.shake(duration, intensity / (scale * scale));
}

/**
 * Pixels of the terrain cache per board unit. WebGL has no anti-aliasing inside a render
 * texture: twice the board lets the screen average the path edges instead of showing steps.
 * « Effets légers » and the Canvas renderer keep the cache at the size of the canvas, and the
 * cache never exceeds the largest texture of the graphics card.
 */
export function terrainScale(
  boardScale: number,
  light: boolean,
  webgl: boolean,
  maxTexture: number,
): number {
  const wanted = webgl && !light ? Math.max(2, boardScale) : boardScale;
  if (maxTexture >= BOARD_WIDTH * wanted) return wanted;
  // Never wider than the graphics card allows, even when the canvas itself is: a cache
  // that cannot be created shows no terrain at all. Rounded down to a hundredth.
  return Math.min(boardScale, Math.floor((maxTexture / BOARD_WIDTH) * 100) / 100);
}

/** Under 40 images a second, the picture is no longer fluid. */
const SLOW_FRAME_MS = 25;
/**
 * Lowers the ceiling when a large canvas is what slows the device down, and only then.
 * Three slow seconds in a row above the plain board: it tries half a step lower. If the
 * images do not come at least 15 % faster, the size was not the cause (a 30 images-a-second
 * power saver, a busy processor): the ceiling goes back up and is never touched again.
 * A ceiling that helped stays for the session, so the picture cannot pulse between sizes.
 */
export function createFrameGovernor(cap = MAX_BOARD_SCALE) {
  let state: 'watch' | 'trial' | 'done' = 'watch',
    frames = 0,
    elapsed = 0,
    slow = 0,
    windows = 0,
    before = 0,
    previous = cap;
  return {
    get cap() {
      return cap;
    },
    /** `scale` is the scale these frames were drawn at; `deltaMs` the time since the last one. */
    frame(deltaMs: number, scale: number) {
      if (state === 'done') return cap;
      // A hidden tab, a debugger or a resize is not a measure of the device.
      if (!(deltaMs > 0) || deltaMs > 250 || (state === 'watch' && scale <= 1)) {
        frames = elapsed = slow = 0;
        return cap;
      }
      frames++;
      elapsed += deltaMs;
      if (elapsed < 1000) return cap;
      const frame = elapsed / frames;
      frames = elapsed = 0;
      if (state === 'watch') {
        slow = frame > SLOW_FRAME_MS ? slow + 1 : 0;
        if (slow >= 3) {
          slow = windows = 0;
          before = frame;
          previous = cap;
          cap = Math.max(1, Math.min(cap, scale) - 0.5);
          state = 'trial';
        }
      } else if (++windows >= 3) {
        // The first two seconds after the change include the rebuild: judge the third.
        if (frame <= before / 1.15) state = 'watch';
        else {
          cap = previous;
          state = 'done';
        }
      }
      return cap;
    },
  };
}

/**
 * Keeps the canvas as sharp as the screen that shows it. Only the canvas grows: scenes zoom
 * their camera by `boardScale`, so every coordinate stays on the 1100 × 620 board.
 * The size is read before each step, never from a layout callback: the frame that follows a
 * resize is already drawn at the new size.
 */
export function bindBoardResolution(game: Phaser.Game, light: () => boolean) {
  const governor = createFrameGovernor();
  let wanted = 0,
    since = 0,
    settled = false;
  const step = (time: number, delta: number) => {
    const shown = game.scale.displaySize.width;
    // Hidden behind the home screen: nothing to measure, keep what we have.
    if (!(shown > 0) || !(game.scale.parentSize.width > 0) || !game.canvas.isConnected) return;
    const width = boardPixelsFor(
      shown,
      window.devicePixelRatio || 1,
      light(),
      governor.frame(game.loop.rawDelta || delta, game.scale.width / BOARD_WIDTH),
    );
    if (Math.abs(width - game.scale.width) <= SLACK) {
      wanted = 0;
      settled = true;
      return;
    }
    if (width !== wanted) {
      wanted = width;
      since = time;
    }
    // The first size is taken at once; later ones wait for the layout to stop moving.
    if (settled && time - since < SETTLE_MS) return;
    wanted = 0;
    settled = true;
    game.scale.setGameSize(width, Math.round((width * BOARD_HEIGHT) / BOARD_WIDTH));
  };
  game.events.on('prestep', step);
  game.events.once('destroy', () => game.events.off('prestep', step));
}
