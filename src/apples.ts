import { RIVER_LEFT_X, BRIDGE_END_X } from './boardLandmarks.ts';
import { endlessWave } from './endless.ts';
import { DEFAULT_SEED } from './gameConstants.ts';
import type { Level } from './levels.ts';
import type { MissionRun } from './missions.ts';
import { LANE_IDS } from './ai.ts';
import { junctionRoad, laneRoad, routeJunctions } from './routes.ts';
import { mixSeed, seededStream } from './seededRandom.ts';

/**
 * The apples of the hidden boss (decisions of the parent, 26 November 2026,
 * docs/BOSS-CACHE.md): during every third wave one clay apple shows at a discreet spot of the
 * board, a few seconds after the wave starts, and stays until the wave ends. A tap keeps it
 * for the player; twelve will open the hidden boss.
 *
 * Nothing here touches the battle: no coin, no strength, no draw of the game's own stream.
 * Where and when an apple shows is read from what the game already holds (its seed, its
 * wave, its terrain), through a stream of its own.
 */

/** An apple shows during every wave whose number is a multiple of this one. */
export const APPLE_EVERY_WAVES = 3;
/** The apples a player has to find to open the hidden boss. */
export const APPLES_TO_UNLOCK = 12;
/** Seconds of play after the start of its wave before the apple shows: from…to. */
export const APPLE_DELAY_SECONDS = Object.freeze({ least: 4, most: 15 });
/** Half the size the apple is drawn at, in board units. */
export const APPLE_RADIUS = 19;
/**
 * Where an apple may show, in the top band of the board, among the scenery: its two corners,
 * on either side of what the page writes over the middle (the lanes of the first expedition,
 * King Snake's gauge), and just under those words on the snakes' side. Away from the dens,
 * the river and the crystal, above the camp (a tap that places an ally never lands on the
 * apple), and never at the bottom, where the page announces what happens.
 */
export const APPLE_ZONES = Object.freeze([
  Object.freeze({ left: 172, right: 280, top: 46, bottom: 112 }),
  Object.freeze({ left: 300, right: 440, top: 96, bottom: 118 }),
  Object.freeze({ left: 830, right: 910, top: 46, bottom: 88 }),
]);
/** No apple nearer a road than its own size and this margin, as the scenery keeps. */
const ROAD_MARGIN = 43;
/** No apple nearer a prop of the scenery than both their sizes and this gap. */
const PROP_GAP = 6;
/** Tries drawn from the apple's stream before the spots are looked at one by one. */
const DRAWS = 48;
/** The step of that last look, in board units. */
const SCAN_STEP = 4;
/** Salt of the apple's stream: its draws are its own, whatever else the seed is asked. */
const APPLE_SALT = 0x706f6d6d;

export type Circle = Readonly<{ x: number; y: number; radius: number }>;
export type Apple = Readonly<{
  /** Its name in a player's book: the seed of the game and the wave, counted from the first. */
  id: string;
  /** The wave it shows in, counted from the very first one (the endless adventure goes on). */
  wave: number;
  x: number;
  y: number;
  /** Seconds of play after the start of its wave before it shows. */
  delay: number;
}>;
/** What the rule reads of a game: nothing it could change. */
export type AppleGame = Readonly<{
  wave: number;
  kings: number;
  endless: unknown;
  initialSeed: number | null;
  mission: Pick<MissionRun, 'seed'> | null;
  level: Level;
}>;

/** The wave being played counted from the first one: the endless adventure goes on counting. */
export const appleWave = (game: Pick<AppleGame, 'wave' | 'kings' | 'endless'>): number =>
  game.endless ? endlessWave(game.kings, game.wave) : game.wave;

/** True for a wave that has an apple. */
export const waveHasApple = (wave: number): boolean =>
  Number.isInteger(wave) && wave > 0 && wave % APPLE_EVERY_WAVES === 0;

/** The seed a game was started from: the one its terrain is drawn from too. */
export const appleSeed = (game: Pick<AppleGame, 'mission' | 'initialSeed'>): number =>
  (game.mission?.seed ?? game.initialSeed ?? DEFAULT_SEED) >>> 0;

/** The name of the apple of `wave` in a game started from `seed`. */
export const appleId = (seed: number, wave: number): string => `${seed >>> 0}:${wave}`;

/**
 * True for a spot where the apple stands clear of the roads, the river, the rocks and the
 * props, with `gap` between it and a rock or a prop.
 */
export function appleSpotClear(
  x: number,
  y: number,
  level: Level,
  props: readonly Circle[],
  gap = PROP_GAP,
  roads = roadsOf(level),
): boolean {
  if (x > RIVER_LEFT_X - APPLE_RADIUS && x < BRIDGE_END_X + APPLE_RADIUS) return false;
  if (roads.some((p) => Math.hypot(p.x - x, p.y - y) < APPLE_RADIUS + ROAD_MARGIN)) return false;
  if (level.rocks.some((r) => Math.hypot(r.x - x, r.y - y) < r.r + APPLE_RADIUS + gap))
    return false;
  return props.every((p) => Math.hypot(p.x - x, p.y - y) >= p.radius + APPLE_RADIUS + gap);
}

function roadsOf(level: Level) {
  return LANE_IDS.flatMap((lane) => laneRoad(lane, level)).concat(
    ...routeJunctions(level).map((x) => junctionRoad(x, level)),
  );
}

/**
 * The apple of the wave being played, or null for a wave without one. `props` are the props
 * of the scenery drawn on this board: the apple sits among them, never on one. Null too if
 * no spot were free (none was found on six terrains and thousands of seeds).
 */
export function appleOf(game: AppleGame, props: readonly Circle[]): Apple | null {
  const wave = appleWave(game);
  if (!waveHasApple(wave)) return null;
  const seed = appleSeed(game);
  const random = seededStream(mixSeed((seed ^ APPLE_SALT) >>> 0, wave));
  const { least, most } = APPLE_DELAY_SECONDS;
  const delay = least + random() * (most - least);
  const roads = roadsOf(game.level);
  const clear = (x: number, y: number, gap = PROP_GAP) =>
    appleSpotClear(x, y, game.level, props, gap, roads);
  const found = (x: number, y: number) =>
    Object.freeze({ id: appleId(seed, wave), wave, x, y, delay });
  for (let draw = 0; draw < DRAWS; draw++) {
    const zone = APPLE_ZONES[Math.floor(random() * APPLE_ZONES.length)];
    const x = zone.left + random() * (zone.right - zone.left);
    const y = zone.top + random() * (zone.bottom - zone.top);
    if (clear(x, y)) return found(x, y);
  }
  // Every spot of the zones in turn, from a corner that the stream picks; on a board crowded
  // with props, a spot that only touches one.
  const first = Math.floor(random() * APPLE_ZONES.length);
  for (const gap of [PROP_GAP, 0])
    for (let i = 0; i < APPLE_ZONES.length; i++) {
      const zone = APPLE_ZONES[(first + i) % APPLE_ZONES.length];
      for (let y = zone.top; y <= zone.bottom; y += SCAN_STEP)
        for (let x = zone.left; x <= zone.right; x += SCAN_STEP)
          if (clear(x, y, gap)) return found(x, y);
    }
  return null;
}
