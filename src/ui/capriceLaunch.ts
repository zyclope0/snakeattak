import { Game } from '../game.ts';
import { readMissionRun, type MissionRun } from '../missions.ts';
import type { Kind } from '../data.ts';
import type { createMissionProgressController } from '../missionProgress.ts';
import { canLaunchCaprice } from './capriceGate.ts';
/** Validate the entire proposal before the assembly changes a camp, progress or owner. */
export function prepareMissionLaunch(
  raw: MissionRun,
  chosen: readonly Kind[],
  progress: ReturnType<typeof createMissionProgressController>,
): Game | null {
  if (!Array.isArray(chosen)) return null;
  const run = readMissionRun(raw);
  if (
    !run ||
    !canLaunchCaprice(
      run,
      progress.unlocked(run.missionId),
      progress.state.bestStars[run.missionId],
    )
  )
    return null;
  const next = new Game(run.seed, undefined, run);
  if (chosen.length && !next.chooseCapriceKinds(chosen)) return null;
  return next;
}
