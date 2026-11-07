/** Immutable terrain data shared by simulation and renderer; never an active global map. */
export type Rock = Readonly<{ x: number; y: number; r: number }>;
export type Level = Readonly<{
  id: string;
  artId?: 'clearing' | 'grove' | 'ruins';
  layout?: Readonly<{
    junctions: readonly [number, number];
    curves: readonly [number, number, number];
  }>;
  name: string;
  subtitle: string;
  palette: Readonly<{
    ground: number;
    path: number;
    foliage: number;
    stone: number;
    accent: number;
  }>;
  rocks: readonly Rock[];
}>;
const levels: readonly Level[] = [
  {
    id: 'clearing',
    name: 'La clairière des fougères',
    subtitle: 'Vagues 1 à 4 · Les premiers passages',
    palette: {
      ground: 0x91a66d,
      path: 0xc3ac7f,
      foliage: 0x416148,
      stone: 0x8c9381,
      accent: 0xd9cb87,
    },
    rocks: [
      { x: 720, y: 216, r: 31 },
      { x: 864, y: 432, r: 32 },
      { x: 648, y: 480, r: 26 },
    ],
  },
  {
    id: 'grove',
    name: 'Le bosquet ambré',
    subtitle: 'Vagues 5 à 8 · Les rouages se réveillent',
    palette: {
      ground: 0xa0a370,
      path: 0xc9ad80,
      foliage: 0x655d3d,
      stone: 0x99917b,
      accent: 0xe0ad63,
    },
    rocks: [
      { x: 756, y: 180, r: 30 },
      { x: 840, y: 384, r: 30 },
      { x: 636, y: 420, r: 25 },
    ],
  },
  {
    id: 'ruins',
    name: 'Le jardin des vieilles pierres',
    subtitle: 'Vagues 9 à 12 · Le dernier rempart',
    palette: {
      ground: 0x7f9c83,
      path: 0xb5b298,
      foliage: 0x3d6056,
      stone: 0x879a94,
      accent: 0xb5cbd0,
    },
    rocks: [
      { x: 780, y: 468, r: 30 },
      { x: 900, y: 240, r: 31 },
      { x: 636, y: 252, r: 25 },
    ],
  },
];
for (const level of levels) {
  Object.freeze(level.palette);
  level.rocks.forEach(Object.freeze);
  Object.freeze(level.rocks);
  Object.freeze(level);
}
export function levelForWave(wave: number): Level {
  const chapter = Number.isFinite(wave) ? Math.max(0, Math.min(2, Math.floor((wave - 1) / 4))) : 0;
  return levels[chapter];
}

/** Bounded, reproducible mission maps; art is shared, collision identities are unique. */
const missionLevels: readonly Level[] = [
  {
    ...levels[0],
    id: 'mission-clearing-0',
    artId: 'clearing',
    name: 'La clairière des détours',
    subtitle: 'Expédition · Les détours des fougères',
    layout: { junctions: [336, 672], curves: [34, -30, -36] },
    rocks: [
      { x: 816, y: 120, r: 25 },
      { x: 900, y: 380, r: 28 },
      { x: 636, y: 528, r: 25 },
    ],
  },
  {
    ...levels[0],
    id: 'mission-clearing-1',
    artId: 'clearing',
    name: 'La clairière des méandres',
    subtitle: 'Expédition · Les longs méandres',
    layout: { junctions: [396, 720], curves: [-36, 32, 38] },
    rocks: [
      { x: 816, y: 252, r: 29 },
      { x: 912, y: 408, r: 25 },
      { x: 636, y: 120, r: 24 },
    ],
  },
  {
    ...levels[0],
    id: 'mission-clearing-2',
    artId: 'clearing',
    name: 'Le carrefour des fougères',
    subtitle: 'Expédition · Les carrefours rapprochés',
    layout: { junctions: [360, 648], curves: [42, 38, -30] },
    rocks: [
      { x: 780, y: 120, r: 24 },
      { x: 900, y: 264, r: 26 },
      { x: 816, y: 528, r: 28 },
    ],
  },
];
for (const level of missionLevels) {
  Object.freeze(level.layout!.junctions);
  Object.freeze(level.layout!.curves);
  Object.freeze(level.layout);
  level.rocks.forEach(Object.freeze);
  Object.freeze(level.rocks);
  Object.freeze(level);
}
export function missionLevel(layout: 0 | 1 | 2): Level {
  return missionLevels[layout];
}
