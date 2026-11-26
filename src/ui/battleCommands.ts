import { setAttribute, setText } from '../i18n/dom.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { campToolModel } from './campToolModel.ts';
import { pauseStateFor } from './pauseState.ts';
import { byId, dialogOpen } from './dom.ts';
import { battleOver } from './battleState.ts';
import * as TEXT from '../texts/fr/battleScreens.ts';
import * as CAMP from '../texts/fr/camp.ts';
import { atKingCamp } from '../endless.ts';
import { clayWhenRoom } from './clayFit.ts';

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
  // « Rentrer avec mon record », in the camp after a king of the endless adventure: the record
  // is already written, the game stays saved; the child goes home.
  byId('endless-home').onclick = () => byId('menu-home').click();
  byId('pause').onclick = () => {
    if (!battleOver(session.game)) togglePause(session, refresh);
  };
  clayWhenRoom(byId('resume-game'));
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
    session.game.message = TEXT.placementAnnuleChoisisUnAllieOu;
    refresh();
  };
  return () => {
    const game = session.game;
    const finished = battleOver(game);
    const pause = byId<HTMLButtonElement>('pause');
    setText(pause, game.paused ? '▶' : 'Ⅱ');
    setAttribute(pause, 'aria-label', game.paused ? TEXT.reprendre : TEXT.mettreEnPause);
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

/** What uses the Space key itself: a control pressed, a field typed in. */
const TAKES_SPACE = 'button, select, input, textarea, summary, a, [contenteditable]';
function spacePauses(session: Session, target: EventTarget | null): boolean {
  const typing = target instanceof HTMLElement && target.closest(TAKES_SPACE);
  return session.screen === 'battle' && !battleOver(session.game) && !typing && !dialogOpen();
}

function togglePause(session: Session, refresh: () => void) {
  const pauses = pauseStateFor(session);
  if (session.game.paused) pauses.resume();
  else pauses.interrupt();
  refresh();
}

function showStart(game: Game) {
  const home = byId<HTMLButtonElement>('endless-home');
  home.hidden = !atKingCamp(game);
  home.disabled = game.paused;
  const start = byId<HTMLButtonElement>('start');
  const choosingBonus = game.rewards.pending !== null;
  start.disabled = game.status !== 'preparing' || game.paused || choosingBonus;
  // Presentation only: during a wave the launch button gives its place to the speed button.
  start.dataset.state = battleOver(game) ? 'ended' : choosingBonus ? 'reward' : game.status;
  setText(start, startLabel(game));
}

function startLabel(game: Game): string {
  if (battleOver(game)) return TEXT.partieTerminee;
  if (game.rewards.pending !== null) return TEXT.choisirUnBonus;
  if (game.status === 'fighting') return TEXT.vagueEnCours;
  if (atKingCamp(game)) return CAMP.continuer;
  return game.wave ? TEXT.vagueSuivante : TEXT.lancerLaVague;
}
