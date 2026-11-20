import './voyage.css';
import type { Game } from '../../game.ts';
import type { RewardId } from '../../rewards.ts';
import { voyageSeedFrom } from '../../voyage.ts';
import { encodeVoyage } from '../../voyageCode.ts';
import {
  chooseBonus,
  recordStage,
  stageGame,
  startVoyage,
  voyagePhase,
  voyagePlanOf,
} from '../../voyageState.ts';
import type { VoyagePhase, VoyageState } from '../../voyageState.ts';
import { loadVoyageLog, logVoyage, saveVoyageLog } from '../../voyageStorage.ts';
import type { VoyageLog } from '../../voyageStorage.ts';
import { battleOver } from '../battleState.ts';
import { freshSeed } from '../missionWords.ts';
import type { VoyagePorts } from '../voyageDoor.ts';
import { capriceBubble } from './capriceBubble.ts';
import { voyageBattle } from './voyageBattle.ts';
import type { StageOnBoard } from './voyageBattle.ts';
import { giftWindow, otherVoyageWindow } from './voyageCodeWindows.ts';
import { voyagePage } from './voyagePage.ts';
import type { VoyageView } from './voyagePage.ts';
import { replaceWindow } from './voyageReplace.ts';
import { arrivedView, bonusView, fallenView, mapView } from './voyageViews.ts';
import type { ViewActions } from './voyageViews.ts';
import {
  battleMark,
  keepingNote,
  recordLine,
  stageOutcome,
  underWay,
  voyageHeading,
} from './voyageWords.ts';

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
export function bindVoyageScreens(ports: VoyagePorts, logChanged: (log: VoyageLog) => void) {
  const { session, storage } = ports;
  let log = loadVoyageLog(storage);
  let saved = !!storage;
  let playing: Playing | null = null;

  const page = voyagePage();
  const showCode = giftWindow();
  const askOther = otherVoyageWindow({
    fresh: () => request(freshVoyage()),
    take: (seed, version) => request(startVoyage(seed, version)),
  });
  const askReplace = replaceWindow(begin);
  const drawBattle = voyageBattle(onward);
  const actions: ViewActions = {
    start: startStage,
    explain: capriceBubble(),
    choose,
    give: () => log.current && showCode(encodeVoyage(log.current.seed, log.current.version)!),
    other: askOther,
    fresh: () => request(freshVoyage()),
    again: () => log.current && begin(startVoyage(log.current.seed, log.current.version)),
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
  /** The page draws the seed of a new voyage; the rules never do. */
  function freshVoyage() {
    return startVoyage(voyageSeedFrom(freshSeed()));
  }
  /** Another voyage takes the place of the one in the log. */
  function begin(next: VoyageState | null) {
    if (!commit(next)) return;
    playing = null;
    show();
    page.focus();
  }
  /** A voyage under way is never replaced without asking. */
  function request(next: VoyageState | null) {
    if (!next) return;
    if (underWay(log.current)) askReplace(log.current, next);
    else begin(next);
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
    /** From the home: a first visit draws a voyage, then the page shows where it stands. */
    open() {
      if (!log.current && !commit(freshVoyage())) return;
      ports.navigate('voyage');
      show();
    },
    /** With every redraw of the page: the stage on the board, and its end once only. */
    refresh() {
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
      if (playing?.game === session.game && !playing.outcome) startStage();
    },
  };
}
