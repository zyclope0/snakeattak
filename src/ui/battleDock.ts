import { canSpend } from './capriceBudget.ts';
import {
  setAttribute as setDisplayAttribute,
  createTextNode as copyTextNode,
  setText as setDisplayText,
} from '../i18n/dom.ts';
import './craftSurfaces.css';
import { weakLaneAdvice } from './placementAdvice.ts';
import type { Session } from '../session.ts';
import type { createCareer } from '../progression.ts';
import type { Kind } from '../data.ts';
import { kinds } from '../data.ts';
import { DEFAULT_ROSTERS } from '../roster.ts';
import { dockKinds } from './dockModel.ts';
import { portraitStyle } from '../art.ts';
import { FEAST_CHOICES, feastPot } from './feastControls.ts';
import { byId } from './dom.ts';
/** Four shortcuts, not a second catalogue or a second source of recruitment rules. */
export function bindBattleDock(
  session: Session,
  career: ReturnType<typeof createCareer> | undefined,
  refresh: () => void,
  openToolHelp: () => void,
) {
  const container = byId('dock-allies');
  const status = byId('dock-mode');
  const focusBoard = () => byId('game').focus({ preventScroll: true });
  byId('dock-catalogue').onclick = () => byId('reinforcements-toggle').click();
  const cancel = byId<HTMLButtonElement>('dock-cancel');
  const help = byId<HTMLButtonElement>('dock-tool-help');
  help.onclick = openToolHelp;
  cancel.onclick = () => {
    session.selectUnit(null);
    refresh();
    focusBoard();
  };
  const cards = Array.from({ length: 4 }, () => {
    const button = document.createElement('button');
    const portrait = document.createElement('span');
    const name = document.createElement('span');
    const price = document.createElement('small');
    button.className = 'dock-card';
    portrait.className = 'portrait';
    portrait.setAttribute('aria-hidden', 'true');
    name.className = 'dock-name';
    price.className = 'dock-price';
    button.append(portrait, name, price);
    button.onclick = () => {
      if (button.disabled) return;
      const kind = button.dataset.dockKind as Kind;
      session.selectUnit(session.selected === kind ? null : kind);
      refresh();
      focusBoard();
    };
    container.append(button);
    return { button, portrait, name, price };
  });
  const pots = FEAST_CHOICES.map((flavor) => {
    const button = document.createElement('button');
    button.dataset.dockFeast = flavor.value;
    setDisplayAttribute(
      button,
      'aria-label',
      flavor.label + ' : choisir le miel puis toucher un chemin',
    );
    button.append(feastPot(flavor.value), copyTextNode(flavor.label));
    button.onclick = () => {
      if (button.disabled) return;
      session.selectFeast(session.selectedFeast === flavor.value ? null : flavor.value);
      refresh();
      focusBoard();
    };
    byId('dock-honey').append(button);
    return { button, flavor: flavor.value };
  });
  return () => {
    const game = session.game,
      state = career?.state;
    const selected = dockKinds(
      game,
      state ? state.rosters[state.activeRoster] : DEFAULT_ROSTERS[0],
    );
    cards.forEach((card, i) => {
      const kind = selected[i];
      card.button.hidden = !kind;
      if (!kind) return;
      if (card.button.dataset.dockKind !== kind) {
        card.button.dataset.dockKind = kind;
        card.portrait.style.cssText = portraitStyle(kind);
        setDisplayText(card.name, kinds[kind].name);
      }
      const cost = game.recruitCost(kind);
      setDisplayText(card.price, cost === 0 ? 'Offert' : cost + ' ●');
      card.button.disabled =
        game.paused || game.status === 'won' || game.status === 'lost' || !canSpend(game, cost);
      card.button.setAttribute('aria-pressed', String(session.selected === kind));
      setDisplayAttribute(
        card.button,
        'aria-label',
        `${kinds[kind].name}, ${cost === 0 ? 'offert' : cost + ' pièces'}${!canSpend(game, cost) ? (game.caprice.reserve ? ', réserve bancaire protégée' : ', pas assez de pièces') : ''}`,
      );
    });
    for (const { button, flavor } of pots) {
      button.disabled =
        game.paused ||
        game.caprice.noHoney ||
        game.feastUsed ||
        game.status === 'won' ||
        game.status === 'lost';
      button.setAttribute('aria-pressed', String(session.selectedFeast === flavor));
    }
    const placing = !!session.selected || !!session.selectedFeast;
    cancel.hidden = !placing;
    cancel.disabled = !placing;
    help.hidden = placing;
    const hint =
      session.actionHint ??
      (session.selectedFeast
        ? 'Touche un chemin'
        : session.selected
          ? 'Place ton allié'
          : (weakLaneAdvice(game) ??
            (game.caprice.noHoney
              ? 'Pas de miel dans ce caprice'
              : game.feastUsed
                ? 'Miel utilisé'
                : 'Tes favoris')));
    if (status.textContent !== hint) setDisplayText(status, hint);
  };
}
