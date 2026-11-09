import Phaser from 'phaser';
import type { Level } from '../levels.ts';
import type { Point } from '../navigation.ts';
import { laneRoad, junctionRoad, routeJunctions } from '../routes.ts';
import { stageTheme } from './stageLayout.ts';

/** Raised, matte limestone/paper pieces drawn once, from the real route samples. */
export function drawCraftPaths(ground: Phaser.GameObjects.Graphics, level: Level) {
  const theme = stageTheme(level);
  const stroke = (points: Point[], width: number, color: number, alpha: number, dy = 0) => {
    ground.lineStyle(width, color, alpha);
    ground.beginPath();
    ground.moveTo(points[0].x, points[0].y + dy);
    for (const p of points.slice(1)) ground.lineTo(p.x, p.y + dy);
    ground.strokePath();
  };
  for (const x of routeJunctions(level)) {
    const road = junctionRoad(x, level);
    stroke(road, 44, 0x344c40, 0.1, 3);
    stroke(road, 37, 0x756749, 0.85);
    stroke(road, 32, 0xbca27a, 1);
    stroke(road, 24, 0xd4bd92, 0.8);
  }
  for (const lane of [0, 1, 2]) {
    const road = laneRoad(lane, level);
    stroke(road, 78, 0x344c40, 0.04, 3);
    stroke(road, 69, 0x344c40, 0.1, 4);
    stroke(road, 61, 0x7f8266, 0.65, 2);
    stroke(road, 56, theme.path, 1);
    stroke(road, 47, theme.inner, 0.95, -1);
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
        // Eight bevelled corners read as small handmade blocks, without sharp grid tiles.
        const corners = [
          [-7, -5],
          [6, -5],
          [9, -2],
          [9, 2],
          [6, 5],
          [-6, 5],
          [-9, 2],
          [-9, -2],
        ];
        const points = (dy: number) =>
          corners.map(
            ([dx, oy]) => new Phaser.Geom.Point(x + tx * dx + nx * oy, y + ty * dx + ny * oy + dy),
          );
        ground.fillStyle(0x827252, 0.3);
        ground.fillPoints(points(1.8), true);
        ground.fillStyle((i + row + lane) % 4 ? theme.stone : theme.inner, 0.95);
        ground.fillPoints(points(0), true);
        ground.lineStyle(0.8, 0xfff7dc, 0.6);
        ground.lineBetween(
          x - tx * 6 - nx * 4,
          y - ty * 6 - ny * 4,
          x + tx * 5 - nx * 4,
          y + ty * 5 - ny * 4,
        );
      }
    }
  }
}
