import { canSpend } from './capriceBudget.ts';
import { setAttribute as setDisplayAttribute, setText as setDisplayText } from '../i18n/dom.ts';
import './craftSurfaces.css';
import { weakLaneAdvice } from './placementAdvice.ts';
import type { Session } from '../session.ts';
import type { createCareer } from '../progression.ts';
import type { Kind } from '../data.ts';
import { kinds } from '../data.ts';
import { DEFAULT_ROSTERS } from '../roster.ts';
import { dockKinds } from './dockModel.ts';
import { portraitStyle } from '../art.ts';
import { FEAST_CHOICES, feastButton } from './feastControls.ts';
import { byId, decoration, forwardClick, make, refreshText, setPressed } from './dom.ts';
import { focusBoard } from './battleDom.ts';
import { battleOver } from './battleState.ts';

type Career = ReturnType<typeof createCareer>;
type AllyShortcut = ReturnType<typeof allyShortcut>;
type HoneyShortcut = ReturnType<typeof honeyShortcut>;

/** Four shortcuts, not a second catalogue or a second source of recruitment rules. */
export function bindBattleDock(
  session: Session,
  career: Career | undefined,
  refresh: () => void,
  openToolHelp: () => void,
) {
  const status = byId('dock-mode');
  forwardClick('dock-catalogue', 'reinforcements-toggle');
  const cancel = byId<HTMLButtonElement>('dock-cancel');
  const help = byId<HTMLButtonElement>('dock-tool-help');
  help.onclick = openToolHelp;
  cancel.onclick = () => {
    session.selectUnit(null);
    refresh();
    focusBoard();
  };
  const allies = Array.from({ length: 4 }, () => allyShortcut(session, refresh));
  const pots = FEAST_CHOICES.map((choice) => honeyShortcut(session, choice, refresh));
  return () => {
    const favourites = dockKinds(session.game, activeRoster(career));
    allies.forEach((ally, i) => showAlly(ally, favourites[i], session));
    for (const pot of pots) showPot(pot, session);
    const placing = !!session.selected || !!session.selectedFeast;
    cancel.hidden = !placing;
    cancel.disabled = !placing;
    help.hidden = placing;
    refreshText(status, dockHint(session));
  };
}

const activeRoster = (career: Career | undefined) =>
  career ? career.state.rosters[career.state.activeRoster] : DEFAULT_ROSTERS[0];

/** An empty card: `showAlly` gives it the ally of its place among the favourites. */
function allyShortcut(session: Session, refresh: () => void) {
  const portrait = decoration('span', 'portrait');
  const name = make('span', { className: 'dock-name' });
  const price = make('small', { className: 'dock-price' });
  const button = make('button', { className: 'dock-card' }, portrait, name, price);
  button.onclick = () => {
    if (button.disabled) return;
    const kind = button.dataset.dockKind as Kind;
    session.selectUnit(session.selected === kind ? null : kind);
    refresh();
    focusBoard();
  };
  byId('dock-allies').append(button);
  return { button, portrait, name, price };
}

function honeyShortcut(
  session: Session,
  choice: (typeof FEAST_CHOICES)[number],
  refresh: () => void,
) {
  const button = feastButton(choice);
  button.dataset.dockFeast = choice.value;
  setDisplayAttribute(
    button,
    'aria-label',
    choice.label + ' : choisir le miel puis toucher un chemin',
  );
  button.onclick = () => {
    if (button.disabled) return;
    session.selectFeast(session.selectedFeast === choice.value ? null : choice.value);
    refresh();
    focusBoard();
  };
  byId('dock-honey').append(button);
  return { button, flavor: choice.value };
}

function showAlly(card: AllyShortcut, kind: Kind | undefined, session: Session) {
  const game = session.game;
  card.button.hidden = !kind;
  if (!kind) return;
  if (card.button.dataset.dockKind !== kind) {
    card.button.dataset.dockKind = kind;
    card.portrait.style.cssText = portraitStyle(kind);
    setDisplayText(card.name, kinds[kind].name);
  }
  const cost = game.recruitCost(kind);
  setDisplayText(card.price, cost === 0 ? 'Offert' : cost + ' ●');
  card.button.disabled = game.paused || battleOver(game) || !canSpend(game, cost);
  setPressed(card.button, session.selected === kind);
  setDisplayAttribute(
    card.button,
    'aria-label',
    `${kinds[kind].name}, ${cost === 0 ? 'offert' : cost + ' pièces'}${!canSpend(game, cost) ? (game.caprice.reserve ? ', réserve bancaire protégée' : ', pas assez de pièces') : ''}`,
  );
}

function showPot({ button, flavor }: HoneyShortcut, session: Session) {
  const game = session.game;
  button.disabled = game.paused || game.caprice.noHoney || game.feastUsed || battleOver(game);
  setPressed(button, session.selectedFeast === flavor);
}

/** One short line: what the hand is doing, else the lane to reinforce, else the honey. */
function dockHint(session: Session): string {
  const game = session.game;
  if (session.actionHint !== null) return session.actionHint;
  if (session.selectedFeast) return 'Touche un chemin';
  if (session.selected) return 'Place ton allié';
  const weakLane = weakLaneAdvice(game);
  if (weakLane !== null) return weakLane;
  if (game.caprice.noHoney) return 'Pas de miel dans ce caprice';
  return game.feastUsed ? 'Miel utilisé' : 'Tes favoris';
}
