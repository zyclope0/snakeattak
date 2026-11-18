import { setText as setDisplayText } from '../i18n/dom.ts';
import { heroTrainingState, campToolModel } from './campToolModel.ts';
import type { Session } from '../session.ts';
import { byId } from './dom.ts';
import * as TEXT from '../texts/fr/home.ts';
import { fill } from '../texts/fill.ts';
/** How long the button that replaces « Lancer la vague » ignores a tap, after the wave began. */
const QUICK_GUARD_MS = 900;
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
  encourage.onclick = () => {
    session.game.encourage();
    refresh();
  };
  // It stands where « Lancer la vague » was a moment before: a second tap of the same
  // gesture must not spend it. It is held, not disabled: a disabled button loses the focus,
  // and the next press of the space bar would pause the game.
  let fightingSince = 0;
  quick.onclick = () => {
    if (quick.getAttribute('aria-disabled') === 'true') return;
    encourage.click();
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
    // It keeps its place for the whole wave, greyed once spent: a button that left in the
    // middle of a fight moved its neighbours under the finger.
    const fighting = g.status === 'fighting';
    if (!fighting) fightingSince = 0;
    else if (!fightingSince) fightingSince = performance.now();
    if (!fighting && document.activeElement === quick) byId('start').focus();
    quick.hidden = !fighting;
    const held = isPaused() || !ready || performance.now() - fightingSince < QUICK_GUARD_MS;
    quick.setAttribute('aria-disabled', String(held));
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
