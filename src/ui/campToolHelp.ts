import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import { portraitStyle } from '../art.ts';
import { feastIconStyle } from './feastControls.ts';
import { CAMP_TOOLS, campToolModel, type CampTool } from './campToolModel.ts';
import { pauseForDialog } from './dialogs.ts';
import './campToolHelp.css';
import { byId, make, portraitPhone, setPressed } from './dom.ts';
import * as TEXT from '../texts/fr/help.ts';
import { fill } from '../texts/fill.ts';

const LABELS: Record<CampTool, string> = {
  honey: TEXT.miel,
  encourage: TEXT.encourager,
  repair: TEXT.reparer,
  hero: TEXT.heros,
};

/** One window explains the four tools of the camp. Returns the function that opens it. */
export function bindCampToolHelp(session: Session, refresh: () => void) {
  const dialog = byId('camp-tool-dialog') as HTMLDialogElement;
  const modal = pauseForDialog(dialog, session, refresh);
  const portrait = portraitPhone();
  // Upright, the board and this window give way to the notice that asks to turn the device.
  portrait.addEventListener('change', () => {
    if (portrait.matches && dialog.open) modal.close();
  });
  let selected: CampTool = 'honey';
  // The repair has no picture of its own: the style sheet draws it from `data-tool`.
  const pictures: Record<CampTool, string> = {
    honey: feastIconStyle('lure'),
    encourage: portraitStyle('club'),
    repair: '',
    hero: portraitStyle('hero'),
  };
  const buttons = CAMP_TOOLS.map((tool) => {
    const button = make('button');
    button.dataset.campTool = tool;
    setDisplayText(button, LABELS[tool]);
    button.onclick = () => {
      selected = tool;
      show();
    };
    byId('camp-tool-topics').append(button);
    return button;
  });
  function show() {
    const help = campToolModel(session.game, selected);
    for (const field of ['title', 'when', 'gesture', 'result', 'status'] as const)
      setDisplayText(byId('camp-tool-' + field), help[field]);
    setDisplayText(
      byId('camp-tool-cost'),
      help.cost === 0 ? TEXT.gratuit : fill(TEXT.nPieces, help.cost),
    );
    byId('camp-tool-picture').style.cssText = pictures[selected];
    byId('camp-tool-picture').dataset.tool = selected;
    for (const button of buttons) setPressed(button, button.dataset.campTool === selected);
  }
  const open = () => {
    show();
    modal.open();
  };
  byId('camp-tool-help').onclick = open;
  byId('close-camp-tool-help').onclick = modal.close;
  return open;
}
