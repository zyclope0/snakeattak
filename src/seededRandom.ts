/**
 * The one seeded draw of the game. A fight, a reward offer, a voyage and the scenery each keep
 * their own state but all step it the same way, so a seed, a starting code or a saved fight
 * always gives the same game. Changing a number here changes every game ever played or shared.
 */
const MULTIPLIER = 1664525;
const INCREMENT = 1013904223;
/** One more than the largest state: a state divided by it runs from 0 to just under 1. */
export const SEED_RANGE = 4294967296;

/** The state that follows `state`. */
export const nextSeed = (state: number): number => (Math.imul(state, MULTIPLIER) + INCREMENT) >>> 0;

/** A state as a share of the range, from 0 to just under 1. */
export const seedShare = (state: number): number => state / SEED_RANGE;

/** A private stream: each call steps its own state and returns its share. */
export function seededStream(seed: number): () => number {
  let state = seed;
  return () => seedShare((state = nextSeed(state)));
}

/**
 * Thirty-two well-stirred bits out of a seed and the number of a question: each question
 * asked of the same seed gets answers of its own. The voyage and the expedition ask this way.
 */
export function mixSeed(seed: number, salt: number): number {
  let hash = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** The private stream of one question asked of a seed: no fight shares it. */
export const questionStream = (seed: number, salt: number): (() => number) =>
  seededStream(mixSeed(seed, salt));

/** One of the list, by the next draw. */
export const pickOne = <T>(random: () => number, list: readonly T[]): T =>
  list[Math.floor(random() * list.length)];

/** Shuffles the list where it stands, from its last place to its second, and returns it. */
export function shuffle<T>(random: () => number, values: T[]): T[] {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}
