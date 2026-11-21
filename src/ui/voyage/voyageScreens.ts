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
  let log = loadVoyageLog(storage);
  let saved = !!storage;
  let playing: Playing | null = null;

  const page = voyagePage();
  const explain = capriceBubble();
  // « La Grande Expédition » took the voyage's place (decision of the parent, 21 November
  // 2026): a voyage begun is finished here, then the door leads to the expedition. They share
  // the window of a caprice and the board's result panel.
  const expedition = bindExpeditionScreens(
    ports,
    (caprice) => explain(caprice, EXPEDITION_TEXT.leDefiDeLEtape),
    (state) => logChanged(log, state),
  );
  const drawBattle = voyageBattle(() => (expedition.owns() ? expedition.onward() : onward()));
  const actions: ViewActions = {
    start: startStage,
    explain,
    choose,
    expedition: () => expedition.open(),
  };

  /** Every transition ends here: the log follows, is stored, and the door is told. */
  function commit(next: VoyageState | null): boolean {
    const updated = next && logVoyage(log, next);
    if (!updated) return false;
    log = updated;
    saved = saveVoyageLog(storage, log);
    logChanged(log);
    return true;
  }
  /** A new camp for the stage to play: a stage left halfway starts again from here. */
  function startStage() {
    const state = log.current;
    const game = state && stageGame(state);
    if (!game) return;
    playing = {
      game,
      stage: state.won + 1,
      stages: voyagePlanOf(state).stages.length,
      outcome: null,
    };
    ports.play(game);
  }
  function choose(card: RewardId) {
    if (!log.current || !commit(chooseBonus(log.current, card))) return;
    show();
    page.focus();
  }
  /** The stage that has just ended enters the voyage; what the result panel then says. */
  function recordOutcome(live: Playing) {
    const after = log.current && recordStage(log.current, live.game);
    return after && commit(after) ? stageOutcome(after, live.stage) : null;
  }
  /** « Continuer le voyage » : from the board to the choice of a bonus, or to the end. */
  function onward() {
    ports.home();
    ports.navigate('voyage');
    show();
    // The bonus cards are drawn where « Continuer » was: a second tap must not choose one.
    page.hold();
  }
  /** The stage on the board was begun and left: the map says that it starts again. */
  function leftHalfway() {
    return (
      playing?.game === session.game &&
      !battleOver(playing.game) &&
      (playing.game.wave > 0 || session.hasPlaced)
    );
  }
  function content(state: VoyageState): Node[] {
    switch (voyagePhase(state)) {
      case 'stage':
        return mapView(state, leftHalfway(), actions);
      case 'bonus':
        return bonusView(state, actions);
      case 'arrived':
        return arrivedView(state, log.best, actions);
      case 'fallen':
        return fallenView(state, log.best, actions);
    }
  }
  /** Draws the view the voyage calls for. A voyage that is over shows its record below. */
  function show() {
    const state = log.current;
    if (!state) return;
    const travelling = state.status === 'travelling';
    page.show(
      VIEWS[voyagePhase(state)],
      {
        ...voyageHeading(state),
        record: travelling ? recordLine(log.best) : '',
        note: travelling ? keepingNote(saved) : '',
      },
      content(state),
    );
  }

  return {
    /** From the home: a voyage begun to finish, or else « La Grande Expédition ». */
    open() {
      if (!voyageToFinish(log)) return expedition.open();
      show();
      ports.navigate('voyage');
    },
    /** With every redraw of the page: the stage on the board, and its end once only. */
    refresh() {
      if (expedition.owns()) {
        drawBattle(expedition.battle());
        return;
      }
      const live = playing?.game === session.game ? playing : null;
      if (live && !live.outcome && battleOver(live.game)) live.outcome = recordOutcome(live);
      drawBattle(
        live && session.screen === 'battle'
          ? { mark: battleMark(live.stage, live.stages), outcome: live.outcome }
          : null,
      );
    },
    /** « Recommencer » on the board: the stage under way starts again from its beginning. */
    restartStage() {
      if (expedition.owns()) expedition.restartStage();
      else if (playing?.game === session.game && !playing.outcome) startStage();
    },
  };
}
