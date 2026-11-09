import { MISSIONS } from '../missions.ts';
import type { MissionId } from '../missions.ts';
import type { MissionProgress } from '../missionProgress.ts';

/** Presentation only. Availability always comes from the progression controller. */
export function missionJourney(
  bestStars: MissionProgress['bestStars'],
  unlocked: (id: MissionId) => boolean,
) {
  const next = MISSIONS.find((mission) => unlocked(mission.id) && !bestStars[mission.id])?.id;
  return MISSIONS.map((mission, index) => {
    const disabled = !unlocked(mission.id);
    const stars = bestStars[mission.id];
    const status = disabled
      ? 'locked'
      : stars > 0
        ? 'complete'
        : mission.id === next
          ? 'next'
          : 'available';
    return {
      id: mission.id,
      number: index + 1,
      stars,
      starLabel: `${stars} étoile${stars > 1 ? 's' : ''} sur 3`,
      disabled,
      status,
      label:
        status === 'locked'
          ? 'Verrouillée · termine la précédente'
          : status === 'complete'
            ? 'Terminée · rejouer'
            : status === 'next'
              ? 'Prochaine mission'
              : 'Mission ouverte',
      symbol:
        status === 'locked' ? '🔒' : status === 'complete' ? '✓' : status === 'next' ? '➜' : '○',
    };
  });
}
