import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import { portraitStyle } from '../art.ts';
import { feastIconStyle } from './feastControls.ts';
import { CAMP_TOOLS, campToolModel, type CampTool } from './campToolModel.ts';
import { pauseForDialog } from './dialogs.ts';
import './campToolHelp.css';
import { byId, portraitPhone } from './dom.ts';
export function bindCampToolHelp(session: Session, refresh: () => void) {
  const dialog = byId('camp-tool-dialog') as HTMLDialogElement;
  const modal = pauseForDialog(dialog, session, refresh);
  const portrait = portraitPhone();
  portrait.addEventListener('change', () => {
    if (portrait.matches && dialog.open) modal.close();
  });
  let selected: CampTool = 'honey';
  const labels = ['Miel', 'Encourager', 'Réparer', 'Héros'];
  const illustrations = [feastIconStyle('lure'), portraitStyle('club'), '', portraitStyle('hero')];
  const buttons = CAMP_TOOLS.map((tool, index) => {
    const button = document.createElement('button');
    button.dataset.campTool = tool;
    setDisplayText(button, labels[index]);
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
    setDisplayText(byId('camp-tool-cost'), help.cost === 0 ? 'Gratuit' : `${help.cost} pièces`);
    byId('camp-tool-picture').style.cssText = illustrations[CAMP_TOOLS.indexOf(selected)];
    byId('camp-tool-picture').dataset.tool = selected;
    buttons.forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.campTool === selected)),
    );
  }
  const open = () => {
    show();
    modal.open();
  };
  byId('camp-tool-help').onclick = open;
  byId('close-camp-tool-help').onclick = modal.close;
  return open;
}
