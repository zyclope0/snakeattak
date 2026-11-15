import { setText as setDisplayText } from '../i18n/dom.ts';
import { heroTrainingState, campToolModel } from './campToolModel.ts';
import type { Session } from '../session.ts';
import { byId } from './dom.ts';
import * as TEXT from '../texts/fr/home.ts';
import { fill } from '../texts/fill.ts';
/** Two actions of the camp: encourage the allies, train the hero. */
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
  for (const choice of choices)
    choice.onclick = () => {
      session.trainHero(choice.dataset.training as 'force' | 'guard');
      refresh();
    };
  return () => {
    const g = session.game;
    encourage.disabled = isPaused() || !campToolModel(g, 'encourage').ready;
    setDisplayText(
      status,
      g.encouragementRemaining > 0
        ? fill(TEXT.encouragesNS, Math.ceil(g.encouragementRemaining))
        : g.encouragementUsed
          ? TEXT.revientALaProchaineVague
          : TEXT.n1FoisParVagueAttaquesPlusRapides,
    );
    const training = heroTrainingState(g);
    for (const choice of choices) choice.disabled = isPaused() || !training.ready;
    setDisplayText(byId('training-status'), training.status);
  };
}
