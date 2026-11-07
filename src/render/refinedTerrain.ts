import Phaser from 'phaser';
import { LANES } from '../ai.ts';
import { laneRoad, junctionRoad, routeJunctions } from '../routes.ts';
import type { Point } from '../navigation.ts';
import type { Level } from '../levels.ts';
import { stageComposition, STAGE_SIZES, stageTheme } from './stageLayout.ts';

/** A scenery layer; roads are consumed from the same model as the simulation. */
export function refinedTerrain(
  scene: Phaser.Scene,
  objects: Phaser.GameObjects.Container,
  level: Level,
  seed: number,
): Phaser.GameObjects.Image[] {
  const theme = stageTheme(level);
  objects.add(scene.add.image(550, 310, theme.ground).setDisplaySize(1100, 620));
  const ground = scene.add.graphics();
  objects.add(ground);
  const stroke = (points: Point[], width: number, color: number, alpha: number) => {
    ground.lineStyle(width, color, alpha);
    ground.beginPath();
    ground.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ground.lineTo(p.x, p.y);
    ground.strokePath();
  };
  // Secondary earthen connections sit below the paved main lanes. Geometry is
  // shared with the rules; only their displayed stroke width is reduced by40%.
  for (const x of routeJunctions(level)) {
    const road = junctionRoad(x, level);
    stroke(road, 82 * 0.6, 0x344c40, 0.04);
    stroke(road, 70 * 0.6, 0x344c40, 0.08);
    stroke(road, 62 * 0.6, 0x6d7253, 0.5);
    stroke(road, 56 * 0.6, 0x987e58, 0.95);
    stroke(road, 44 * 0.6, 0xb8a37b, 0.7);
    for (let i = 3; i < road.length - 3; i += 8) {
      const p = road[i];
      ground.fillStyle(i % 3 ? 0x756549 : 0xd3c19b, 0.35);
      ground.fillEllipse(p.x + (i % 5) - 2, p.y, 3, 2);
    }
  }
  const roads = [0, 1, 2].map((lane) => laneRoad(lane, level));
  for (const road of roads) {
    // Feathered earth shoulder and a warm pale limestone centre, without a board overlay.
    stroke(road, 82, 0x344c40, 0.035);
    stroke(road, 76, 0x344c40, 0.05);
    stroke(road, 70, 0x344c40, 0.07);
    stroke(road, 62, 0x737b63, 0.5);
    stroke(road, 56, theme.path, 0.95);
    stroke(road, 44, theme.inner, 0.75);
    for (let i = 3; i < road.length - 3; i += 6) {
      const p = road[i],
        next = road[i + 1];
      const angle = Math.atan2(next.y - p.y, next.x - p.x);
      const tx = Math.cos(angle),
        ty = Math.sin(angle),
        nx = -ty,
        ny = tx;
      for (const row of [-1, 0, 1]) {
        const shift = row * 14,
          along = row === 0 ? -7 : 1;
        const x = p.x + nx * shift + tx * along,
          y = p.y + ny * shift + ty * along;
        const corners = [
          [-8, -5],
          [7, -5],
          [9, 3],
          [-6, 5],
        ].map(([dx, dy]) => new Phaser.Geom.Point(x + tx * dx + nx * dy, y + ty * dx + ny * dy));
        ground.fillStyle(i % 4 ? theme.stone : theme.path, 0.72);
        ground.fillPoints(corners, true);
        ground.lineStyle(0.7, 0x8a9276, 0.27);
        ground.strokePoints(corners, true);
      }
    }
  }
  const prop = (frame: number, x: number, y: number, size: number) =>
    scene.add
      .image(x, y, 'props-three-bridges', frame)
      .setDisplaySize(size, size)
      .setTint(theme.tint);
  const composition = stageComposition(level, seed);
  // Water expresses the existing impassable column. The three bridge positions
  // and all navigation coordinates stay untouched. Rounded samples overlap to
  // feather the banks without rectangular patches or right-angled ends.
  const stream = Array.from({ length: 161 }, (_, i) => {
    const y = -10 + i * 4;
    return { x: 528 + Math.sin(y / 54) * 5 + Math.sin(y / 21) * 2, y };
  });
  for (const [radius, color, alpha] of [
    [63, 0x345949, 0.08],
    [58, 0x345949, 0.12],
    [54, 0x759478, 0.45],
    [48, 0x91aa88, 0.8],
    [43, 0x386f73, 1],
    [35, 0x4b9298, 1],
    [25, 0x68a8ab, 0.7],
  ] as const) {
    ground.fillStyle(color, alpha);
    for (const p of stream) ground.fillCircle(p.x, p.y, radius);
  }
  for (let y = 8; y < 620; y += 23) {
    ground.lineStyle(1.4, 0xc5e5dc, 0.45);
    ground.lineBetween(513 + Math.sin(y) * 5, y, 530 + Math.sin(y) * 5, y + 2);
    ground.lineStyle(1, 0xc5e5dc, 0.25);
    ground.lineBetween(536, y + 8, 546, y + 9);
  }
  for (const p of composition.bridges) {
    ground.fillStyle(0x314b40, 0.16);
    ground.fillEllipse(p.x, p.y + 18, 120, 48);
    objects.add(prop(0, p.x, p.y, STAGE_SIZES.bridge));
  }
  const foreground: Phaser.GameObjects.Image[] = [];
  for (const p of composition.decor) {
    const image = prop(p.frame, p.x, p.y, 52 * p.scale)
      .setFlipX(p.flipX)
      .setAngle(p.angle)
      .setTint(theme.tint === 0xffffff ? p.tint : theme.tint);
    if (p.foreground) foreground.push(image.setDepth(10 + p.y / 1000));
    else objects.add(image);
  }
  for (const rock of level.rocks) {
    ground.fillStyle(0x304d3b, 0.17);
    ground.fillEllipse(rock.x, rock.y + 9, rock.r * 2.2, rock.r);
    foreground.push(prop(3, rock.x, rock.y - 5, rock.r * 2.2).setDepth(10 + rock.y / 1000));
  }
  // Three unobtrusive, distinct lane marks; no terrain text.
  for (const [index, y] of LANES.entries()) {
    ground.fillStyle([0x6da6b8, 0x9b97b8, 0xb8a269][index], 0.95);
    for (let dot = 0; dot <= index; dot++) ground.fillCircle(147 + dot * 7, y + 37, 2.6);
  }
  return foreground;
}
