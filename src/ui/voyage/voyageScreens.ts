import './voyage.css';
import type { Game } from '../../game.ts';
import type { RewardId } from '../../rewards.ts';
import {
  chooseBonus,
  recordStage,
  stageGame,
  voyagePhase,
  voyagePlanOf,
} from '../../voyageState.ts';
import type { VoyagePhase, VoyageState } from '../../voyageState.ts';
import { loadVoyageLog, logVoyage, saveVoyageLog } from '../../voyageStorage.ts';
import type { VoyageLog } from '../../voyageStorage.ts';
import type { ExpeditionDoor } from '../../expeditionLog.ts';
import { battleOver } from '../battleState.ts';
import { voyageToFinish } from '../voyageDoor.ts';
import type { VoyagePorts } from '../voyageDoor.ts';
import { capriceBubble } from './capriceBubble.ts';
import { bindExpeditionScreens } from './expedition/expeditionScreens.ts';
import { voyageBattle } from './voyageBattle.ts';
import type { StageOnBoard } from './voyageBattle.ts';
import { voyagePage } from './voyagePage.ts';
import type { VoyageView } from './voyagePage.ts';
import { arrivedView, bonusView, fallenView, mapView } from './voyageViews.ts';
import type { ViewActions } from './voyageViews.ts';
import { battleMark, keepingNote, recordLine, stageOutcome, voyageHeading } from './voyageWords.ts';
import * as EXPEDITION_TEXT from '../../texts/fr/expedition.ts';

/** A stage put on the board: which one it is and, once it is recorded, how it ended. */
type Playing = { game: Game; stage: number; stages: number; outcome: StageOnBoard['outcome'] };

/**
 * What the screens hold between two taps: the player's log and the stage on the board. Every
 * function of this module reads and changes this one record.
 */
type Screen = {
  readonly ports: VoyagePorts;
  readonly session: VoyagePorts['session'];
  readonly storage: VoyagePorts['storage'];
  /** Tells the door what to say next. */
  readonly logChanged: (log?: VoyageLog, expedition?: ExpeditionDoor) => void;
  log: VoyageLog;
  saved: boolean;
  playing: Playing | null;
  readonly page: ReturnType<typeof voyagePage>;
  readonly actions: ViewActions;
};
type Expedition = ReturnType<typeof bindExpeditionScreens>;

const VIEWS: Record<VoyagePhase, VoyageView> = {
  stage: 'map',
  bonus: 'bonus',
  arrived: 'arrived',
  fallen: 'fallen',
};

/**
 * The screens of « Le voyage », loaded when the door of the home is first touched. This
 * function holds the player's log and binds the screens to it, in order: the page and its
 * windows, the battle screen, then what each button asks of the voyage. Every draw and
 * every rule stays in the model (`voyageState.ts`): a button only asks for a transition,
 * and a refused one changes nothing. `logChanged` tells the door what to say next.
 */
export function bindVoyageScreens(
  ports: VoyagePorts,
  logChanged: (log?: VoyageLog, expedition?: ExpeditionDoor) => void,
) {
  const { session, storage } = ports;
  const log = loadVoyageLog(storage);
  const page = voyagePage();
  const explain = capriceBubble();
  // « La Grande Expédition » took the voyage's place (decision of the parent, 21 November
  // 2026): a voyage begun is finished here, then the door leads to the expedition. They share
  // the window of a caprice and the board's result panel.
  const expedition = bindExpeditionScreens(
    ports,
    (caprice) => explain(caprice, EXPEDITION_TEXT.leDefiDeLEtape),
    // Told on a tap, once the screens are bound: the voyage's log as it is then.
    (state) => logChanged(screen.log, state),
  );
  const drawBattle = voyageBattle(() => (expedition.owns() ? expedition.onward() : onward(screen)));
  const screen: Screen = {
    ports,
    session,
    storage,
    logChanged,
    log,
    saved: !!storage,
    playing: null,
    page,
    actions: {
      start: () => startStage(screen),
      explain,
      choose: (card) => choose(screen, card),
      expedition: () => expedition.open(),
    },
  };
  return voyageControls(screen, expedition, drawBattle);
}

