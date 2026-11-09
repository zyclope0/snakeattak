import type { Level } from '../levels.ts';
import { laneRoad, junctionRoad, routeJunctions } from '../routes.ts';
import { LANES } from '../ai.ts';

/** Pure presentation palette; all maps share the readable layout. */
export function stageTheme(level: Level) {
  const id = level.artId ?? level.id;
  if (id === 'grove')
    return {
      ground: 'ground-grove',
      scenery: null,
      path: 0xddcea7,
      inner: 0xeadcbd,
      stone: 0xf3e7ca,
      tint: 0xf4e7c9,
      dens: [1, 3, 1],
    };
  if (id === 'ruins')
    return {
      ground: 'ground-ruins',
      scenery: 'scenery-marsh',
      path: 0xc9d3c4,
      inner: 0xdfe5d5,
      stone: 0xe8ecdf,
      tint: 0xe1efe9,
      dens: [3, 1, 3],
    };
  return {
    ground: 'ground-clearing',
    scenery: level.id === 'mission-clearing-1' ? 'scenery-marsh' : 'scenery-flood',
    path: 0xbda378,
    inner: 0xe0cda2,
    stone: 0xf0dfb5,
    tint: 0xffffff,
    dens: [1, 3, 1],
  };
}

export const STAGE_SIZES = {
  bridge: 142,
  fort: { x: 988, y: 360, width: 186, height: 210 },
  dens: LANES.map((y, i) => ({ x: 84, y: y + 23, width: 128 + i * 3, height: 128 + i * 3 })),
} as const;

export type StageProp = {
  x: number;
  y: number;
  frame: number;
  radius: number;
  scale: number;
  angle: number;
  flipX: boolean;
  tint: number;
  foreground: boolean;
};

/** Bounded rejection sampling (Poisson distance), in a separate cosmetic stream. */
export function stageComposition(level: Level, seed: number) {
  let state = (seed ^ 0x73616765 ^ (level.layout?.junctions[0] ?? 0)) >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const roads = [0, 1, 2]
    .flatMap((lane) => laneRoad(lane, level))
    .concat(...routeJunctions(level).map((x) => junctionRoad(x, level)));
  const decor: StageProp[] = [];
  for (let attempt = 0; attempt < 900 && decor.length < 24; attempt++) {
    const x = 38 + random() * 1024;
    // Dense framing at the top and bottom, no props in the recruitment area.
    const y = random() < 0.5 ? 36 + random() * 58 : 548 + random() * 38;
    const scale = 0.85 + random() * 0.3,
      radius = 19 * scale;
    if (roads.some((p) => Math.hypot(p.x - x, p.y - y) < radius + 43)) continue;
    if (decor.some((p) => Math.hypot(p.x - x, p.y - y) < radius + p.radius + 10)) continue;
    // The stream continues beyond the navigation barrier: no props floating in it.
    if (Math.abs(x - 528) < radius + 54) continue;
    const neighbors = decor.filter((p) => Math.hypot(p.x - x, p.y - y) < 130);
    const frames = [1, 2, 3].filter((frame) => neighbors.every((p) => p.frame !== frame));
    if (!frames.length) continue;
    decor.push({
      x,
      y,
      radius,
      scale,
      frame: frames[Math.floor(random() * frames.length)],
      flipX: random() < 0.5,
      angle: random() * 8 - 4,
      tint: [0xffffff, 0xf1f4e9, 0xe7efe4][Math.floor(random() * 3)],
      foreground: y > 540,
    });
  }
  const edges = [96, ...LANES.flatMap((y) => [y - 36, y + 36]), 552];
  const banks = [0, 2, 4, 6].map((i) => ({
    left: 480,
    right: 576,
    top: edges[i],
    bottom: edges[i + 1],
  }));
  return { bridges: LANES.map((y) => ({ x: 528, y })), banks, decor };
}
