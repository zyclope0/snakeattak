import { capriceById, capriceUnlocked } from '../caprices.ts';
import type { MissionRun } from '../missions.ts';

/**
 * Whether this departure may start: its mission is open and its caprice, if any, belongs to it
 * and is unlocked by the stars. Kept apart from the preparation window, which loads on demand.
 */
export function canLaunchCaprice(run: MissionRun, missionOpen: boolean, stars: number) {
  const caprice = run.caprice ? capriceById(run.caprice) : null;
  return (
    missionOpen &&
    (!run.caprice ||
      (!!caprice && caprice.missionId === run.missionId && capriceUnlocked(caprice.tier, stars)))
  );
}
