import type { MissionRun } from './missions.ts';
import { LANE_IDS } from './ai.ts';
import * as TEXT from './texts/fr/adventure.ts';
const center = Object.freeze([1]);
const upper = Object.freeze([0, 1]);
const lower = Object.freeze([1, 2]);
/** Versioned rule. No random draw: preview, eggs, spawn and AI share this mask. */
export function activeEnemyLanes(run: MissionRun | null, local: number): readonly number[] {
  if (run?.rules !== 2 || run.missionId !== 'refuge') return LANE_IDS;
  if (!Number.isInteger(local) || local < 1 || local > 3)
    throw new RangeError(TEXT.invalidTutorialWave);
  return local === 1 ? center : local === 2 ? (run.seed % 2 ? upper : lower) : LANE_IDS;
}
