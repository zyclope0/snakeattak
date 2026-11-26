import { endlessReached } from '../endless.ts';
import { newRecords } from '../endlessRecords.ts';
import type { Game } from '../game.ts';
import type { Adventure } from './adventure.ts';

/** What is written after every command and every step that matters. */
export function createSaving(
  adventure: Adventure,
  /**
   * Whether the game on the board is a camp of the adventure, to be recorded, and whether it is
   * a battle aside (Classic Snake), of which nothing is recorded.
   */
  games: { readonly hasCamp: boolean; readonly aside?: boolean },
) {
  const { session, campMemory, persistence, career, missions, albums } = adventure;
  const { stickers, records, missionDone, family } = adventure;
  /** The wave last written in the records for an endless game: each step is written once. */
  const endlessWritten = new WeakMap<Game, number>();

  /**
   * Brings the camp memory, the career, the missions and the stickers up to date with the
   * game on screen. `writeCamp` also writes the classic camp under its own key, at its usual
   * place between the memory and the career.
   */
  function recordGame(writeCamp: boolean) {
    if (games.aside) return;
    if (games.hasCamp) {
      campMemory.remember(session.game);
      if (writeCamp && !session.game.mission) persistence.sync(session.game);
    }
    if (!session.game.mission) career.sync(session.game);
    if (games.hasCamp) missions.sync(session.game);
    stickers.record(session.game);
    recordEndless(session.game);
  }
  /**
   * How far an endless adventure went goes into the player's records: after each king and when
   * it falls. A wave tried again is the same game, written on the same line.
   */
  function recordEndless(game: Game) {
    const wave = game.endless ? endlessReached(game) : 0;
    if (!game.endless || !wave || endlessWritten.get(game) === wave) return;
    endlessWritten.set(game, wave);
    const run = game.initialSeed ?? 0;
    if (records.add({ wave, kings: game.kings, rules: game.endless.version, run }))
      newRecords.add(game);
  }
  /** A mission just won leaves its mark on the device, beside its last camp. */
  function markMissionDone() {
    const game = session.game;
    if (!game.mission || game.stage || game.status !== 'won') return;
    const camp = missions.state.retryCamp;
    if (!missionDone.finished(camp)) missionDone.mark(camp);
  }

  return {
    recordGame,
    /** The game recorded, the family file written, the mark of a mission won left. */
    save() {
      if (games.aside) return;
      recordGame(true);
      family.sync(campMemory.raw(), career.state, missions.state, albums.state);
      markMissionDone();
    },
  };
}
