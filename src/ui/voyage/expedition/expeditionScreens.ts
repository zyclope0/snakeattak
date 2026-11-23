import './expedition.css';
import { isLastingBoon } from '../../../boons.ts';
import type { BoonId, LastingBoon } from '../../../boons.ts';
import { capriceById } from '../../../caprices.ts';
import type { CapriceDefinition } from '../../../caprices.ts';
import {
  buyAtRoulotte,
  chooseGift,
  chooseHalt,
  createExpeditionGame,
  expeditionPhase,
  expeditionPlanOf,
  leaveRoulotte,
  needsPlace,
  rerollGifts,
  skipGift,
  startExpedition,
  underWay,
  winBattle,
} from '../../../expedition.ts';
import type { ExpeditionState, Path } from '../../../expedition.ts';
import { loadExpeditionLog, logExpedition, saveExpeditionLog } from '../../../expeditionStorage.ts';
import type { ExpeditionLog } from '../../../expeditionStorage.ts';
import type { Game } from '../../../game.ts';
import type { ExpeditionDoor } from '../../../expeditionLog.ts';
import { voyageSeedFrom } from '../../../voyage.ts';
import { battleOver } from '../../battleState.ts';
import { freshSeed } from '../../missionWords.ts';
import type { VoyagePorts } from '../../voyageDoor.ts';
import type { StageOnBoard } from '../voyageBattle.ts';
import { voyagePage } from '../voyagePage.ts';
import type { VoyageView } from '../voyagePage.ts';
import { replaceWindow } from '../voyageReplace.ts';
import { arrivedView, giftView, mapView, roulotteView } from './expeditionViews.ts';
import type { ExpeditionActions } from './expeditionViews.ts';
import {
  battleMark,
  battleOutcome,
  expeditionHeading,
  haltNotice,
  keepingNote,
  keptLine,
  replaceSentence,
} from './expeditionWords.ts';
import * as TEXT from '../../../texts/fr/expedition.ts';

/** A battle put on the board: the expedition it was opened from, and how it ended. */
type Playing = {
  game: Game;
  path: Path | undefined;
  state: ExpeditionState;
  outcome: StageOnBoard['outcome'];
};

/**
 * What the screens hold between two taps: the player's log, the battle on the board, and what
 * the page says next. Every function of this module reads and changes this one record.
 */
type Screen = {
  readonly ports: VoyagePorts;
  readonly session: VoyagePorts['session'];
  readonly storage: VoyagePorts['storage'];
  /** Tells the door of the home what to say. */
  readonly logChanged: (door: ExpeditionDoor) => void;
  log: ExpeditionLog;
  saved: boolean;
  playing: Playing | null;
  /** What a halt has just done, or why a mission did not open: said once, then forgotten. */
  notice: string;
  /** A new lasting gift waiting for a place, when the five are taken. */
  replacing: LastingBoon | null;
  readonly page: ReturnType<typeof voyagePage>;
  readonly actions: ExpeditionActions;
};

/**
 * The screens of « La Grande Expédition », loaded with those of the voyage. This function
 * holds the player's log and binds the page to it. Every draw and every rule stays in the
 * model (`expedition.ts`): a button only asks for a transition, and a refused one changes
 * nothing. `explain` is the voyage's window for a caprice; `logChanged` tells the door of
 * the home what to say.
 */
