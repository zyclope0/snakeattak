/**
 * The layers of the board, from the ground up. Every `setDepth` of the battle reads this
 * table (`import * as DEPTH from './boardLayers.ts'`): to slip a layer between two others,
 * look here, not in ten files. A higher number is drawn in front. What stands on the board
 * (fighters, foreground scenery, eggs) also sorts by its height on the screen, lower being
 * nearer: see `boardDepth.ts`.
 */
export const terrain = 0;
/** The honey spread on a road, under everything that walks on it. */
export const honeyZone = 7.5;
/** Eggs, sorted among themselves by `eggDepth`. */
export const eggs = 8;
/** Glows around the dens and the refuge, and the honey pot put down on the road. */
export const strongholdEffects = 9;
export const honeyPot = 9;
export const dens = 9.4;
export const feastLabel = 9.5;
/** Just under the fighters: every legal defender stays visible beside the gate. */
export const refuge = 9.6;
export const flightShadows = 9.65;
/** Shadows of the fighters and the marks the king draws on the ground. */
export const groundMarks = 9.7;
/** Fighters and foreground scenery, sorted by `standingDepth`. */
export const standing = 10;
/** Lines drawn over the fighters: ranges, placement, trails. */
export const ink = 15;
export const refugeDetails = 15.1;
/** The dark plate behind the words of the refuge, drawn under them. */
export const refugePlate = 15.15;
export const refugeLabel = 15.2;
export const medicalStation = 15.4;
/** Warnings above the fight: the next threats and the king's protection. */
export const warnings = 16;
export const threatIcons = 16.1;
export const threatCounts = 16.2;
/** Small words that follow a fighter: care, the king's court. */
export const signalLabels = 17;
export const sparks = 21;
export const feedback = 22;
/** The king's name and the words of an encounter. */
export const feedbackLabels = 23;
/** Numbers and words that rise from a blow or a reward, in front of every other word. */
export const floatingWords = 24;
/** The end of a battle covers the whole board. */
export const resultOverlay = 100;
