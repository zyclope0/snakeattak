import { setText as setDisplayText } from '../i18n/dom.ts';
import { heroTrainingState } from './campToolModel.ts';
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
        session.trainHero(b.dataset.training as 'force' | 'guard');
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
    setDisplayText(
      status,
      g.encouragementRemaining > 0
        ? `Encouragés · ${Math.ceil(g.encouragementRemaining)} s`
        : g.encouragementUsed
          ? 'Revient à la prochaine vague'
          : '1 fois par vague · attaques plus rapides pendant 8 s',
    );
    const training = heroTrainingState(g);
    for (const b of choices) b.disabled = g.paused || !training.ready;
    setDisplayText(document.getElementById('training-status')!, training.status);
  };
}
