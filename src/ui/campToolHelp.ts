import type { Session } from '../session.ts';
import { portraitStyle } from '../art.ts';
import { feastIconStyle } from './feastControls.ts';
import { CAMP_TOOLS, campToolModel, type CampTool } from './campToolModel.ts';
import { pauseForDialog } from './dialogs.ts';
import './campToolHelp.css';

export function bindCampToolHelp(session: Session, refresh: () => void) {
  const el = (id: string) => document.getElementById(id)!;
  const dialog = el('camp-tool-dialog') as HTMLDialogElement;
  const modal = pauseForDialog(dialog, session, refresh);
  const portrait = matchMedia('(pointer: coarse) and (orientation: portrait)');
  portrait.addEventListener('change', () => {
    if (portrait.matches && dialog.open) modal.close();
  });
  let selected: CampTool = 'honey';
  const labels = ['Miel', 'Encourager', 'Réparer', 'Héros'];
  const illustrations = [feastIconStyle('lure'), portraitStyle('club'), '', portraitStyle('hero')];
  const buttons = CAMP_TOOLS.map((tool, index) => {
    const button = document.createElement('button');
    button.dataset.campTool = tool;
    button.textContent = labels[index];
    button.onclick = () => {
      selected = tool;
      show();
    };
    el('camp-tool-topics').append(button);
    return button;
  });
  function show() {
    const help = campToolModel(session.game, selected);
    for (const field of ['title', 'when', 'gesture', 'result', 'status'] as const)
      el('camp-tool-' + field).textContent = help[field];
    el('camp-tool-cost').textContent = help.cost === 0 ? 'Gratuit' : `${help.cost} pièces`;
    el('camp-tool-picture').style.cssText = illustrations[CAMP_TOOLS.indexOf(selected)];
    el('camp-tool-picture').dataset.tool = selected;
    buttons.forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.campTool === selected)),
    );
  }
  const open = () => {
    show();
    modal.open();
  };
  el('camp-tool-help').onclick = open;
  el('close-camp-tool-help').onclick = modal.close;
  return open;
}
