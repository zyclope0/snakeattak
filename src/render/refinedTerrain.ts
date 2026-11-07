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
  const roads = [0, 1, 2]
    .map((lane) => laneRoad(lane, level))
    .concat(routeJunctions(level).map((x) => junctionRoad(x, level)));
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
  // The living barrier is real navigation geometry. Low mossy banks express it
  // without the old column of tree canopies; openings stay at their true coordinates.
  const composition = stageComposition(level, seed);
  for (const [index, bank] of composition.banks.entries()) {
    const height = bank.bottom - bank.top,
      y = (bank.top + bank.bottom) / 2;
    // Soft irregular moss silhouette, rather than a rectangular platform.
    ground.fillStyle(0x3e5b45, 0.17);
    ground.fillEllipse(528, y + 4, 116, height + 10);
    ground.fillStyle(0x617955, 0.57);
    ground.fillEllipse(528, y, 110, height + 4);
    for (let x = bank.left + 8; x <= bank.right - 8; x += 12)
      for (let at = bank.top + 10; at < bank.bottom - 5; at += 12) {
        if (((x - 528) / 51) ** 2 + ((at - y) / (height / 2)) ** 2 > 0.95) continue;
        ground.fillStyle(Math.sin(x + at) > 0 ? 0x8c9e71 : 0x4f6e51, 0.45);
        ground.fillEllipse(x + Math.sin(at) * 3, at, 22, 17);
      }
    // Uneven moss tufts make the bank read as a continuous low obstacle,
    // including its edges; isolated props previously suggested extra crossings.
    for (let x = bank.left + 7; x < bank.right - 5; x += 10) {
      ground.fillStyle(x % 3 ? 0x647e58 : 0xa2ae7d, 0.65);
      const edge = Math.sqrt(Math.max(0, 1 - ((x - 528) / 51) ** 2)) * (height / 2 - 4);
      ground.fillEllipse(x, y - edge + Math.sin(x) * 2, 14, 8);
      ground.fillEllipse(x, y + edge + Math.cos(x) * 2, 15, 9);
    }
    objects.add(prop(index % 2 ? 2 : 3, 515, y - 3, 54).setFlipX(index % 2 === 0));
    objects.add(prop(index % 2 ? 1 : 2, 551, y + 1, 43).setFlipX(index % 2 !== 0));
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
