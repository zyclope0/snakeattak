import { setAttribute, setText } from '../i18n/dom.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { campToolModel } from './campToolModel.ts';
import { pauseStateFor } from './pauseState.ts';
import { byId, dialogOpen } from './dom.ts';
import { battleOver } from './battleState.ts';

type Ports = {
  /** Runs just before a wave starts: the camp is saved as the player prepared it. */
  beforeWave: () => void;
  /** True while the actions of the camp must wait (pause, page in the background). */
  actionsPaused: () => boolean;
};

/** The commands of a battle: launch, pause, speed, repair, cancel. Returns their refresh. */
export function bindBattleCommands(session: Session, refresh: () => void, ports: Ports) {
  byId('start').onclick = () => {
    ports.beforeWave();
    session.game.startWave();
    refresh();
  };
  byId('pause').onclick = () => {
    if (!battleOver(session.game)) togglePause(session, refresh);
  };
  byId('resume-game').onclick = () => {
    if (battleOver(session.game)) return;
    pauseStateFor(session).resume();
    refresh();
  };
  byId('speed').onclick = () => {
    session.speed = session.speed === 1 ? 2 : 1;
    refresh();
  };
  byId('repair').onclick = () => {
    session.repair();
    refresh();
  };
  byId('cancel').onclick = () => {
    session.selectUnit(null);
    session.game.message = 'Placement annulé. Choisis un allié ou lance la vague.';
    refresh();
  };
  return () => {
    const game = session.game;
    const finished = battleOver(game);
    const pause = byId<HTMLButtonElement>('pause');
    setText(pause, game.paused ? '▶' : 'Ⅱ');
    setAttribute(pause, 'aria-label', game.paused ? 'Reprendre' : 'Mettre en pause');
    setText(byId('speed'), `×${session.speed}`);
    showStart(game);
    pause.disabled = finished;
    pause.hidden = finished;
    byId<HTMLButtonElement>('repair').disabled =
      ports.actionsPaused() || !campToolModel(game, 'repair').ready;
    byId('cancel').hidden = !session.selected && !session.selectedFeast;
  };
}

/** Escape drops the current choice. Space pauses, unless a control or a window has the key. */
export function bindBattleKeys(session: Session, refresh: () => void) {
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && !dialogOpen()) {
      session.selectUnit(null);
      refresh();
    }
    if (event.code !== 'Space' || !spacePauses(session, event.target)) return;
    event.preventDefault();
    togglePause(session, refresh);
  });
}

function spacePauses(session: Session, target: EventTarget | null): boolean {
  const typing =
    target instanceof HTMLElement &&
    target.closest('button, select, input, textarea, summary, a, [contenteditable]');
  return session.screen === 'battle' && !battleOver(session.game) && !typing && !dialogOpen();
}

function togglePause(session: Session, refresh: () => void) {
  const pauses = pauseStateFor(session);
  if (session.game.paused) pauses.resume();
  else pauses.interrupt();
  refresh();
}

function showStart(game: Game) {
  const start = byId<HTMLButtonElement>('start');
  const choosingBonus = game.rewards.pending !== null;
  start.disabled = game.status !== 'preparing' || game.paused || choosingBonus;
  // Presentation only: during a wave the launch button gives its place to the speed button.
  start.dataset.state = battleOver(game) ? 'ended' : choosingBonus ? 'reward' : game.status;
  setText(start, startLabel(game));
}

function startLabel(game: Game): string {
  if (battleOver(game)) return 'Partie terminée';
  if (game.rewards.pending !== null) return 'Choisir un bonus';
  if (game.status === 'fighting') return 'Vague en cours…';
  return game.wave ? 'Vague suivante' : 'Lancer la vague';
}