/** What the door of the home asks of the screens. */
function voyageControls(
  screen: Screen,
  expedition: Expedition,
  drawBattle: (stage: StageOnBoard | null) => void,
) {
  const { ports, session } = screen;
  return {
    /** From the home: a voyage begun to finish, or else « La Grande Expédition ». */
    open() {
      if (!voyageToFinish(screen.log)) return expedition.open();
      show(screen);
      ports.navigate('voyage');
    },
    /** With every redraw of the page: the stage on the board, and its end once only. */
    refresh() {
      if (expedition.owns()) {
        drawBattle(expedition.battle());
        return;
      }
      drawBattle(stageOnBoard(screen));
    },
    /** « Recommencer » on the board: the stage under way starts again from its beginning. */
    restartStage() {
      const { playing } = screen;
      if (expedition.owns()) expedition.restartStage();
      else if (playing?.game === session.game && !playing.outcome) startStage(screen);
    },
  };
}

/** The stage on the board and its end, recorded once; null when the board shows none. */
function stageOnBoard(screen: Screen): StageOnBoard | null {
  const { session } = screen;
  const live = screen.playing?.game === session.game ? screen.playing : null;
  if (live && !live.outcome && battleOver(live.game)) live.outcome = recordOutcome(screen, live);
  return live && session.screen === 'battle'
    ? { mark: battleMark(live.stage, live.stages), outcome: live.outcome }
    : null;
}

/** Every transition ends here: the log follows, is stored, and the door is told. */
function commit(screen: Screen, next: VoyageState | null): boolean {
  const updated = next && logVoyage(screen.log, next);
  if (!updated) return false;
  screen.log = updated;
  screen.saved = saveVoyageLog(screen.storage, screen.log);
  screen.logChanged(screen.log);
  return true;
}
/** A new camp for the stage to play: a stage left halfway starts again from here. */
function startStage(screen: Screen) {
  const state = screen.log.current;
  const game = state && stageGame(state);
  if (!game) return;
  screen.playing = {
    game,
    stage: state.won + 1,
    stages: voyagePlanOf(state).stages.length,
    outcome: null,
  };
  screen.ports.play(game);
}
function choose(screen: Screen, card: RewardId) {
  const state = screen.log.current;
  if (!state || !commit(screen, chooseBonus(state, card))) return;
  show(screen);
  screen.page.focus();
}
/** The stage that has just ended enters the voyage; what the result panel then says. */
function recordOutcome(screen: Screen, live: Playing) {
  const after = screen.log.current && recordStage(screen.log.current, live.game);
  return after && commit(screen, after) ? stageOutcome(after, live.stage) : null;
}
/** « Continuer le voyage » : from the board to the choice of a bonus, or to the end. */
function onward(screen: Screen) {
  screen.ports.home();
  screen.ports.navigate('voyage');
  show(screen);
  // The bonus cards are drawn where « Continuer » was: a second tap must not choose one.
  screen.page.hold();
}
/** The stage on the board was begun and left: the map says that it starts again. */
function leftHalfway(screen: Screen) {
  const { playing, session } = screen;
  return (
    playing?.game === session.game &&
    !battleOver(playing.game) &&
    (playing.game.wave > 0 || session.hasPlaced)
  );
}
function content(screen: Screen, state: VoyageState): Node[] {
  const { actions } = screen;
  switch (voyagePhase(state)) {
    case 'stage':
      return mapView(state, leftHalfway(screen), actions);
    case 'bonus':
      return bonusView(state, actions);
    case 'arrived':
      return arrivedView(state, screen.log.best, actions);
    case 'fallen':
      return fallenView(state, screen.log.best, actions);
  }
}
/** Draws the view the voyage calls for. A voyage that is over shows its record below. */
function show(screen: Screen) {
  const state = screen.log.current;
  if (!state) return;
  const travelling = state.status === 'travelling';
  screen.page.show(
    VIEWS[voyagePhase(state)],
    {
      ...voyageHeading(state),
      record: travelling ? recordLine(screen.log.best) : '',
      note: travelling ? keepingNote(screen.saved) : '',
    },
    content(screen, state),
  );
}
