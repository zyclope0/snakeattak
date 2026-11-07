import type Phaser from 'phaser';
import type { Game } from '../game.ts';
import { STICKY_ZONE, feastPoint } from '../tactics.ts';
import { laneRoad } from '../routes.ts';
import type { Point } from '../navigation.ts';
const zones = new Map<string, { points: Point[]; border: Point[] }>();
/** The visible patch uses the same route and bounds as the slowdown rule. */
export function drawHoneyZone(
  g: Phaser.GameObjects.Graphics,
  game: Game,
  clock: number,
  reduced: boolean,
) {
  const feast = game.feast!;
  const pot = feastPoint(feast, game.level);
  if (feast.flavor === 'sticky') {
    const key = `${game.level.id}:${feast.lane}`;
    let zone = zones.get(key);
    if (!zone) {
      const points = laneRoad(feast.lane, game.level).filter(
        (p) => p.x >= STICKY_ZONE.left && p.x <= STICKY_ZONE.right,
      );
      const border = [
        ...points.map((p) => ({ x: p.x, y: p.y - STICKY_ZONE.halfWidth })),
        ...points
          .slice()
          .reverse()
          .map((p) => ({ x: p.x, y: p.y + STICKY_ZONE.halfWidth })),
      ];
      zone = { points, border };
      zones.set(key, zone);
    }
    const { points, border } = zone;
    g.fillStyle(0x6eab87, 0.28);
    g.fillPoints(border, true);
    g.lineStyle(2, 0xc6e4a9, 0.65);
    g.strokePoints(border, true);
    for (let i = 0; i < points.length; i += 6) {
      const p = points[i],
        pulse = reduced ? 0 : Math.sin(clock * 3 + i) * 1.3;
      g.fillStyle(0x375f47, 0.35);
      g.fillEllipse(p.x, p.y + 15, 7 + pulse, 4);
      g.lineStyle(1, 0xd9e8b1, 0.65);
      g.strokeCircle(p.x, p.y + 15, 3 + pulse * 0.3);
    }
  } else {
    g.lineStyle(2, 0xe5bf66, 0.45);
    g.strokeEllipse(pot.x, pot.y + 8, 77, 32);
  }
  return pot;
}
