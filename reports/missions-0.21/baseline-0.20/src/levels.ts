/** Immutable terrain data shared by simulation and renderer; never an active global map. */
export type Rock = Readonly<{ x: number; y: number; r: number }>;
export type Level = Readonly<{
  id: 'clearing' | 'grove' | 'ruins';
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
