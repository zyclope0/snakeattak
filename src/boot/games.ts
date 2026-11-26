import { prepareMissionLaunch } from '../ui/capriceLaunch.ts';
import { decodeCheckpoint } from '../checkpoints.ts';
import type { Kind } from '../data.ts';
import { battleOver } from '../game.ts';
import type { Game } from '../game.ts';
import type { MissionRun } from '../missions.ts';
import { byId } from '../ui/dom.ts';
import type { bindVoyageDoor } from '../ui/voyageDoor.ts';
import type { Adventure } from './adventure.ts';

/** A game still being played goes on as it is; otherwise its stored camp is read again. */
function liveOrStored(game: Game | undefined, camp: string | null): Game | null {
  if (game && !battleOver(game)) return game;
  return camp ? decodeCheckpoint(camp) : null;
}

/**
 * The game on the board, and where the classic adventure and the mission wait meanwhile.
 * `saved` is the game found at start, already on the board; `showBattle` shows the board with
 * the game just put on it; `voyage` is the door of the voyage, once it is bound.
 */
export function createGames(
  adventure: Adventure,
  saved: Game | null,
  showBattle: () => void,
  voyage: () => ReturnType<typeof bindVoyageDoor> | undefined,
) {
  const { session, missions, persistence, campMemory, missionDone, albums, stickers } = adventure;
  let hasCamp = !!saved;
  let classicGame: Game | undefined = saved && !saved.mission ? saved : undefined;
  let missionGame: Game | undefined = saved?.mission ? saved : undefined;
  /** The classic camp waiting under a mission, and whether it is an endless one. */
  let endlessCamp: { raw: string | null; endless: boolean } = { raw: null, endless: false };
  /**
   * A battle played aside (Classic Snake): the game it covers, given back untouched at home,
   * and how to play it again. Nothing of it is ever recorded.
   */
  let aside: { covered: Game; again: () => Game } | null = null;

  /** Whether the classic camp waiting under a mission is an endless one (read once per camp). */
  function campIsEndless(): boolean {
    const raw = missions.state.classicCamp ?? null;
    if (raw !== endlessCamp.raw)
      endlessCamp = { raw, endless: !!(raw && decodeCheckpoint(raw)?.endless) };
    return endlessCamp.endless;
  }
  /** « Recommencer » : the same stage or the same mission again, or a new classic adventure. */
  function restartGame() {
    const run = session.game.mission;
    if (aside) session.useGame(aside.again());
    else if (session.game.stage) voyage()?.restartStage();
    else if (run) launchMission(run, session.game.capriceKindsChosen, true);
    else session.restartSame();
  }

  /** The classic adventure to go back to: from a mission, the one that was set aside. */
  function restoreClassic(): Game | null {
    if (!session.game.mission) return campMemory.load() ?? persistence.load();
    // A voyage stage is not a mission to come back to: it starts again from the voyage.
    if (!session.game.stage) missionGame = session.game;
    const classic = liveOrStored(classicGame, missions.state.classicCamp);
    if (classic) campMemory.replace(missions.state.classicCamp);
    return classic;
  }
  /** The menu has just put a game on the board. */
  function gameStarted() {
    hasCamp = true;
    missions.switchMode(session.game.mission ? 'missions' : 'classic');
    if (!session.game.mission) classicGame = session.game;
  }

  /** Before another game takes the board: the one on screen is recorded and kept for its mode. */
  function setGameAside() {
    if (hasCamp) missions.sync(session.game);
    stickers.record(session.game);
    if (!session.game.mission && hasCamp) classicGame = session.game;
  }
  /** Starts a mission; false when the departure is refused: the game on screen then stays. */
  function launchMission(run: MissionRun, chosen: readonly Kind[] = [], retry = false) {
    const next = prepareMissionLaunch(run, chosen, missions);
    if (!next) return false;
    setGameAside();
    if (!missions.started(run)) return false;
    // A departure, even of the same mission and seed, is a mission under way: the same camps
    // come back, and one of them must not pass for the mission won.
    missionDone.clear();
    if (!retry) albums.beginRun();
    session.useGame(next);
    missionGame = next;
    campMemory.replace(null);
    hasCamp = true;
    showBattle();
    byId('start').focus({ preventScroll: true });
    return true;
  }
  /**
   * Puts a stage of the voyage on the board. Nothing of it is kept as a camp: the mission and
   * the classic adventure set aside stay as they are, and the voyage records the stage itself.
   */
  function playStage(game: Game) {
    setGameAside();
    session.useGame(game);
    showBattle();
    byId('start').focus({ preventScroll: true });
  }
  /**
   * Puts a battle aside on the board (Classic Snake). The game on screen is set aside as for a
   * stage and comes back as it was when the child goes home: a reload or a closed application
   * finds it there too, since nothing of the battle aside is written.
   */
  function playAside(game: Game, again: () => Game) {
    if (!aside) setGameAside();
    aside = { covered: aside?.covered ?? session.game, again };
    session.useGame(game);
    showBattle();
    byId('start').focus({ preventScroll: true });
  }
  function missionCanResume() {
    return !!missionGame || !!missions.state.retryCamp;
  }
  /**
   * A mission waits to be continued, unless the one on record has been won: just now, or before
   * the game was closed (its camp carries the mark of the mission won).
   */
  function missionWaits() {
    return (
      missionCanResume() &&
      missionGame?.status !== 'won' &&
      !missionDone.finished(missions.state.retryCamp)
    );
  }
  /** Back to the mission under way, the classic adventure being set aside first. */
  function resumeMission() {
    if (!session.game.mission && hasCamp) {
      missions.sync(session.game);
      classicGame = session.game;
    }
    const game = liveOrStored(missionGame, missions.state.retryCamp);
    if (!game) return;
    // Played again, the camp of a mission won waits again to be continued.
    missionDone.clear();
    session.useGame(game);
    missionGame = game;
    missions.switchMode('missions');
    hasCamp = true;
    campMemory.replace(missions.state.retryCamp);
    showBattle();
  }

  return {
    /** True once a game of the adventure is on the board: what is played is then recorded. */
    get hasCamp() {
      return hasCamp;
    },
    /** True while a battle aside is on the board: nothing is recorded. */
    get aside() {
      return !!aside;
    },
    playAside,
    /** Going home: the game the battle aside covered is on the board again. */
    leaveAside() {
      if (aside) session.useGame(aside.covered);
      aside = null;
    },
    campIsEndless,
    restartGame,
    restoreClassic,
    gameStarted,
    launchMission,
    playStage,
    missionCanResume,
    missionWaits,
    resumeMission,
    /** After an import: the camp of the file is on the board, in its mode, or a new adventure. */
    useImported(game: Game | null, camp: string | null) {
      aside = null;
      classicGame = game && !game.mission ? game : undefined;
      missionGame = game?.mission ? game : undefined;
      campMemory.replace(camp);
      if (game) session.useGame(game);
      else session.restart();
      hasCamp = game !== null;
    },
  };
}
