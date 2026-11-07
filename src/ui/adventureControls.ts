import { missionById } from '../missions.ts';
import type { Session } from '../session.ts';
export function bindAdventureControls(session: Session, refresh: () => void) {
  const encourage = document.getElementById('encourage') as HTMLButtonElement;
  const status = document.getElementById('encourage-status')!;
  encourage.onclick = () => {
    session.game.encourage();
    refresh();
  };
  const choices = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-training]'));
  choices.forEach(
    (b) =>
      (b.onclick = () => {
        session.game.trainHero(b.dataset.training as 'force' | 'guard');
        refresh();
      }),
  );
  return () => {
    const g = session.game;
    encourage.disabled =
      g.paused ||
      g.status !== 'fighting' ||
      g.encouragementUsed ||
      !g.units.some((u) => u.kind !== 'wall' && u.kind !== 'medic' && u.kind !== 'nurse');
    status.textContent =
      g.encouragementRemaining > 0
        ? `Encouragés · ${Math.ceil(g.encouragementRemaining)} s`
        : g.encouragementUsed
          ? 'Revient à la prochaine vague'
          : '1 fois par vague · attaques plus rapides pendant 8 s';
    const trainingReady = g.mission
      ? missionById(g.mission.missionId)!.unlockRank >= 4
      : g.wave >= 4;
    const hero = g.units.find((u) => u.kind === 'hero' && u.hp > 0);
    for (const b of choices)
      b.disabled =
        g.paused ||
        g.status !== 'preparing' ||
        !trainingReady ||
        !hero ||
        g.campaign.training !== 'none' ||
        g.gold < 90;
    document.getElementById('training-status')!.textContent =
      g.campaign.training === 'force'
        ? 'Frappe renforcée · +15 % de dégâts du héros'
        : g.campaign.training === 'guard'
          ? 'Gardien · −15 % sur les coups et tirs reçus'
          : !hero
            ? 'Le héros est tombé. Aucun entraînement possible.'
            : !trainingReady
              ? 'Disponible après la vague 4'
              : '90 pièces · un seul entraînement pour ce détachement';
  };
}
