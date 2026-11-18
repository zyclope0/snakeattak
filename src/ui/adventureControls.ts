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
  // The same action within reach during the wave, where the launch button was: in the camp
  // actions alone it took four taps, and a child never found it.
  const quick = byId<HTMLButtonElement>('encourage-quick');
  encourage.onclick = quick.onclick = () => {
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
    const ready = campToolModel(g, 'encourage').ready,
      encouraged = g.encouragementRemaining > 0;
    encourage.disabled = isPaused() || !ready;
    // Shown while it can be used in this wave, then while it lasts; gone once it is spent.
    quick.hidden = g.status !== 'fighting' || !(ready || encouraged);
    quick.disabled = isPaused() || !ready;
    setDisplayText(
      quick,
      encouraged ? fill(TEXT.encouragesNS, Math.ceil(g.encouragementRemaining)) : TEXT.encourager,
    );
    setDisplayText(
      status,
      encouraged
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
