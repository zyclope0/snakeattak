import { setText } from '../../i18n/dom.ts';
import { byId, make, refreshText } from '../dom.ts';
import * as TEXT from '../../texts/fr/voyageScreens.ts';

/** A stage on the board: its mark, and once it is over what to say and the one way on. */
export type StageOnBoard = {
  mark: string;
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
  const mark = make('p', { id: 'voyage-mark' });
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
    refreshText(mark, stage.mark);
    // The camp of a stage is not saved between its waves: the usual status would say it is.
    setText(byId('save-status'), stage.kept ?? TEXT.leVoyageEstGardeEntreDeuxEtapes);
    if (!stage.outcome) return;
    refreshText(note, stage.outcome.note);
    refreshText(button, stage.outcome.button);
  };
}
