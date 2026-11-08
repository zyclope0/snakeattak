import type { Session } from '../session.ts';
import type { createCareer } from '../progression.ts';
import type { Kind } from '../data.ts';
import { kinds } from '../data.ts';
import { DEFAULT_ROSTERS } from '../roster.ts';
import { dockKinds } from './dockModel.ts';
import { portraitStyle } from '../art.ts';
import { FEAST_CHOICES, feastPot } from './feastControls.ts';

/** Four shortcuts, not a second catalogue or a second source of recruitment rules. */
export function bindBattleDock(
  session: Session,
  career: ReturnType<typeof createCareer> | undefined,
  refresh: () => void,
) {
  const container = document.getElementById('dock-allies')!;
  const status = document.getElementById('dock-mode')!;
  const focusBoard = () => document.getElementById('game')!.focus({ preventScroll: true });
  document.getElementById('dock-catalogue')!.onclick = () =>
    document.getElementById('reinforcements-toggle')!.click();
  const cancel = document.getElementById('dock-cancel') as HTMLButtonElement;
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
    button.setAttribute('aria-label', flavor.label + ' : choisir le miel puis toucher un chemin');
    button.append(feastPot(flavor.value), document.createTextNode(flavor.label));
    button.onclick = () => {
      if (button.disabled) return;
      session.selectFeast(session.selectedFeast === flavor.value ? null : flavor.value);
      refresh();
      focusBoard();
    };
    document.getElementById('dock-honey')!.append(button);
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
        card.name.textContent = kinds[kind].name;
      }
      const cost = game.recruitCost(kind);
      card.price.textContent = cost === 0 ? 'Offert' : cost + ' ●';
      card.button.disabled =
        game.paused || game.status === 'won' || game.status === 'lost' || game.gold < cost;
      card.button.setAttribute('aria-pressed', String(session.selected === kind));
      card.button.setAttribute(
        'aria-label',
        `${kinds[kind].name}, ${cost === 0 ? 'offert' : cost + ' pièces'}${game.gold < cost ? ', pas assez de pièces' : ''}`,
      );
    });
    for (const { button, flavor } of pots) {
      button.disabled =
        game.paused || game.feastUsed || game.status === 'won' || game.status === 'lost';
      button.setAttribute('aria-pressed', String(session.selectedFeast === flavor));
    }
    cancel.disabled = !session.selected && !session.selectedFeast;
    const hint =
      session.actionHint ??
      (session.selectedFeast
        ? 'Touche un chemin'
        : session.selected
          ? 'Place ton allié'
          : game.feastUsed
            ? 'Miel utilisé'
            : 'Tes favoris');
    if (status.textContent !== hint) status.textContent = hint;
  };
}
