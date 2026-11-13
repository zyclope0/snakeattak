import type { Session } from '../session.ts';
import { pauseForDialog } from './dialogs.ts';
import { pauseStateFor } from './pauseState.ts';
import { setText } from '../i18n/dom.ts';
import { availableGold } from './capriceBudget.ts';
import { byId, dialogOpen, make } from './dom.ts';
import { focusBoard } from './battleDom.ts';
import { bankSummary } from './battleState.ts';

/** What the catalogue lets the player do at once: its own pause must not block these. */
const GUARDED_ACTIONS = [
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
].join(',');

/** A native catalogue owns a pause lease; selecting only prepares the existing action. */
export function bindReinforcementsDrawer(session: Session, refresh: () => void) {
  const panel = byId<HTMLDialogElement>('reinforcements');
  const toggle = byId('reinforcements-toggle');
  const close = byId('reinforcements-close');
  const modal = pauseForDialog(panel, session, refresh);
  const pauses = pauseStateFor(session);
  const { budget, tools } = arrangeCatalogue(panel);
  let trigger: HTMLElement = toggle;
  const sync = () => toggle.setAttribute('aria-expanded', String(panel.open));
  let destination: HTMLElement = toggle;
  const hide = (board = false) => {
    destination = board ? byId('game') : trigger;
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
    if (!panel.open && !dialogOpen()) destination.focus({ preventScroll: true });
  });
  for (const control of [
    document.getElementById('mobile-home'),
    document.getElementById('menu-home'),
    document.querySelector('#app .brand'),
  ])
    control?.addEventListener('click', () => hide());
  closeBeforeActions(panel, () => hide(true));
  return {
    refresh: () => {
      sync();
      const game = session.game;
      setText(budget, game.caprice.reserve ? bankSummary(game) : `${availableGold(game)} pièces`);
    },
    actionsPaused: () =>
      document.hidden || (panel.open ? pauses.pausedAfterRelease() : session.game.paused),
  };
}

/** An action chosen in the catalogue closes it first, and an ally goes to the board. */
function closeBeforeActions(panel: HTMLDialogElement, hideToBoard: () => void) {
  // Release this catalogue's lease before the ordinary handler invokes a guarded action.
  panel.addEventListener(
    'click',
    (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>(GUARDED_ACTIONS);
      if (button && !button.disabled && panel.open) hideToBoard();
    },
    true,
  );
  panel.addEventListener('click', (event) => {
    if ((event.target as Element).closest('[data-kind]')) focusBoard();
  });
}

/**
 * The page lists the catalogue flat. Put the coins beside its title, fold advice and camp
 * tools under one heading, and give the allies and that fold a body that scrolls.
 */
function arrangeCatalogue(panel: HTMLDialogElement) {
  const budget = make('span', { id: 'catalog-budget' });
  panel.querySelector('.army-title h2')!.after(budget);
  const content = make('div', { className: 'catalog-tools-body' });
  const tools = make(
    'details',
    { id: 'catalog-tools' },
    make('summary', { text: 'Conseils et outils' }),
    content,
  );
  for (const child of Array.from(panel.children))
    if (child.matches('#camp-observation, .battle-footer, #quick-army, #camp-tools'))
      content.append(child);
  panel.append(make('div', { className: 'catalog-body' }, byId('shop'), tools));
  return { budget, tools };
}
