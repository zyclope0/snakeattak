import * as DEPTH from './boardLayers.ts';

/** Board units of height in one unit of depth: the 620 of the board never reach the next layer. */
const HEIGHT_PER_DEPTH = 1000;

/**
 * Depth of what stands on the board, fighters and foreground scenery alike: lower on the
 * screen is nearer, so it is drawn in front.
 */
export function standingDepth(y: number): number {
  return DEPTH.standing + y / HEIGHT_PER_DEPTH;
}

/** Eggs lie under the fighters and sort among themselves the same way. */
export function eggDepth(y: number): number {
  return DEPTH.eggs + y / HEIGHT_PER_DEPTH;
}