export function bindExpeditionScreens(
  ports: VoyagePorts,
  explain: (caprice: CapriceDefinition) => void,
  logChanged: (door: ExpeditionDoor) => void,
) {
  const { session, storage } = ports;
  const screen: Screen = {
    ports,
    session,
    storage,
    logChanged,
    log: loadExpeditionLog(storage),
    saved: !!storage,
    playing: null,
    notice: '',
    replacing: null,
    page: voyagePage('expedition'),
    // The buttons of the page: they run on a tap, once the screens are bound.
    actions: {
      play: (path) => play(screen, path),
      explain,
      halt: (choice) => halt(screen, choice),
      gift: (id) => take(screen, id, 'gift'),
      reroll: () => move(screen, screen.log.current && rerollGifts(screen.log.current)),
      skip: () => move(screen, screen.log.current && skipGift(screen.log.current)),
      buy: (id) => take(screen, id, 'roulotte'),
      leave: () => move(screen, screen.log.current && leaveRoulotte(screen.log.current)),
      replace: (old) => replace(screen, old),
      other: () => request(screen, askReplace, fresh()),
      fresh: () => begin(screen, fresh()),
    },
  };
  const askReplace = replaceWindow<ExpeditionState>((next) => begin(screen, next), {
    id: 'expedition',
    title: TEXT.changerDExpedition,
    keep: TEXT.garderMonExpedition,
    change: TEXT.uneNouvelleExpedition,
    sentence: replaceSentence,
  });
  return expeditionControls(screen);
}

/** What the voyage's screens ask of the expedition: open it, draw its battle, go on. */
function expeditionControls(screen: Screen) {
  const { ports, session, page } = screen;
  return {
    /** From the voyage page: a first visit draws an expedition, then the page shows it. */
    open() {
      if (!screen.log.current && !commit(screen, fresh())) return;
      screen.notice = '';
      // Drawn first: the heading that takes the focus already says where the child is.
      show(screen);
      // The second tap of a double tap on the door must not start a battle.
      page.hold();
      ports.navigate('expedition');
    },
    /**
     * With every redraw of the page: the battle on the board and its end, recorded once. Null
     * when the board shows no battle of the expedition.
     */
    battle: (): StageOnBoard | null => battleOnBoard(screen),
    /** « Continuer l'expédition » : from the board to the page, where the gift waits. */
    onward() {
      screen.playing = null;
      ports.home();
      show(screen);
      // The gifts are drawn where « Continuer » was: a second tap must not choose one.
      page.hold();
      ports.navigate('expedition');
    },
    /** True when the game on the board is a battle of the expedition. */
    owns: () => screen.playing?.game === session.game,
    /** « Recommencer » on the board: the battle under way starts again from its beginning. */
    restartStage() {
      const { playing } = screen;
      if (playing?.game === session.game && !playing.outcome) play(screen, playing.path);
    },
  };
}

/** The battle on the board and its end, recorded once; null when it is not the expedition's. */
function battleOnBoard(screen: Screen): StageOnBoard | null {
  const { session } = screen;
  const live = screen.playing?.game === session.game ? screen.playing : null;
  if (!live) return null;
  if (!live.outcome && battleOver(live.game)) live.outcome = record(screen, live);
  return session.screen === 'battle'
    ? {
        mark: battleMark(live.state),
        defi: capriceById(live.game.mission?.caprice)?.name,
        outcome: live.outcome,
        kept: keptLine(screen.saved),
      }
    : null;
}

