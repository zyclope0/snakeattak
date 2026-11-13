/**
 * Depth of what stands on the board, fighters and foreground scenery alike: lower on the
 * screen is nearer, so it is drawn in front.
 */
export function standingDepth(y: number): number {
  return 10 + y / 1000;
}
