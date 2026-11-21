import './expedition.css';
import { BOON_RULES, boonLevel, isLastingBoon } from '../../../boons.ts';
import type { BoonId, LastingBoon } from '../../../boons.ts';
import type { CapriceDefinition } from '../../../caprices.ts';
import {
  buyAtRoulotte,
  chooseGift,
  chooseHalt,
  createExpeditionGame,
  expeditionPhase,
  expeditionPlanOf,
  leaveRoulotte,
  rerollGifts,
  skipGift,
  startExpedition,
  winBattle,
} from '../../../expedition.ts';
import type { ExpeditionState, Path } from '../../../expedition.ts';
import { loadExpeditionLog, logExpedition, saveExpeditionLog } from '../../../expeditionStorage.ts';
import type { Game } from '../../../game.ts';
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
  underWay,
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
 * The screens of « La Grande Expédition », loaded with those of the voyage. This function
 * holds the player's log and binds the page to it. Every draw and every rule stays in the
 * model (`expedition.ts`): a button only asks for a transition, and a refused one changes
 * nothing. `explain` is the voyage's window for a caprice; `logChanged` tells the door of
 * the home what to say.
 */
export function bindExpeditionScreens(
  ports: VoyagePorts,
  explain: (caprice: CapriceDefinition) => void,
  logChanged: () => void,
) {
  const { session, storage } = ports;
  let log = loadExpeditionLog(storage);
  let saved = !!storage;
  let playing: Playing | null = null;
  /** What a halt has just done, or why a mission did not open: said once, then forgotten. */
  let notice = '';
  /** A new lasting gift waiting for a place, when the five are taken. */
  let replacing: LastingBoon | null = null;

  const page = voyagePage('expedition');
  const askReplace = replaceWindow<ExpeditionState>(begin, {
    id: 'expedition',
    title: TEXT.changerDExpedition,
    keep: TEXT.garderMonExpedition,
    change: TEXT.uneNouvelleExpedition,
    sentence: replaceSentence,
  });
  const actions: ExpeditionActions = {
    play,
    explain,
    halt,
    gift: (id) => take(id, 'gift'),
    reroll: () => move(log.current && rerollGifts(log.current)),
    skip: () => move(log.current && skipGift(log.current)),
    buy: (id) => take(id, 'roulotte'),
    leave: () => move(log.current && leaveRoulotte(log.current)),
    replace,
    other: () => request(fresh()),
    fresh: () => begin(fresh()),
  };

  /** Every transition ends here: the log follows, is stored, and the door is told. */
  function commit(next: ExpeditionState | null): boolean {
    const updated = next && logExpedition(log, next);
    if (!updated) return false;
    log = updated;
    saved = saveExpeditionLog(storage, log);
    logChanged();
    return true;
  }
  /** The page draws the seed of a new expedition; the rules never do. */
  function fresh() {
    return startExpedition(voyageSeedFrom(freshSeed()));
  }
  function begin(next: ExpeditionState | null) {
    if (!commit(next)) return;
    playing = null;
    notice = '';
    replacing = null;
    show();
    page.focus();
  }
  /** An expedition under way is never replaced without asking. */
  function request(next: ExpeditionState | null) {
    if (!next) return;
    if (underWay(log.current)) askReplace(log.current, next);
    else begin(next);
  }
  /** A transition from a button of the page: the page follows, its heading takes the focus. */
  function move(next: ExpeditionState | null) {
    if (!commit(next)) {
      // Refused: the page shows the expedition as it still is.
      show();
      return;
    }
    notice = '';
    show();
    page.hold();
    page.focus();
  }
  /** A new camp for the battle that waits; a battle left halfway starts again from here. */
  function play(path?: Path) {
    const state = log.current;
    const game = state && createExpeditionGame(expeditionPlanOf(state), state, path);
    if (!state || !game) {
      notice = TEXT.cetteMissionNeSOuvrePas;
      show();
      focusQuestion();
      return;
    }
    notice = '';
    playing = { game, path, state, outcome: null };
    ports.play(game);
  }
  function halt(choice: 0 | 1) {
    const state = log.current;
    if (!state) return;
    const step = expeditionPlanOf(state).tableaux[state.tableau][state.step];
    const after = chooseHalt(expeditionPlanOf(state), state, choice);
    if (step.kind !== 'halt' || !after || !commit(after)) return;
    notice = haltNotice(state, after, step.halts[choice]);
    show();
    page.hold();
    page.focus();
  }
  /** A new lasting gift asks first for a place when the five are taken. */
  function take(id: BoonId, from: 'gift' | 'roulotte') {
    const state = log.current;
    if (!state) return;
    const full = state.boons.length >= BOON_RULES[1].places;
    if (isLastingBoon(id) && full && !boonLevel(state.boons, id)) {
      replacing = id;
      show();
      page.hold();
      focusQuestion();
      return;
    }
    move(from === 'gift' ? chooseGift(state, id) : buyAtRoulotte(state, id));
  }
  function replace(old: LastingBoon | null) {
    const state = log.current;
    const id = replacing;
    replacing = null;
    if (!state || !id || !old) {
      show();
      page.focus();
      return;
    }
    const pending = state.pending?.kind;
    move(pending === 'gift' ? chooseGift(state, id, old) : buyAtRoulotte(state, id, old));
  }
  /** The battle on the board has ended: a win enters the expedition, a loss changes nothing. */
  function record(live: Playing) {
    const won = live.game.status === 'won';
    const after = won
      ? winBattle(expeditionPlanOf(live.state), live.state, live.game, live.path)
      : null;
    if (won && !commit(after)) return battleOutcome('unsaved');
    return battleOutcome(after);
  }
  /** The sentence that asks something of the child takes the focus, not the page's name. */
  function focusQuestion() {
    const asked = document.querySelector<HTMLElement>(
      '.expedition-page :is(.exp-notice, .exp-swap)',
    );
    if (!asked) return page.focus();
    asked.tabIndex = -1;
    asked.focus({ preventScroll: true });
  }
  function content(state: ExpeditionState): { view: VoyageView; nodes: Node[] } {
    const phase = expeditionPhase(state);
    if (phase === 'arrived')
      return { view: 'arrived', nodes: arrivedView(state, log.best, actions) };
    if (phase === 'gift') return { view: 'gift', nodes: giftView(state, replacing, actions) };
    if (phase === 'roulotte')
      return { view: 'roulotte', nodes: roulotteView(state, replacing, actions) };
    return { view: 'map', nodes: mapView(state, notice, log.best, actions) };
  }
  function show() {
    const state = log.current;
    if (!state) return;
    const { view, nodes } = content(state);
    const travelling = state.status === 'travelling';
    page.show(
      view,
      {
        ...expeditionHeading(state),
        // The record waits for the end: the top row keeps its room for the tableau's name.
        record: '',
        note: travelling ? keepingNote(saved) : '',
      },
      nodes,
    );
  }

  return {
    /** From the voyage page: a first visit draws an expedition, then the page shows it. */
    open() {
      if (!log.current && !commit(fresh())) return;
      notice = '';
      // Drawn first: the heading that takes the focus already says where the child is.
      show();
      ports.navigate('expedition');
    },
    /**
     * With every redraw of the page: the battle on the board and its end, recorded once. Null
     * when the board shows no battle of the expedition.
     */
    battle(): StageOnBoard | null {
      const live = playing?.game === session.game ? playing : null;
      if (!live) return null;
      if (!live.outcome && battleOver(live.game)) live.outcome = record(live);
      return session.screen === 'battle'
        ? {
            mark: battleMark(live.state),
            outcome: live.outcome,
            kept: keptLine(saved),
          }
        : null;
    },
    /** « Continuer l'expédition » : from the board to the page, where the gift waits. */
    onward() {
      playing = null;
      ports.home();
      show();
      ports.navigate('expedition');
    },
    /** True when the game on the board is a battle of the expedition. */
    owns: () => playing?.game === session.game,
    /** « Recommencer » on the board: the battle under way starts again from its beginning. */
    restartStage() {
      if (playing?.game === session.game && !playing.outcome) play(playing.path);
    },
  };
}
