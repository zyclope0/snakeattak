import { setText } from '../../i18n/dom.ts';
import { frenchLeaf } from '../capriceCopy.ts';
import { byId, make, refreshText } from '../dom.ts';
import * as TEXT from '../../texts/fr/voyageScreens.ts';

/** A stage on the board: its mark, and once it is over what to say and the one way on. */
export type StageOnBoard = {
  mark: string;
  /** The challenge of the step, in the son's French words: the board names it, phones too. */
  defi?: string;
  outcome: { note: string; button: string } | null;
  /** What the status line says is kept; the voyage's words when absent. */
  kept?: string;
};

/**
 * The voyage on the battle screen. A small mark on the board says, all through a stage, that
 * this is a voyage and which stage it is; when the stage ends, the result panel gets one
 * sentence and one button. Returns the function that redraws both; nothing shows for a
 * game that is not a stage.
 */
export function voyageBattle(onward: () => void): (stage: StageOnBoard | null) => void {
  const step = make('span', { id: 'voyage-mark-step' });
  const defi = frenchLeaf('span', '');
  defi.id = 'voyage-mark-defi';
  const mark = make('p', { id: 'voyage-mark' }, step, defi);
  byId('game').before(mark);
  const note = make('p', { id: 'voyage-result-note' });
  const button = make('button', { id: 'voyage-continue', className: 'primary' });
  const result = make('div', { id: 'voyage-result' }, note, button);
  byId('battle-result-content').append(result);
  button.onclick = onward;
  return (stage) => {
    mark.hidden = !stage;
    result.hidden = !stage?.outcome;
    if (!stage) return;
    refreshText(step, stage.mark);
    defi.hidden = !stage.defi;
    defi.textContent = stage.defi ?? '';
    // The camp of a stage is not saved between its waves: the usual status would say it is.
    setText(byId('save-status'), stage.kept ?? TEXT.leVoyageEstGardeEntreDeuxEtapes);
    if (!stage.outcome) return;
    refreshText(note, stage.outcome.note);
    refreshText(button, stage.outcome.button);
  };
}
