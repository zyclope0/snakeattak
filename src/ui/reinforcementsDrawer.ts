import type { Session } from '../session.ts';
import { pauseForDialog } from './dialogs.ts';
import { pauseStateFor } from './pauseState.ts';
import { setText } from '../i18n/dom.ts';

/** A native catalogue owns a pause lease; selecting only prepares the existing action. */
export function bindReinforcementsDrawer(session: Session, refresh: () => void) {
  const panel = document.getElementById('reinforcements') as HTMLDialogElement;
  const toggle = document.getElementById('reinforcements-toggle')!;
  const close = document.getElementById('reinforcements-close')!;
  const modal = pauseForDialog(panel, session, refresh);
  const pauses = pauseStateFor(session);
  const tools = document.createElement('details');
  tools.id = 'catalog-tools';
  const label = document.createElement('summary');
  setText(label, 'Conseils et outils');
  const content = document.createElement('div');
  content.className = 'catalog-tools-body';
  tools.append(label, content);
  for (const child of Array.from(panel.children))
    if (child.matches('#camp-observation, .battle-footer, #quick-army, #camp-tools'))
      content.append(child);
  const body = document.createElement('div');
  body.className = 'catalog-body';
  body.append(document.getElementById('shop')!, tools);
  panel.append(body);
  let trigger: HTMLElement = toggle;
  const sync = () => toggle.setAttribute('aria-expanded', String(panel.open));
  let destination: HTMLElement = toggle;
  const hide = (board = false) => {
    destination = board ? document.getElementById('game')! : trigger;
    modal.close();
    sync();
  };
  toggle.onclick = () => {
    if (panel.open) {
      hide();
      return;
    }
    if (document.activeElement instanceof HTMLElement) trigger = document.activeElement;
    destination = trigger;
    tools.open = false;
    modal.open();
    sync();
    close.focus({ preventScroll: true });
  };
  close.onclick = () => hide();
  panel.addEventListener('close', () => {
    sync();
    if (!panel.open && !document.querySelector('dialog[open]'))
      destination.focus({ preventScroll: true });
  });
  for (const control of [
    document.getElementById('mobile-home'),
    document.getElementById('menu-home'),
    document.querySelector('#app .brand'),
  ])
    control?.addEventListener('click', () => hide());
  // Release this catalogue's lease before the ordinary handler invokes a guarded action.
  panel.addEventListener(
    'click',
    (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>(
        [
          '[data-kind]',
          '#reset',
          '#end-restart',
          '#repair',
          '[data-training]',
          '#encourage',
          '[data-feast-flavor]',
          '[data-feast-lane]',
          '#mission-back-map',
          '#mission-again',
          '#mission-next',
        ].join(','),
      );
      if (button && !button.disabled && panel.open) hide(true);
    },
    true,
  );
  panel.addEventListener('click', (event) => {
    if ((event.target as Element).closest('[data-kind]'))
      document.getElementById('game')!.focus({ preventScroll: true });
  });
  return {
    refresh: sync,
    actionsPaused: () =>
      document.hidden || (panel.open ? pauses.pausedAfterRelease() : session.game.paused),
  };
}
