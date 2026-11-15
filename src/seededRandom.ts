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
