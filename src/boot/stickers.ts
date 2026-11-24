import type { createCapriceAlbumsController } from '../capriceAlbums.ts';
import { decodeCheckpoint } from '../checkpoints.ts';
import type { Game } from '../game.ts';

/** The sticker books of the caprices, as the games put on the board fill them. */
export function createStickers(albums: ReturnType<typeof createCapriceAlbumsController>) {
  /** What the sticker of each caprice won gave: recorded once a game. */
  const results = new WeakMap<Game, boolean>();
  return {
    /** A caprice under way needs its sticker book: one is opened when the save names none. */
    openForCaprice(game: Game | null | undefined, retryCamp?: string | null) {
      if (albums.state.campProfileId) return;
      if (game?.mission?.caprice || (retryCamp && decodeCheckpoint(retryCamp)?.mission?.caprice))
        albums.beginRun();
    },
    /** A caprice won earns its sticker once, however often the game is refreshed. */
    record(game: Game) {
      if (game.mission?.caprice && game.status === 'won' && !results.has(game))
        results.set(game, albums.record(game));
    },
    /** What the sticker of a caprice won gave, once recorded. */
    result: (game: Game) => results.get(game),
  };
}
