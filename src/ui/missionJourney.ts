import { MISSIONS } from '../missions.ts';
import type { MissionId } from '../missions.ts';
import type { MissionProgress } from '../missionProgress.ts';
import * as TEXT from '../texts/fr/missionScreens.ts';
import { fill } from '../texts/fill.ts';

type Status = 'locked' | 'complete' | 'next' | 'available';
const LABELS: Record<Status, string> = {
  locked: TEXT.verrouilleeTermineLaPrecedente,
  complete: TEXT.termineeRejouer,
  next: TEXT.prochaineMission,
  available: TEXT.missionOuverte,
};
const SYMBOLS: Record<Status, string> = {
  locked: '🔒',
  complete: '✓',
  next: '➜',
  available: '○',
};

function statusOf(disabled: boolean, stars: number, next: boolean): Status {
  if (disabled) return 'locked';
  if (stars > 0) return 'complete';
  return next ? 'next' : 'available';
}

/** Presentation only. Availability always comes from the progression controller. */
export function missionJourney(
  bestStars: MissionProgress['bestStars'],
  unlocked: (id: MissionId) => boolean,
) {
  const next = MISSIONS.find((mission) => unlocked(mission.id) && !bestStars[mission.id])?.id;
  return MISSIONS.map((mission, index) => {
    const disabled = !unlocked(mission.id);
    const stars = bestStars[mission.id];
    const status = statusOf(disabled, stars, mission.id === next);
    return {
      id: mission.id,
      number: index + 1,
      stars,
      starLabel: fill(TEXT.nEtoileNSur3, stars, stars > 1 ? 's' : ''),
      disabled,
      status,
      label: LABELS[status],
      symbol: SYMBOLS[status],
    };
  });
}
