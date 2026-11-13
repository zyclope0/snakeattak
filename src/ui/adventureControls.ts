import { setText as setDisplayText } from '../i18n/dom.ts';
import { heroTrainingState, campToolModel } from './campToolModel.ts';
import type { Session } from '../session.ts';
import { byId } from './dom.ts';
export function bindAdventureControls(
  session: Session,
  refresh: () => void,
  isPaused = () => session.game.paused,
) {
  const encourage = byId<HTMLButtonElement>('encourage');
  const status = byId('encourage-status');
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
    encourage.disabled = isPaused() || !campToolModel(g, 'encourage').ready;
    setDisplayText(
      status,
      g.encouragementRemaining > 0
        ? `Encouragés · ${Math.ceil(g.encouragementRemaining)} s`
        : g.encouragementUsed
          ? 'Revient à la prochaine vague'
          : '1 fois par vague · attaques plus rapides pendant 8 s',
    );
    const training = heroTrainingState(g);
    for (const b of choices) b.disabled = isPaused() || !training.ready;
    setDisplayText(byId('training-status'), training.status);
  };
}