/** Every transition ends here: the log follows, is stored, and the door is told. */
function commit(screen: Screen, next: ExpeditionState | null): boolean {
  const updated = next && logExpedition(screen.log, next);
  if (!updated) return false;
  screen.log = updated;
  screen.saved = saveExpeditionLog(screen.storage, screen.log);
  const { current } = screen.log;
  screen.logChanged(underWay(current) ? 'under-way' : current ? 'opened' : 'none');
  return true;
}
/** The page draws the seed of a new expedition; the rules never do. */
function fresh() {
  return startExpedition(voyageSeedFrom(freshSeed()));
}
function begin(screen: Screen, next: ExpeditionState | null) {
  if (!commit(screen, next)) return;
  screen.playing = null;
  screen.notice = '';
  screen.replacing = null;
  show(screen);
  screen.page.focus();
}
/** An expedition under way is never replaced without asking. */
function request(
  screen: Screen,
  askReplace: (current: ExpeditionState, next: ExpeditionState) => void,
  next: ExpeditionState | null,
) {
  if (!next) return;
  const { current } = screen.log;
  if (underWay(current)) askReplace(current, next);
  else begin(screen, next);
}
/** A transition from a button of the page: the page follows, its heading takes the focus. */
function move(screen: Screen, next: ExpeditionState | null) {
  if (!commit(screen, next)) {
    // Refused: the page shows the expedition as it still is.
    show(screen);
    return;
  }
  screen.notice = '';
  show(screen);
  screen.page.hold();
  screen.page.focus();
}
/** A new camp for the battle that waits; a battle left halfway starts again from here. */
function play(screen: Screen, path?: Path) {
  const state = screen.log.current;
  const game = state && createExpeditionGame(expeditionPlanOf(state), state, path);
  if (!state || !game) {
    screen.notice = TEXT.cetteEtapeNeSOuvrePas;
    show(screen);
    focusQuestion(screen);
    return;
  }
  screen.notice = '';
  screen.playing = { game, path, state, outcome: null };
  screen.ports.play(game);
}
function halt(screen: Screen, choice: 0 | 1) {
  const state = screen.log.current;
  if (!state) return;
  const step = expeditionPlanOf(state).tableaux[state.tableau][state.step];
  const after = chooseHalt(expeditionPlanOf(state), state, choice);
  if (step.kind !== 'halt' || !after || !commit(screen, after)) return;
  screen.notice = haltNotice(state, after, step.halts[choice]);
  show(screen);
  screen.page.hold();
  screen.page.focus();
}
/** A new lasting gift asks first for a place when the five are taken. */
function take(screen: Screen, id: BoonId, from: 'gift' | 'roulotte') {
  const state = screen.log.current;
  if (!state) return;
  if (isLastingBoon(id) && needsPlace(state, id)) {
    screen.replacing = id;
    show(screen);
    screen.page.hold();
    focusQuestion(screen);
    return;
  }
  move(screen, from === 'gift' ? chooseGift(state, id) : buyAtRoulotte(state, id));
}
function replace(screen: Screen, old: LastingBoon | null) {
  const state = screen.log.current;
  const id = screen.replacing;
  screen.replacing = null;
  if (!state || !id || !old) {
    show(screen);
    screen.page.focus();
    return;
  }
  const pending = state.pending?.kind;
  move(screen, pending === 'gift' ? chooseGift(state, id, old) : buyAtRoulotte(state, id, old));
}
/** The battle on the board has ended: a win enters the expedition, a loss changes nothing. */
function record(screen: Screen, live: Playing) {
  const won = live.game.status === 'won';
  const after = won
    ? winBattle(expeditionPlanOf(live.state), live.state, live.game, live.path)
    : null;
  if (won && !commit(screen, after)) return battleOutcome('unsaved');
  return battleOutcome(after);
}
/** The sentence that asks something of the child takes the focus, not the page's name. */
function focusQuestion(screen: Screen) {
  const asked = document.querySelector<HTMLElement>('.expedition-page :is(.exp-notice, .exp-swap)');
  if (!asked) return screen.page.focus();
  asked.tabIndex = -1;
  asked.focus({ preventScroll: true });
}
function content(screen: Screen, state: ExpeditionState): { view: VoyageView; nodes: Node[] } {
  const { actions } = screen;
  const phase = expeditionPhase(state);
  if (phase === 'arrived')
    return { view: 'arrived', nodes: arrivedView(state, screen.log.best, actions) };
  if (phase === 'gift') return { view: 'gift', nodes: giftView(state, screen.replacing, actions) };
  if (phase === 'roulotte')
    return { view: 'roulotte', nodes: roulotteView(state, screen.replacing, actions) };
  return { view: 'map', nodes: mapView(state, screen.notice, screen.log.best, actions) };
}
function show(screen: Screen) {
  const state = screen.log.current;
  if (!state) return;
  const { view, nodes } = content(screen, state);
  const travelling = state.status === 'travelling';
  screen.page.show(
    view,
    {
      ...expeditionHeading(state),
      // The record waits for the end: the top row keeps its room for the tableau's name.
      record: '',
      note: travelling ? keepingNote(screen.saved) : '',
    },
    nodes,
  );
}
