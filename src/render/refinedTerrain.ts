import { addSceneryFrame } from './sceneryFrame.ts';
import { drawCraftPaths } from './craftPaths.ts';
import Phaser from 'phaser';
import { LANES } from '../ai.ts';
import type { Level } from '../levels.ts';
import { stageComposition, STAGE_SIZES, stageTheme } from './stageLayout.ts';
import type { StageProp } from './stageLayout.ts';
import { Figurines } from './figurines.ts';
import { boardScale } from './boardResolution.ts';
import { standingDepth } from './boardDepth.ts';

type Graphics = Phaser.GameObjects.Graphics;
type Image = Phaser.GameObjects.Image;
/** A prop of the scenery sheet; `baked` (the default) prepares it at the size of the cache. */
type PropMaker = (frame: number, x: number, y: number, size: number, baked?: boolean) => Image;

// Water expresses the existing impassable column. The three bridge positions
// and all navigation coordinates stay untouched. Rounded samples overlap to
// feather the banks without rectangular patches or right-angled ends.
const STREAM = Array.from({ length: 161 }, (_, i) => {
  const y = -10 + i * 4;
  return { x: 528 + Math.sin(y / 54) * 5 + Math.sin(y / 21) * 2, y };
});
/** The stream from its soft banks to its bright middle: radius, colour, opacity. */
const WATER = [
  [63, 0x345949, 0.08],
  [58, 0x345949, 0.12],
  [54, 0x759478, 0.45],
  [48, 0x91aa88, 0.8],
  [43, 0x315d63, 1],
  [35, 0x518f98, 1],
  [25, 0x85b8bc, 0.7],
] as const;
const LANE_MARKS = [0x6da6b8, 0x9b97b8, 0xb8a269];

function drawStream(ground: Graphics) {
  for (const [radius, color, alpha] of WATER) {
    ground.fillStyle(color, alpha);
    for (const p of STREAM) ground.fillCircle(p.x, p.y, radius);
  }
  for (let y = 8; y < 620; y += 23) {
    ground.lineStyle(1.4, 0xc5e5dc, 0.45);
    ground.lineBetween(513 + Math.sin(y) * 5, y, 530 + Math.sin(y) * 5, y + 2);
    ground.lineStyle(1, 0xc5e5dc, 0.25);
    ground.lineBetween(536, y + 8, 546, y + 9);
  }
}

/** Framing props: baked into the cache, except those in front of the fighters. */
function addDecor(
  decor: readonly StageProp[],
  tint: number,
  prop: PropMaker,
  objects: Phaser.GameObjects.Container,
  foreground: Image[],
) {
  for (const p of decor) {
    const image = prop(p.frame, p.x, p.y, 52 * p.scale, !p.foreground)
      .setFlipX(p.flipX)
      .setAngle(p.angle)
      .setTint(tint === 0xffffff ? p.tint : tint);
    if (p.foreground) foreground.push(image.setDepth(standingDepth(p.y)));
    else objects.add(image);
  }
}

/** Three unobtrusive, distinct lane marks; no terrain text. */
function drawLaneMarks(ground: Graphics) {
  for (const [index, y] of LANES.entries()) {
    ground.fillStyle(LANE_MARKS[index], 0.95);
    for (let dot = 0; dot <= index; dot++) ground.fillCircle(147 + dot * 7, y + 37, 2.6);
  }
}

/** A scenery layer; roads are consumed from the same model as the simulation. */
export function refinedTerrain(
  scene: Phaser.Scene,
  objects: Phaser.GameObjects.Container,
  level: Level,
  seed: number,
  /** Pixels of the cache per board unit: props baked into it are prepared at that size. */
  cacheScale = 1,
): Image[] {
  const figurines = Figurines.of(scene);
  const theme = stageTheme(level);
  objects.add(scene.add.image(550, 310, theme.ground).setDisplaySize(1100, 620));
  addSceneryFrame(scene, objects, theme.scenery);
  const ground = scene.add.graphics();
  objects.add(ground);
  drawCraftPaths(ground, level);
  // `baked` props are drawn once into the cache; the others stay on the board, among the fighters.
  const prop: PropMaker = (frame, x, y, size, baked = true) => {
    const art = figurines.image(
      { texture: 'props-three-bridges', frame },
      size,
      size,
      baked ? cacheScale : boardScale(scene),
    );
    return scene.add
      .image(x, y, art.texture, art.frame)
      .setDisplaySize(size, size)
      .setTint(theme.tint);
  };
  const composition = stageComposition(level, seed);
  drawStream(ground);
  for (const p of composition.bridges) {
    ground.fillStyle(0x314b40, 0.16);
    ground.fillEllipse(p.x, p.y + 18, 120, 48);
    objects.add(prop(0, p.x, p.y, STAGE_SIZES.bridge));
  }
  const foreground: Image[] = [];
  addDecor(composition.decor, theme.tint, prop, objects, foreground);
  for (const rock of level.rocks) {
    ground.fillStyle(0x304d3b, 0.17);
    ground.fillEllipse(rock.x, rock.y + 9, rock.r * 2.2, rock.r);
    foreground.push(
      prop(3, rock.x, rock.y - 5, rock.r * 2.2, false).setDepth(standingDepth(rock.y)),
    );
  }
  drawLaneMarks(ground);
  return foreground;
}
